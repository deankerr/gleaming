import type { AppEnv } from '../types'
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { ImageTransformParamsSchema, serveFile } from '../handlers/files/serveFile'

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
  externalId: z.string().openapi({
    param: {
      name: 'externalId',
      in: 'path',
    },
    example: 'abcdef123456',
  }),
  // Optional second level path parameter that can be used for future extensions
  subpath: z
    .string()
    .optional()
    .openapi({
      param: {
        name: 'subpath',
        in: 'path',
      },
      example: 'preview',
    }),
})

const serveFileRoute = createRoute({
  method: 'get',
  path: '/{externalId}/{subpath?}',
  tags: ['Files'],
  summary: 'Serve file by external ID',
  description: 'Serve a file by its unique external ID with optional transformations for images',
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
