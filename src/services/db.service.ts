import type { DB } from '../db'
import type { NewProperty } from '../db/schema'
import { and, desc, eq, like } from 'drizzle-orm'
import { initDB } from '../db'
import { propertiesTable, schema } from '../db/schema'

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
   * Create a new file record with properties and tags
   */
  async createFile(data: typeof schema.files.$inferInsert & {
    properties?: Record<string, string>
    tags?: string[]
  }) {
    const { properties, tags, ...fileData } = data

    // Create the file record first
    await this.db.insert(schema.files).values(fileData)
    console.log('db:files:create', fileData)

    // Add properties if provided
    if (properties) {
      const propertyRecords = Object.entries(properties).map(([key, value]) => ({
        objectId: fileData.objectId,
        userId: fileData.userId,
        projectId: fileData.projectId,
        key,
        value,
      }))
      if (propertyRecords.length > 0) {
        await this.db.insert(propertiesTable).values(propertyRecords)
      }
    }

    // Add tags if provided
    if (tags) {
      const tagRecords = tags.map(tag => ({
        objectId: fileData.objectId,
        userId: fileData.userId,
        projectId: fileData.projectId,
        key: `tag_${tag}`,
        value: '1',
      }))
      if (tagRecords.length > 0) {
        await this.db.insert(propertiesTable).values(tagRecords)
      }
    }

    // Return the complete file record with properties and tags
    const file = await this.getFileByObjectId(fileData.objectId)
    if (!file)
      return null

    const fileProperties = await this.getFileProperties(fileData.objectId)
    const fileTags = await this.getFileTags(fileData.objectId)

    return {
      ...file,
      properties: Object.fromEntries(
        fileProperties
          .filter(p => !p.key.startsWith('tag_'))
          .map(p => [p.key, p.value]),
      ),
      tags: fileTags.map(t => t.key.replace('tag_', '')),
    }
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

  /**
   * Create a new property
   * Will update if property with same objectId+key exists
   */
  async upsertProperty(data: NewProperty) {
    await this.db
      .insert(propertiesTable)
      .values(data)
      .onConflictDoUpdate({
        target: [propertiesTable.objectId, propertiesTable.key],
        set: data,
      })

    return this.getProperty(data.objectId, data.key)
  }

  /**
   * Get a specific property by objectId and key
   */
  async getProperty(objectId: string, key: string) {
    return this.db.query.properties.findFirst({
      where: and(
        eq(propertiesTable.objectId, objectId),
        eq(propertiesTable.key, key),
      ),
    })
  }

  /**
   * Get all properties for a file
   */
  async getFileProperties(objectId: string) {
    return this.db.query.properties.findMany({
      where: eq(propertiesTable.objectId, objectId),
    })
  }

  /**
   * Get all tags for a file (properties with key starting with 'tag_')
   */
  async getFileTags(objectId: string) {
    return this.db.query.properties.findMany({
      where: and(
        eq(propertiesTable.objectId, objectId),
        like(propertiesTable.key, 'tag_%'),
      ),
    })
  }

  /**
   * Delete a specific property
   */
  async deleteProperty(objectId: string, key: string) {
    await this.db
      .delete(propertiesTable)
      .where(and(
        eq(propertiesTable.objectId, objectId),
        eq(propertiesTable.key, key),
      ))
  }

  /**
   * Delete all properties for a file
   */
  async deleteFileProperties(objectId: string) {
    await this.db
      .delete(propertiesTable)
      .where(eq(propertiesTable.objectId, objectId))
  }
}
