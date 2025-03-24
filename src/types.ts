import type { RouteConfig, RouteHandler } from '@hono/zod-openapi'
import type { DBService } from './services/db.service'
import type { ImageService } from './services/image.service'
import type { StorageService } from './services/storage.service'

// Define extended Hono environment with our services
export interface AppEnv {
  Bindings: CloudflareBindings // AMBIENT TYPE (worker-configuration.d.ts)
  Variables: {
    db: DBService
    storage: StorageService
    image: ImageService
    userId: string
    projectId: string
  }
}

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppEnv>
