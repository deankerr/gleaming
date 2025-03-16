import { DbWorkspace } from '../types'
import { DEFAULT_USER_ID, DEFAULT_WORKSPACE_ID, DB_TABLE_WORKSPACES } from '../constants'

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

// Note: Image-related functions have been moved to src/image/image-queries.ts
