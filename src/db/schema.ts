import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Core files table
export const files = sqliteTable('files', {
  id: text('id').primaryKey(), // Internal ID
  contentHash: text('content_hash').notNull(), // BLAKE-3
  contentType: text('content_type').notNull(),
  size: integer('size').notNull(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),

  // System-managed metadata specific to file type
  // e.g. for images: { width: 800, height: 600, format: 'jpeg' }
  systemMetadata: text('system_metadata', { mode: 'json' }),

  // User-supplied metadata (tags, descriptions, etc)
  userMetadata: text('user_metadata', { mode: 'json' }),

  // Access control
  publicId: text('public_id'),

  userId: text('user_id').notNull(),
  workspaceId: text('workspace_id').notNull(),
})

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
