/**
 * Interface for image transformation options
 */
export interface ImageTransformOptions {
  width?: number
  height?: number
  fit?: 'cover' | 'scale-down' | 'contain' | 'crop' | 'pad'
  quality?: number
  format?: 'avif' | 'webp' | 'json' | 'jpeg' | 'png'
}

/**
 * Prepares transformation options for Cloudflare Images
 */
export function prepareTransformOptions(
  width?: number,
  height?: number,
  quality: number = 80,
  fit: string = 'cover',
  format?: string,
): ImageTransformOptions {
  // Prepare transform options
  const transformOptions: ImageTransformOptions = {
    width,
    height,
    quality,
  }

  // Set fit if valid
  if (fit) {
    const validFit = convertToValidFit(fit)
    if (validFit) {
      transformOptions.fit = validFit
    }
  }

  // Set format if specified and valid
  if (format) {
    // Convert format to a valid Cloudflare format
    const validFormat = convertToValidFormat(format)
    if (validFormat) {
      transformOptions.format = validFormat
    }
  }

  // Remove undefined values
  Object.keys(transformOptions).forEach((key) => {
    if (transformOptions[key as keyof ImageTransformOptions] === undefined) {
      delete transformOptions[key as keyof ImageTransformOptions]
    }
  })

  return transformOptions
}

/**
 * Converts any fit string to a valid Cloudflare fit
 */
function convertToValidFit(fit: string): 'cover' | 'scale-down' | 'contain' | 'crop' | 'pad' | undefined {
  switch (fit.toLowerCase()) {
    case 'cover':
      return 'cover'
    case 'scale-down':
      return 'scale-down'
    case 'contain':
      return 'contain'
    case 'crop':
      return 'crop'
    case 'pad':
      return 'pad'
    default:
      return undefined
  }
}

/**
 * Converts any format string to a valid Cloudflare format
 */
function convertToValidFormat(format: string): 'avif' | 'webp' | 'json' | 'jpeg' | 'png' | undefined {
  const normalizedFormat = format.toLowerCase()

  switch (normalizedFormat) {
    case 'avif':
      return 'avif'
    case 'webp':
      return 'webp'
    case 'json':
      return 'json'
    case 'jpg':
    case 'jpeg':
      return 'jpeg'
    case 'png':
      return 'png'
    default:
      return undefined
  }
}

/**
 * Transforms an image using Cloudflare's image resizing service
 */
export async function transformImage(
  originalImageUrl: string,
  transformOptions: ImageTransformOptions,
): Promise<Response> {
  // Transform the image using Cloudflare's image resizing service
  const response = await fetch(originalImageUrl, {
    cf: {
      image: transformOptions,
    },
  })

  return response
}

/**
 * Creates a filename that includes transformation info
 */
export function createTransformedFilename(
  baseFilename: string,
  width?: number,
  height?: number,
  format?: string,
): string {
  let filename = baseFilename

  // Add dimensions if specified
  if (width || height) {
    filename += `-${width || 'auto'}x${height || 'auto'}`
  }

  // Add extension if format is specified
  if (format) {
    filename += `.${format}`
  }

  return filename
}
