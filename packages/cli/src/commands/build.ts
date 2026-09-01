// Flint CLI — Build Command
// Production build

import { build } from 'vite'
import flint from '@flint/vite-plugin'

export async function buildProject(outDir: string): Promise<void> {
  console.log(`\n🔥 Building for production...\n`)

  try {
    await build({
      root: process.cwd(),
      plugins: [flint()],
      build: {
        outDir,
        sourcemap: true,
        minify: 'esbuild',
        target: 'es2022',
      },
    })

    console.log(`  ✅ Build complete!`)
    console.log(`  📁 Output: ${outDir}/\n`)
  } catch (err) {
    console.error(`\n  ❌ Build failed: ${err instanceof Error ? err.message : String(err)}\n`)
    process.exit(1)
  }
}
