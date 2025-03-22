import type { ImageTransformParams } from '../handlers/files/serveFile'

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

  async transform(stream: ReadableStream<Uint8Array>, options: ImageTransformParams) {
    const { format, quality, ...transforms } = options
    return await this.images
      .input(stream)
      .transform(transforms)
      .output({ format: getOutputFormat(format), quality })
  }
}

/**
 * Convert format string to ImagesBinding format type
 */
function getOutputFormat(
  format?: string,
): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'image/avif' {
  switch (format) {
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
