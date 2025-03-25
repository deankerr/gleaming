import type { DB } from '../db'
import { desc, eq } from 'drizzle-orm'
import { initDB } from '../db'
import { schema } from '../db/schema'

/**
 * Database service for common operations
 */
export class DBService {
  private db: DB

  constructor(d1: D1Database) {
    this.db = initDB(d1)
  }

  /**
   * Get a file by internal ID
   */
  async getFileByObjectId(objectId: string) {
    return this.db.query.files.findFirst({
      where: eq(schema.files.objectId, objectId),
    })
  }

  /**
   * Get a file by external ID
   */
  async getFileByExternalId(externalId: string) {
    return this.db.query.files.findFirst({
      where: eq(schema.files.externalId, externalId),
    })
  }

  /**
   * Create a new file record
   */
  async createFile(data: typeof schema.files.$inferInsert) {
    await this.db.insert(schema.files).values(data)
    console.log('db:files:create', data)
    return this.getFileByObjectId(data.objectId)
  }

  /**
   * List files ordered by creation time (descending)
   */
  async listFiles(limit: number = 50) {
    return this.db.query.files.findMany({
      orderBy: [desc(schema.files.createdAt)],
      limit,
    })
  }

  /**
   * Get all files in a workspace
   */
  async getWorkspaceFiles(projectId: string) {
    return this.db.query.files.findMany({
      where: eq(schema.files.projectId, projectId),
    })
  }
}
