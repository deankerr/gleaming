import { internalError } from '../utils/errors'

export interface ImageInfoMetadata {
  format: string
  width?: number
  height?: number
  fileSize?: number
}

type ImageValidationResult = { success: true; data: ImageInfoMetadata } | { success: false; error: string }

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
   * @returns Validation result with image info or error
   */
  async validateImage(stream: ReadableStream<Uint8Array>): Promise<ImageValidationResult> {
    try {
      // throws ImagesError with code 9412 if input is not an image
      const data = await this.images.info(stream)
      // NOTE: image/svg+xml will not include width/height or fileSize
      return { success: true, data: data as ImageInfoMetadata }
    } catch (err) {
      console.error(err)
      return { success: false, error: 'Invalid image' }
    }
  }

  /**
   * Process an image for storage
   * Currently a stub as we're starting with simple storage only
   */
  async processImage(
    imageData: ReadableStream<Uint8Array>,
    metadata: ImageInfoMetadata,
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
