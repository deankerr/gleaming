import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type { AppEnv } from './types'

// NOTE: DEMO CODE

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

// User schemas
const UserParamsSchema = z.object({
  id: z
    .string()
    .min(3)
    .openapi({
      param: {
        name: 'id',
        in: 'path',
      },
      example: 'user123',
    }),
})

const UserSchema = z
  .object({
    id: z.string().openapi({
      example: 'user123',
    }),
    name: z.string().openapi({
      example: 'John Doe',
    }),
    email: z.string().email().openapi({
      example: 'john@example.com',
    }),
    createdAt: z.string().datetime().openapi({
      example: '2025-01-01T00:00:00Z',
    }),
  })
  .openapi('User')

const CreateUserSchema = z
  .object({
    name: z.string().min(2).openapi({
      example: 'Jane Doe',
    }),
    email: z.string().email().openapi({
      example: 'jane@example.com',
    }),
  })
  .openapi('CreateUser')

// Image schemas
const ImageParamsSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      param: {
        name: 'id',
        in: 'path',
      },
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
})

const ImageQuerySchema = z.object({
  width: z
    .string()
    .regex(/^\d+$/)
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
    .regex(/^\d+$/)
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
})

const ImageSchema = z
  .object({
    id: z.string().uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    url: z.string().url().openapi({
      example: 'https://example.com/images/123e4567-e89b-12d3-a456-426614174000.webp',
    }),
    width: z.number().int().positive().openapi({
      example: 800,
    }),
    height: z.number().int().positive().openapi({
      example: 600,
    }),
    format: z.enum(['webp', 'jpeg', 'png', 'avif']).openapi({
      example: 'webp',
    }),
    size: z.number().int().positive().openapi({
      example: 102400,
    }),
    createdAt: z.string().datetime().openapi({
      example: '2025-01-01T00:00:00Z',
    }),
  })
  .openapi('Image')

const UploadImageSchema = z
  .object({
    url: z.string().url().optional().openapi({
      example: 'https://example.com/source-image.jpg',
    }),
    base64: z.string().optional().openapi({
      example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
    }),
    optimizationPreset: z.enum(['thumbnail', 'web', 'social', 'original']).default('web').openapi({
      example: 'web',
    }),
  })
  .openapi('UploadImage')

// Create routes
// 1. Get user by ID
const getUserRoute = createRoute({
  method: 'get',
  path: '/users/{id}',
  tags: ['Users'],
  summary: 'Get user by ID',
  description: 'Retrieve a user by their unique identifier',
  request: {
    params: UserParamsSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserSchema,
        },
      },
      description: 'User found successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Invalid user ID format',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'User not found',
    },
  },
})

// 2. Create a new user
const createUserRoute = createRoute({
  method: 'post',
  path: '/users',
  tags: ['Users'],
  summary: 'Create a new user',
  description: 'Create a new user with the provided information',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateUserSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: UserSchema,
        },
      },
      description: 'User created successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Invalid user data',
    },
  },
})

// 3. Get image by ID with optional transformations
const getImageRoute = createRoute({
  method: 'get',
  path: '/images/{id}',
  tags: ['Images'],
  summary: 'Get image by ID',
  description: 'Retrieve an image by its unique identifier with optional transformation parameters',
  request: {
    params: ImageParamsSchema,
    query: ImageQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ImageSchema,
        },
      },
      description: 'Image found successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Invalid image ID or query parameters',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Image not found',
    },
  },
})

// 4. Upload a new image
const uploadImageRoute = createRoute({
  method: 'post',
  path: '/images',
  tags: ['Images'],
  summary: 'Upload a new image',
  description: 'Upload a new image via URL or base64 data',
  request: {
    body: {
      content: {
        'application/json': {
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
      description: 'Invalid image data',
    },
  },
})

// Create the app and register routes
const demoApp = new OpenAPIHono<AppEnv>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: 'Validation Error',
          status: 400,
          details: result.error.issues,
        },
        400,
      )
    }
  },
})

type UserParams = z.infer<typeof UserParamsSchema>
type CreateUserBody = z.infer<typeof CreateUserSchema>

demoApp.openapi(getUserRoute, async (c) => {
  const { id } = c.req.valid('param') as UserParams
  const db = c.get('db')

  const user = await db.getUserById(id)
  if (!user) {
    return c.json({ error: 'User not found', status: 404 }, 404)
  }

  return c.json(user, 200)
})

demoApp.openapi(createUserRoute, async (c) => {
  const userData = c.req.valid('json') as CreateUserBody
  const db = c.get('db')

  const user = await db.createUser({
    name: userData.name,
    email: userData.email,
  })

  return c.json(user, 201)
})

demoApp.openapi(getImageRoute, (c) => {
  const { id } = c.req.valid('param')
  const query = c.req.valid('query')

  // In a real app, we would fetch and transform the image
  const width = query.width ? parseInt(query.width) : 800
  const height = query.height ? parseInt(query.height) : 600
  const format = query.format || ('webp' as const)

  return c.json(
    {
      id,
      url: `https://example.com/images/${id}.${format}`,
      width,
      height,
      format,
      size: width * height * 0.2, // Fake size calculation
      createdAt: '2025-01-01T00:00:00Z',
    },
    200,
  )
})

demoApp.openapi(uploadImageRoute, (c) => {
  const imageData = c.req.valid('json')
  // In a real app, we would process and store the image
  const id = crypto.randomUUID()

  return c.json(
    {
      id,
      url: `https://example.com/images/${id}.webp`,
      width: 800,
      height: 600,
      format: 'webp' as const,
      size: 102400,
      createdAt: new Date().toISOString(),
    },
    201,
  )
})

// Set up OpenAPI documentation
demoApp.doc('/docs', {
  openapi: '3.0.0',
  info: {
    title: 'Gleaming Image API',
    version: '1.0.0',
    description: 'API for image hosting and optimization service with AI-powered features',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
  },
  servers: [
    {
      url: 'https://api.example.com',
      description: 'Production server',
    },
    {
      url: 'https://staging-api.example.com',
      description: 'Staging server',
    },
    {
      url: 'http://localhost:8787',
      description: 'Local development server',
    },
  ],
  tags: [
    {
      name: 'Users',
      description: 'User management endpoints',
    },
    {
      name: 'Images',
      description: 'Image management and transformation endpoints',
    },
  ],
})

export { demoApp }
