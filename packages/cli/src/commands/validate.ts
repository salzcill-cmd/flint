// Flint CLI — Project Validation
// Friendly pre-flight checks so beginners get actionable errors instead of
// raw Vite stack traces.

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export interface ProjectValidation {
  ok: boolean
  root: string
  hasPackageJson: boolean
  hasIndexHtml: boolean
  entry: string | null
  errors: string[]
}

const ENTRY_CANDIDATES = [
  '/src/main.jsx',
  '/src/main.tsx',
  '/src/main.js',
  '/src/main.ts',
  '/src/index.jsx',
  '/src/index.tsx',
  '/src/index.js',
  '/src/index.ts',
  '/main.jsx',
  '/main.tsx',
  '/main.js',
  '/main.ts',
  '/index.jsx',
  '/index.tsx',
  '/index.js',
  '/index.ts',
]

/**
 * Validate that the current directory looks like a Flint/Vite project.
 *
 * @example
 * const validation = validateProject()
 * if (!validation.ok) {
 *   printValidationErrors(validation)
 *   process.exit(1)
 * }
 */
export function validateProject(cwd: string = process.cwd()): ProjectValidation {
  const root = resolve(cwd)
  const hasPackageJson = existsSync(join(root, 'package.json'))
  const hasIndexHtml = existsSync(join(root, 'index.html'))
  const errors: string[] = []

  let entry: string | null = null
  if (hasIndexHtml) {
    try {
      const html = readFileSync(join(root, 'index.html'), 'utf-8')
      const match = /<script[^>]+src=["']([^"']+)["']/.exec(html)
      if (match) entry = match[1]
    } catch {
      // unreadable index.html — surfaced via generic error below
    }
  }

  if (!hasPackageJson) {
    errors.push(
      `No package.json found in ${root}.`,
      'Run this command inside your project folder, or create a new project with: flint create my-app'
    )
  }

  if (!hasIndexHtml) {
    errors.push(
      'No index.html found in the project root.',
      'Flint (via Vite) needs an index.html as the entry point:',
      '',
      '  <!doctype html>',
      '  <html>',
      '    <body>',
      '      <div id="app"></div>',
      '      <script type="module" src="/src/main.jsx"></script>',
      '    </body>',
      '  </html>'
    )
  } else if (!entry) {
    errors.push(
      'index.html has no <script type="module" src="..."> tag.',
      'Add a module script pointing at your app entry, e.g.: <script type="module" src="/src/main.jsx"></script>'
    )
  }

  return {
    ok: errors.length === 0,
    root,
    hasPackageJson,
    hasIndexHtml,
    entry,
    errors,
  }
}

/**
 * Print validation errors in a friendly, actionable format.
 */
export function printValidationErrors(validation: ProjectValidation): void {
  console.error(`\n  ✖ Cannot start — project structure looks wrong:\n`)
  for (const error of validation.errors) {
    console.error(`    ${error}`)
  }
  console.error(`\n  💡 Tip: run \`flint doctor\` for a full health check.\n`)
}
