import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

/**
 * Initialize the database connection
 * @param db D1 database instance from environment bindings
 * @returns Drizzle ORM instance
 */
export function initDB(db: D1Database) {
  return drizzle(db, { schema })
}

// Types for use throughout the application
export type DB = ReturnType<typeof initDB>
export type DBSchema = typeof schema
export type Tables = DBSchema['schema']

// Re-export schema
export { schema }
