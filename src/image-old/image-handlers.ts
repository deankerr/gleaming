/**
 * HTTP handlers for the image module
 * Focuses only on request/response handling
 */
import { bodyLimit } from 'hono/body-limit'
import { cache } from 'hono/cache'
import { HTTPException } from 'hono/http-exception'
import { ensureDefaultWorkspace } from '../utils/workspaces'
import { ImageRetrievalParams, ImageTransformOptions, ImageUploadParams } from './image-entities'
import {
  deleteImage,
  getImageById,
  transformImage as transformImageService,
  uploadImage,
} from './image-service'
import { createTransformedFilename, prepareTransformOptions } from './image-transformations'

/**
 * Apply bodyLimit middleware to upload route only
 */
export const uploadMiddleware = bodyLimit({
  maxSize: 10 * 1024 * 1024, // 10MB
})

/**
 * Upload image handler
 */
export const uploadImageHandler = async (c: any) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file')
    const workspaceId = formData.get('workspace') || 'default'
    const collectionId = formData.get('collection') || null
    const title = formData.get('title') || null
    const description = formData.get('description') || null
    const tags = formData.get('tags')
      ? formData
          .get('tags')
          .split(',')
          .map((tag: string) => tag.trim())
      : []
    const sourceUrl = formData.get('source_url') || null

    if (!file || !(file instanceof File)) {
      throw new HTTPException(400, { message: 'No file uploaded' })
    }

    // Ensure default workspace exists
    await ensureDefaultWorkspace(c.env.DB)

    // Get base URL for image URLs
    const baseUrl = new URL(c.req.url).origin

    // Prepare upload params
    const params: ImageUploadParams = {
      file,
      workspaceId,
      collectionId,
      title,
      description,
      tags,
      sourceUrl,
    }

    // Upload the image
    const image = await uploadImage(c.env['gleaming-images'], c.env.DB, params, baseUrl, c.env)

    return c.json({
      success: true,
      data: image,
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('Error uploading image:', error)
    throw new HTTPException(500, { message: 'Failed to upload image' })
  }
}

/**
 * Get image metadata handler
 */
export const getImageMetadataHandler = async (c: any) => {
  try {
    const id = c.req.param('id')
    const baseUrl = new URL(c.req.url).origin

    // Get image metadata
    const image = await getImageById(c.env.DB, baseUrl, id)

    if (!image) {
      throw new HTTPException(404, { message: 'Image not found' })
    }

    return c.json({
      success: true,
      data: image,
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('Error getting image:', error)
    throw new HTTPException(500, { message: 'Failed to get image' })
  }
}

/**
 * Delete image handler
 */
export const deleteImageHandler = async (c: any) => {
  try {
    const id = c.req.param('id')

    // Delete the image
    const result = await deleteImage(c.env['gleaming-images'], c.env.DB, id)

    if (!result) {
      throw new HTTPException(404, { message: 'Image not found' })
    }

    return c.json({
      success: true,
      message: 'Image deleted successfully',
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('Error deleting image:', error)
    throw new HTTPException(500, { message: 'Failed to delete image' })
  }
}

/**
 * Handler for image access with optional transformations
 * Handles both:
 * - /image/:id (original image)
 * - /image/:id/:any_filename (original image)
 * - /image/:id/:any_filename.ext (format conversion)
 * - /image/:id/:any_filename.ext?w=800&h=600 (transformation)
 */
export const imageHandler = async (c: any) => {
  const id = c.req.param('id')
  const filenameParam = c.req.param('filename')
  const url = new URL(c.req.url)

  try {
    // Parse filename to extract extension if present
    let format: string | undefined
    let filename = filenameParam || id

    if (filenameParam) {
      const parts = filenameParam.split('.')
      if (parts.length > 1) {
        format = parts.pop()?.toLowerCase()
        filename = parts.join('.')
      }
    }

    // Check if we need to transform the image
    const width = parseInt(url.searchParams.get('w') || url.searchParams.get('width') || '0') || undefined
    const height = parseInt(url.searchParams.get('h') || url.searchParams.get('height') || '0') || undefined
    const quality = parseInt(url.searchParams.get('q') || url.searchParams.get('quality') || '80')
    const fit = url.searchParams.get('fit') || 'cover'

    // Prepare transformation options if needed
    let transformOptions: ImageTransformOptions | undefined

    if (
      width ||
      height ||
      format ||
      url.searchParams.has('q') ||
      url.searchParams.has('quality') ||
      url.searchParams.has('fit')
    ) {
      transformOptions = prepareTransformOptions(width, height, quality, fit, format)
    }

    // Prepare retrieval params
    const params: ImageRetrievalParams = {
      id,
      transformOptions,
      filename,
    }

    // Get and possibly transform the image
    const {
      contentType,
      body,
      filename: outputFilename,
    } = await transformImageService(c.env['gleaming-images'], c.env.DB, params)

    // Create a friendly filename for Content-Disposition
    const saveFilename = transformOptions
      ? createTransformedFilename(
          filename || outputFilename.split('.')[0],
          width,
          height,
          format || outputFilename.split('.').pop(),
        )
      : outputFilename

    // Serve the image with appropriate headers
    return new Response(body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${saveFilename}"`,
        'Cache-Control': transformOptions
          ? 'public, max-age=86400' // Cache transformed images for 24 hours
          : 'public, max-age=31536000', // Cache original images for 1 year
        Vary: 'Accept',
      },
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('Image error:', error)
    throw new HTTPException(500, { message: 'Failed to process image' })
  }
}

/**
 * Configure the cache middleware for image routes
 */
export const imageCacheMiddleware = cache({
  cacheName: 'gleaming-images',
  cacheControl: 'public, max-age=31536000', // Cache for 1 year
})
