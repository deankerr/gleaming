/**
 * Storage operations for the image module
 */
import { StorageImageMetadata } from './image-entities'
import { generateUniqueId } from './image-utils'

/**
 * Create a storage key for an image
 */
export function createStorageKey(id: string, filename: string): string {
  // Extract file extension
  const extension = filename.split('.').pop() || ''

  // Create a path-like structure: images/{id}.{extension}
  return `images/${id}${extension ? '.' + extension : ''}`
}

/**
 * Upload an image to storage
 */
export async function uploadImageToStorage(
  bucket: R2Bucket,
  file: File,
  id: string,
  metadata?: {
    width?: number
    height?: number
  },
): Promise<StorageImageMetadata> {
  try {
    // Create storage key
    const key = createStorageKey(id, file.name)

    // Upload to R2
    const result = await bucket.put(key, file, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalFilename: file.name,
        width: metadata?.width?.toString() || '',
        height: metadata?.height?.toString() || '',
      },
    })

    if (!result) {
      throw new Error('Failed to upload image to storage')
    }

    // Return storage metadata
    return {
      id,
      key,
      contentType: file.type,
      size: file.size,
      etag: result.etag,
      width: metadata?.width,
      height: metadata?.height,
      originalFilename: file.name,
      customMetadata: {
        originalFilename: file.name,
        width: metadata?.width?.toString() || '',
        height: metadata?.height?.toString() || '',
      },
    }
  } catch (error) {
    console.error('Error uploading image to storage:', error)
    throw new Error('Failed to upload image to storage')
  }
}

/**
 * Get an image from storage
 */
export async function getImageFromStorage(bucket: R2Bucket, key: string) {
  try {
    // Get the object
    const object = await bucket.get(key)
    return object
  } catch (error) {
    console.error('Error getting image from storage:', error)
    throw new Error('Failed to get image from storage')
  }
}

/**
 * Delete an image from storage
 */
export async function deleteImageFromStorage(bucket: R2Bucket, key: string): Promise<boolean> {
  try {
    await bucket.delete(key)
    return true
  } catch (error) {
    console.error('Error deleting image from storage:', error)
    throw new Error('Failed to delete image from storage')
  }
}
