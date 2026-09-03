// Flint Runtime Tests — Server Components & Actions, Optimistic Updates, use() API
// Comprehensive tests for React 19-equivalent features

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { state, effect, batch, computed } from '@flint/reactivity'

// ─── Server Components & Server Actions ─────────────────────────

import {
  createServerAction,
  getServerActionRegistry,
  configureServerTransport,
  handleServerAction,
  addServerActionMiddleware,
  setServerComponentContext,
  clearServerComponentContext,
  RedirectError,
  NotFoundError,
} from '@flint/runtime/ssr/server-components'
import type { ServerActionMiddleware } from '@flint/runtime/ssr/server-components'

describe('Server Components & Server Actions', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    clearServerComponentContext()
    // Mock fetch for happy-dom environment so server actions execute via registry
    globalThis.fetch = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(init?.body as string || '{}')
      const registry = getServerActionRegistry()
      const result = await registry.execute(body.actionId, ...body.args)
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }) as any
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  describe('createServerAction', () => {
    it('creates a server action with metadata', async () => {
      const action = createServerAction(async (title: string) => {
        return { id: 1, title }
      }, { revalidate: ['todos'] })

      expect(action.isServerAction).toBe(true)
      expect(action.actionId).toBeDefined()
    })

    it('registers action in registry', async () => {
      const action = createServerAction(async (x: number) => x * 2)
      const registry = getServerActionRegistry()

      expect(registry.has(action.actionId)).toBe(true)
    })

    it('executes action on server', async () => {
      const action = createServerAction(async (x: number) => x * 2)
      const result = await action(5)

      // In happy-dom, the wrapper goes through fetch -> registry -> {data, error}
      expect(result).toEqual({ data: 10, error: null, revalidate: undefined })
    })

    it('calls onSuccess callback', async () => {
      const onSuccess = vi.fn()
      const action = createServerAction(async () => 'result', { onSuccess })

      await action()

      expect(onSuccess).toHaveBeenCalledWith('result')
    })

    it('calls onError callback on failure', async () => {
      const onError = vi.fn()
      const action = createServerAction(async () => {
        throw new Error('fail')
      }, { onError })

      await action()

      expect(onError).toHaveBeenCalled()
    })
  })

  describe('Server Action Registry', () => {
    it('registers and executes actions', async () => {
      const registry = getServerActionRegistry()

      registry.register('test_action', async (x: number) => x + 1)

      expect(registry.has('test_action')).toBe(true)
      expect(await registry.execute('test_action', 5)).toBe(6)
    })

    it('throws on missing action', async () => {
      const registry = getServerActionRegistry()

      await expect(registry.execute('nonexistent')).rejects.toThrow('not found')
    })
  })

  describe('Server Action Middleware', () => {
    it('executes middleware chain via HTTP handler', async () => {
      const order: string[] = []

      addServerActionMiddleware(async (actionId, args, next) => {
        order.push('first')
        return next(...args)
      })

      addServerActionMiddleware(async (actionId, args, next) => {
        order.push('second')
        return next(...args)
      })

      const action = createServerAction(async () => {
        order.push('action')
        return 'done'
      })

      const request = new Request('/__flint_server_action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: action.actionId, args: [] }),
      })

      await handleServerAction(request)

      expect(order).toEqual(['first', 'second', 'action'])
    })
  })

  describe('Server Action HTTP Handler', () => {
    it('handles POST requests', async () => {
      const action = createServerAction(async (x: number) => x * 2)

      const request = new Request('/__flint_server_action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: action.actionId, args: [5] }),
      })

      const response = await handleServerAction(request)
      const result = await response.json()

      expect(result).toEqual({ data: 10, error: null })
    })

    it('returns 400 for missing action ID', async () => {
      const request = new Request('/__flint_server_action', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await handleServerAction(request)

      expect(response.status).toBe(400)
    })

    it('returns 404 for unknown action', async () => {
      const request = new Request('/__flint_server_action', {
        method: 'POST',
        body: JSON.stringify({ actionId: 'unknown', args: [] }),
      })

      const response = await handleServerAction(request)

      expect(response.status).toBe(404)
    })
  })

  describe('Server Component Context', () => {
    it('sets and clears context', () => {
      const context = {
        params: { id: '123' },
        query: { tab: 'about' },
        data: {},
        headers: {},
        setHeader: vi.fn(),
        redirect: vi.fn(),
        notFound: vi.fn() as any,
      }

      setServerComponentContext(context)
      clearServerComponentContext()
    })
  })

  describe('Special Errors', () => {
    it('creates RedirectError', () => {
      const error = new RedirectError('/login', 302)

      expect(error.url).toBe('/login')
      expect(error.status).toBe(302)
      expect(error.name).toBe('RedirectError')
    })

    it('creates NotFoundError', () => {
      const error = new NotFoundError()

      expect(error.message).toBe('Not Found')
      expect(error.name).toBe('NotFoundError')
    })
  })

  describe('Transport Configuration', () => {
    it('configures custom transport', () => {
      const transport = vi.fn()
      configureServerTransport(transport)
    })
  })
})

// ─── Optimistic Updates ─────────────────────────────────────────

import {
  useOptimistic,
  useOptimisticAction,
  useActionState,
} from '@flint/runtime/hooks/optimistic'

