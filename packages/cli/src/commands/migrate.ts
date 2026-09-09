// Flint CLI — Migrate Command
// Run database migrations

import { execSync } from 'child_process'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'

export interface MigrateOptions {
  database?: string
  status: boolean
}

export async function runMigrate(options: MigrateOptions): Promise<void> {
  const dbDir = join(process.cwd(), 'db')
  const migrationsDir = join(dbDir, 'migrations')

  if (options.status) {
    console.log(`\n  Migration Status\n`)
    console.log(`  Database: ${options.database || 'flint.config.ts'}`)
    console.log(`  Migrations: ${existsSync(migrationsDir) ? readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).length : 0} pending`)
    console.log()
    return
  }

  if (!existsSync(migrationsDir)) {
    console.log(`  No migrations found. Run \`flint db generate\` first.`)
    return
  }

  const migrations = readdirSync(migrationsDir).filter(f => f.endsWith('.sql'))

  if (migrations.length === 0) {
    console.log(`  No pending migrations.`)
    return
  }

  console.log(`\n  Running ${migrations.length} migration(s)...\n`)

  for (const migration of migrations) {
    console.log(`  ▸ ${migration}`)
  }

  // Use Drizzle Kit to push
  try {
    execSync('npx drizzle-kit push', { cwd: process.cwd(), stdio: 'inherit' })
    console.log(`\n  ✓ All migrations applied\n`)
  } catch (error) {
    console.error(`\n  ✗ Migration failed\n`)
    process.exit(1)
  }
}
