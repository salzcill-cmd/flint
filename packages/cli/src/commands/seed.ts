// Flint CLI — Seed Command
// Run database seed files

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

export interface SeedOptions {
  file?: string
}

export async function runSeed(options: SeedOptions): Promise<void> {
  const seedFile = options.file || 'seed.ts'
  const seedPath = join(process.cwd(), 'db', seedFile)

  if (!existsSync(seedPath)) {
    console.log(`\n  No seed file found at db/${seedFile}`)
    console.log(`  Create a seed file: db/seed.ts\n`)
    console.log(`  Example:`)
    console.log(`  export async function seed(db) {`)
    console.log(`    await db.insert(users).values([...])`)
    console.log(`  }\n`)
    return
  }

  console.log(`\n  Running seed: ${seedFile}\n`)

  try {
    execSync(`npx tsx db/${seedFile}`, { cwd: process.cwd(), stdio: 'inherit' })
    console.log(`\n  ✓ Seed complete\n`)
  } catch (error) {
    console.error(`\n  ✗ Seed failed\n`)
    process.exit(1)
  }
}
