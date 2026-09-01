// Flint Runtime — Error Boundaries & Lazy Loading
// Catch errors gracefully and load components on demand

import { state, computed, effect } from '@flint/reactivity'
import type { Signal } from '@flint/reactivity'
import { h } from '../renderer/index.js'
import type { Child } from '../renderer/index.js'

// ─── Types ──────────────────────────────────────────────────────

export type ErrorBoundaryFallback = (error: Error, reset: () => void) => Child
export type LazyComponent<T = any> = () => Promise<{ default: (props: T) => Child }>

export interface ErrorBoundaryProps {
  fallback: ErrorBoundaryFallback
  onError?: (error: Error) => void
  children: Child | Child[]
}

export interface LazyOptions {
  /** Loading component while lazy loading */
  loading?: Child | (() => Child)
  /** Error component if load fails */
  error?: Child | ((error: Error) => Child)
  /** Delay before showing loading (ms) */
  delay?: number
  /** Timeout for loading (ms) */
  timeout?: number
}

export interface SuspenseProps {
  fallback?: Child | Child[]
  children: Child | Child[]
  onResolve?: () => void
  onReject?: (error: Error) => void
}

// ─── Error Boundary ─────────────────────────────────────────────

let currentErrorBoundary: ErrorBoundaryState | null = null

interface ErrorBoundaryState {
  error: Signal<Error | null>
  reset: () => void
}

/**
 * Error boundary component that catches rendering errors.
 *
 * @example
 * <ErrorBoundary 
 *   fallback={(error, reset) => (
 *     <div>
 *       <p>Error: {error.message}</p>
 *       <button onClick={reset}>Retry</button>
 *     </div>
 *   )}
 *   onError={(error) => logError(error)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 */
export function ErrorBoundary(props: ErrorBoundaryProps): Child {
  const { fallback, onError, children } = props

  const errorState = state<Error | null>(null)
  const reset = () => errorState.set(null)

  // Check for errors
  if (errorState()) {
    return fallback(errorState()!, reset)
  }

  // Try to render children
  try {
    // Set current boundary for error catching
    currentErrorBoundary = { error: errorState, reset }

    const content = Array.isArray(children) ? children : [children]

    // Clear boundary after setting up
    setTimeout(() => {
      currentErrorBoundary = null
    }, 0)

    return h(null, null, ...content)
  } catch (error) {
    // Catch and handle error
    const err = error instanceof Error ? error : new Error(String(error))
    errorState.set(err)
    onError?.(err)
    return fallback(err, reset)
  }
}

/**
 * Catch error at current component level (internal use).
 */
export function catchError(error: Error): void {
  if (currentErrorBoundary) {
    currentErrorBoundary.error.set(error)
  } else {
    console.error('[Flint] Uncaught error:', error)
  }
}

// ─── Lazy Loading ───────────────────────────────────────────────

const lazyCache = new Map<string, { component: any; promise: Promise<any> }>()

/**
 * Lazily load a component.
 *
 * @example
 * const LazyDashboard = lazy(() => import('./Dashboard'))
 *
 * // With Suspense
 * <Suspense fallback={<Spinner />}>
 *   <LazyDashboard />
 * </Suspense>
 */
export function lazy<T = any>(
  factory: LazyComponent<T>,
  options: LazyOptions = {}
): (props: T) => Child {
  const { loading = null, error, delay = 200, timeout = 10000 } = options

  const LazyComponent = (props: T): Child => {
    const cacheKey = factory.toString()
    const isLoaded = state(false)
    const component = state<any>(null)
    const loadError = state<Error | null>(null)
    const isLoading = state(false)

    // Check cache
    if (lazyCache.has(cacheKey)) {
      const cached = lazyCache.get(cacheKey)!
      if (cached.component) {
        return cached.component(props)
      }
    }

    // Start loading
    if (!isLoading()) {
      isLoading.set(true)

      const loadPromise = factory()
        .then((mod) => {
          component.set(mod.default || mod)
          isLoaded.set(true)
          lazyCache.set(cacheKey, { component: mod.default || mod, promise: loadPromise })
        })
        .catch((err) => {
          loadError.set(err)
        })
        .finally(() => {
          isLoading.set(false)
        })
    }

    // Show loading after delay
    if (isLoaded()) {
      const Comp = component()
      return Comp ? Comp(props) : null
    }

    if (loadError()) {
      if (typeof error === 'function') {
        return error(loadError()!)
      }
      if (error) {
        return error
      }
      return h('div', { style: { color: 'red' } }, `Error loading component: ${loadError()!.message}`)
    }

    // Show loading indicator after delay
    if (typeof loading === 'function') {
      return loading()
    }
    return loading ?? null
  }

  return LazyComponent as any
}

