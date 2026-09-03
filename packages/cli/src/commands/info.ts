// Flint CLI — Info Command
// Displays project and environment information

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

export async function infoProject(): Promise<void> {
  console.log('\n  Flint Project Info\n')

  // Environment info
  console.log('  Environment:')
  console.log(`    Node.js: ${process.version}`)
  console.log(`    npm: ${getVersion('npm')}`)
  console.log(`    pnpm: ${getVersion('pnpm')}`)
  console.log(`    yarn: ${getVersion('yarn')}`)
  console.log(`    OS: ${process.platform} ${process.arch}`)

  // Project info
  const root = findProjectRoot()
  if (root !== process.cwd()) {
    console.log('\n  Project:')
    console.log(`    Root: ${root}`)

    const pkgPath = path.join(root, 'package.json')
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
      console.log(`    Name: ${pkg.name || 'N/A'}`)
      console.log(`    Version: ${pkg.version || 'N/A'}`)
      console.log(`    Private: ${pkg.private ? 'Yes' : 'No'}`)

      // Dependencies
      const deps = { ...pkg.dependencies, ...pkg.devDependencies }
      const flintDeps = Object.keys(deps).filter(d => d.includes('flint'))
      if (flintDeps.length > 0) {
        console.log('\n  Flint Packages:')
        for (const dep of flintDeps) {
          console.log(`    ${dep}: ${deps[dep]}`)
        }
      }
    }
  } else {
    console.log('\n  No Flint project found in current directory.')
  }

  // Config files
  console.log('\n  Config Files:')
  const configFiles = [
    'vite.config.js',
    'vite.config.ts',
    'flint.config.js',
    'flint.config.ts',
    'tsconfig.json',
    'eslint.config.js',
    'vitest.config.ts',
  ]

  let hasConfigs = false
  for (const file of configFiles) {
    if (fs.existsSync(path.join(root, file))) {
      console.log(`    ✔ ${file}`)
      hasConfigs = true
    }
  }

  if (!hasConfigs) {
    console.log('    None found')
  }

  console.log('')
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

function getVersion(command: string): string {
  try {
    return execSync(`${command} --version`, { encoding: 'utf-8' }).trim().split('\n')[0]
  } catch {
    return 'Not installed'
  }
}
