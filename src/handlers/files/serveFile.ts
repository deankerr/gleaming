import { z } from '@hono/zod-openapi'
import type { ServeFileRoute } from '../../routes/file'
import type { AppRouteHandler } from '../../types'
import { AppError, notFound } from '../../utils/errors'

// Define the supported transformations
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

// Type for transform params
export interface TransformParams {
  width?: string
  height?: string
  format?: string
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
  quality?: string
}

/**
 * Handler for serving a file by its slug
 */
export const serveFile: AppRouteHandler<ServeFileRoute> = async (c) => {
  const { slug } = c.req.valid('param')
  const queryParams = c.req.query()

  // Extract transformation parameters
  const transformParams: TransformParams = {
    width: queryParams.width,
    height: queryParams.height,
    format: queryParams.format,
    fit: queryParams.fit as any,
    quality: queryParams.quality,
  }

  const db = c.get('db')
  const storageService = c.get('storage')
  const imageService = c.get('image')

  try {
    // Find file record with this slug
    const fileRecord = await db.getFileBySlug(slug)
    if (!fileRecord) {
      throw notFound('File')
    }

    // Get the file from storage
    const r2Object = await storageService.getFile(fileRecord.id)
    if (!r2Object) {
      throw notFound('File content')
    }

    // Check if any transformations were requested
    const hasTransforms = Boolean(
      transformParams.width ||
        transformParams.height ||
        transformParams.format ||
        transformParams.fit ||
        transformParams.quality,
    )

    // If transformations are requested and it's an image, transform it
    if (
      hasTransforms &&
      fileRecord.contentType.startsWith('image/') &&
      fileRecord.contentType !== 'image/svg+xml'
    ) {
      // Let the image service handle the transformation
      const { transformedImage, contentType } = await imageService.transformWithFormat(
        r2Object.body,
        transformParams,
      )

      // Return the transformed image with appropriate headers
      return new Response(transformedImage, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
          'Content-Disposition': 'inline',
        },
      })
    }

    // If no transformations or not an image, return the original file
    return new Response(r2Object.body, {
      headers: {
        'Content-Type': fileRecord.contentType,
        'Cache-Control': 'public, max-age=31536000',
        'Content-Disposition': 'inline',
      },
    })
  } catch (error) {
    console.error('Error serving file:', error)

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
    return c.json({ error: 'Failed to serve file', status: 500 }, 500)
  }
}
