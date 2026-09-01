// Flint CLI — Dev Command
// Starts the development server

import { createServer } from 'vite'
import flint from '@flint/vite-plugin'

export interface DevOptions {
  port: number
  host: string
}

export async function startDev(options: DevOptions): Promise<void> {
  console.log(`\n🔥 Starting Flint dev server...\n`)

  const server = await createServer({
    root: process.cwd(),
    plugins: [flint({ dev: true })],
    server: {
      port: options.port,
      host: options.host,
    },
  })

  await server.listen()

  const info = server.resolvedUrls
  console.log(`  🌐 Dev server running at:\n`)
  if (info?.local) {
    console.log(`     ${info.local}`)
  }
  if (info?.network) {
    console.log(`     ${info.network}`)
  }
  console.log(`\n  Press Ctrl+C to stop.\n`)

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.close()
    process.exit(0)
  })
}
