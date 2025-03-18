import { OpenAPIHono } from '@hono/zod-openapi'
import { showRoutes } from 'hono/dev'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import serveEmojiFavicon from './middleware/serve-emoji-favicon'
import { demoApp } from './zod-openapi-demo'
import { DBService } from './services/db.service'
import type { AppEnv } from './types'

const app = new OpenAPIHono<AppEnv>({
  strict: false, // allow trailing slashes
})

// Middleware to initialize and attach services
app.use('*', async (c, next) => {
  // Initialize database service
  const dbService = new DBService(c.env.DB)
  c.set('db', dbService)
  await next()
})

// Standard middleware
app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', prettyJSON())
app.use('*', serveEmojiFavicon('🤩'))

// Mount the demo app
app.route('/api', demoApp)

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

// Redirect root to API docs
app.get('/', (c) => c.redirect('/api/docs'))

showRoutes(app, { verbose: true })

export default app
