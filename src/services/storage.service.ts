import { internalError } from '../utils/errors'

/**
 * Storage service for managing files in R2
 */
export class StorageService {
  private bucket: R2Bucket

  constructor(bucket: R2Bucket) {
    this.bucket = bucket
  }

  /**
   * Store a file in R2
   * @param key - The key to store the file under
   * @param file - The file data to store
   * @param contentType - The content type of the file
   * @returns The stored object
   */
  async storeFile(key: string, file: ArrayBuffer | ReadableStream<Uint8Array>, contentType: string) {
    try {
      const result = await this.bucket.put(key, file, {
        httpMetadata: {
          contentType,
        },
      })

      console.log('storage:put:', key)
      return result
    } catch (error) {
      console.error('Failed to store file in R2:', error)
      throw internalError('Failed to store file')
    }
  }

  /**
   * Get a file from R2
   * @param key - The key of the file to get
   * @returns The file object or null if not found
   */
  async getFile(key: string) {
    try {
      return await this.bucket.get(key)
    } catch (error) {
      console.error('Failed to get file from R2:', error)
      throw internalError('Failed to retrieve file')
    }
  }

  /**
   * Check if a file exists in R2
   * @param key - The key of the file to check
   * @returns True if the file exists, false otherwise
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const headObject = await this.bucket.head(key)
      return headObject !== null
    } catch (error) {
      console.error('Failed to check if file exists in R2:', error)
      return false
    }
  }

  /**
   * Delete a file from R2
   * @param key - The key of the file to delete
   * @returns True if the file was deleted, false otherwise
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      await this.bucket.delete(key)
      return true
    } catch (error) {
      console.error('Failed to delete file from R2:', error)
      return false
    }
  }
}
