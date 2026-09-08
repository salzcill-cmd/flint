// @flint/db — Database Integration powered by Drizzle ORM
// Ringan, cepat, TypeScript-first

// ─── Types ──────────────────────────────────────────────────────

export interface DatabaseConfig {
  /** Database driver */
  driver: 'sqlite' | 'pg' | 'mysql'
  /** Database URL or connection string */
  url?: string
  /** Path to database file (for SQLite) */
  path?: string
  /** Connection options */
  options?: any
}

export interface DatabaseAdapter {
  /** Database instance */
  db: any
  /** Database driver */
  driver: string
  /** Close connection */
  close(): Promise<void>
}

// ─── Database Factory ───────────────────────────────────────────

export async function createDatabase(config: DatabaseConfig): Promise<DatabaseAdapter> {
  switch (config.driver) {
    case 'sqlite':
      return createSQLiteAdapter(config)
    case 'pg':
      return createPostgreSQLAdapter(config)
    case 'mysql':
      return createMySQLAdapter(config)
    default:
      throw new Error(`Unsupported driver: ${config.driver}`)
  }
}

// ─── SQLite Implementation ─────────────────────────────────────

async function createSQLiteAdapter(config: DatabaseConfig): Promise<DatabaseAdapter> {
  const Database = (await import('better-sqlite3')).default
  const { drizzle } = await import('drizzle-orm/better-sqlite3')
  
  const path = config.path || config.url || ':memory:'
  const sqlite = new Database(path)
  const db = drizzle(sqlite)

  return {
    db,
    driver: 'sqlite',
    close: async () => {
      sqlite.close()
    },
  }
}

// ─── PostgreSQL Implementation ──────────────────────────────────

async function createPostgreSQLAdapter(config: DatabaseConfig): Promise<DatabaseAdapter> {
  const postgres = (await import('postgres')).default
  const { drizzle } = await import('drizzle-orm/postgres-js')
  
  const client = postgres(config.url!)
  const db = drizzle(client)

  return {
    db,
    driver: 'pg',
    close: async () => {
      await client.end()
    },
  }
}

// ─── MySQL Implementation ───────────────────────────────────────

async function createMySQLAdapter(config: DatabaseConfig): Promise<DatabaseAdapter> {
  const mysql2 = await import('mysql2/promise')
  const { drizzle } = await import('drizzle-orm/mysql2')
  
  const connection = await mysql2.createConnection(config.url!)
  const db = drizzle(connection)

  return {
    db,
    driver: 'mysql',
    close: async () => {
      await connection.end()
    },
  }
}

// ─── Re-export Drizzle Operators ────────────────────────────────

export { eq, and, or, not, gt, lt, gte, lte, like, sql } from 'drizzle-orm'
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm'

// ─── Schema Helpers ─────────────────────────────────────────────

export {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  json,
  uuid,
} from 'drizzle-orm/pg-core'

export {
  sqliteTable,
  integer as sqliteInteger,
  text as sqliteText,
} from 'drizzle-orm/sqlite-core'

export {
  mysqlTable,
  int,
  varchar as mysqlVarchar,
  text as mysqlText,
} from 'drizzle-orm/mysql-core'
