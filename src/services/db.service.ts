import { eq } from 'drizzle-orm'
import { ulid } from 'ulidx'
import { DB, initDB } from '../db'
import { files, users, workspaces } from '../db/schema'

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
  async getFileById(id: string) {
    return this.db.query.files.findFirst({
      where: eq(files.id, id),
    })
  }

  /**
   * Get a file by slug
   */
  async getFileBySlug(slug: string) {
    return this.db.query.files.findFirst({
      where: eq(files.slug, slug),
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
    contentHash: string
    contentType: string
    size: number
    metadata?: Record<string, any>
    slug: string
    userId: string
    workspaceId: string
  }) {
    const id = ulid()

    await this.db.insert(files).values({
      id,
      contentHash: data.contentHash,
      contentType: data.contentType,
      size: data.size,
      metadata: data.metadata,
      slug: data.slug,
      userId: data.userId,
      workspaceId: data.workspaceId,
    })

    console.log('db:files:insert:', id)
    return this.getFileById(id)
  }

  /**
   * Get all files in a workspace
   */
  async getWorkspaceFiles(workspaceId: string) {
    return this.db.query.files.findMany({
      where: eq(files.workspaceId, workspaceId),
    })
  }

  /**
   * Get a workspace by ID
   */
  async getWorkspaceById(id: string) {
    return this.db.query.workspaces.findFirst({
      where: eq(workspaces.id, id),
    })
  }

  /**
   * Create a new workspace
   */
  async createWorkspace(data: { name: string; slug: string; userId: string }) {
    const id = ulid()

    await this.db.insert(workspaces).values({
      id,
      name: data.name,
      slug: data.slug,
      userId: data.userId,
    })

    return this.getWorkspaceById(id)
  }

  /**
   * Get a user by ID
   */
  async getUserById(id: string) {
    return this.db.query.users.findFirst({
      where: eq(users.id, id),
    })
  }

  /**
   * Create a new user
   */
  async createUser(data: { name: string; email: string }) {
    const id = ulid()

    await this.db.insert(users).values({
      id,
      name: data.name,
      email: data.email,
    })

    return this.getUserById(id)
  }
}
