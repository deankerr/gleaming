import { Hono } from 'hono'
import { CloudflareBindings } from '../types'
import {
  adminDashboardHandler,
  initWorkspaceHandler,
  debugHandler,
  imageGalleryHandler,
} from './admin-handlers'

// Create admin routes
const adminRoutes = new Hono<{ Bindings: CloudflareBindings }>()

// Admin dashboard
adminRoutes.get('/', adminDashboardHandler)

// Development-only endpoint to initialize the default workspace
adminRoutes.get('/init', initWorkspaceHandler)

// Debug endpoint to check database status
adminRoutes.get('/debug', debugHandler)

// Image gallery
adminRoutes.get('/images', imageGalleryHandler)

// Export routes and other public APIs from this module
export { adminRoutes }