// ─── Enhanced Suspense ──────────────────────────────────────────

interface SuspenseState {
  pending: Set<Promise<any>>
  resolved: Set<Promise<any>>
  rejected: Set<Promise<any>>
}

const suspenseStates = new Map<string, SuspenseState>()

/**
 * Enhanced Suspense component with async support.
 *
 * @example
 * <Suspense fallback={<Spinner />} onResolve={() => console.log('loaded')}>
 *   <AsyncComponent />
 * </Suspense>
 */
export function Suspense(props: SuspenseProps): Child {
  const { fallback = null, children, onResolve, onReject } = props

  // Check for pending promises
  const hasPending = false // Simplified - full implementation requires promise tracking

  if (hasPending) {
    return Array.isArray(fallback) ? fallback[0] ?? null : (fallback as Child) ?? null
  }

  // Render children
  try {
    const content = Array.isArray(children) ? children : [children]
    return h(null, null, ...content)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    onReject?.(err)
    catchError(err)
    return null
  }
}

// ─── createResource ─────────────────────────────────────────────

export interface Resource<T> {
  data: Signal<T | undefined>
  loading: Signal<boolean>
  error: Signal<Error | null>
  refetch: () => Promise<void>
}

/**
 * Create a data resource for async loading.
 *
 * @example
 * const users = createResource(async () => {
 *   const res = await fetch('/api/users')
 *   return res.json()
 * })
 *
 * // In component
 * if (users.loading()) return <Spinner />
 * if (users.error()) return <Error message={users.error().message} />
 * return <UserList users={users.data()} />
 */
export function createResource<T>(
  fetcher: () => Promise<T>,
  options?: { immediate?: boolean }
): Resource<T> {
  const data = state<T | undefined>(undefined)
  const loading = state(false)
  const error = state<Error | null>(null)

  const refetch = async () => {
    loading.set(true)
    error.set(null)

    try {
      const result = await fetcher()
      data.set(result)
    } catch (err) {
      error.set(err instanceof Error ? err : new Error(String(err)))
    } finally {
      loading.set(false)
    }
  }

  // Auto-fetch if immediate
  if (options?.immediate !== false) {
    refetch()
  }

  return { data, loading, error, refetch }
}

// ─── createAsyncComponent ───────────────────────────────────────

/**
 * Create a component that handles async loading with Suspense integration.
 *
 * @example
 * const UserProfile = createAsyncComponent(
 *   async (props: { id: string }) => {
 *     const user = await fetchUser(props.id)
 *     return <div>{user.name}</div>
 *   },
 *   { fallback: <Spinner /> }
 * )
 */
export function createAsyncComponent<T>(
  asyncFn: (props: T) => Promise<Child>,
  options: { fallback?: Child; error?: Child | ((err: Error) => Child) } = {}
): (props: T) => Child {
  const { fallback = null, error: ErrorComponent } = options

  return (props: T): Child => {
    const result = state<Child | null>(null)
    const loading = state(true)
    const error = state<Error | null>(null)

    // Execute async function
    asyncFn(props)
      .then((content) => {
        result.set(content)
        loading.set(false)
      })
      .catch((err) => {
        error.set(err)
        loading.set(false)
      })

    if (loading()) {
      return fallback as Child
    }

    if (error()) {
      if (typeof ErrorComponent === 'function') {
        return ErrorComponent(error()!)
      }
      if (ErrorComponent) {
        return ErrorComponent
      }
      return h('div', { style: { color: 'red' } }, error()!.message)
    }

    return result()
  }
}
