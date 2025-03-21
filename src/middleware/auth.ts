import type { MiddlewareHandler } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'
import type { AppEnv } from '../types'

/**
 * Middleware to protect API routes with Bearer authentication
 * Uses the API_TOKEN environment variable for authentication
 */
export const apiAuth = (): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    // Get API token from environment
    const token = c.env.API_TOKEN
    if (!token) {
      return c.json({ error: 'API_TOKEN environment variable not set', status: 500 }, 500)
    }

    // Apply bearer auth with the token
    return bearerAuth({ token })(c, next)
  }
}
