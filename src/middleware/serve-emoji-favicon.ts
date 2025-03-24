import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '../types'

export function serveEmojiFavicon(emoji: string, devEmoji: string): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const isDev = c.env.ENVIRONMENT === 'development'

    if (c.req.path === '/favicon.ico') {
      c.header('Content-Type', 'image/svg+xml')
      return c.body(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" x="0em" font-size="90">${
          isDev ? devEmoji : emoji
        }</text></svg>`,
      )
    }
    return next()
  }
}
