import type { MiddlewareHandler } from 'hono'

export interface RequestMetadata {
  userAgent: string | null
  cfConnectingIp: string | null
  cfIpCountry: string | null
  cfRayId: string | null
}

/**
 * Middleware that collects standardized request metadata
 * Adds the metadata to the context for use in handlers
 */
export function requestMetadata(): MiddlewareHandler {
  return async (c, next) => {
    const metadata: RequestMetadata = {
      userAgent: c.req.header('user-agent') || null,
      cfConnectingIp: c.req.header('cf-connecting-ip') || null,
      cfIpCountry: c.req.header('cf-ipcountry') || null,
      cfRayId: c.req.header('cf-ray') || null,
    }

    // Add metadata to context for handlers to use
    c.set('requestMetadata', metadata)

    await next()
  }
}
