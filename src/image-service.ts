import { ImageMetadata, DbImage, DEFAULT_WORKSPACE_ID } from './types'
import { createStorageKey, generateUniqueId } from './utils'
import { storeImageMetadata, listImages, getImageById, ensureDefaultWorkspace } from './database'

/**
 * Uploads an image to R2 storage and stores metadata in D1
 */
export async function uploadImage(
  bucket: R2Bucket,
  db: D1Database,
  file: File,
  baseUrl: string,
  workspaceId?: string,
  collectionId?: string,
  width?: number,
  height?: number,
): Promise<ImageMetadata> {
  // Generate a unique ID for the image
  const id = generateUniqueId()
  const key = createStorageKey(id, file.name)

  // Ensure default workspace exists
  if (!workspaceId) {
    workspaceId = await ensureDefaultWorkspace(db)
  }

  // Upload file to R2
  await bucket.put(key, file, {
    httpMetadata: {
      contentType: file.type,
    },
    customMetadata: {
      originalFilename: file.name,
      width: width?.toString() || '',
      height: height?.toString() || '',
    },
  })

  // Create and store metadata in D1
  const dbImage = await storeImageMetadata(db, {
    id,
    cloudflare_id: key,
    original_filename: file.name,
    mime_type: file.type,
    size: file.size,
    width,
    height,
    workspace_id: workspaceId,
    collection_id: collectionId,
  })

  // Get file extension from original filename
  const fileExt = file.name.split('.').pop() || ''
  const safeFilename = getSafeFilename(file.name)

  // Return metadata in API format
  const metadata: ImageMetadata = {
    id: dbImage.id,
    filename: dbImage.original_filename,
    contentType: dbImage.mime_type,
    size: dbImage.size,
    width: dbImage.width,
    height: dbImage.height,
    uploadedAt: dbImage.created_at,
    // Updated URL format with filename
    url: `${baseUrl}/image/${dbImage.id}/${safeFilename}`,
    workspaceId: dbImage.workspace_id,
    collectionId: dbImage.collection_id,
  }

  return metadata
}

/**
 * Retrieves an image from R2 storage
 */
export async function getImage(
  bucket: R2Bucket,
  db: D1Database,
  id: string,
): Promise<{ object: R2Object | null; key: string }> {
  // Get metadata from database
  const dbImage = await getImageById(db, id)

  if (dbImage) {
    // We have metadata, so we know the exact key
    const object = await bucket.get(dbImage.cloudflare_id)
    return { object, key: dbImage.cloudflare_id }
  }

  return { object: null, key: '' }
}

/**
 * Gets image with metadata from database
 */
export async function getImageWithMetadata(
  db: D1Database,
  baseUrl: string,
  id: string,
): Promise<ImageMetadata | null> {
  try {
    const dbImage = await getImageById(db, id)

    if (!dbImage) {
      return null
    }

    // Get file extension from original filename
    const fileExt = dbImage.original_filename.split('.').pop() || ''
    const safeFilename = getSafeFilename(dbImage.original_filename)

    // Convert to API format
    const metadata: ImageMetadata = {
      id: dbImage.id,
      filename: dbImage.original_filename,
      contentType: dbImage.mime_type,
      size: dbImage.size,
      width: dbImage.width,
      height: dbImage.height,
      uploadedAt: dbImage.created_at,
      // Updated URL format with filename
      url: `${baseUrl}/image/${dbImage.id}/${safeFilename}`,
      workspaceId: dbImage.workspace_id,
      collectionId: dbImage.collection_id,
    }

    return metadata
  } catch (error) {
    console.error('Error getting image with metadata:', error)
    throw error
  }
}

/**
 * Lists images from the database
 */
export async function listImagesWithMetadata(
  db: D1Database,
  baseUrl: string,
  options: {
    workspaceId?: string
    collectionId?: string
    limit?: number
    offset?: number
  } = {},
): Promise<{ images: ImageMetadata[]; cursor?: string; count: number }> {
  const { workspaceId = DEFAULT_WORKSPACE_ID, limit = 50, offset = 0 } = options

  // Get images from database
  const dbImages = await listImages(db, {
    workspaceId,
    collectionId: options.collectionId,
    limit,
    offset,
  })

  // Convert to API format
  const images: ImageMetadata[] = dbImages.map((img) => {
    // Get file extension from original filename
    const fileExt = img.original_filename.split('.').pop() || ''
    const safeFilename = getSafeFilename(img.original_filename)

    return {
      id: img.id,
      filename: img.original_filename,
      contentType: img.mime_type,
      size: img.size,
      width: img.width,
      height: img.height,
      uploadedAt: img.created_at,
      // Updated URL format with filename
      url: `${baseUrl}/image/${img.id}/${safeFilename}`,
      workspaceId: img.workspace_id,
      collectionId: img.collection_id,
    }
  })

  // For pagination
  const hasMore = images.length === limit
  const nextOffset = hasMore ? offset + limit : undefined

  return {
    images,
    cursor: nextOffset?.toString(),
    count: images.length,
  }
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
