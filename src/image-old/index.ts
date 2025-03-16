/**
 * Image module - Public API
 *
 * This module provides functionality for image upload, storage, retrieval,
 * transformation, and management.
 */
import { Hono } from 'hono'
import { CloudflareBindings } from '../types'

// Import handlers and middleware
import {
  deleteImageHandler,
  getImageMetadataHandler,
  imageCacheMiddleware,
  imageHandler,
  uploadImageHandler,
  uploadMiddleware,
} from './image-handlers'

/**
 * Create and configure the API routes for images
 */
const imageRoutes = new Hono<{ Bindings: CloudflareBindings }>()

// API routes
imageRoutes.post('/', uploadMiddleware, uploadImageHandler)
imageRoutes.get('/:id', getImageMetadataHandler)
imageRoutes.delete('/:id', deleteImageHandler)

// Public image access with optional filename and transformations
imageRoutes.get('/image/:id/:filename?', imageCacheMiddleware, imageHandler)

// Export routes
export { imageRoutes }

// Re-export domain entities
export {
  Image,
  ImageListParams,
  ImageRetrievalParams,
  ImageTransformOptions,
  ImageUploadParams,
} from './image-entities'

// Re-export service functions
export { deleteImage, transformImage, uploadImage } from './image-service'
