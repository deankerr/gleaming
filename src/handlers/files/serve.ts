import { z } from '@hono/zod-openapi'
import type { ServeImageRoute } from '../../routes/files'
import type { AppRouteHandler } from '../../types'
import { AppError, notFound } from '../../utils/errors'

// Define the supported image transformations
export const ImageTransformParamsSchema = z.object({
  width: z
    .string()
    .optional()
    .openapi({
      param: {
        name: 'width',
        in: 'query',
      },
      example: '800',
    }),
  height: z
    .string()
    .optional()
    .openapi({
      param: {
        name: 'height',
        in: 'query',
      },
      example: '600',
    }),
  format: z
    .enum(['webp', 'jpeg', 'png', 'avif'])
    .optional()
    .openapi({
      param: {
        name: 'format',
        in: 'query',
      },
      example: 'webp',
    }),
  fit: z
    .enum(['scale-down', 'contain', 'cover', 'crop', 'pad'])
    .optional()
    .openapi({
      param: {
        name: 'fit',
        in: 'query',
      },
      example: 'contain',
    }),
  quality: z
    .string()
    .optional()
    .openapi({
      param: {
        name: 'quality',
        in: 'query',
      },
      example: '85',
    }),
})

// Custom simplified type for query params
export interface ImageTransformParams {
  width?: string
  height?: string
  format?: string
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
  quality?: string
}

/**
 * Handler for serving an image by its slug
 */
export const serveImage: AppRouteHandler<ServeImageRoute> = async (c) => {
  const { slug } = c.req.valid('param')

  // Get query parameters directly without using valid() since we're handling
  // them with our own logic for simplicity
  const queryParams = c.req.query()
  const transformParams: ImageTransformParams = {
    width: queryParams.width,
    height: queryParams.height,
    format: queryParams.format as string,
    fit: queryParams.fit as any,
    quality: queryParams.quality,
  }

  const db = c.get('db')
  const storageService = c.get('storage')

  try {
    // Find file record with this slug
    const file = await db.getFileBySlug(slug)

    if (!file) {
      throw notFound('File')
    }

    // Get the file from storage
    const r2Object = await storageService.getFile(file.contentHash)

    if (!r2Object) {
      throw notFound('File content')
    }

    // Apply transformations if any were requested
    if (hasTransformations(transformParams)) {
      const imageService = c.get('image')

      // Create transform options from query parameters
      const transformOptions = createTransformOptions(transformParams)

      // Apply the transformations
      const transformed = await imageService.transform(r2Object.body, transformOptions)

      // Get the content type based on format or original
      const contentType = getContentType(transformParams.format, file.contentType)

      // Return the transformed image with appropriate headers
      return new Response(transformed, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
          'Content-Disposition': 'inline',
        },
      })
    }

    // If no transformations, return the original file
    return new Response(r2Object.body, {
      headers: {
        'Content-Type': file.contentType,
        'Cache-Control': 'public, max-age=31536000',
        'Content-Disposition': 'inline',
      },
    })
  } catch (error) {
    console.error('Error serving image:', error)

    if (error instanceof AppError) {
      return c.json(
        {
          error: error.message,
          status: error.status,
        },
        error.status,
      )
    }

    // Default to 500 for server errors
    return c.json({ error: 'Failed to serve image', status: 500 }, 500)
  }
}

/**
 * Check if any transformations were requested
 */
function hasTransformations(params: ImageTransformParams): boolean {
  return !!(params.width || params.height || params.format || params.fit || params.quality)
}

/**
 * Create transform options from query parameters
 */
function createTransformOptions(params: ImageTransformParams): Record<string, any> {
  const options: Record<string, any> = {}

  if (params.width) options.width = parseInt(params.width, 10)
  if (params.height) options.height = parseInt(params.height, 10)
  if (params.fit) options.fit = params.fit
  if (params.quality) options.quality = parseInt(params.quality, 10)

  return options
}

/**
 * Get the content type based on format or original
 */
function getContentType(format: string | undefined, originalContentType: string): string {
  if (!format) return originalContentType

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
      return originalContentType
  }
}
