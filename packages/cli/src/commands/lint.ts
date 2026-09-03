// Flint CLI — Lint Command
// Lints project files with ESLint

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

export async function lintProject(fix: boolean): Promise<void> {
  const root = findProjectRoot()

  // Check if eslint is available
  const eslintConfig = findESLintConfig(root)
  if (!eslintConfig) {
    console.log('\n  No ESLint config found. Initializing with defaults...\n')
    initESLintConfig(root)
  }

  const args: string[] = ['eslint']

  if (fix) {
    args.push('--fix')
  }

  // Target source files
  args.push('src/**/*.{ts,tsx,js,jsx}')

  console.log(`\n  Linting project${fix ? ' (auto-fix enabled)' : ''}...\n`)

  const child = spawn('npx', args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) {
        console.log('\n  No lint errors found!\n')
        resolve()
      } else {
        console.log(`\n  Lint errors found. Fix them and try again.\n`)
        reject(new Error(`Lint failed with exit code ${code}`))
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

function findESLintConfig(root: string): string | null {
  const patterns = [
    'eslint.config.js',
    'eslint.config.mjs',
    'eslint.config.cjs',
    '.eslintrc.js',
    '.eslintrc.cjs',
    '.eslintrc.json',
    '.eslintrc',
  ]

  for (const pattern of patterns) {
    if (fs.existsSync(path.join(root, pattern))) {
      return pattern
    }
  }

  return null
}

function initESLintConfig(root: string): void {
  const config = `import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        document: 'readonly',
        window: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
]
`

  fs.writeFileSync(path.join(root, 'eslint.config.js'), config)
  console.log('  ✔ Created eslint.config.js\n')
}
