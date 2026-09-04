import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  MiddlewareStack,
  authMiddleware,
  logMiddleware,
  guardMiddleware,
  validateMiddleware,
  cacheMiddleware,
  MiddlewareManager,
  type MiddlewareContext,
} from '../src/router/middleware.js'

function createMockContext(overrides: Partial<MiddlewareContext> = {}): MiddlewareContext {
  let abortReason: string | undefined
  return {
    path: '/test',
    params: {},
    query: {},
    headers: {},
    meta: {},
    next: vi.fn().mockResolvedValue(undefined),
    abort: vi.fn((reason?: string) => { abortReason = reason }),
    state: {},
    ...overrides,
  }
}

describe('MiddlewareStack', () => {
  it('should execute middleware in order', async () => {
    const order: number[] = []
    const stack = new MiddlewareStack()

    stack.add(async (ctx, next) => {
      order.push(1)
      await next()
    })

    stack.add(async (ctx, next) => {
      order.push(2)
      await next()
    })

    const ctx = createMockContext()
    const result = await stack.execute(ctx)

    expect(result).toBe(true)
    expect(order).toEqual([1, 2])
  })

  it('should execute global middleware before route-specific', async () => {
    const order: number[] = []
    const stack = new MiddlewareStack()

    stack.use(async (ctx, next) => {
      order.push('global')
      await next()
    })

    stack.add(async (ctx, next) => {
      order.push('route')
      await next()
    })

    const ctx = createMockContext()
    await stack.execute(ctx)

    expect(order).toEqual(['global', 'route'])
  })

  it('should stop execution when abort is called', async () => {
    const order: number[] = []
    const stack = new MiddlewareStack()

    stack.add(async (ctx, next) => {
      order.push(1)
      ctx.abort('stopped')
    })

    stack.add(async (ctx, next) => {
      order.push(2)
      await next()
    })

    const ctx = createMockContext()
    const result = await stack.execute(ctx)

    expect(result).toBe(false)
    expect(order).toEqual([1])
  })

  it('should handle sync middleware', async () => {
    const stack = new MiddlewareStack()

    stack.add((ctx, next) => {
      ctx.state.synced = true
      return next()
    })

    const ctx = createMockContext()
    const result = await stack.execute(ctx)

    expect(result).toBe(true)
    expect(ctx.state.synced).toBe(true)
  })

  it('should clear middleware', async () => {
    const stack = new MiddlewareStack()
    stack.add(async (ctx, next) => { await next() })
    stack.use(async (ctx, next) => { await next() })

    stack.clear()

    const ctx = createMockContext()
    const result = await stack.execute(ctx)

    expect(result).toBe(true)
  })
})

describe('authMiddleware', () => {
  it('should allow access when authenticated', async () => {
    const middleware = authMiddleware({
      isAuthenticated: () => true,
    })

    const ctx = createMockContext()
    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    expect(next).toHaveBeenCalled()
  })

  it('should redirect when not authenticated', async () => {
    const middleware = authMiddleware({
      isAuthenticated: () => false,
      redirectTo: '/login',
    })

    const ctx = createMockContext()
    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    expect(next).not.toHaveBeenCalled()
    expect(ctx.abort).toHaveBeenCalledWith('/login')
  })

  it('should use default redirect path', async () => {
    const middleware = authMiddleware({
      isAuthenticated: () => false,
    })

    const ctx = createMockContext()
    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    expect(ctx.abort).toHaveBeenCalledWith('/login')
  })
})

describe('logMiddleware', () => {
  it('should log navigation path', async () => {
    const log = vi.fn()
    const middleware = logMiddleware({ log })

    const ctx = createMockContext({ path: '/dashboard' })
    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    expect(log).toHaveBeenCalledWith('[Flint] Navigating to: /dashboard', ctx)
  })

  it('should log completion time', async () => {
    const log = vi.fn()
    const middleware = logMiddleware({ log })

    const ctx = createMockContext()
    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    // Wait for next().then() to complete
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('[Flint] Navigation completed in'),
    )
  })
})

