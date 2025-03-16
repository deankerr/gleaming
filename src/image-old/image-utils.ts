import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, ImageMetadata } from '../types'

/**
 * Validates if a file is an image and meets the size requirements
 * Also extracts metadata if valid
 */
export async function validateImage(
  file: File,
  env: any,
): Promise<{
  valid: boolean
  error?: string
  metadata?: Partial<ImageMetadata>
}> {
  // Check file size first (quick check before more expensive operations)
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    }
  }

  // Check if file is an image based on MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    }
  }

  try {
    // Use Cloudflare Images binding to validate and extract metadata
    const metadata = await extractImageMetadata(file, env)

    // Additional validation based on metadata if needed
    // For example, you could check maximum dimensions here

    return {
      valid: true,
      metadata,
    }
  } catch (error) {
    console.error('Error validating image:', error)
    return {
      valid: false,
      error: 'Failed to validate image format',
    }
  }
}

/**
 * Extracts image metadata using Cloudflare Images binding
 */
export async function extractImageMetadata(file: File, env: any) {
  try {
    // Convert the file to a ReadableStream
    const stream = file.stream()

    // Get image info without transforming
    const info = await env.IMAGES.info(stream)

    // Return the metadata
    return {
      width: info.width,
      height: info.height,
      format: info.format,
      fileSize: info.fileSize,
    }
  } catch (error) {
    console.error('Error extracting image metadata:', error)
    throw error
  }
}

/**
 * Generates a unique ID for an image
 */
export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Creates a standardized filename for storage
 */
export function createStorageKey(id: string, originalFilename: string): string {
  // Extract file extension from original filename
  const fileExtension = originalFilename.split('.').pop() || ''

  // Create sanitized key for R2 storage
  return `images/${id}${fileExtension ? '.' + fileExtension : ''}`
}

/**
 * Extract content-type from filename for serving images
 */
export function getContentTypeFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'avif':
      return 'image/avif'
    case 'svg':
      return 'image/svg+xml'
    default:
      return 'application/octet-stream'
  }
}
