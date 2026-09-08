// @flint/server — Lightweight HTTP Server powered by Hono
// Ringan, cepat, TypeScript-first

import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { compress } from 'hono/compress'
import { HTTPException } from 'hono/http-exception'

// ─── Types ──────────────────────────────────────────────────────

export interface ServerConfig {
  /** Port number (default: 3000) */
  port?: number
  /** Host to bind (default: '0.0.0.0') */
  host?: string
  /** Enable request logging (default: false) */
  logger?: boolean
  /** Enable CORS (default: true) */
  cors?: boolean
  /** Enable compression (default: true) */
  compress?: boolean
  /** Custom error handler */
  onError?: (err: Error, c: any) => Response | Promise<Response>
  /** Custom not found handler */
  onNotFound?: (c: any) => Response | Promise<Response>
}

export type RouteHandler = (c: any) => any

// ─── Server Class ───────────────────────────────────────────────

export class FlintServer {
  readonly hono: Hono
  private config: ServerConfig
  private server: any = null

  constructor(config: ServerConfig = {}) {
    this.config = {
      port: 3000,
      host: '0.0.0.0',
      logger: false,
      cors: true,
      compress: true,
      ...config,
    }

    this.hono = new Hono()

    // Setup default middleware
    if (this.config.cors) {
      this.hono.use('*', cors())
    }
    if (this.config.logger) {
      this.hono.use('*', logger())
    }
    if (this.config.compress) {
      this.hono.use('*', compress())
    }

    // Default error handler
    this.hono.onError((err, c) => {
      if (this.config.onError) {
        return this.config.onError(err, c)
      }

      if (err instanceof HTTPException) {
        return c.json({ error: err.message }, err.status)
      }

      console.error('[Flint Server] Error:', err)
      return c.json({ error: 'Internal Server Error' }, 500)
    })

    // Default not found handler
    this.hono.notFound((c) => {
      if (this.config.onNotFound) {
        return this.config.onNotFound(c)
      }
      return c.json({ error: 'Route not found' }, 404)
    })
  }

  // ─── HTTP Methods ─────────────────────────────────────────────

  get(path: string, handler: RouteHandler): this {
    this.hono.get(path, handler)
    return this
  }

  post(path: string, handler: RouteHandler): this {
    this.hono.post(path, handler)
    return this
  }

  put(path: string, handler: RouteHandler): this {
    this.hono.put(path, handler)
    return this
  }

  patch(path: string, handler: RouteHandler): this {
    this.hono.patch(path, handler)
    return this
  }

  delete(path: string, handler: RouteHandler): this {
    this.hono.delete(path, handler)
    return this
  }

  all(path: string, handler: RouteHandler): this {
    this.hono.all(path, handler)
    return this
  }

  // ─── Route Groups ─────────────────────────────────────────────

  route(prefix: string): RouteGroup {
    return new RouteGroup(this.hono, prefix)
  }

  // ─── Middleware ────────────────────────────────────────────────

  use(middleware: any): this {
    this.hono.use('*', middleware)
    return this
  }

  // ─── Start Server ─────────────────────────────────────────────

  listen(port?: number, callback?: () => void): any {
    const p = port || this.config.port || 3000
    this.server = serve({
      fetch: this.hono.fetch,
      port: p,
      hostname: this.config.host,
    }, () => {
      console.log(`[Flint Server] Running on http://${this.config.host}:${p}`)
      callback?.()
    })
    return this.server
  }

  // ─── Stop Server ──────────────────────────────────────────────

  async close(): Promise<void> {
    if (this.server) {
      this.server.close()
      this.server = null
    }
  }
}

// ─── Route Group ────────────────────────────────────────────────

export class RouteGroup {
  private hono: Hono
  private prefix: string

  constructor(hono: Hono, prefix: string) {
    this.hono = hono
    this.prefix = prefix
  }

  get(path: string, handler: RouteHandler): this {
    this.hono.get(`${this.prefix}${path}`, handler)
    return this
  }

  post(path: string, handler: RouteHandler): this {
    this.hono.post(`${this.prefix}${path}`, handler)
    return this
  }

  put(path: string, handler: RouteHandler): this {
    this.hono.put(`${this.prefix}${path}`, handler)
    return this
  }

  delete(path: string, handler: RouteHandler): this {
    this.hono.delete(`${this.prefix}${path}`, handler)
    return this
  }
}

// ─── Factory Function ───────────────────────────────────────────

export function createServer(config?: ServerConfig): FlintServer {
  return new FlintServer(config)
}

// ─── Built-in Middleware ────────────────────────────────────────

export { cors, logger, compress }
export { HTTPException }

// ─── Re-export Hono types ──────────────────────────────────────

export type { Hono } from 'hono'
