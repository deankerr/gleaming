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
   * Validate image and extract metadata
   * @param stream - The image stream to validate
   * @returns Validation result with image info or error
   */
  async processMetadata(stream: ReadableStream<Uint8Array>): Promise<ImageValidationResult> {
    try {
      // throws ImagesError with code 9412 if input is not an image
      const data = await this.images.info(stream)
      // NOTE: image/svg+xml will not include width/height or fileSize
      return { success: true, data: data as ImageInfoMetadata }
    } catch (err) {
      if (err instanceof Error) {
        if ('code' in err && typeof err.code === 'number' && err.code === 9412) {
          return { success: false, error: 'Not a valid image format' }
        }
      }
      throw err
    }
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

  /**
   * Transform an image and return both the transformed image and content type
   * @param imageData - The image data to transform
   * @param params - Transform parameters from request query
   * @returns Object containing transformed image and content type
   */
  async transformWithFormat(
    imageData: ReadableStream<Uint8Array>,
    params: {
      width?: string
      height?: string
      format?: string
      fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
      quality?: string
    },
  ): Promise<{ transformedImage: ReadableStream<Uint8Array>; contentType: string }> {
    // Convert string parameters to appropriate types
    const options: Record<string, any> = {}

    if (params.width) options.width = parseInt(params.width, 10)
    if (params.height) options.height = parseInt(params.height, 10)
    if (params.fit) options.fit = params.fit
    if (params.quality) options.quality = parseInt(params.quality, 10)
    if (params.format) options.format = params.format

    // Transform the image
    const transformedImage = await this.transform(imageData, options)

    // Determine content type based on requested format
    const contentType = getOutputFormat(params.format)

    return { transformedImage, contentType }
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
