import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import { HTTPException } from 'hono/http-exception'
import imageRoutes from './images/image.routes'
import { showRoutes } from 'hono/dev'

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

app.route('/api/v0', imageRoutes)

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

console.log('hono routes')
showRoutes(app, { verbose: true })

export default app
