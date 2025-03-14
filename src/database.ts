import { DbImage, DbCollection, DbWorkspace } from './types'
import {
  DEFAULT_USER_ID,
  DEFAULT_WORKSPACE_ID,
  DB_TABLE_WORKSPACES,
  DB_TABLE_COLLECTIONS,
  DB_TABLE_IMAGES,
} from './constants'
import { v4 as uuidv4 } from 'uuid'

/**
 * Create a default workspace if it doesn't exist
 */
export async function ensureDefaultWorkspace(db: D1Database): Promise<string> {
  try {
    // Check if default workspace exists
    const existingWorkspace = await db
      .prepare(`SELECT id FROM ${DB_TABLE_WORKSPACES} WHERE id = ?`)
      .bind(DEFAULT_WORKSPACE_ID)
      .first<DbWorkspace>()

    if (existingWorkspace) {
      return DEFAULT_WORKSPACE_ID
    }

    // Create default workspace
    const workspace: DbWorkspace = {
      id: DEFAULT_WORKSPACE_ID,
      name: 'Default Workspace',
      description: 'Default workspace for images',
      user_id: DEFAULT_USER_ID,
      created_at: Date.now(),
    }

    await db
      .prepare(
        `INSERT INTO ${DB_TABLE_WORKSPACES} (id, name, description, user_id, created_at) VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(workspace.id, workspace.name, workspace.description, workspace.user_id, workspace.created_at)
      .run()

    return DEFAULT_WORKSPACE_ID
  } catch (error) {
    console.error('Error ensuring default workspace:', error)
    throw error
  }
}

/**
 * Store an image in the database
 */
export async function storeImageMetadata(
  db: D1Database,
  image: Omit<DbImage, 'uuid' | 'user_id' | 'created_at'>,
): Promise<DbImage> {
  try {
    const uuid = uuidv4()
    const now = Date.now()

    const dbImage: DbImage = {
      ...image,
      uuid,
      user_id: DEFAULT_USER_ID,
      created_at: now,
    }

    await db
      .prepare(
        `
        INSERT INTO images (
          uuid, id, cloudflare_id, original_filename, mime_type, 
          size, width, height, workspace_id, collection_id, 
          source_url, user_id, created_at
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .bind(
        dbImage.uuid,
        dbImage.id,
        dbImage.cloudflare_id,
        dbImage.original_filename,
        dbImage.mime_type,
        dbImage.size,
        dbImage.width || null,
        dbImage.height || null,
        dbImage.workspace_id,
        dbImage.collection_id || null,
        dbImage.source_url || null,
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
 * List images with optional filtering
 */
export async function listImages(
  db: D1Database,
  options: {
    workspaceId?: string
    collectionId?: string
    limit?: number
    offset?: number
  } = {},
): Promise<DbImage[]> {
  try {
    const { workspaceId = DEFAULT_WORKSPACE_ID, collectionId, limit = 50, offset = 0 } = options

    let query = 'SELECT * FROM images WHERE workspace_id = ?'
    const params: any[] = [workspaceId]

    if (collectionId) {
      query += ' AND collection_id = ?'
      params.push(collectionId)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const { results } = await db
      .prepare(query)
      .bind(...params)
      .all<DbImage>()

    return results
  } catch (error) {
    console.error('Error listing images:', error)
    throw error
  }
}

/**
 * Get a single image by public ID
 */
export async function getImageById(db: D1Database, id: string): Promise<DbImage | null> {
  try {
    return await db.prepare('SELECT * FROM images WHERE id = ?').bind(id).first<DbImage>()
  } catch (error) {
    console.error('Error getting image by ID:', error)
    throw error
  }
}

/**
 * Get a single image by internal UUID
 */
export async function getImageByUuid(db: D1Database, uuid: string): Promise<DbImage | null> {
  try {
    return await db.prepare('SELECT * FROM images WHERE uuid = ?').bind(uuid).first<DbImage>()
  } catch (error) {
    console.error('Error getting image by UUID:', error)
    throw error
  }
}

/**
 * Delete an image by ID
 */
export async function deleteImage(db: D1Database, id: string): Promise<boolean> {
  try {
    const result = await db.prepare('DELETE FROM images WHERE id = ?').bind(id).run()

    return result.success
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}
