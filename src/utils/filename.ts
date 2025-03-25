import type { EnhancedResponse } from '../services/fetch.service'

/**
 * Maximum length for filenames (including extension)
 */
const MAX_FILENAME_LENGTH = 64
const FALLBACK_NAME = 'untitled'

/**
 * Normalize a filename to be safe for use in Content-Disposition headers and URLs
 * Removes invalid characters, trims length, and ensures proper extension
 */
export function normalizeFilename(filename: string, contentType?: string): string {
  // Remove any directory traversal attempts and get the base name
  let normalized = filename.split(/[\\/]/).pop() || ''

  // Replace any non-alphanumeric chars (except dash, underscore, period) with dash
  normalized = normalized.replace(/[^\w\-.]/g, '-')

  // Replace multiple consecutive dashes/dots with single ones
  normalized = normalized.replace(/-+/g, '-').replace(/\.+/g, '.')

  // Remove leading/trailing dashes and dots
  normalized = normalized.replace(/^[-.]|[-.]$/g, '')

  // Extract extension from filename
  const lastDot = normalized.lastIndexOf('.')
  let nameWithoutExt = lastDot > 0 ? normalized.slice(0, lastDot) : normalized
  let extension = lastDot > 0 ? normalized.slice(lastDot + 1) : ''

  // If no extension in filename but we have a content type, use that
  if (!extension && contentType) {
    const contentExt = contentType.split('/')[1]
    if (contentExt) {
      extension = contentExt.replace(/[^a-z0-9]/gi, '')
    }
  }

  // Ensure the name part isn't too long, leaving room for extension
  const maxBaseLength = extension ? MAX_FILENAME_LENGTH - extension.length - 1 : MAX_FILENAME_LENGTH
  if (nameWithoutExt.length > maxBaseLength) {
    nameWithoutExt = nameWithoutExt.slice(0, maxBaseLength)
  }

  // If we end up with an empty name, use FALLBACK_NAME
  if (!nameWithoutExt) {
    nameWithoutExt = FALLBACK_NAME
  }

  // Combine name and extension
  return extension ? `${nameWithoutExt}.${extension}` : nameWithoutExt
}

/**
 * Extract filename from Content-Disposition header
 * Handles both "attachment" and "inline" dispositions
 */
function extractFilenameFromContentDisposition(disposition?: string): string | undefined {
  if (!disposition)
    return undefined

  // Try to match filename or filename* parameter
  const filenameMatch = disposition.match(/filename\*?=(?:"([^"]*)"|(.*?)(?:;|$))/i)
  if (!filenameMatch)
    return undefined

  let filename = filenameMatch[1] || filenameMatch[2]

  // Handle RFC 5987 encoded filenames
  if (disposition.includes('filename*=')) {
    try {
      const [_, name] = filename.split('\'', 2)
      filename = decodeURIComponent(name)
    }
    catch {
      // If decoding fails, return the raw filename
    }
  }

  // Clean up any remaining quotes or whitespace
  return filename.trim().replace(/^["']|["']$/g, '')
}

/**
 * Extract the best possible filename from a URL path
 */
function extractFilenameFromUrl(url: URL): string | undefined {
  const pathname = url.pathname
  const segments = pathname.split('/')
  const lastSegment = segments[segments.length - 1]

  // If the last segment is empty or just a slash, return undefined
  if (!lastSegment)
    return undefined

  // Remove any query parameters that might be part of the filename
  const cleanFilename = lastSegment.split('?')[0]

  // Decode any URL encoded characters
  try {
    return decodeURIComponent(cleanFilename)
  }
  catch {
    return cleanFilename
  }
}

/**
 * Get a filename from a response, trying multiple sources in order of reliability:
 * 1. Content-Disposition header
 * 2. URL path
 * 3. Generated name based on content type
 * The result is NOT normalized - use normalizeFilename on the result
 */
function getFilenameFromResponse(response: EnhancedResponse): string {
  // Try Content-Disposition first
  const dispositionFilename = extractFilenameFromContentDisposition(response.info.contentDisposition)
  if (dispositionFilename)
    return dispositionFilename

  // Try URL path next
  const urlFilename = extractFilenameFromUrl(response.info.url)
  if (urlFilename)
    return urlFilename

  // Generate a basic name based on content type if available
  if (response.info.contentType) {
    const ext = response.info.contentType.split('/')[1]
    if (ext)
      return `image.${ext}`
  }

  // Fallback to a generic name
  return FALLBACK_NAME
}

/**
 * Get a normalized filename for an ingested file, considering:
 * 1. User provided filename (if any)
 * 2. Content-Disposition header
 * 3. URL path
 * 4. Content type
 * Always returns a normalized filename suitable for storage and Content-Disposition
 */
export function getNormalizedFilename(options: {
  customFilename?: string
  response?: EnhancedResponse
  contentType?: string
}): string {
  const { customFilename, response, contentType } = options

  // If user provided a filename, normalize it with the content type
  if (customFilename) {
    return normalizeFilename(customFilename, contentType || response?.info.contentType)
  }

  // If we have a response, try to get a filename from it
  if (response) {
    const responseFilename = getFilenameFromResponse(response)
    return normalizeFilename(responseFilename, response.info.contentType)
  }

  // If we just have a content type, generate a basic name
  if (contentType) {
    return normalizeFilename(FALLBACK_NAME, contentType)
  }

  // Absolute fallback
  return FALLBACK_NAME
}
