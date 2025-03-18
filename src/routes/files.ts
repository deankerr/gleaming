import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { getImageByHash } from '../handlers/files/get'
import { uploadImage } from '../handlers/files/upload'
import type { AppEnv } from '../types'

// Define schemas
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
  hash: z.string().openapi({
    param: {
      name: 'hash',
      in: 'path',
    },
    example: 'abc123def456',
  }),
})

const ImageSchema = z
  .object({
    id: z.string().openapi({
      example: '01HPDQ5GXCVBNMTP7VJVDBK3NR',
    }),
    slug: z.string().openapi({
      example: 'my-image-01HPDQ5GXCVBNMTP7VJVDBK3NR',
    }),
    contentHash: z.string().openapi({
      example: 'abc123def456',
    }),
    contentType: z.string().openapi({
      example: 'image/jpeg',
    }),
    size: z.number().int().positive().openapi({
      example: 102400,
    }),
    metadata: z
      .object({
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
        format: z.string().optional(),
      })
      .optional()
      .openapi({
        example: { width: 800, height: 600, format: 'jpeg' },
      }),
    createdAt: z.string().datetime().openapi({
      example: '2025-01-01T00:00:00Z',
    }),
  })
  .openapi('Image')

// Upload schema allowing either URL or direct file upload
const UploadImageSchema = z
  .object({
    url: z.string().url().optional().openapi({
      example: 'https://example.com/source-image.jpg',
    }),
    file: z.instanceof(Blob).optional(),
    slug: z.string().optional().openapi({
      example: 'my-image',
    }),
  })

  .openapi('UploadImage')

// Create routes
// 1. Upload a new image
const uploadImageRoute = createRoute({
  method: 'post',
  path: '/files',
  tags: ['Files'],
  summary: 'Upload a new image',
  description: 'Upload a new image via URL or direct file upload',
  request: {
    body: {
      content: {
        'application/json': {
          schema: UploadImageSchema,
        },
        'multipart/form-data': {
          schema: UploadImageSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: ImageSchema,
        },
      },
      description: 'Image uploaded successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Invalid image data or file too large',
    },
    415: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Unsupported media type',
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

// 2. Get file by hash
const getFileRoute = createRoute({
  method: 'get',
  path: '/files/{hash}',
  tags: ['Files'],
  summary: 'Get file by hash',
  description: 'Retrieve a file by its content hash',
  request: {
    params: FileParamsSchema,
  },
  responses: {
    200: {
      description: 'File retrieved successfully',
      content: {
        'application/json': {
          schema: ImageSchema,
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

// Create the router with OpenAPIHono
const filesRouter = new OpenAPIHono<AppEnv>()

// Register routes
filesRouter.openapi(uploadImageRoute, uploadImage)

filesRouter.openapi(getFileRoute, getImageByHash)

export { filesRouter }

export type UploadImageRoute = typeof uploadImageRoute
export type GetImageByHashRoute = typeof getFileRoute
