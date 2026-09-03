import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

interface DoctorResult {
  name: string
  status: 'ok' | 'warning' | 'error'
  message: string
}

export function doctor(): void {
  console.log('\n  Flint Doctor\n')

  const results: DoctorResult[] = []

  // Check Node.js version
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.slice(1), 10)
  if (majorVersion >= 18) {
    results.push({ name: 'Node.js', status: 'ok', message: `v${nodeVersion}` })
  } else {
    results.push({ name: 'Node.js', status: 'error', message: `v${nodeVersion} (requires >= 18)` })
  }

  // Check package.json
  const pkgPath = path.join(process.cwd(), 'package.json')
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      results.push({ name: 'package.json', status: 'ok', message: `Found (${pkg.name || 'unnamed'})` })

      // Check for flint dependency
      const deps = { ...pkg.dependencies, ...pkg.devDependencies }
      if (deps.flint || deps['@flint/runtime']) {
        results.push({ name: 'Flint', status: 'ok', message: 'Installed' })
      } else {
        results.push({ name: 'Flint', status: 'warning', message: 'Not found in dependencies' })
      }

      // Check for TypeScript
      if (deps.typescript) {
        results.push({ name: 'TypeScript', status: 'ok', message: deps.typescript })
      } else {
        results.push({ name: 'TypeScript', status: 'warning', message: 'Not installed' })
      }

      // Check for Vite
      if (deps.vite) {
        results.push({ name: 'Vite', status: 'ok', message: deps.vite })
      } else {
        results.push({ name: 'Vite', status: 'warning', message: 'Not installed' })
      }
    } catch (err) {
      results.push({ name: 'package.json', status: 'error', message: 'Invalid JSON' })
    }
  } else {
    results.push({ name: 'package.json', status: 'error', message: 'Not found' })
  }

  // Check for tsconfig.json
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
  if (fs.existsSync(tsconfigPath)) {
    results.push({ name: 'tsconfig.json', status: 'ok', message: 'Found' })
  } else {
    results.push({ name: 'tsconfig.json', status: 'warning', message: 'Not found' })
  }

  // Check for vite.config.ts
  const viteConfigPath = path.join(process.cwd(), 'vite.config.ts')
  if (fs.existsSync(viteConfigPath)) {
    results.push({ name: 'vite.config.ts', status: 'ok', message: 'Found' })
  } else {
    results.push({ name: 'vite.config.ts', status: 'warning', message: 'Not found' })
  }

  // Check for src/main.tsx or src/main.ts
  const mainTsx = path.join(process.cwd(), 'src', 'main.tsx')
  const mainTs = path.join(process.cwd(), 'src', 'main.ts')
  if (fs.existsSync(mainTsx)) {
    results.push({ name: 'src/main.tsx', status: 'ok', message: 'Found' })
  } else if (fs.existsSync(mainTs)) {
    results.push({ name: 'src/main.ts', status: 'ok', message: 'Found' })
  } else {
    results.push({ name: 'src/main.ts(x)', status: 'warning', message: 'Not found' })
  }

  // Check for App.tsx
  const appTsx = path.join(process.cwd(), 'src', 'App.tsx')
  if (fs.existsSync(appTsx)) {
    results.push({ name: 'src/App.tsx', status: 'ok', message: 'Found' })
  } else {
    results.push({ name: 'src/App.tsx', status: 'warning', message: 'Not found' })
  }

  // Check for node_modules
  const nodeModules = path.join(process.cwd(), 'node_modules')
  if (fs.existsSync(nodeModules)) {
    results.push({ name: 'node_modules', status: 'ok', message: 'Found' })
  } else {
    results.push({ name: 'node_modules', status: 'error', message: 'Not found (run npm install)' })
  }

  // Print results
  for (const result of results) {
    const icon = result.status === 'ok' ? '✓' : result.status === 'warning' ? '⚠' : '✗'
    const color = result.status === 'ok' ? '\x1b[32m' : result.status === 'warning' ? '\x1b[33m' : '\x1b[31m'
    console.log(`  ${color}${icon}\x1b[0m ${result.name}: ${result.message}`)
  }

  // Summary
  const errors = results.filter(r => r.status === 'error').length
  const warnings = results.filter(r => r.status === 'warning').length

  console.log('\n  Summary:')
  if (errors === 0 && warnings === 0) {
    console.log('  \x1b[32m✓ Everything looks good!\x1b[0m')
  } else {
    if (errors > 0) {
      console.log(`  \x1b[31m✗ ${errors} error(s) found\x1b[0m`)
    }
    if (warnings > 0) {
      console.log(`  \x1b[33m⚠ ${warnings} warning(s) found\x1b[0m`)
    }
  }
  console.log('')
}

export function doctorHelp(): string {
  return `
Usage: flint doctor

Check your project for potential issues and missing dependencies.

Examples:
  flint doctor
`
}
