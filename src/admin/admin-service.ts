import { CloudflareBindings } from '../types'

/**
 * Get database status information
 */
export async function getDatabaseStatus(db: D1Database): Promise<{
  tables: any[]
  hasWorkspacesTable: boolean
  defaultWorkspaceExists: boolean
  defaultWorkspace?: any
}> {
  // Check if tables exist
  const tablesResult = await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
  const tables = tablesResult.results

  // Check if workspaces table exists
  const hasWorkspacesTable = tables.some((table: any) => table.name === 'workspaces')

  let defaultWorkspaceExists = false
  let defaultWorkspace = undefined

  if (hasWorkspacesTable) {
    // Check if default workspace exists
    const workspaceResult = await db.prepare('SELECT * FROM workspaces WHERE id = ?').bind('default').all()

    defaultWorkspaceExists = workspaceResult.results.length > 0
    defaultWorkspace = defaultWorkspaceExists ? workspaceResult.results[0] : undefined
  }

  return {
    tables,
    hasWorkspacesTable,
    defaultWorkspaceExists,
    defaultWorkspace,
  }
}

/**
 * Check if the environment is development
 */
export function isDevelopmentEnvironment(env: CloudflareBindings): boolean {
  return env.ENVIRONMENT === 'development'
}
