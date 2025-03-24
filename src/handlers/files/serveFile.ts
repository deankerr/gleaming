import { z } from '@hono/zod-openapi'
import type { ServeFileRoute } from '../../routes/file'
import type { AppRouteHandler } from '../../types'
import { AppError, notFound } from '../../utils/errors'
import type { FileMetadata } from '../../db/schema'

// Define the supported transformations
export const ImageTransformParamsSchema = z.object({
  anim: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional()
    .openapi({
      param: {
        name: 'anim',
        in: 'query',
      },
      example: 'false',
    }),
  width: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
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
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
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
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .optional()
    .openapi({
      param: {
        name: 'quality',
        in: 'query',
      },
      example: '85',
    }),
  flip: z
    .enum(['h', 'v', 'hv'])
    .optional()
    .openapi({
      param: {
        name: 'flip',
        in: 'query',
      },
      example: 'hv',
    }),
  rotate: z
    .enum(['90', '180', '270'])
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .optional()
    .openapi({
      param: {
        name: 'rotate',
        in: 'query',
      },
      example: '90',
    }),
})

export type ImageTransformParams = z.infer<typeof ImageTransformParamsSchema>

/**
 * Handler for serving a file by its slug
 */
export const serveFile: AppRouteHandler<ServeFileRoute> = async (c) => {
  const param = c.req.valid('param')
  // Extract just the base externalId without extension and ignoring subpath
  const externalId = param.externalId.split('.')[0] // remove extension
  const transformParams = c.req.valid('query')

  const db = c.get('db')
  const storageService = c.get('storage')
  const imageService = c.get('image')

  try {
    // Find file record with this slug
    const fileRecord = await db.getFileByExternalId(externalId)
    if (!fileRecord) {
      throw notFound('File')
    }

    // Get the file from storage
    const r2Object = await storageService.getFile(fileRecord)
    if (!r2Object) {
      throw notFound('File content')
    }

    // If transformations are requested and it's an image, transform it
    if (hasTransforms(transformParams) && isTransformableImage(fileRecord)) {
      const transformedImage = await imageService.transform(r2Object.body, transformParams)
      return transformedImage.response()
    }

    // If no transformations or not an image, return the original file
    return new Response(r2Object.body, {
      headers: {
        'Content-Type': fileRecord.contentType,
        'Cache-Control': 'public, max-age=31536000',
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

function hasTransforms(params: ImageTransformParams) {
  return Object.values(params).some((value) => value !== undefined)
}

function isTransformableImage(fileRecord: FileMetadata) {
  return fileRecord.contentType.startsWith('image/') && fileRecord.contentType !== 'image/svg+xml'
}
