import type { AppEnv } from './types'
import { OpenAPIHono } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'
import { showRoutes } from 'hono/dev'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { DEFAULT_PROJECT, DEFAULT_USER } from './constants'
import { apiAuth } from './middleware/auth'
import { serveEmojiFavicon } from './middleware/serve-emoji-favicon'
import { apiRouter } from './routes/api'
import { devRouter } from './routes/dev'
import { fileRouter } from './routes/file'
import { FetchService } from './services'
import { DBService } from './services/db.service'
import { ImageService } from './services/image.service'
import { StorageService } from './services/storage.service'

const app = new OpenAPIHono<AppEnv>({
  strict: false, // allow trailing slashes
})

// Middleware to initialize and attach services
app.use('*', async (c, next) => {
  // Initialize services
  const dbService = new DBService(c.env.DB)
  const storageService = new StorageService(c.env.BUCKET)
  const imageService = new ImageService(c.env.IMAGES)
  const fetchService = new FetchService(c.env.RL_FETCH_HOSTNAME, new URL(c.req.url).hostname)

  // Attach services to context
  c.set('db', dbService)
  c.set('storage', storageService)
  c.set('image', imageService)
  c.set('fetch', fetchService)
  await next()
})

// Middleware to set up user and project context
app.use('*', async (c, next) => {
  const userId = c.env.DEFAULT_USER || DEFAULT_USER
  const projectId = c.env.DEFAULT_PROJECT || DEFAULT_PROJECT

  c.set('userId', userId)
  c.set('projectId', projectId)

  await next()
})

// Standard middleware - apply these first so they work for all routes
app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', prettyJSON())
app.use('*', serveEmojiFavicon('🤩', '🌌'))

app.use('/api/*', apiAuth())
app.route('/api', apiRouter)

app.route('/dev', devRouter)

// Public file routes
app.route('/file', fileRouter)

app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Gleaming API',
    description:
      'API for the Gleaming. Protected with Bearer auth - include your API token in the Authorization header.',
  },
})

app.get(
  '/reference',
  apiReference({
    theme: 'kepler',
    layout: 'classic',
    defaultHttpClient: {
      targetKey: 'js',
      clientKey: 'fetch',
    },
    url: '/doc',
  }),
)

// Global error handler
app.onError((err, c) => {
  console.error(`${err.message}\n`, err.stack)

  // Handle Hono's HTTPException
  if (err instanceof HTTPException) {
    const errorResponse = {
      error: err.message,
      status: err.status,
    }
    return c.json(errorResponse, err.status)
  }

  // Handle other errors
  const errorResponse = {
    error: 'Internal Server Error',
    status: 500,
  }
  return c.json(errorResponse, 500)
})

// Catch-all route for 404s
app.notFound((c) => {
  const errorResponse = {
    error: 'Resource not found',
    status: 404,
  }
  return c.json(errorResponse, 404)
})

showRoutes(app, { verbose: false })

export default app
