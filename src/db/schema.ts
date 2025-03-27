import { relations, sql } from 'drizzle-orm'
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { generateUniqueId } from '../utils/id'

export const filesTable = sqliteTable(
  'files',
  {
    objectId: text('object_id').primaryKey(), // primary id/r2 bucket key
    externalId: text('external_id').notNull().unique(), // URL access id
    access: text('access', { enum: ['public', 'private'] })
      .default('public')
      .notNull(),

    size: integer('size').notNull(),
    contentHash: text('content_hash').notNull(), // md5 from r2
    contentType: text('content_type').notNull(),

    filename: text('filename').notNull(),
    fileMetadata: text('file_metadata', { mode: 'json' }).notNull().default('{}'),

    ingestUrl: text('ingest_url'),
    ingestMetadata: text('ingest_metadata', { mode: 'json' }).notNull().default('{}'), // client ip/user agent

    // will refer to tables in the future
    userId: text('user_id').notNull(),
    projectId: text('project_id').notNull(),

    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: text('deleted_at'),
  },
  table => [index('external_id_idx').on(table.externalId), index('content_hash_idx').on(table.contentHash)],
)

export const propertiesTable = sqliteTable('properties', {
  id: text('id')
    .notNull()
    .$defaultFn(() => generateUniqueId())
    .unique(),

  objectId: text('object_id').notNull(), // file
  key: text('key').notNull(),
  value: text('value').notNull(),

  userId: text('user_id').notNull(),
  projectId: text('project_id').notNull(),

  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, table => [
  // Compound primary key ensures one key per object
  primaryKey({ columns: [table.objectId, table.key] }),

  // Find all properties of an object (most common query)
  index('object_idx').on(table.objectId),

  // Find properties by value within a project
  // Useful for "find all files with property X=Y in project Z"
  index('project_key_value_idx').on(table.projectId, table.key, table.value),

  // Find properties by value across all user's projects
  // Useful for "find all files with property X=Y for this user"
  index('user_key_value_idx').on(table.userId, table.key, table.value),

  // Index for value searches (when we need to search across all properties)
  index('value_idx').on(table.value),

  // Index to optimize tag queries
  index('tag_idx').on(table.key, table.objectId),
])

export const filesRelations = relations(filesTable, ({ many }) => ({
  properties: many(propertiesTable),
}))

export const propertiesRelations = relations(propertiesTable, ({ one }) => ({
  file: one(filesTable, {
    fields: [propertiesTable.objectId],
    references: [filesTable.objectId],
  }),
}))

export type FileMetadata = typeof filesTable.$inferSelect
export type Property = typeof propertiesTable.$inferSelect
export type NewProperty = typeof propertiesTable.$inferInsert
export const schema = { files: filesTable, properties: propertiesTable }
