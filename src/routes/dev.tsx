import type { AppEnv } from '../types'
import { Hono } from 'hono'
import { getConnInfo } from 'hono/cloudflare-workers'
import { FilesPage, GalleryPage, UploadPage } from '../pages/dev'

// Create the router
const devRouter = new Hono<AppEnv>()

// Upload page route
devRouter.get('/upload', async (c) => {
  return c.html(<UploadPage currentPath={c.req.path} />)
})

// Route to list files
devRouter.get('/files', async (c) => {
  console.log(getConnInfo(c))
  const query = c.req.query()
  const limit = Number.parseInt(query.limit || '50', 10)
  const db = c.get('db')

  try {
    // Get files from DB ordered by createdAt DESC
    const files = await db.listFiles(limit)
    return await c.html(<FilesPage files={files} />)
  }
  catch (error) {
    console.error('Error listing files:', error)
    return c.json({ error: 'Failed to list files', status: 500 }, 500)
  }
})

// Image gallery route
devRouter.get('/gallery', async (c) => {
  const query = c.req.query()
  const limit = Number.parseInt(query.limit || '50', 10)
  const db = c.get('db')

  try {
    // Get files from DB ordered by createdAt DESC
    const files = await db.listFiles(limit)

    // Filter to only include image files
    const imageFiles = files.filter((file) => {
      const contentType = file.contentType.includes('/') ? file.contentType : `image/${file.contentType}`
      return contentType.startsWith('image/')
    })

    return await c.html(<GalleryPage images={imageFiles} />)
  }
  catch (error) {
    console.error('Error creating gallery:', error)
    return c.json({ error: 'Failed to create gallery', status: 500 }, 500)
  }
})

export { devRouter }
