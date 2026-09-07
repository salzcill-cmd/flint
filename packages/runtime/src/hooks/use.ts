// Flint Runtime — use() Hook v4
// Simplified promise and context handling in render

import { state, computed, effect } from '@flint/reactivity'
import type { Signal, Computed } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export interface UseResult<T> {
  (): T
  loading: Computed<boolean>
  error: Computed<Error | null>
  data: Computed<T | undefined>
}

export interface UseContextResult<T> {
  (): T
}

// ─── use() — Promise Hook ───────────────────────────────────────

/**
 * Use a promise in render with automatic loading/error handling.
 *
 * @example
 * const user = use(fetchUser(id))
 *
 * // In JSX:
 * <When condition={user.loading()}>
 *   <Spinner />
 * </When>
 * <When condition={user.error()}>
 *   <Alert type="error">{user.error().message}</Alert>
 * </When>
 * <When condition={user.data()}>
 *   <div>{user.data().name}</div>
 * </When>
 */
function usePromise<T>(promise: Promise<T>): UseResult<T> {
  const data = state<T | undefined>(undefined)
  const error = state<Error | null>(null)
  const loading = state(true)

  promise
    .then((result) => {
      data.set(result)
      loading.set(false)
    })
    .catch((err) => {
      error.set(err instanceof Error ? err : new Error(String(err)))
      loading.set(false)
    })

  const result = (() => data()) as UseResult<T>
  result.loading = computed(() => loading())
  result.error = computed(() => error())
  result.data = computed(() => data())

  return result
}

// ─── use() — Signal Hook ────────────────────────────────────────

/**
 * Use a signal directly (identity function).
 *
 * @example
 * const count = state(0)
 * const c = use(count)
 * c()  // Same as count()
 */
function useSignal<T>(signal: Signal<T>): Signal<T> {
  return signal
}

// ─── use() — Context Hook ───────────────────────────────────────

/**
 * Use a context value directly.
 *
 * @example
 * const theme = createContext('light')
 *
 * function MyComponent() {
 *   const value = use(theme)
 *   return <div>{value}</div>
 * }
 */
function useContext<T>(context: { _defaultValue?: T; _value?: T }): T {
  if (context._value !== undefined) {
    return context._value
  }
  if (context._defaultValue !== undefined) {
    return context._defaultValue
  }
  throw new Error('use() requires a valid context or promise')
}

/**
 * Use a promise, signal, or context value.
 *
 * @example
 * // With promise
 * const user = use(fetchUser(id))
 *
 * // With signal
 * const count = state(0)
 * const c = use(count)
 *
 * // With context
 * const value = use(theme)
 */
export function use<T>(promise: Promise<T>): UseResult<T>
export function use<T>(signal: Signal<T>): Signal<T>
export function use<T>(context: { _defaultValue?: T; _value?: T }): T
export function use<T>(value: Promise<T> | Signal<T> | { _defaultValue?: T; _value?: T }): UseResult<T> | Signal<T> | T {
  if (typeof value === 'function' && '_flint_signal' in value) {
    return useSignal(value as Signal<T>)
  }
  if (typeof value === 'object' && value !== null && ('_defaultValue' in value || '_value' in value)) {
    return useContext(value as { _defaultValue?: T; _value?: T })
  }
  return usePromise(value as Promise<T>)
}

// ─── useAsync() — Async Data Fetching ───────────────────────────

/**
 * Simplified async data fetching with caching.
 *
 * @example
 * const user = useAsync(() => fetchUser(userId))
 *
 * // Auto-refetch when userId changes
 * const user = useAsync(() => fetchUser(userId), { key: () => userId })
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  options?: {
    key?: () => string | number
    immediate?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  }
): UseResult<T> {
  const data = state<T | undefined>(undefined)
  const error = state<Error | null>(null)
  const loading = state(false)

  const execute = async () => {
    loading.set(true)
    error.set(null)

    try {
      const result = await fetcher()
      data.set(result)
      options?.onSuccess?.(result)
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      error.set(e)
      options?.onError?.(e)
    } finally {
      loading.set(false)
    }
  }

  // Auto-fetch on mount if immediate is true (default)
  if (options?.immediate !== false) {
    execute()
  }

  // Re-fetch when key changes
  if (options?.key) {
    const keyEffect = computed(() => options.key!())
    effect(() => {
      keyEffect() // Track the key
      execute()
    })
  }

  const result = (() => data()) as UseResult<T>
  result.loading = computed(() => loading())
  result.error = computed(() => error())
  result.data = computed(() => data())

  // Add refetch method
  ;(result as any).refetch = execute

  return result
}

// ─── useDebounce() — Debounced Value ────────────────────────────

/**
 * Debounce a value.
 *
 * @example
 * const search = state('')
 * const debouncedSearch = useDebounce(search(), 300)
 *
 * // Auto-refetch when debounced value changes
 */
