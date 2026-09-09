// @flint/server — Caching Layer
// In-memory cache (built-in, zero dependencies)

// ─── Types ──────────────────────────────────────────────────────

export interface CacheConfig {
  /** Default TTL in seconds (default: 300) */
  ttl?: number
  /** Maximum items in cache (default: 1000) */
  maxItems?: number
  /** Prefix for cache keys */
  prefix?: string
}

// ─── In-Memory Cache ────────────────────────────────────────────

interface CacheEntry {
  value: any
  expiresAt: number
}

export class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map()
  private prefix: string
  private defaultTTL: number
  private maxItems: number

  constructor(config: CacheConfig = {}) {
    this.prefix = config.prefix || 'flint:'
    this.defaultTTL = (config.ttl || 300) * 1000
    this.maxItems = config.maxItems || 1000
  }

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(`${this.prefix}${key}`)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(`${this.prefix}${key}`)
      return null
    }
    return entry.value as T
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (this.cache.size >= this.maxItems) {
      const oldest = this.cache.keys().next().value
      if (oldest) this.cache.delete(oldest)
    }
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL
    this.cache.set(`${this.prefix}${key}`, {
      value,
      expiresAt: Date.now() + ttl,
    })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(`${this.prefix}${key}`)
  }

  async clear(pattern?: string): Promise<void> {
    if (!pattern) {
      this.cache.clear()
      return
    }
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(`${this.prefix}${pattern}`)) {
        this.cache.delete(key)
      }
    }
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(`${this.prefix}${key}`)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(`${this.prefix}${key}`)
      return false
    }
    return true
  }

  async keys(pattern?: string): Promise<string[]> {
    const prefix = this.prefix
    const result: string[] = []
    for (const key of Array.from(this.cache.keys())) {
      if (!pattern || key.startsWith(`${prefix}${pattern}`)) {
        result.push(key.replace(prefix, ''))
      }
    }
    return result
  }

  getStats() {
    return { size: this.cache.size }
  }
}

// ─── Cache Middleware ────────────────────────────────────────────

export function cacheMiddleware(cache: MemoryCache, ttl?: number) {
  return async (c: any, next: () => Promise<void>) => {
    const key = `${c.req.method}:${c.req.url}`
    const cached = await cache.get(key)
    if (cached) {
      return c.json(cached)
    }
    await next()
    try {
      const body = await c.res.clone().json()
      await cache.set(key, body, ttl)
    } catch {}
  }
}

// ─── Factory ────────────────────────────────────────────────────

export function createCache(config: CacheConfig = {}): MemoryCache {
  return new MemoryCache(config)
}
