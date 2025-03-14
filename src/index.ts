import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import { HTTPException } from 'hono/http-exception'
import { CloudflareBindings, ErrorResponse } from './types'

// Import route modules
import adminRoutes from './routes/admin'
import imageRoutes from './routes/images'
import publicRoutes from './routes/public'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Consolidated middleware
app.use('*', logger())
app.use('*', secureHeaders())
app.use(
  '*',
  cors({
    origin: '*', // Consider restricting this in production
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
  }),
)
app.use('*', prettyJSON())

// Global error handler
app.onError((err, c) => {
  console.error(`[ERROR] ${err.message}`, err.stack)

  // Handle Hono's HTTPException
  if (err instanceof HTTPException) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: err.message,
      status: err.status,
    }
    return c.json(errorResponse, err.status)
  }

  // Handle other errors
  const errorResponse: ErrorResponse = {
    success: false,
    error: 'Internal Server Error',
    status: 500,
  }
  return c.json(errorResponse, 500)
})

// Mount routes
app.route('/admin', adminRoutes)
app.route('/api/v1/images', imageRoutes)
app.route('/', publicRoutes)

// Catch-all route for 404s
app.notFound((c) => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: 'Resource not found',
    status: 404,
  }
  return c.json(errorResponse, 404)
})

export default app
