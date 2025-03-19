import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type { AppEnv } from '../types'

// Dev routes for debugging purposes
const listFilesRoute = createRoute({
  method: 'get',
  path: '/files',
  tags: ['Dev'],
  summary: 'List files (dev only)',
  description: 'List files in descending order by creation time',
  request: {
    query: z.object({
      limit: z
        .string()
        .optional()
        .openapi({
          param: {
            name: 'limit',
            in: 'query',
          },
          example: '20',
        }),
    }),
  },
  responses: {
    200: {
      description: 'Files retrieved successfully',
      content: {
        'application/json': {
          schema: z.array(z.any()),
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
            status: z.number(),
          }),
        },
      },
    },
  },
})

// Handler for listing files
const listFiles = async (c: any) => {
  const { limit = '50' } = c.req.valid('query')
  const db = c.get('db')

  try {
    // Get files from DB ordered by createdAt DESC
    const files = await db.listFiles(parseInt(limit, 10))
    return c.json(files, 200)
  } catch (error) {
    console.error('Error listing files:', error)
    return c.json({ error: 'Failed to list files', status: 500 }, 500)
  }
}

// Create the router
const devRouter = new OpenAPIHono<AppEnv>()

// Register routes
devRouter.openapi(listFilesRoute, listFiles)

export { devRouter }
