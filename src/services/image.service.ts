import { AppError, badRequest, internalError, unsupportedMediaType } from '../utils/errors'
import { MAX_FILE_SIZE, VALID_IMAGE_TYPES } from '../constants'
import { cloneStream, countStreamSize } from '../utils/hash'

export interface ImageMetadata {
  width?: number
  height?: number
  format?: string
  fileSize: number
}

/**
 * Service for image validation and processing
 */
export class ImageService {
  private images: ImagesBinding

  constructor(images: ImagesBinding) {
    this.images = images
  }

  /**
   * Validate an image file
   * @param imageData - The image data to validate
   * @param contentType - The content type of the image
   * @returns The validated image info
   */
  async validateImage(imageData: ReadableStream<Uint8Array>, contentType: string): Promise<ImageMetadata> {
    // Check content type
    if (!VALID_IMAGE_TYPES.includes(contentType)) {
      throw unsupportedMediaType(`Unsupported image type: ${contentType}`)
    }

    // Clone the stream so we can use it for both size checking and format validation
    const [sizeStream, infoStream] = cloneStream(imageData)

    // First, check the file size
    try {
      const fileSize = await countStreamSize(sizeStream)

      // Check against maximum allowed size
      if (fileSize > MAX_FILE_SIZE) {
        throw badRequest(`Image size exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`)
      }

      // Now validate image format using Cloudflare Images
      try {
        const info = await this.images.info(infoStream)

        // Extract relevant metadata
        const metadata: ImageMetadata = {
          format: info.format,
          fileSize: fileSize, // Use our actual measured size
        }

        // Add dimensions if available
        if ('width' in info && 'height' in info) {
          metadata.width = info.width
          metadata.height = info.height
        }

        return metadata
      } catch (error) {
        // Handle format validation errors
        if (error instanceof Error) {
          // Pass through AppError instances
          if (error instanceof AppError) {
            throw error
          }

          // Cloudflare Images might throw validation errors
          throw badRequest(`Invalid image format: ${error.message}`)
        }
        throw badRequest('Invalid image format')
      }
    } catch (error) {
      // Handle size checking errors or pass through other validation errors
      if (error instanceof Error) {
        // Pass through AppError instances
        if (error instanceof AppError) {
          throw error
        }
        throw badRequest(`Image validation failed: ${error.message}`)
      }
      throw badRequest('Invalid image data')
    }
  }

  /**
   * Process an image for storage
   * Currently a stub as we're starting with simple storage only
   */
  async processImage(
    imageData: ReadableStream<Uint8Array>,
    metadata: ImageMetadata,
  ): Promise<ReadableStream<Uint8Array>> {
    // In the future, we can add transformations here
    // For now, just return the original image
    return imageData
  }

  /**
   * Transform an image with the given options
   * @param imageData - The image data to transform
   * @param options - Transform options like width, height, and format
   * @returns The transformed image data
   */
  async transform(
    imageData: ReadableStream<Uint8Array>,
    options: {
      width?: number
      height?: number
      fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
      quality?: number
      format?: string
    },
  ): Promise<ReadableStream<Uint8Array>> {
    try {
      // Use Cloudflare Images API to transform the image
      const transformer = this.images.input(imageData)

      // Apply transformations
      const transformOptions: ImageTransform = {
        width: options.width,
        height: options.height,
        fit: options.fit,
      }

      const transformed = transformer.transform(transformOptions)

      // Set output format and quality
      const outputOptions: ImageOutputOptions = {
        format: getOutputFormat(options.format),
        quality: options.quality,
      }

      // Get the transformed image
      const result = await transformed.output(outputOptions)
      return result.image()
    } catch (error) {
      console.error('Image transformation failed:', error)
      throw internalError('Failed to transform image')
    }
  }
}

/**
 * Convert format string to ImagesBinding format type
 */
function getOutputFormat(
  format?: string,
): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'image/avif' {
  if (!format) return 'image/webp' // Default

  switch (format) {
    case 'webp':
      return 'image/webp'
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'avif':
      return 'image/avif'
    default:
      return 'image/webp'
  }
}
