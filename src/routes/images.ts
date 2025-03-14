import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { HTTPException } from 'hono/http-exception'
import {
  CloudflareBindings,
  ImageUploadResponse,
  ImageListResponse,
  ErrorResponse,
  MAX_FILE_SIZE,
  DEFAULT_WORKSPACE_ID,
} from '../types'
import { validateImage } from '../utils'
import { uploadImage, listImagesWithMetadata, getImage, getImageWithMetadata } from '../image-service'
import { ensureDefaultWorkspace, deleteImage } from '../database'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Apply bodyLimit middleware to upload route only
const uploadMiddleware = bodyLimit({
  maxSize: MAX_FILE_SIZE,
  onError: (c) => {
    throw new HTTPException(413, {
      message: `File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    })
  },
})

// List images
app.get('/', async (c) => {
  try {
    const url = new URL(c.req.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const workspaceId = url.searchParams.get('workspace') || DEFAULT_WORKSPACE_ID
    const collectionId = url.searchParams.get('collection') || undefined
    const baseUrl = url.origin

    // Ensure default workspace exists
    await ensureDefaultWorkspace(c.env.DB)

    const {
      images,
      cursor: nextCursor,
      count,
    } = await listImagesWithMetadata(c.env.DB, baseUrl, {
      workspaceId,
      collectionId,
      limit,
      offset,
    })

    const response: ImageListResponse = {
      success: true,
      images,
      cursor: nextCursor,
      count,
    }

    return c.json(response)
  } catch (error) {
    console.error('List error:', error)
    throw new HTTPException(500, { message: 'Failed to list images' })
  }
})

// Upload image
app.post('/upload', uploadMiddleware, async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File

    if (!file) {
      throw new HTTPException(400, { message: 'No file provided' })
    }

    // Get optional workspace and collection from formData
    const workspaceId = formData.get('workspace_id')?.toString() || undefined
    const collectionId = formData.get('collection_id')?.toString() || undefined

    // Validate file and extract metadata
    const validation = await validateImage(file, c.env)
    if (!validation.valid) {
      throw new HTTPException(400, { message: validation.error || 'Invalid file' })
    }

    // Get base URL for image URLs
    const baseUrl = new URL(c.req.url).origin

    // Extract width and height from validation metadata
    const width = validation.metadata?.width
    const height = validation.metadata?.height

    // Upload to R2 and store metadata in D1
    const metadata = await uploadImage(
      c.env['gleaming-images'],
      c.env.DB,
      file,
      baseUrl,
      workspaceId,
      collectionId,
      width,
      height,
    )

    // Log the complete metadata for debugging
    console.log('Image uploaded successfully:', {
      id: metadata.id,
      filename: metadata.filename,
      dimensions: `${metadata.width}x${metadata.height}`,
      size: `${Math.round(metadata.size / 1024)} KB`,
      contentType: metadata.contentType,
      url: metadata.url,
      workspace: metadata.workspaceId,
      collection: metadata.collectionId,
    })

    // Return success response
    const response: ImageUploadResponse = {
      success: true,
      message: 'Image uploaded successfully',
      image: metadata,
    }

    return c.json(response)
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('Upload error:', error)
    throw new HTTPException(500, { message: 'Failed to upload image' })
  }
})

// Get single image with metadata and transform URLs
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const baseUrl = new URL(c.req.url).origin

    const image = await getImageWithMetadata(c.env.DB, baseUrl, id)

    if (!image) {
      throw new HTTPException(404, { message: 'Image not found' })
    }

    return c.json({ success: true, image })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('Get image error:', error)
    throw new HTTPException(500, { message: 'Failed to retrieve image metadata' })
  }
})

// Delete image (development only)
app.delete('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    // Get image from R2
    const { object, key } = await getImage(c.env['gleaming-images'], c.env.DB, id)

    if (!object) {
      throw new HTTPException(404, { message: 'Image not found' })
    }

    // Delete from R2
    await c.env['gleaming-images'].delete(key)

    // Delete from database
    await deleteImage(c.env.DB, id)

    return c.json({ success: true, message: 'Image deleted successfully' })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('Delete error:', error)
    throw new HTTPException(500, { message: 'Failed to delete image' })
  }
})

export default app
