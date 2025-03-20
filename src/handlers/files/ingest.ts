import { DEFAULT_USER_ID, DEFAULT_WORKSPACE_ID, MAX_FILE_SIZE } from '../../constants'
import type { IngestImageRoute } from '../../routes/files'
import type { AppRouteHandler } from '../../types'
import { AppError, badRequest } from '../../utils/errors'
import { cloneStream, generateHashFromStream } from '../../utils/hash'
import { generateCompactTimeId } from '../../utils/id'

// Blocklist of potentially dangerous domains (example)
const BLOCKLISTED_DOMAINS = [
  'malicious-site.com',
  'known-bad-actor.net',
  // Add more as needed
]

// Maximum redirect count to prevent redirect loops
const MAX_REDIRECTS = 5

// Timeout for fetch operations (in ms)
const FETCH_TIMEOUT = 15000
const HEAD_TIMEOUT = 5000

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
        'User-Agent': 'Gleaming Image Service/1.0',
        Accept: 'image/*',
      },
      redirect: 'follow',
      cf: {
        cacheEverything: false,
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
  const { url, slug } = c.req.valid('json')

  const userId = DEFAULT_USER_ID
  const workspaceId = DEFAULT_WORKSPACE_ID

  // Get services from context
  const storageService = c.get('storage')
  const imageService = c.get('image')
  const db = c.get('db')

  try {
    // Perform initial HEAD request for quick validation before full download
    const headResponse = await safeFetch(url, 'HEAD', HEAD_TIMEOUT)

    if (!headResponse.ok) {
      throw badRequest(`Failed to access image URL: ${headResponse.statusText}`)
    }

    // Quick size check from HEAD request if available
    // This helps avoid downloading files that are obviously too large
    const contentLength = headResponse.headers.get('content-length')
    if (contentLength) {
      const size = parseInt(contentLength, 10)
      if (size > MAX_FILE_SIZE) {
        throw badRequest(`Image too large: ${size} bytes (max: ${MAX_FILE_SIZE} bytes)`)
      }
    }

    // Fetch the actual image
    const response = await safeFetch(url)
    if (!response.ok) {
      throw badRequest(`Failed to fetch image from URL: ${response.statusText}`)
    }

    // Stream the response body
    const imageStream = response.body as ReadableStream<Uint8Array>
    if (!imageStream) {
      throw badRequest('Failed to get response stream')
    }

    // Get the content type
    const contentType = response.headers.get('content-type')
    if (!contentType) {
      throw badRequest('Response has no content type')
    }

    // Clone the stream so we can use it multiple times
    const [validationStream, processStream] = cloneStream(imageStream)

    // Let the ImageService handle all image validation
    // This will validate both format and size
    const result = await imageService.validateImage(validationStream)
    if (!result.success) {
      throw badRequest(result.error)
    }
    const metadata = result.data

    // Clone the process stream for hashing and storage
    const [hashStream, storeStream] = cloneStream(processStream)

    // Generate a content-based hash
    const contentHash = await generateHashFromStream(hashStream)

    // Check if file already exists
    const existingFile = await storageService.fileExists(contentHash)

    // If file doesn't exist, store it
    if (!existingFile) {
      await storageService.storeFile(contentHash, storeStream, contentType)
    }

    // Create slug - use time ID as base, add user-provided slug only if provided
    const timeId = generateCompactTimeId()
    const fileSlug = slug ? `${timeId}-${slug}` : timeId

    // Create database record
    const fileRecord = await db.createFile({
      contentHash,
      contentType,
      size: metadata.fileSize ?? 0, // Use the validated file size
      metadata,
      slug: fileSlug,
      userId,
      workspaceId,
    })

    // Return the created file
    return c.json(fileRecord, 201)
  } catch (error) {
    console.error('Error ingesting image from URL:', error)

    // Handle AppError instances
    if (error instanceof AppError) {
      return c.json({ error: error.message, status: error.status }, error.status as 400) // TODO fix
    }

    // Default to 500 for server errors
    return c.json({ error: 'Failed to process image ingestion', status: 500 }, 500)
  }
}
