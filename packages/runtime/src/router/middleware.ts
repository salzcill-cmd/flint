// Flint Router v3 — Middleware System
// Express-like middleware for route handlers

// ─── Types ──────────────────────────────────────────────────────

export interface MiddlewareContext {
  /** Current route path */
  path: string
  /** Route params */
  params: Record<string, string>
  /** Query parameters */
  query: Record<string, string>
  /** Request headers (simulated) */
  headers: Record<string, string>
  /** Route metadata */
  meta: Record<string, any>
  /** Next middleware function */
  next: () => Promise<void>
  /** Abort navigation */
  abort: (reason?: string) => void
  /** State to pass between middleware */
  state: Record<string, any>
}

export type MiddlewareFunction = (
  ctx: MiddlewareContext,
  next: () => Promise<void>
) => void | Promise<void>

export interface RouteWithMiddleware {
  path: string
  component?: () => any
  middlewares?: MiddlewareFunction[]
  meta?: Record<string, any>
  children?: RouteWithMiddleware[]
}

// ─── Middleware Stack ────────────────────────────────────────────

export class MiddlewareStack {
  private middlewares: MiddlewareFunction[] = []
  private globalMiddlewares: MiddlewareFunction[] = []

  /**
   * Add global middleware (runs on all routes)
   */
  use(middleware: MiddlewareFunction): this {
    this.globalMiddlewares.push(middleware)
    return this
  }

  /**
   * Add route-specific middleware
   */
  add(middleware: MiddlewareFunction): this {
    this.middlewares.push(middleware)
    return this
  }

  /**
   * Execute middleware stack
   */
  async execute(ctx: MiddlewareContext): Promise<boolean> {
    const allMiddlewares = [...this.globalMiddlewares, ...this.middlewares]
    let aborted = false

    const createNext = (index: number) => async () => {
      if (aborted) return

      if (index >= allMiddlewares.length) {
        return
      }

      const middleware = allMiddlewares[index]
      await middleware(ctx, createNext(index + 1))
    }

    // Override abort to stop execution
    const originalAbort = ctx.abort
    ctx.abort = (reason?: string) => {
      aborted = true
      originalAbort(reason)
    }

    try {
      await createNext(0)( )
      return !aborted
    } catch (error) {
      console.error('[Flint Middleware] Error:', error)
      return false
    }
  }

  /**
   * Clear all middleware
   */
  clear(): void {
    this.middlewares = []
    this.globalMiddlewares = []
  }
}

// ─── Built-in Middleware ─────────────────────────────────────────

/**
 * Authentication middleware
 */
export function authMiddleware(options: {
  redirectTo?: string
  isAuthenticated?: () => boolean
} = {}): MiddlewareFunction {
  const { redirectTo = '/login', isAuthenticated = () => false } = options

  return (ctx, next) => {
    if (!isAuthenticated()) {
      ctx.abort(redirectTo)
      return
    }
    next()
  }
}

/**
 * Logging middleware
 */
export function logMiddleware(options: {
  log?: (message: string, ctx: MiddlewareContext) => void
} = {}): MiddlewareFunction {
  const { log = console.log } = options

  return (ctx, next) => {
    const start = performance.now()
    log(`[Flint] Navigating to: ${ctx.path}`, ctx)

    next().then(() => {
      const duration = performance.now() - start
      log(`[Flint] Navigation completed in ${duration.toFixed(2)}ms`)
    })
  }
}

/**
 * Guard middleware (route protection)
 */
export function guardMiddleware(options: {
  condition?: () => boolean | Promise<boolean>
  redirectTo?: string
  message?: string
} = {}): MiddlewareFunction {
  const { condition = () => true, redirectTo = '/', message = 'Access denied' } = options

  return async (ctx, next) => {
    const allowed = await condition()

    if (!allowed) {
      console.warn(`[Flint Guard] ${message}`)
      ctx.abort(redirectTo)
      return
    }

    next()
  }
}

/**
 * Progress middleware (loading bar)
 */
export function progressMiddleware(options: {
  onStart?: () => void
  onProgress?: (progress: number) => void
  onComplete?: () => void
} = {}): MiddlewareFunction {
  const { onStart, onProgress, onComplete } = options

  return (ctx, next) => {
    onStart?.()
    onProgress?.(0)

    // Simulate progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      onProgress?.(Math.min(progress, 90))
      if (progress >= 90) {
        clearInterval(interval)
      }
    }, 50)

    next().then(() => {
      clearInterval(interval)
      onProgress?.(100)
      onComplete?.()
    })
  }
}

/**
 * Validate middleware
 */
export function validateMiddleware(options: {
  rules: Record<string, (value: any) => boolean | string>
}): MiddlewareFunction {
  const { rules } = options

  return (ctx, next) => {
    for (const [key, rule] of Object.entries(rules)) {
      const value = ctx.params[key] || ctx.query[key]
      const result = rule(value)

      if (result !== true) {
        console.error(`[Flint Validate] Validation failed for "${key}": ${result}`)
        ctx.abort()
        return
      }
    }
    next()
  }
}

/**
 * Cache middleware
 */
export function cacheMiddleware(options: {
  ttl?: number
  key?: (ctx: MiddlewareContext) => string
} = {}): MiddlewareFunction {
  const { ttl = 60000, key = (ctx) => ctx.path } = options
  const cache = new Map<string, { data: any; expiry: number }>()

  return (ctx, next) => {
    const cacheKey = key(ctx)
    const cached = cache.get(cacheKey)

    if (cached && cached.expiry > Date.now()) {
      // Cache hit - skip to next
      return next()
    }

    // Store in context for route to use
    ctx.state.cacheKey = cacheKey
    ctx.state.setCache = (data: any) => {
      cache.set(cacheKey, { data, expiry: Date.now() + ttl })
    }

    next()
  }
}

// ─── Middleware Manager ──────────────────────────────────────────

export class MiddlewareManager {
  private stacks = new Map<string, MiddlewareStack>()

  /**
   * Get or create middleware stack for a route
   */
  getStack(routePath: string): MiddlewareStack {
    if (!this.stacks.has(routePath)) {
      this.stacks.set(routePath, new MiddlewareStack())
    }
    return this.stacks.get(routePath)!
  }

  /**
   * Add middleware to a route
 */
  use(routePath: string, middleware: MiddlewareFunction): void {
    this.getStack(routePath).add(middleware)
  }

  /**
   * Add global middleware
   */
  useGlobal(middleware: MiddlewareFunction): void {
    // Create a special stack for global middleware
    if (!this.stacks.has('__global__')) {
      this.stacks.set('__global__', new MiddlewareStack())
    }
    this.stacks.get('__global__')!.use(middleware)
  }

  /**
   * Execute middleware for a route
   */
  async execute(routePath: string, ctx: MiddlewareContext): Promise<boolean> {
    // Execute global middleware first
    const globalStack = this.stacks.get('__global__')
    if (globalStack) {
      const allowed = await globalStack.execute(ctx)
      if (!allowed) return false
    }

    // Execute route-specific middleware
    const routeStack = this.stacks.get(routePath)
    if (routeStack) {
      return routeStack.execute(ctx)
    }

    return true
  }

  /**
   * Clear middleware for a route
   */
  clear(routePath: string): void {
    this.stacks.get(routePath)?.clear()
  }

  /**
   * Clear all middleware
   */
  clearAll(): void {
    this.stacks.clear()
  }
}
