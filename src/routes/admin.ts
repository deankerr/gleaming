import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { CloudflareBindings, DEFAULT_WORKSPACE_ID } from '../types'
import { uploadFormHtml, galleryHtml } from '../html'
import { listImagesWithMetadata } from '../image-service'
import { ensureDefaultWorkspace } from '../database'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Admin dashboard
app.get('/', (c) => {
  try {
    return c.html(uploadFormHtml())
  } catch (error) {
    console.error('Admin dashboard error:', error)
    throw new HTTPException(500, { message: 'Failed to render admin dashboard' })
  }
})

// Development-only endpoint to initialize the default workspace
app.get('/init', async (c) => {
  try {
    // Only allow in development environment
    if (c.env.ENVIRONMENT !== 'development') {
      throw new HTTPException(403, { message: 'This endpoint is only available in development mode' })
    }

    // Ensure default workspace exists
    await ensureDefaultWorkspace(c.env.DB)

    return c.json({
      success: true,
      message: 'Default workspace initialized successfully',
    })
  } catch (error) {
    console.error('Initialization error:', error)
    throw new HTTPException(500, { message: 'Failed to initialize default workspace' })
  }
})

// Debug endpoint to check database status
app.get('/debug', async (c) => {
  try {
    // Only allow in development environment
    if (c.env.ENVIRONMENT !== 'development') {
      throw new HTTPException(403, { message: 'This endpoint is only available in development mode' })
    }

    // Check if tables exist
    const tablesResult = await c.env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()

    // Check if workspaces table exists
    const hasWorkspacesTable = tablesResult.results.some((table: any) => table.name === 'workspaces')

    let workspaceResult = { results: [] }

    if (hasWorkspacesTable) {
      // Check if default workspace exists
      workspaceResult = await c.env.DB.prepare('SELECT * FROM workspaces WHERE id = ?')
        .bind(DEFAULT_WORKSPACE_ID)
        .all()
    }

    return c.json({
      success: true,
      tables: tablesResult.results,
      hasWorkspacesTable,
      defaultWorkspace: workspaceResult.results,
    })
  } catch (error: any) {
    console.error('Debug error:', error)
    return c.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack || '',
    })
  }
})

// Image gallery
app.get('/images', async (c) => {
  try {
    const baseUrl = new URL(c.req.url).origin

    // Ensure default workspace exists
    await ensureDefaultWorkspace(c.env.DB)

    const { images } = await listImagesWithMetadata(c.env.DB, baseUrl, {
      workspaceId: DEFAULT_WORKSPACE_ID,
      limit: 100,
    })

    return c.html(galleryHtml(images))
  } catch (error) {
    console.error('Gallery error:', error)
    throw new HTTPException(500, { message: 'Failed to load image gallery' })
  }
})

export default app
