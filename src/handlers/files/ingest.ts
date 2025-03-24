import type { IngestImageRoute } from '../../routes/api'
import type { AppRouteHandler } from '../../types'
import { bytesToHex } from '@noble/hashes/utils'
import { ulid } from 'ulidx'
import { VALID_IMAGE_TYPES } from '../../constants'
import { AppError, badRequest, internalError } from '../../utils/errors'
import { generateExternalId } from '../../utils/id'

// Maximum redirect count to prevent redirect loops
const MAX_REDIRECTS = 5

// Timeout for fetch operations (in ms)
const FETCH_TIMEOUT = 15000

/**
 * Parse a URL string into a URL object with error handling
 * @param urlString URL string to parse
 * @returns URL object
 */
function parseUrl(urlString: string): URL {
  try {
    return new URL(urlString)
  }
  catch (error) {
    console.error('Error parsing URL:', error)
    throw badRequest('Invalid URL format')
  }
}

/**
 * Verify if a URL is safe to fetch from
 * @param url The URL to verify
 * @param blockedDomains Additional domains to block
 * @returns True if safe, throws otherwise
 */
function verifyUrl(url: URL, blockedDomains: string[] = []): boolean {
  // Check protocol (only allow http and https)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw badRequest(`Unsupported URL protocol: ${url.protocol}`)
  }

  // Block localhost and private IPs
  if (
    url.hostname === 'localhost'
    || url.hostname === '127.0.0.1'
    || url.hostname.startsWith('192.168.')
    || url.hostname.startsWith('10.')
    || url.hostname.startsWith('172.16.')
  ) {
    throw badRequest('Internal/private URLs are not allowed')
  }

  // Check against blocklist
  const domain = url.hostname.toLowerCase()
  if (blockedDomains?.some(blocked => domain.includes(blocked))) {
    throw badRequest('URL domain is not allowed')
  }

  return true
}

/**
 * Safely fetch a resource with security considerations
 * @param urlString URL string to fetch
 * @param blockedDomains Domains to block
 * @param method HTTP method
 * @param timeoutMs Timeout in milliseconds
 * @returns Response
 */
async function safeFetch(
  urlString: string,
  blockedDomains: string[],
  method = 'GET',
  timeoutMs = FETCH_TIMEOUT,
): Promise<Response> {
  // Create an AbortController for timeout management
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    // Parse and verify URL is safe to fetch from
    const url = parseUrl(urlString)
    verifyUrl(url, blockedDomains)

    const response = await fetch(urlString, {
      method,
      headers: {
        'User-Agent': 'Gleaming/1.0',
      },
      redirect: 'follow',
      cf: {
        timeout: timeoutMs / 1000,
        maxRedirects: MAX_REDIRECTS,
      },
      signal: controller.signal,
    })

    // If there were redirects, verify the redirected URL is also safe
    if (response.redirected && response.url !== urlString) {
      const redirectedUrl = parseUrl(response.url)
      verifyUrl(redirectedUrl, blockedDomains)
    }

    return response
  }
  finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Handler for ingesting an image via URL
 */
export const ingestImage: AppRouteHandler<IngestImageRoute> = async (c) => {
  // Extract payload from request body
  const { url, filename: filenameParam } = c.req.valid('json')

  const userId = c.get('userId')
  const projectId = c.get('projectId')

  // Get services from context
  const storageService = c.get('storage')
  const db = c.get('db')

  try {
    // Fetch the actual image
    const response = await safeFetch(url, [new URL(c.req.url).hostname])
    if (!response.ok) {
      throw badRequest(`Failed to fetch image from URL: ${response.statusText}`)
    }

    // Only accept allowed image content types
    const contentType = response.headers.get('content-type')
    if (!contentType || !VALID_IMAGE_TYPES.includes(contentType)) {
      throw badRequest(`Unsupported content type: ${contentType}`)
    }

    // Generate a unique ID for both storage and database
    const objectId = ulid()
    const externalId = generateExternalId()
    const filename = filenameParam || parseUrl(url).pathname.split('/').pop() || externalId

    // Fix for streams without known length (like SVGs from dynamic services)
    // Read the entire response into an ArrayBuffer first
    if (!response.body) {
      throw internalError('Response body is empty')
    }

    let fileContent: ArrayBuffer | ReadableStream = response.body

    // Check if content-length header is missing or if we're dealing with SVG
    // This ensures we have a known length for R2 storage
    if (!response.headers.has('content-length')) {
      try {
        fileContent = await response.arrayBuffer()
      }
      catch (error) {
        console.error('Error converting response to ArrayBuffer:', error)
        throw internalError('Failed to process image data')
      }
    }

    const keyParts = {
      userId,
      projectId,
      objectId,
    }

    const httpMetadata: R2HTTPMetadata = {
      contentType,
    }

    const r2Object = await storageService.storeFile(keyParts, fileContent, { httpMetadata })
    const md5 = r2Object.checksums.md5
    if (!md5) {
      throw internalError('Failed to store file')
    }

    // Create database record with the same ID
    const fileRecord = await db.createFile({
      objectId,
      externalId,
      contentHash: bytesToHex(new Uint8Array(md5)),
      contentType,
      size: r2Object.size,
      metadata: {},
      filename,
      userId,
      projectId,
    })

    // Return the created file
    return c.json(fileRecord, 201)
  }
  catch (error) {
    console.error('Error ingesting image from URL:', error)

    // Handle AppError instances
    if (error instanceof AppError) {
      const status = error.status === 404 || error.status === 415 ? 400 : error.status
      return c.json({ error: error.message, status }, status)
    }

    // Default to 500 for server errors
    return c.json({ error: 'Failed to process image ingestion', status: 500 }, 500)
  }
}