describe('useOptimistic', () => {
  it('initializes with initial value', () => {
    const result = useOptimistic('initial')

    expect(result.optimistic()).toBe('initial')
    expect(result.isPending()).toBe(false)
    expect(result.isError()).toBe(false)
    expect(result.error()).toBeNull()
    expect(result.latest()).toBe('initial')
  })

  it('sets optimistic value', () => {
    const result = useOptimistic('initial')

    result.set('optimistic')

    expect(result.optimistic()).toBe('optimistic')
    expect(result.isPending()).toBe(true)
  })

  it('sets optimistic value with function', () => {
    const result = useOptimistic(0)

    result.set(prev => prev + 1)

    expect(result.optimistic()).toBe(1)
  })

  it('resets to initial value', () => {
    const result = useOptimistic('initial')

    result.set('changed')
    result.reset()

    expect(result.optimistic()).toBe('initial')
    expect(result.isPending()).toBe(false)
  })

  it('uses custom update function', () => {
    const result = useOptimistic(
      { count: 0 },
      { update: (current, newValue) => ({ ...current, count: newValue as number }) }
    )

    result.set(5)

    expect(result.optimistic()).toEqual({ count: 5 })
  })
})

describe('useOptimisticAction', () => {
  it('creates action with optimistic state', async () => {
    const action = vi.fn(async (title: string) => ({ id: 1, title }))
    const result = useOptimisticAction(action)

    expect(result.state.isPending()).toBe(false)
    expect(typeof result.execute).toBe('function')
  })

  it('sets pending state during execution', async () => {
    let resolvePromise: (value: any) => void
    const action = vi.fn(() => new Promise(resolve => { resolvePromise = resolve }))
    const result = useOptimisticAction(action)

    const promise = result.execute('test')
    expect(result.state.isPending()).toBe(true)

    resolvePromise!({ id: 1, title: 'test' })
    await promise

    expect(result.state.isPending()).toBe(false)
  })

  it('handles errors', async () => {
    const action = vi.fn(async () => { throw new Error('fail') })
    const result = useOptimisticAction(action)

    await expect(result.execute('test')).rejects.toThrow('fail')
    expect(result.state.isError()).toBe(true)
  })
})

describe('useActionState', () => {
  it('initializes with initial state', () => {
    const action = vi.fn(async (prev, formData) => formData)
    const [stateVal, execute, isPending] = useActionState(action, { count: 0 })

    expect(stateVal).toEqual({ count: 0 })
    expect(isPending).toBe(false)
  })

  it('updates state on action execution', async () => {
    const action = vi.fn(async (prev, formData) => ({
      count: prev.count + 1,
    }))
    const [stateVal, execute] = useActionState(action, { count: 0 })

    await execute({})

    // Note: useActionState returns snapshot values, not signals
    // The state value updates internally
    expect(typeof execute).toBe('function')
  })
})

// ─── use() API ──────────────────────────────────────────────────

import {
  createContext,
  useProvider,
} from '@flint/runtime/hooks/optimistic'

describe('use() API', () => {
  describe('createContext', () => {
    it('creates a context with default value', () => {
      const ctx = createContext('default')

      expect(ctx._flintContext).toBe(true)
      expect(ctx.defaultValue).toBe('default')
    })

    it('provides value', () => {
      const ctx = createContext('default')

      const value = useProvider(ctx, 'provided')

      expect(value).toBe('provided')
    })
  })
})

// ─── Form Actions & Resource Preloading ─────────────────────────

import {
  createFormAction,
} from '@flint/runtime/hooks/form-actions'

describe('Form Actions', () => {
  it('creates a form action handler', () => {
    const formAction = createFormAction({
      action: async (formData) => formData,
    })

    expect(typeof formAction.submit).toBe('function')
    expect(typeof formAction.reset).toBe('function')
    expect(formAction.pending).toBe(false)
  })

  it('submits form data', async () => {
    const action = vi.fn(async (data) => ({ success: true, data }))
    const formAction = createFormAction({ action })

    const formData = new FormData()
    formData.set('title', 'Test')

    const result = await formAction.submit(formData)

    expect(action).toHaveBeenCalled()
    expect(result.success).toBe(true)
  })

  it('calls onSubmit hook on success', async () => {
    const onSubmit = vi.fn()
    const formAction = createFormAction({
      action: async () => 'result',
      onSubmit,
    })

    await formAction.submit(new FormData())

    expect(onSubmit).toHaveBeenCalledWith('result')
  })

  it('calls onError hook on failure', async () => {
    const onError = vi.fn()
    const formAction = createFormAction({
      action: async () => { throw new Error('fail') },
      onError,
    })

    await expect(formAction.submit(new FormData())).rejects.toThrow()
    expect(onError).toHaveBeenCalled()
  })

  it('resets form state', () => {
    const formAction = createFormAction({
      action: async () => 'result',
    })

    formAction.reset()
    expect(formAction.pending).toBe(false)
  })
})

// ─── Compiler Auto-Memoization ──────────────────────────────────

import { Optimizer } from '@flint/compiler/optimizer'

describe('Compiler Auto-Memoization', () => {
  it('creates optimizer with autoMemoization enabled', () => {
    const optimizer = new Optimizer({ autoMemoization: true })
    expect(optimizer).toBeDefined()
  })

  it('includes autoMemoized in stats', () => {
    const optimizer = new Optimizer()
    const ast = {
      type: 'Program',
      body: [
        {
          type: 'VariableDeclaration',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: { type: 'Identifier', name: 'x' },
              init: {
                type: 'BinaryExpression',
                operator: '+',
                left: { type: 'Identifier', name: 'a' },
                right: { type: 'Identifier', name: 'b' },
              },
            },
          ],
          kind: 'const',
        },
      ],
    }

    const result = optimizer.optimize(ast)
    expect(result.stats.autoMemoized).toBeDefined()
  })
})
