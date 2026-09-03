// Flint CLI — Build Command
// Production build

import { build } from 'vite'
import flint from '@flint/vite-plugin'

export async function buildProject(
  outDir: string,
  minify: boolean = true,
  sourcemap: boolean = true
): Promise<void> {
  console.log(`\n  Building for production...\n`)

  try {
    const result = await build({
      root: process.cwd(),
      plugins: [flint()],
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

    // Show bundle info
    if ('output' in result) {
      const outputs = Array.isArray(result.output) ? result.output : [result.output]
      for (const output of outputs) {
        if ('assets' in output) {
          const assets = output.assets as Array<{ fileName: string; type: string; size: number }>
          console.log(`  Bundle size:`)
          for (const asset of assets) {
            const size = formatSize(asset.size)
            console.log(`    ${asset.fileName} (${size})`)
          }
        }
      }
    }

    console.log('')
  } catch (err) {
    console.error(`\n  Build failed: ${err instanceof Error ? err.message : String(err)}\n`)
    process.exit(1)
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
