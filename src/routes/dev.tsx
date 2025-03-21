import { Hono } from 'hono'
import { FilesPage, GalleryPage, UploadPage } from '../pages/dev'
import type { AppEnv } from '../types'

// Create the router
const devRouter = new Hono<AppEnv>()

// Upload page route
devRouter.get('/upload', async (c) => {
  return c.html(<UploadPage currentPath={c.req.path} />)
})

// Route to list files
devRouter.get('/files', async (c) => {
  const query = c.req.query()
  const limit = parseInt(query.limit || '50', 10)
  const db = c.get('db')

  try {
    // Get files from DB ordered by createdAt DESC
    const files = await db.listFiles(limit)
    // Convert database results to FileMetadata type
    const filesMeta = files.map((file) => ({
      slug: file.slug,
      contentType: file.contentType,
      size: file.size,
      createdAt: file.createdAt,
      metadata: file.metadata as Record<string, unknown>,
    }))

    return c.html(<FilesPage files={filesMeta} />)
  } catch (error) {
    console.error('Error listing files:', error)
    return c.json({ error: 'Failed to list files', status: 500 }, 500)
  }
})

// Image gallery route
devRouter.get('/gallery', async (c) => {
  const query = c.req.query()
  const limit = parseInt(query.limit || '50', 10)
  const db = c.get('db')

  try {
    // Get files from DB ordered by createdAt DESC
    const files = await db.listFiles(limit)

    // Filter to only include image files
    const imageFiles = files.filter((file) => {
      const contentType = file.contentType.includes('/') ? file.contentType : `image/${file.contentType}`
      return contentType.startsWith('image/')
    })

    // Convert database results to FileMetadata type
    const imagesMeta = imageFiles.map((file) => ({
      slug: file.slug,
      contentType: file.contentType,
      size: file.size,
      createdAt: file.createdAt,
      metadata: file.metadata as Record<string, unknown>,
    }))

    return c.html(<GalleryPage images={imagesMeta} />)
  } catch (error) {
    console.error('Error creating gallery:', error)
    return c.json({ error: 'Failed to create gallery', status: 500 }, 500)
  }
})

export { devRouter }
