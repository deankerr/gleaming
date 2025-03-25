import type { AppEnv } from '../types'
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { createSelectSchema } from 'drizzle-zod'
import { schema } from '../db/schema'
import { getFileInfo } from '../handlers/files/info'
import { ingestImage } from '../handlers/files/ingest'
import { uploadImage } from '../handlers/files/upload'

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

const ImageSchema = createSelectSchema(schema.files)

// Direct file upload schema
const UploadImageSchema = z
  .object({
    // TODO blob validation stopped working?
    file: z.any().openapi({
      type: 'string',
      format: 'binary',
      description: 'Image file to upload',
    }),
    filename: z.string().optional().openapi({
      description: 'Optional user-defined filename',
      example: 'my-image.jpg',
    }),
    projectId: z.string().optional().openapi({
      description: 'Project ID (defaults to default-project)',
      example: 'my-project',
    }),
  })
  .openapi('UploadImage')

// Ingest via URL schema
const IngestImageSchema = z
  .object({
    url: z.string().url().openapi({
      example: 'https://example.com/source-image.jpg',
      description: 'URL of the image to ingest',
    }),
    filename: z.string().optional().openapi({
      description: 'Optional user-defined filename',
      example: 'my-image.jpg',
    }),
    projectId: z.string().optional().openapi({
      description: 'Project ID (defaults to default-project)',
      example: 'my-project',
    }),
  })
  .openapi('IngestImage')

// Create routes
// 1. Upload a new image
const uploadImageRoute = createRoute({
  method: 'post',
  path: '/upload',
  tags: ['Files'],
  summary: 'Upload a new image',
  description: 'Upload a new image via URL or direct file upload',
  request: {
    body: {
      content: {
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

// 1b. Ingest a new image from URL
const ingestImageRoute = createRoute({
  method: 'post',
  path: '/ingest',
  tags: ['Files'],
  summary: 'Ingest a new image from URL',
  description: ' endpoint to ingest a new image via URL with additional validation',
  request: {
    body: {
      content: {
        'application/json': {
          schema: IngestImageSchema,
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
      description: 'Image ingested successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Invalid URL, non-image content, or file too large',
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

const FileParamsSchema = z.object({
  externalId: z.string().openapi({
    param: {
      name: 'externalId',
      in: 'path',
    },
    example: 'abcdef123456',
  }),
})

// 2. Get file info by slug
const getFileInfoRoute = createRoute({
  method: 'get',
  path: '/info/{externalId}',
  tags: ['Files'],
  summary: 'Get file info by external ID',
  description: 'Retrieve file information by its unique external ID',
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
const apiRouter = new OpenAPIHono<AppEnv>()

// Register routes
apiRouter.openapi(uploadImageRoute, uploadImage)
apiRouter.openapi(ingestImageRoute, ingestImage)
apiRouter.openapi(getFileInfoRoute, getFileInfo)

export { apiRouter }

export type UploadImageRoute = typeof uploadImageRoute
export type IngestImageRoute = typeof ingestImageRoute
export type GetFileInfoRoute = typeof getFileInfoRoute
