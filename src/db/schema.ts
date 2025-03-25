import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Core files table
const files = sqliteTable(
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
    metadata: text('metadata', { mode: 'json' }), // file metadata

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

export type FileMetadata = typeof files.$inferSelect
export const schema = { files }
