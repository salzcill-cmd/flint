import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { createServer } from 'http'
import { parse } from 'url'

interface PreviewOptions {
  port?: number
  host?: string
  open?: boolean
}

export function preview(options: PreviewOptions = {}): void {
  const { port = 4173, host = 'localhost', open = true } = options
  const distPath = path.join(process.cwd(), 'dist')

  if (!fs.existsSync(distPath)) {
    console.error('No dist folder found. Run "flint build" first.')
    process.exit(1)
  }

  console.log(`\n  Preview server starting...\n`)

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || '/', true)
    let pathname = parsedUrl.pathname || '/'

    // Try to serve the file
    let filePath = path.join(distPath, pathname)

    // Default to index.html for SPA routing
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distPath, 'index.html')
    }

    try {
      const content = fs.readFileSync(filePath)
      const ext = path.extname(filePath)
      const mimeTypes: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
      }

      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' })
      res.end(content)
    } catch (err) {
      res.writeHead(404)
      res.end('Not Found')
    }
  })

  server.listen(port, host, () => {
    console.log(`  > Local:   http://${host}:${port}/`)
    console.log(`  > Network: http://${getNetworkIP()}:${port}/`)
    console.log(`\n  Press Ctrl+C to stop.\n`)

    if (open) {
      try {
        const command = process.platform === 'darwin'
          ? `open http://${host}:${port}`
          : process.platform === 'win32'
            ? `start http://${host}:${port}`
            : `xdg-open http://${host}:${port}`
        execSync(command, { stdio: 'ignore' })
      } catch {}
    }
  })
}

function getNetworkIP(): string {
  try {
    const { networkInterfaces } = require('os')
    const interfaces = networkInterfaces()
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address
        }
      }
    }
  } catch {}
  return 'localhost'
}

export function previewHelp(): string {
  return `
Usage: flint preview [options]

Preview the production build locally.

Options:
  --port <number>   Port to use (default: 4173)
  --host <string>   Host to bind to (default: localhost)
  --no-open         Don't open browser automatically

Examples:
  flint preview
  flint preview --port 8080
  flint preview --host 0.0.0.0 --port 3000
`
}