export function useDebounce<T>(value: T, delay: number): Computed<T> {
  const debounced = state(value)
  let timeoutId: ReturnType<typeof setTimeout>

  effect(() => {
    const current = value
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      debounced.set(current)
    }, delay)
  })

  return computed(() => debounced())
}

// ─── useThrottle() — Throttled Value ────────────────────────────

/**
 * Throttle a value.
 *
 * @example
 * const scrollPosition = useThrottle(window.scrollY, 100)
 */
export function useThrottle<T>(value: T, limit: number): Computed<T> {
  const throttled = state(value)
  let lastUpdate = 0

  effect(() => {
    const now = Date.now()
    if (now - lastUpdate >= limit) {
      throttled.set(value)
      lastUpdate = now
    }
  })

  return computed(() => throttled())
}

// ─── usePrevious() — Previous Value ─────────────────────────────

/**
 * Get the previous value.
 *
 * @example
 * const count = state(0)
 * const prevCount = usePrevious(count())
 *
 * count.set(5)
 * prevCount()  // 0
 */
export function usePrevious<T>(value: T): Computed<T | undefined> {
  const previous = state<T | undefined>(undefined)
  const current = state(value)

  effect(() => {
    const newVal = value
    previous.set(current())
    current.set(newVal)
  })

  return computed(() => previous())
}

// ─── useToggle() — Boolean Toggle ───────────────────────────────

/**
 * Toggle a boolean value.
 *
 * @example
 * const [isOpen, toggle] = useToggle(false)
 *
 * <button onClick={toggle}>Toggle</button>
 */
export function useToggle(initial = false): [Computed<boolean>, () => void] {
  const value = state(initial)

  const toggle = () => value.set(!value())

  return [computed(() => value()), toggle]
}

// ─── useCounter() — Counter ─────────────────────────────────────

/**
 * Counter with increment/decrement.
 *
 * @example
 * const [count, { increment, decrement, reset }] = useCounter(0)
 *
 * <button onClick={increment}>+</button>
 * <button onClick={decrement}>-</button>
 * <span>{count()}</span>
 */
export function useCounter(initial = 0) {
  const value = state(initial)

  const increment = (by = 1) => value.set(value() + by)
  const decrement = (by = 1) => value.set(value() - by)
  const reset = () => value.set(initial)

  return [
    computed(() => value()),
    { increment, decrement, reset, set: value.set },
  ]
}

// ─── useLocalStorage() — Persistent State ───────────────────────

/**
 * State that persists to localStorage.
 *
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'light')
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [Computed<T>, (value: T | ((prev: T) => T)) => void] {
  const stored = (() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })()

  const value = state<T>(stored)

  const setValue = (newValue: T | ((prev: T) => T)) => {
    const resolved = typeof newValue === 'function'
      ? (newValue as (prev: T) => T)(value())
      : newValue
    value.set(resolved)
    try {
      localStorage.setItem(key, JSON.stringify(resolved))
    } catch {
      // Ignore storage errors
    }
  }

  return [computed(() => value()), setValue]
}

// ─── useMediaQuery() — Responsive Design ────────────────────────

/**
 * React to media queries.
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)')
 */
export function useMediaQuery(query: string): Computed<boolean> {
  const matches = state(false)

  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia(query)
    matches.set(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => matches.set(e.matches)
    mediaQuery.addEventListener('change', handler)

    // Cleanup on unmount (simplified)
    effect(() => {
      return () => mediaQuery.removeEventListener('change', handler)
    })
  }

  return computed(() => matches())
}

// ─── useOnline() — Network Status ───────────────────────────────

/**
 * Track online/offline status.
 *
 * @example
 * const isOnline = useOnline()
 */
export function useOnline(): Computed<boolean> {
  const online = state(navigator?.onLine ?? true)

  if (typeof window !== 'undefined') {
    const handleOnline = () => online.set(true)
    const handleOffline = () => online.set(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    effect(() => {
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    })
  }

  return computed(() => online())
}

// ─── useDarkMode() — Dark Mode Detection ────────────────────────

/**
 * Detect user's preferred color scheme.
 *
 * @example
 * const isDark = useDarkMode()
 */
export function useDarkMode(): Computed<boolean> {
  const dark = state(false)

  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    dark.set(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => dark.set(e.matches)
    mediaQuery.addEventListener('change', handler)

    effect(() => {
      return () => mediaQuery.removeEventListener('change', handler)
    })
  }

  return computed(() => dark())
}
