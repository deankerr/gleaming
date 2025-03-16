import { DbImage } from '../types'
import { DEFAULT_USER_ID, DB_TABLE_IMAGES } from '../constants'
import { v4 as uuidv4 } from 'uuid'

/**
 * Store an image in the database
 */
export async function storeImageMetadata(
  db: D1Database,
  image: Omit<DbImage, 'uuid' | 'user_id' | 'created_at'>,
): Promise<DbImage> {
  try {
    const uuid = uuidv4()
    const timestamp = Date.now()

    const dbImage: DbImage = {
      uuid,
      id: image.id,
      cloudflare_id: image.cloudflare_id,
      original_filename: image.original_filename,
      mime_type: image.mime_type,
      size: image.size,
      width: image.width,
      height: image.height,
      workspace_id: image.workspace_id,
      collection_id: image.collection_id,
      source_url: image.source_url,
      user_id: DEFAULT_USER_ID,
      created_at: timestamp,
    }

    // Insert into database
    await db
      .prepare(
        `INSERT INTO ${DB_TABLE_IMAGES} 
        (uuid, id, cloudflare_id, original_filename, mime_type, size, width, height, 
        workspace_id, collection_id, source_url, user_id, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        dbImage.uuid,
        dbImage.id,
        dbImage.cloudflare_id,
        dbImage.original_filename,
        dbImage.mime_type,
        dbImage.size,
        dbImage.width,
        dbImage.height,
        dbImage.workspace_id,
        dbImage.collection_id,
        dbImage.source_url,
        dbImage.user_id,
        dbImage.created_at,
      )
      .run()

    return dbImage
  } catch (error) {
    console.error('Error storing image metadata:', error)
    throw error
  }
}

/**
 * Get an image by ID
 */
export async function getImageMetadata(db: D1Database, id: string): Promise<DbImage | null> {
  try {
    const image = await db.prepare(`SELECT * FROM ${DB_TABLE_IMAGES} WHERE id = ?`).bind(id).first<DbImage>()
    return image
  } catch (error) {
    console.error('Error getting image by ID:', error)
    throw error
  }
}

/**
 * Delete an image from the database
 */
export async function deleteImageMetadata(db: D1Database, id: string): Promise<boolean> {
  try {
    const result = await db.prepare(`DELETE FROM ${DB_TABLE_IMAGES} WHERE id = ?`).bind(id).run()
    return result.success
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}
