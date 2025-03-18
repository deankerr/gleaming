import type { RouteConfig, RouteHandler } from '@hono/zod-openapi'
import type { DBService } from './services/db.service'

// Define extended Hono environment with our services
export type AppEnv = {
  Bindings: CloudflareBindings // AMBIENT TYPE (worker-configuration.d.ts)
  Variables: {
    db: DBService
  }
}

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppEnv>
