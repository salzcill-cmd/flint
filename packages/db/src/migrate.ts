// @flint/db — Migration CLI Commands
// Database migration management

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

// ─── Types ──────────────────────────────────────────────────────

export interface MigrationConfig {
  /** Database driver */
  driver: 'sqlite' | 'pg' | 'mysql'
  /** Database URL */
  url?: string
  /** Schema path (default: './src/schema') */
  schemaPath?: string
  /** Migrations path (default: './drizzle') */
  migrationsPath?: string
}

// ─── Migration Commands ─────────────────────────────────────────

/** Generate migration from schema changes */
export async function generateMigration(config: MigrationConfig): Promise<void> {
  const { driver, url, schemaPath = './src/schema', migrationsPath = './drizzle' } = config

  console.log('[Flint DB] Generating migration...')

  // Ensure migrations directory exists
  if (!existsSync(migrationsPath)) {
    mkdirSync(migrationsPath, { recursive: true })
  }

  // Run drizzle-kit generate
  const command = `npx drizzle-kit generate --config=${getConfigPath(config)}`
  
  try {
    execSync(command, { stdio: 'inherit' })
    console.log('[Flint DB] Migration generated successfully')
  } catch (error) {
    console.error('[Flint DB] Failed to generate migration:', error)
    throw error
  }
}

/** Apply pending migrations */
export async function migrate(config: MigrationConfig): Promise<void> {
  console.log('[Flint DB] Applying migrations...')

  const command = `npx drizzle-kit migrate --config=${getConfigPath(config)}`
  
  try {
    execSync(command, { stdio: 'inherit' })
    console.log('[Flint DB] Migrations applied successfully')
  } catch (error) {
    console.error('[Flint DB] Failed to apply migrations:', error)
    throw error
  }
}

/** Push schema directly to database (dev only) */
export async function pushSchema(config: MigrationConfig): Promise<void> {
  console.log('[Flint DB] Pushing schema...')

  const command = `npx drizzle-kit push --config=${getConfigPath(config)}`
  
  try {
    execSync(command, { stdio: 'inherit' })
    console.log('[Flint DB] Schema pushed successfully')
  } catch (error) {
    console.error('[Flint DB] Failed to push schema:', error)
    throw error
  }
}

/** Open Drizzle Studio */
export async function studio(config: MigrationConfig): Promise<void> {
  console.log('[Flint DB] Starting Drizzle Studio...')

  const command = `npx drizzle-kit studio --config=${getConfigPath(config)}`
  
  try {
    execSync(command, { stdio: 'inherit' })
  } catch (error) {
    console.error('[Flint DB] Failed to start Studio:', error)
    throw error
  }
}

/** Check migration status */
export async function migrateStatus(config: MigrationConfig): Promise<void> {
  console.log('[Flint DB] Checking migration status...')

  const command = `npx drizzle-kit check --config=${getConfigPath(config)}`
  
  try {
    execSync(command, { stdio: 'inherit' })
  } catch (error) {
    console.error('[Flint DB] Failed to check status:', error)
    throw error
  }
}

// ─── Config Helpers ─────────────────────────────────────────────

function getConfigPath(config: MigrationConfig): string {
  // Create drizzle config file if it doesn't exist
  const configPath = join(process.cwd(), 'drizzle.config.ts')
  
  if (!existsSync(configPath)) {
    const configContent = `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema/*',
  out: './drizzle',
  dialect: '${config.driver}',
  dbCredentials: {
    url: '${config.url || 'local.db'}',
  },
})
`
    writeFileSync(configPath, configContent)
    console.log('[Flint DB] Created drizzle.config.ts')
  }

  return configPath
}

// ─── Seed Command ───────────────────────────────────────────────

export interface SeedOptions {
  /** Seed file path (default: './src/seed.ts') */
  seedPath?: string
  /** Database config */
  config: MigrationConfig
}

/** Run database seed */
export async function seed(options: SeedOptions): Promise<void> {
  const { seedPath = './src/seed.ts', config } = options

  console.log('[Flint DB] Running seed...')

  if (!existsSync(seedPath)) {
    console.error(`[Flint DB] Seed file not found: ${seedPath}`)
    console.log('[Flint DB] Create a seed file at', seedPath)
    return
  }

  try {
    // Import and run seed function
    const seedModule = await import(seedPath)
    if (seedModule.default) {
      await seedModule.default()
    } else if (seedModule.seed) {
      await seedModule.seed()
    }
    console.log('[Flint DB] Seed completed successfully')
  } catch (error) {
    console.error('[Flint DB] Seed failed:', error)
    throw error
  }
}

// ─── Export Config Generator ────────────────────────────────────

export function generateDrizzleConfig(config: MigrationConfig): string {
  return `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema/*',
  out: './drizzle',
  dialect: '${config.driver}',
  dbCredentials: {
    url: '${config.url || 'local.db'}',
  },
})
`
}
