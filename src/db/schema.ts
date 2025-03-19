import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Core files table
export const files = sqliteTable(
  'files',
  {
    id: text('id').primaryKey(), // Internal ID
    contentHash: text('content_hash').notNull(), // BLAKE-3, R2 key
    contentType: text('content_type').notNull(),
    size: integer('size').notNull(),
    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    metadata: text('metadata', { mode: 'json' }), // file metadata

    // owner
    userId: text('user_id').notNull(),
    workspaceId: text('workspace_id').notNull(),

    // public url slug: /file/{slug}
    slug: text('slug').notNull(),
  },
  (table) => [index('slug_idx').on(table.slug)],
)

// Workspaces table
export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  userId: text('user_id').notNull(),
})

// Users table (basic for v1)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

// Export all tables for migrations
export const schema = { files, workspaces, users }
