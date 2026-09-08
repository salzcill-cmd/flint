// @flint/server — Rate Limiting Middleware
// Protect your API from abuse

export interface RateLimitConfig {
  /** Maximum requests per window (default: 100) */
  max?: number
  /** Window duration in milliseconds (default: 60000 = 1 minute) */
  windowMs?: number
  /** Custom error message */
  message?: string
  /** Custom key generator (default: IP address) */
  keyGenerator?: (c: any) => string
  /** Skip certain requests */
  skip?: (c: any) => boolean
  /** Custom handler when limit exceeded */
  handler?: (c: any, retryAfter: number) => Response
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// ─── In-Memory Store ────────────────────────────────────────────

const store = new Map<string, RateLimitEntry>()

// ─── Cleanup Old Entries ────────────────────────────────────────

let cleanupInterval: NodeJS.Timeout | null = null

function startCleanup(windowMs: number) {
  if (cleanupInterval) return
  
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(key)
      }
    }
  }, windowMs)
  
  // Don't keep process alive just for cleanup
  if (cleanupInterval.unref) {
    cleanupInterval.unref()
  }
}

// ─── Default Key Generator ──────────────────────────────────────

function getDefaultKey(c: any): string {
  return c.req.header('x-forwarded-for') || 
         c.req.header('x-real-ip') || 
         c.req.raw?.socket?.remoteAddress || 
         'unknown'
}

// ─── Rate Limit Middleware ──────────────────────────────────────

export function rateLimit(config: RateLimitConfig = {}) {
  const {
    max = 100,
    windowMs = 60000,
    message = 'Terlalu banyak request, coba lagi nanti',
    keyGenerator = getDefaultKey,
    skip = () => false,
    handler,
  } = config

  startCleanup(windowMs)

  return async (c: any, next: () => Promise<void>) => {
    // Skip if configured
    if (skip(c)) {
      return next()
    }

    const key = keyGenerator(c)
    const now = Date.now()
    
    // Get or create entry
    let entry = store.get(key)
    
    if (!entry || now > entry.resetTime) {
      // New window
      entry = {
        count: 0,
        resetTime: now + windowMs,
      }
      store.set(key, entry)
    }

    // Increment count
    entry.count++

    // Set rate limit headers
    c.header('X-RateLimit-Limit', String(max))
    c.header('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)))
    c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)))

    // Check limit
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      c.header('Retry-After', String(retryAfter))

      if (handler) {
        return handler(c, retryAfter)
      }

      return c.json({
        error: message,
        retryAfter,
      }, 429)
    }

    return next()
  }
}

// ─── Preset Configurations ──────────────────────────────────────

/** Strict rate limit: 10 requests per minute */
export const strictRateLimit = (config?: Partial<RateLimitConfig>) =>
  rateLimit({ max: 10, windowMs: 60000, ...config })

/** Standard rate limit: 100 requests per minute */
export const standardRateLimit = (config?: Partial<RateLimitConfig>) =>
  rateLimit({ max: 100, windowMs: 60000, ...config })

/** Lenient rate limit: 1000 requests per minute */
export const lenientRateLimit = (config?: Partial<RateLimitConfig>) =>
  rateLimit({ max: 1000, windowMs: 60000, ...config })

/** API rate limit: 50 requests per minute */
export const apiRateLimit = (config?: Partial<RateLimitConfig>) =>
  rateLimit({ max: 50, windowMs: 60000, ...config })

/** Auth rate limit: 5 requests per minute (for login/register) */
export const authRateLimit = (config?: Partial<RateLimitConfig>) =>
  rateLimit({ max: 5, windowMs: 60000, ...config })

// ─── Utility Functions ──────────────────────────────────────────

/** Reset rate limit for a key */
export function resetRateLimit(key: string): void {
  store.delete(key)
}

/** Get rate limit info for a key */
export function getRateLimitInfo(key: string): { count: number; resetTime: number } | null {
  return store.get(key) || null
}

/** Clear all rate limits */
export function clearAllRateLimits(): void {
  store.clear()
}
