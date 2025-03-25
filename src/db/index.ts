import { drizzle } from 'drizzle-orm/d1'
import { schema } from './schema'

/**
 * Initialize the database with the provided D1 instance
 */
export function initDB(d1: D1Database) {
  return drizzle(d1, { schema })
}

/**
 * Export the DB type for type inference
 */
export type DB = ReturnType<typeof initDB>
