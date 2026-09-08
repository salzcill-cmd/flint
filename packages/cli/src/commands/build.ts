// Flint CLI — Build Command
// Production build with bundle reporting

import { build } from 'vite'
import flint from 'flint-vite-plugin'
import { validateProject, printValidationErrors } from './validate.js'

export interface BuildOptions {
  outDir: string
  minify: boolean
  sourcemap: boolean
}

/** Default performance budget for the largest JS chunk (gzipped). */
const BUDGET_KB = 50

export async function buildProject(options: BuildOptions): Promise<void> {
  // Pre-flight check: fail fast with friendly errors
  const validation = validateProject()
  if (!validation.ok) {
    printValidationErrors(validation)
    process.exit(1)
  }

  const { outDir, minify, sourcemap } = options

  console.log(`\n  Building for production...\n`)

  try {
    const result = await build({
      root: process.cwd(),
      plugins: [flint({ dev: false })],
      build: {
        outDir,
        sourcemap,
        minify: minify ? 'esbuild' : false,
        target: 'es2022',
        rollupOptions: {
          output: {
            manualChunks: undefined,
          },
        },
      },
    })

    console.log(`  Build complete!`)
    console.log(`  Output: ${outDir}/\n`)

    // Show bundle info with gzip sizes
    if ('output' in result) {
      const outputs = Array.isArray(result.output) ? result.output : [result.output]
      let largestJsGzip = 0

      for (const output of outputs) {
        const files = [
          ...(('assets' in output ? output.assets : []) as Array<{ fileName: string; type: string; size: number }>),
          ...(('chunks' in output ? output.chunks : []) as Array<{ fileName: string; type: string; size: number }>),
        ]
        if (files.length === 0) continue

        console.log(`  Bundle size:`)
        for (const file of files) {
          const raw = file.size
          const gzip = gzipEstimate(raw, file.fileName)
          if (file.fileName.endsWith('.js') && gzip > largestJsGzip) {
            largestJsGzip = gzip
          }
          console.log(`    ${file.fileName.padEnd(36)} ${formatSize(raw).padStart(9)} │ gzip ~${formatSize(gzip).padStart(8)}`)
        }
        console.log('')

        // Performance budget hint (gzip estimate, not a measured value)
        if (largestJsGzip > BUDGET_KB * 1024) {
          console.log(
            `  ⚠ Largest JS chunk is ~${formatSize(largestJsGzip)} gzipped ` +
            `(budget: ${BUDGET_KB} KB). Consider code splitting with lazy().\n`
          )
        }
      }
    }

    console.log('')
  } catch (err) {
    console.error(`\n  ✖ Build failed:\n`)
    console.error(`    ${err instanceof Error ? err.message : String(err)}\n`)
    console.error(`  💡 Tip: run \`flint doctor\` to check your project setup.\n`)
    process.exit(1)
  }
}

/**
 * Rough gzip size estimate (JS/HTML/CSS compress to roughly 30-40% of raw).
 * Clearly an estimate — labeled as "gzip ~" in the output.
 */
function gzipEstimate(bytes: number, fileName: string): number {
  const compressible = /\.(js|css|html|svg|json)$/.test(fileName)
  return compressible ? Math.round(bytes * 0.35) : bytes
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
