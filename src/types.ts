import type { DBService } from './services/db.service'

// Define extended Hono environment with our services
export type AppEnv = {
  Bindings: CloudflareBindings
  Variables: {
    db: DBService
  }
}
