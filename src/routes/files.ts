import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { getImageInfoBySlug } from '../handlers/files/info'
import { ingestImage } from '../handlers/files/ingest'
import { serveImage, ImageTransformParamsSchema } from '../handlers/files/serve'
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
  slug: z.string().openapi({
    param: {
      name: 'slug',
      in: 'path',
    },
    example: 'ltspei2xq-my-image',
  }),
})

const ImageSchema = z
  .object({
    id: z.string().openapi({
      example: '01HPDQ5GXCVBNMTP7VJVDBK3NR',
    }),
    slug: z.string().openapi({
      example: 'ltspei2xq-my-image',
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

// Direct file upload schema
const UploadImageSchema = z
  .object({
    // TODO blob validation stopped working?
    file: z.any().openapi({
      type: 'string',
      format: 'binary',
      description: 'Image file to upload',
    }),
    slug: z.string().optional().openapi({
      description: 'Optional user-defined slug (will be combined with a time-sortable ID)',
      example: 'my-image',
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
    slug: z.string().optional().openapi({
      description: 'Optional user-defined slug (will be combined with a time-sortable ID)',
      example: 'my-image',
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

// 1b. Ingest a new image from URL (experimental)
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

// 2. Get file info by slug
const getFileInfo = createRoute({
  method: 'get',
  path: '/info/{slug}',
  tags: ['Files'],
  summary: 'Get file info by slug',
  description: 'Retrieve file information by its unique slug',
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

// 3. Serve image by slug
const serveImageRoute = createRoute({
  method: 'get',
  path: '/file/{slug}',
  tags: ['Files'],
  summary: 'Serve image by slug',
  description: 'Serve an image by its unique slug with optional transformations',
  request: {
    params: FileParamsSchema,
    query: ImageTransformParamsSchema,
  },
  responses: {
    200: {
      description: 'Image served successfully',
      content: {
        'image/*': {
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

// Create the router with OpenAPIHono
const filesRouter = new OpenAPIHono<AppEnv>()

// Register routes
filesRouter.openapi(uploadImageRoute, uploadImage)
filesRouter.openapi(ingestImageRoute, ingestImage)
filesRouter.openapi(getFileInfo, getImageInfoBySlug)
filesRouter.openapi(serveImageRoute, serveImage)

export { filesRouter }

export type UploadImageRoute = typeof uploadImageRoute
export type IngestImageRoute = typeof ingestImageRoute
export type GetImageBySlugRoute = typeof getFileInfo
export type ServeImageRoute = typeof serveImageRoute
