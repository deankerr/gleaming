import type { RouteConfig, RouteHandler } from '@hono/zod-openapi'
import type { DBService, FetchService, ImageService, StorageService } from './services'

// Define extended Hono environment with our services
export interface AppEnv {
  Bindings: CloudflareBindings // AMBIENT TYPE (worker-configuration.d.ts)
  Variables: {
    db: DBService
    storage: StorageService
    image: ImageService
    fetch: FetchService
    userId: string
    projectId: string
  }
}

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppEnv>
