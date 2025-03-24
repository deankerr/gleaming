import { desc, eq } from 'drizzle-orm'
import { DB, initDB } from '../db'
import { files } from '../db/schema'

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
      where: eq(files.objectId, objectId),
    })
  }

  /**
   * Get a file by external ID
   */
  async getFileByExternalId(externalId: string) {
    return this.db.query.files.findFirst({
      where: eq(files.externalId, externalId),
    })
  }

  /**
   * Get a file by content hash
   */
  async getFileByContentHash(hash: string) {
    return this.db.query.files.findFirst({
      where: eq(files.contentHash, hash),
    })
  }

  /**
   * Create a new file record
   */
  async createFile(data: {
    objectId: string
    externalId: string
    contentHash: string
    contentType: string
    size: number
    metadata?: Record<string, any>
    filename: string
    userId: string
    projectId: string
  }) {
    await this.db.insert(files).values({
      objectId: data.objectId,
      externalId: data.externalId,
      contentHash: data.contentHash,
      contentType: data.contentType,
      size: data.size,
      metadata: data.metadata,
      filename: data.filename,
      userId: data.userId,
      projectId: data.projectId,
    })

    console.log('db:files:insert:', data)
    return this.getFileByObjectId(data.objectId)
  }

  /**
   * List files ordered by creation time (descending)
   */
  async listFiles(limit: number = 50) {
    return this.db.query.files.findMany({
      orderBy: [desc(files.createdAt)],
      limit,
    })
  }

  /**
   * Get all files in a workspace
   */
  async getWorkspaceFiles(projectId: string) {
    return this.db.query.files.findMany({
      where: eq(files.projectId, projectId),
    })
  }
}
