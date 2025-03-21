import { bytesToHex } from '@noble/hashes/utils'
import { ulid } from 'ulidx'
import { DEFAULT_USER_ID, DEFAULT_WORKSPACE_ID } from '../../constants'
import type { IngestImageRoute } from '../../routes/api'
import type { AppRouteHandler } from '../../types'
import { AppError, badRequest, internalError } from '../../utils/errors'
import { generateFileSlug } from '../../utils/id'

// Blocklist of potentially dangerous domains (example)
const BLOCKLISTED_DOMAINS: string[] = []

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
  } catch (error) {
    throw badRequest('Invalid URL format')
  }
}

/**
 * Verify if a URL is safe to fetch from
 * @param url The URL to verify
 * @returns True if safe, throws otherwise
 */
function verifyUrl(url: URL): boolean {
  // Check protocol (only allow http and https)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw badRequest(`Unsupported URL protocol: ${url.protocol}`)
  }

  // Block localhost and private IPs
  if (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.hostname.startsWith('192.168.') ||
    url.hostname.startsWith('10.') ||
    url.hostname.startsWith('172.16.')
  ) {
    throw badRequest('Internal/private URLs are not allowed')
  }

  // Check against blocklist
  const domain = url.hostname.toLowerCase()
  if (BLOCKLISTED_DOMAINS.some((blocked) => domain.includes(blocked))) {
    throw badRequest('URL domain is not allowed')
  }

  return true
}

/**
 * Safely fetch a resource with security considerations
 * @param urlString URL string to fetch
 * @param method HTTP method
 * @param timeoutMs Timeout in milliseconds
 * @returns Response
 */
async function safeFetch(urlString: string, method = 'GET', timeoutMs = FETCH_TIMEOUT): Promise<Response> {
  // Create an AbortController for timeout management
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    // Parse and verify URL is safe to fetch from
    const url = parseUrl(urlString)
    verifyUrl(url)

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
      verifyUrl(redirectedUrl)
    }

    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Handler for ingesting an image via URL
 */
export const ingestImage: AppRouteHandler<IngestImageRoute> = async (c) => {
  // Extract payload from request body
  const { url, slug: suffix } = c.req.valid('json')

  const userId = DEFAULT_USER_ID
  const workspaceId = DEFAULT_WORKSPACE_ID

  // Get services from context
  const storageService = c.get('storage')
  const db = c.get('db')

  try {
    // Fetch the actual image
    const response = await safeFetch(url)
    if (!response.ok) {
      throw badRequest(`Failed to fetch image from URL: ${response.statusText}`)
    }

    // Generate a unique ID for both storage and database
    const id = ulid()

    // Get content type from response headers or use a fallback
    const contentType = response.headers.get('content-type') ?? 'application/octet-stream'

    // Store file directly in R2 using the ID as the key
    const r2Object = await storageService.storeFile(id, response.body, contentType)
    const md5 = r2Object.checksums.md5
    if (!md5) {
      throw internalError('Failed to store file')
    }

    // Generate a user-friendly slug
    const slug = generateFileSlug(suffix)

    // Create database record with the same ID
    const fileRecord = await db.createFile({
      id,
      contentHash: bytesToHex(new Uint8Array(md5)), // Use MD5 from R2 for deduplication potential
      contentType,
      size: r2Object.size, // Use the actual size from R2
      metadata: {},
      slug,
      userId,
      workspaceId,
    })

    // Return the created file
    return c.json(fileRecord, 201)
  } catch (error) {
    console.error('Error ingesting image from URL:', error)

    // Handle AppError instances
    if (error instanceof AppError) {
      const status = error.status === 404 || error.status === 415 ? 400 : error.status
      return c.json({ error: error.message, status }, status as 400 | 500)
    }

    // Default to 500 for server errors
    return c.json({ error: 'Failed to process image ingestion', status: 500 }, 500)
  }
}
