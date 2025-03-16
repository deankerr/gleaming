import { ImageMetadata } from '../types'
import { ensureDefaultWorkspace } from '../utils/workspaces'
import {
  ALLOWED_MIME_TYPES,
  Image,
  ImageRetrievalParams,
  ImageUploadParams,
  mapDbImageToImage,
  MAX_FILE_SIZE,
} from './image-entities'
import { deleteImageMetadata, getImageMetadata, storeImageMetadata } from './image-queries'
import { deleteImageFromStorage, getImageFromStorage, uploadImageToStorage } from './image-storage'
import { transformImage as transformImageService } from './image-transformations'
import { generateUniqueId, getContentTypeFromFilename } from './image-utils'

/**
 * Upload an image
 * Orchestrates the upload process between storage and database
 */
export async function uploadImage(
  bucket: R2Bucket,
  db: D1Database,
  params: ImageUploadParams,
  baseUrl: string,
  env: any,
): Promise<Image> {
  const { file } = params
  const metadata = await extractImageMetadata(file, env) // todo can throw

  if (metadata.fileSize > MAX_FILE_SIZE) {
    throw new Error(`File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`)
  }

  // Ensure default workspace exists
  const workspaceId = params.workspaceId || (await ensureDefaultWorkspace(db))

  // Generate a unique ID for the image
  const id = generateUniqueId()

  // Upload to storage with extracted metadata
  const storageMetadata = await uploadImageToStorage(bucket, params.file, id, {
    width: metadata.width,
    height: metadata.height,
  })

  // Store metadata in database
  const dbImage = await storeImageMetadata(db, {
    id,
    cloudflare_id: storageMetadata.key,
    original_filename: params.file.name,
    mime_type: params.file.type,
    size: params.file.size,
    width: metadata.width,
    height: metadata.height,
    workspace_id: workspaceId,
    collection_id: params.collectionId,
    source_url: params.sourceUrl,
  })

  // Map to domain entity and return
  return mapDbImageToImage(dbImage)
}

/**
 * Delete an image
 */
export async function deleteImage(bucket: R2Bucket, db: D1Database, id: string): Promise<boolean> {
  try {
    // Get the image first to ensure it exists and to get the storage key
    const dbImage = await getImageMetadata(db, id)
    if (!dbImage) {
      return false
    }

    // Delete from storage
    await deleteImageFromStorage(bucket, dbImage.cloudflare_id)

    // Delete from database
    await deleteImageMetadata(db, id)

    return true
  } catch (error) {
    console.error('Error deleting image:', error)
    throw new Error('Failed to delete image')
  }
}

/**
 * Transform an image
 */
export async function transformImage(
  bucket: R2Bucket,
  db: D1Database,
  params: ImageRetrievalParams,
): Promise<{ contentType: string; body: ReadableStream; filename: string }> {
  try {
    const { id, transformOptions, filename } = params

    // Get the image with storage object
    const { image, object, key } = await getImageWithStorageObject(bucket, db, id)

    if (!image || !object) {
      throw new Error('Image not found')
    }

    // If no transformation needed, return the original
    if (!transformOptions || Object.keys(transformOptions).length === 0) {
      const objectWithBody = object as any
      const contentType = object.httpMetadata?.contentType || getContentTypeFromFilename(key)

      return {
        contentType,
        body: objectWithBody.body,
        filename: image.original_filename,
      }
    }

    // Otherwise, transform the image
    // This would typically call an image processing service
    // For now, we'll use the transformImage function from image-transformations
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const originalUrl = `${baseUrl}/image/${id}`

    try {
      const transformedImage = await transformImageService(originalUrl, transformOptions, env)

      // Determine output content type
      const outputFormat = transformOptions.format || getContentTypeFromFilename(key).split('/').pop()
      const contentType = getContentTypeFromFilename(`image.${outputFormat}`)

      return {
        contentType,
        body: transformedImage.body,
        filename: filename || image.original_filename,
      }
    } catch (err) {
      const error = err as Error
      console.error('Image transformation failed:', error)
      throw new Error(`Image transformation failed: ${error.message}`)
    }
  } catch (error) {
    console.error('Error transforming image:', error)
    throw new Error('Failed to transform image')
  }
}

/**
 * Retrieves an image from R2 storage
 */
export async function getImageObject(
  bucket: R2Bucket,
  db: D1Database,
  id: string,
): Promise<{ object: R2Object | null; key: string }> {
  // Get metadata from database
  const dbImage = await getImageMetadata(db, id)

  if (dbImage) {
    // We have metadata, so we know the exact key
    const object = await bucket.get(dbImage.cloudflare_id)
    return { object, key: dbImage.cloudflare_id }
  }

  return { object: null, key: '' }
}

/**
 * Helper function to create a URL-safe filename
 */
function getSafeFilename(filename: string): string {
  // Remove file extension
  const parts = filename.split('.')
  const ext = parts.pop()
  const name = parts.join('.')

  // Replace spaces and special characters
  return name
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .toLowerCase()
}

async function extractImageMetadata(file: File, env: any) {
  // Extract metadata using Cloudflare Images
  const stream = file.stream()
  const info = await env.IMAGES.info(stream)

  return {
    width: info.width,
    height: info.height,
    format: info.format,
    fileSize: file.size,
  }
}
