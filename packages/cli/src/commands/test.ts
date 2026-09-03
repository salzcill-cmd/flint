// Flint CLI — Test Command
// Runs tests with vitest

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

interface TestOptions {
  watch: boolean
  coverage: boolean
  update: boolean
}

export async function testProject(options: TestOptions): Promise<void> {
  const root = findProjectRoot()

  // Check if vitest is available
  const vitestConfig = findVitestConfig(root)
  if (!vitestConfig) {
    console.log('\n  No vitest config found. Running with default settings...\n')
  }

  const args: string[] = ['vitest']

  if (options.watch) {
    args.push('--watch')
  } else {
    args.push('run')
  }

  if (options.coverage) {
    args.push('--coverage')
  }

  if (options.update) {
    args.push('--update')
  }

  console.log(`\n  Running tests${options.watch ? ' (watch mode)' : ''}...\n`)

  const child = spawn('npx', args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) {
        console.log('\n  All tests passed!\n')
        resolve()
      } else {
        console.log(`\n  Tests failed with exit code ${code}\n`)
        reject(new Error(`Tests failed with exit code ${code}`))
      }
    })

    child.on('error', (err) => {
      reject(err)
    })
  })
}

function findProjectRoot(): string {
  let dir = process.cwd()
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir
    }
    dir = path.dirname(dir)
  }
  return process.cwd()
}

function findVitestConfig(root: string): string | null {
  const patterns = [
    'vitest.config.ts',
    'vitest.config.js',
    'vitest.config.mjs',
    'vitest.config.cjs',
    'vite.config.ts',
    'vite.config.js',
  ]

  for (const pattern of patterns) {
    if (fs.existsSync(path.join(root, pattern))) {
      return pattern
    }
  }

  return null
}
