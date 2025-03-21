import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { ImageTransformParamsSchema, serveFile } from '../handlers/files/serveFile'
import type { AppEnv } from '../types'

// TODO dedupe schemas
const ErrorSchema = z
  .object({
    error: z.string().openapi({
      example: 'Validation Error',
    }),
    status: z.number().openapi({
      example: 400,
    }),
  })
  .openapi('Error')

const FileParamsSchema = z.object({
  slug: z.string().openapi({
    param: {
      name: 'slug',
      in: 'path',
    },
    example: 'ltspei2xq-my-image',
  }),
})

const serveFileRoute = createRoute({
  method: 'get',
  path: '/{slug}',
  tags: ['Files'],
  summary: 'Serve file by slug',
  description: 'Serve a file by its unique slug with optional transformations for images',
  request: {
    params: FileParamsSchema,
    query: ImageTransformParamsSchema,
  },
  responses: {
    200: {
      description: 'File served successfully',
      content: {
        'image/*': {
          schema: z.any().openapi({
            type: 'string',
            format: 'binary',
          }),
        },
        'application/octet-stream': {
          schema: z.any().openapi({
            type: 'string',
            format: 'binary',
          }),
        },
      },
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'File not found',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Internal server error',
    },
  },
})

const fileRouter = new OpenAPIHono<AppEnv>()

fileRouter.openapi(serveFileRoute, serveFile)

export { fileRouter }

export type ServeFileRoute = typeof serveFileRoute
