import { internalError } from '../utils/errors'

type KeyParts = {
  userId: string
  projectId: string
  objectId: string
}

type R2InputObject = Parameters<R2Bucket['put']>[1]

/**
 * Storage service for managing files in R2
 */
export class StorageService {
  bucket: R2Bucket

  constructor(bucket: R2Bucket) {
    this.bucket = bucket
  }

  generateKey(keyParts: KeyParts) {
    if (!keyParts.userId || !keyParts.projectId || !keyParts.objectId) {
      throw internalError('Invalid key parts')
    }
    return `${keyParts.userId}/${keyParts.projectId}/${keyParts.objectId}`
  }

  /**
   * Store a file in R2
   * @param keyParts - Object containing userId, projectId, and objectId
   * @param value - The file data to store
   * @param options - Optional R2 put options
   * @returns The stored object
   */
  async storeFile(keyParts: KeyParts, value: R2InputObject, options: R2PutOptions = {}) {
    const key = this.generateKey(keyParts)

    try {
      // Add key parts to custom metadata
      const customMetadata = {
        userId: keyParts.userId,
        projectId: keyParts.projectId,
        objectId: keyParts.objectId,
        ...(options.customMetadata || {}), // Merge with any caller-provided metadata
      }

      // Create new options object with merged metadata
      const mergedOptions: R2PutOptions = {
        ...options,
        customMetadata,
      }

      const result = await this.bucket.put(key, value, mergedOptions)
      if (!result) {
        throw new Error('Failed to store file')
      }
      console.log('storage:put:', key, result)
      return result
    } catch (error) {
      console.error('Failed to store file in R2:', error)
      throw internalError('Failed to store file')
    }
  }

  /**
   * Get a file from R2
   * @param keyParts - Object containing userId, projectId, and objectId
   * @returns The file object or null if not found
   */
  async getFile(keyParts: KeyParts) {
    try {
      const key = this.generateKey(keyParts)
      return await this.bucket.get(key)
    } catch (error) {
      console.error('Failed to get file from R2:', error)
      throw internalError('Failed to retrieve file')
    }
  }

  /**
   * Check if a file exists in R2
   * @param keyParts - Object containing userId, projectId, and objectId
   * @returns True if the file exists, false otherwise
   */
  async fileExists(keyParts: KeyParts): Promise<boolean> {
    try {
      const key = this.generateKey(keyParts)
      const headObject = await this.bucket.head(key)
      return headObject !== null
    } catch (error) {
      console.error('Failed to check if file exists in R2:', error)
      return false
    }
  }

  /**
   * Delete a file from R2
   * @param keyParts - Object containing userId, projectId, and objectId
   * @returns True if the file was deleted, false otherwise
   */
  async deleteFile(keyParts: KeyParts): Promise<boolean> {
    try {
      const key = this.generateKey(keyParts)
      await this.bucket.delete(key)
      return true
    } catch (error) {
      console.error('Failed to delete file from R2:', error)
      return false
    }
  }

  /**
   * List files for a user or project
   * @param userId - User ID to list files for
   * @param projectId - Optional project ID to filter by
   * @param options - Optional listing options
   * @returns List of objects with the given prefix
   */
  async listFiles(userId: string, projectId?: string, options?: R2ListOptions) {
    try {
      const prefix = projectId ? `${userId}/${projectId}/` : `${userId}/`
      return await this.bucket.list({
        prefix,
        ...options,
      })
    } catch (error) {
      console.error('Failed to list files from R2:', error)
      throw internalError('Failed to list files')
    }
  }
}