describe('guardMiddleware', () => {
  it('should allow access when condition is true', async () => {
    const middleware = guardMiddleware({
      condition: () => true,
    })

    const ctx = createMockContext()
    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    expect(next).toHaveBeenCalled()
  })

  it('should block access when condition is false', async () => {
    const middleware = guardMiddleware({
      condition: () => false,
      redirectTo: '/unauthorized',
      message: 'Not allowed',
    })

    const ctx = createMockContext()
    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    expect(next).not.toHaveBeenCalled()
    expect(ctx.abort).toHaveBeenCalledWith('/unauthorized')
  })

  it('should handle async condition', async () => {
    const middleware = guardMiddleware({
      condition: async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return true
      },
    })

    const ctx = createMockContext()
    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    expect(next).toHaveBeenCalled()
  })
})

describe('validateMiddleware', () => {
  it('should pass validation', async () => {
    const middleware = validateMiddleware({
      rules: {
        id: (value) => /^\d+$/.test(value) || 'Must be a number',
      },
    })

    const ctx = createMockContext({
      params: { id: '123' },
    })
    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    expect(next).toHaveBeenCalled()
  })

  it('should fail validation', async () => {
    const middleware = validateMiddleware({
      rules: {
        id: (value) => /^\d+$/.test(value) || 'Must be a number',
      },
    })

    const ctx = createMockContext({
      params: { id: 'abc' },
    })
    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    expect(next).not.toHaveBeenCalled()
    expect(ctx.abort).toHaveBeenCalled()
  })

  it('should validate query params', async () => {
    const middleware = validateMiddleware({
      rules: {
        page: (value) => (Number(value) > 0) || 'Must be positive',
      },
    })

    const ctx = createMockContext({
      query: { page: '1' },
    })
    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    expect(next).toHaveBeenCalled()
  })
})

describe('cacheMiddleware', () => {
  it('should store cache key in state', async () => {
    const middleware = cacheMiddleware({ ttl: 60000 })

    const ctx = createMockContext({ path: '/api/data' })
    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    expect(ctx.state.cacheKey).toBe('/api/data')
    expect(typeof ctx.state.setCache).toBe('function')
  })

  it('should use custom key function', async () => {
    const middleware = cacheMiddleware({
      key: (ctx) => `${ctx.path}?${JSON.stringify(ctx.query)}`,
    })

    const ctx = createMockContext({
      path: '/api/data',
      query: { page: '1' },
    })
    const next = vi.fn().mockResolvedValue(undefined)

    await middleware(ctx, next)

    expect(ctx.state.cacheKey).toBe('/api/data?{"page":"1"}')
  })
})

describe('MiddlewareManager', () => {
  it('should create and manage middleware stacks', async () => {
    const manager = new MiddlewareManager()

    manager.use('/dashboard', async (ctx, next) => {
      ctx.state.dashboard = true
      await next()
    })

    const ctx = createMockContext({ path: '/dashboard' })
    const result = await manager.execute('/dashboard', ctx)

    expect(result).toBe(true)
    expect(ctx.state.dashboard).toBe(true)
  })

  it('should execute global middleware before route middleware', async () => {
    const order: string[] = []
    const manager = new MiddlewareManager()

    manager.useGlobal(async (ctx, next) => {
      order.push('global')
      await next()
    })

    manager.use('/test', async (ctx, next) => {
      order.push('route')
      await next()
    })

    const ctx = createMockContext()
    await manager.execute('/test', ctx)

    expect(order).toEqual(['global', 'route'])
  })

  it('should clear middleware for a route', async () => {
    const manager = new MiddlewareManager()

    manager.use('/test', async (ctx, next) => {
      ctx.state.cleared = true
      await next()
    })

    manager.clear('/test')

    const ctx = createMockContext()
    await manager.execute('/test', ctx)

    expect(ctx.state.cleared).toBeUndefined()
  })
})
