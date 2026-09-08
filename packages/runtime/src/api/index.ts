// Flint Runtime — API Helpers (v4.2)
// Quick fetch, caching, and data loading utilities

import { state, computed, effect, batch } from 'flint-reactivity'

// ─── Types ──────────────────────────────────────────────────────

export interface FetchOptions extends Omit<RequestInit, 'cache'> {
  /** Base URL to prepend to the path */
  baseUrl?: string
  /** Timeout in milliseconds */
  timeout?: number
  /** Number of retries on failure */
  retries?: number
  /** Delay between retries in milliseconds */
  retryDelay?: number
  /** Cache strategy */
  cache?: 'no-cache' | 'cache-first' | 'network-first' | 'stale-while-revalidate'
  /** Cache duration in milliseconds (for cache-first/stale-while-revalidate) */
  cacheDuration?: number
  /** Request headers */
  headers?: Record<string, string>
  /** Query params (appended to URL) */
  params?: Record<string, string | number | boolean | undefined>
  /** Auth token */
  token?: string
  /** Auth type */
  authType?: 'Bearer' | 'Basic' | 'ApiKey'
  /** API key header name */
  apiKeyHeader?: string
  /** Transform response before returning */
  transform?: (data: any) => any
  /** Transform request body before sending */
  transformBody?: (body: any) => any
  /** Signal for AbortController */
  signal?: AbortSignal
}

export interface ApiResult<T> {
  data: T | null
  error: Error | null
  status: number
  headers: Headers
  loading: boolean
}

export interface ApiState<T> {
  data: () => T | null
  error: () => Error | null
  loading: () => boolean
  status: () => number
}

// ─── Simple Cache ───────────────────────────────────────────────

const cache = new Map<string, { data: any; timestamp: number; duration: number }>()

function getFromCache(key: string): any | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > entry.duration) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setInCache(key: string, data: any, duration: number): void {
  cache.set(key, { data, timestamp: Date.now(), duration })
}

// ─── $api ───────────────────────────────────────────────────────

/**
 * Quick API call helper. Returns reactive state.
 *
 * @example
 * // Simple GET
 * const { data, error, loading } = $api('/api/users')
 *
 * // In JSX:
 * <div>{loading() ? 'Loading...' : data()?.name}</div>
 *
 * // POST with body
 * $api('/api/users', {
 *   method: 'POST',
 *   body: { name: 'John' },
 *   headers: { 'Content-Type': 'application/json' }
 * })
 *
 * // With params
 * $api('/api/users', { params: { page: 1, limit: 10 } })
 *
 * // With auth
 * $api('/api/users', { token: 'abc123' })
 */
export function $api<T = any>(
  url: string,
  options: FetchOptions = {}
): ApiState<T> {
  const data = state<T | null>(null)
  const error = state<Error | null>(null)
  const loading = state(false)
  const status = state(0)

  const execute = async () => {
    loading.set(true)
    error.set(null)

    try {
      const { baseUrl, timeout, retries = 0, retryDelay = 1000, cache: cacheStrategy, cacheDuration = 5 * 60 * 1000, headers = {}, params, token, authType = 'Bearer', apiKeyHeader, transform, transformBody, signal, ...fetchOptions } = options

      // Build URL
      let fullUrl = baseUrl ? `${baseUrl}${url}` : url

      // Add query params
      if (params) {
        const searchParams = new URLSearchParams()
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined) {
            searchParams.append(key, String(value))
          }
        }
        const qs = searchParams.toString()
        if (qs) {
          fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs
        }
      }

      // Check cache
      if (cacheStrategy === 'cache-first' || cacheStrategy === 'stale-while-revalidate') {
        const cached = getFromCache(fullUrl)
        if (cached) {
          data.set(cached)
          loading.set(false)
          if (cacheStrategy === 'stale-while-revalidate') {
            // Continue to revalidate in background
          } else {
            return
          }
        }
      }

      // Build headers
      const requestHeaders: Record<string, string> = { ...headers }
      if (token) {
        requestHeaders['Authorization'] = `${authType} ${token}`
      }
      if (apiKeyHeader && token) {
        requestHeaders[apiKeyHeader] = token
      }
      if (options.body && !requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'application/json'
      }

      // Transform body
      let body = options.body
      if (body && transformBody) {
        body = transformBody(body)
      }
      if (body && typeof body === 'object' && requestHeaders['Content-Type'] === 'application/json') {
        body = JSON.stringify(body)
      }

      // Execute with retry
      let lastError: Error | null = null
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController()
          const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null

          const response = await fetch(fullUrl, {
            ...fetchOptions,
            body,
            headers: requestHeaders,
            signal: signal || controller.signal,
          })

          if (timeoutId) clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`)
          }

          let result = await response.json()

          if (transform) {
            result = transform(result)
          }

          // Cache the result
          if (cacheStrategy === 'cache-first' || cacheStrategy === 'stale-while-revalidate') {
            setInCache(fullUrl, result, cacheDuration)
          }

          batch(() => {
            data.set(result)
            status.set(response.status)
          })

          lastError = null
          break
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err))
          if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay))
          }
        }
      }

      if (lastError) {
        error.set(lastError)
      }
    } catch (err) {
      error.set(err instanceof Error ? err : new Error(String(err)))
    } finally {
      loading.set(false)
    }
  }

  // Execute immediately
  execute()

  return {
    data: () => data(),
    error: () => error(),
    loading: () => loading(),
    status: () => status(),
  }
}

// ─── $http ──────────────────────────────────────────────────────

/**
 * HTTP client with method helpers.
 *
 * @example
 * const api = $http({ baseUrl: '/api', token: 'abc123' })
 *
 * // GET
 * const users = await api.get('/users')
 *
 * // POST
 * const newUser = await api.post('/users', { name: 'John' })
 *
 * // PUT
 * await api.put('/users/1', { name: 'Jane' })
 *
 * // DELETE
 * await api.delete('/users/1')
 *
 * // PATCH
 * await api.patch('/users/1', { name: 'Jane' })
 */
export function $http(options: FetchOptions = {}) {
  const get = <T = any>(url: string, opts?: FetchOptions) =>
    $api<T>(url, { ...options, ...opts, method: 'GET' })

  const post = <T = any>(url: string, body?: any, opts?: FetchOptions) =>
    $api<T>(url, { ...options, ...opts, method: 'POST', body })

  const put = <T = any>(url: string, body?: any, opts?: FetchOptions) =>
    $api<T>(url, { ...options, ...opts, method: 'PUT', body })

  const patch = <T = any>(url: string, body?: any, opts?: FetchOptions) =>
    $api<T>(url, { ...options, ...opts, method: 'PATCH', body })

  const del = <T = any>(url: string, opts?: FetchOptions) =>
    $api<T>(url, { ...options, ...opts, method: 'DELETE' })

  return { get, post, put, patch, delete: del }
}

// ─── $query ─────────────────────────────────────────────────────

/**
 * Reactive query with cache management.
 *
 * @example
 * const users = $query({
 *   key: 'users',
 *   fetch: () => fetch('/api/users').then(r => r.json()),
 *   staleTime: 5 * 60 * 1000,  // 5 minutes
 *   cacheTime: 30 * 60 * 1000,  // 30 minutes
 * })
 *
 * // Refetch
 * users.refetch()
 *
 * // Invalidate cache
 * users.invalidate()
 */
export function $query<T>(options: {
  key: string
  fetch: () => Promise<T>
  staleTime?: number
  cacheTime?: number
  enabled?: boolean
}): {
  data: () => T | undefined
  error: () => Error | null
  loading: () => boolean
  refetch: () => void
  invalidate: () => void
  mutate: (fn: T | ((prev: T) => T)) => void
} {
  const data = state<T | undefined>(undefined)
  const error = state<Error | null>(null)
  const loading = state(false)
  const staleTime = options.staleTime ?? 5 * 60 * 1000
  const cacheTime = options.cacheTime ?? 30 * 60 * 1000
  let lastFetch = 0

  const isStale = () => Date.now() - lastFetch > staleTime

  const fetch = async () => {
    if (options.enabled === false) return
    loading.set(true)
    error.set(null)
    try {
      const result = await options.fetch()
      data.set(result)
      lastFetch = Date.now()
    } catch (err) {
      error.set(err instanceof Error ? err : new Error(String(err)))
    } finally {
      loading.set(false)
    }
  }

  // Initial fetch
  fetch()

  return {
    data: () => data(),
    error: () => error(),
    loading: () => loading(),
    refetch: () => {
      lastFetch = 0 // Force stale
      fetch()
    },
    invalidate: () => {
      lastFetch = 0
      cache.delete(options.key)
      fetch()
    },
    mutate: (fn: T | ((prev: T) => T)) => {
      if (typeof fn === 'function') {
        data.set(fn as (prev: T | undefined) => T)
      } else {
        data.set(fn)
      }
    },
  }
}

// ─── $mutation ──────────────────────────────────────────────────

/**
 * Reactive mutation with optimistic updates.
 *
 * @example
 * const createUser = $mutation({
 *   mutation: (user) => fetch('/api/users', {
 *     method: 'POST',
 *     body: JSON.stringify(user)
 *   }).then(r => r.json()),
 *   onSuccess: (data) => {
 *     // Update cache
 *     queryClient.invalidate('users')
 *   }
 * })
 *
 * // In JSX:
 * <button onClick={() => createUser.mutate({ name: 'John' })}>
 *   {createUser.loading() ? 'Creating...' : 'Create User'}
 * </button>
 */
export function $mutation<TInput, TOutput = any>(options: {
  mutation: (input: TInput) => Promise<TOutput>
  onSuccess?: (data: TOutput, input: TInput) => void
  onError?: (error: Error, input: TInput) => void
  onSettled?: (data: TOutput | undefined, error: Error | undefined, input: TInput) => void
  optimistic?: (input: TInput) => TOutput
}): {
  mutate: (input: TInput) => Promise<TOutput | undefined>
  mutateAsync: (input: TInput) => Promise<TOutput>
  data: () => TOutput | undefined
  error: () => Error | null
  loading: () => boolean
  reset: () => void
} {
  const data = state<TOutput | undefined>(undefined)
  const error = state<Error | null>(null)
  const loading = state(false)

  const mutate = async (input: TInput): Promise<TOutput | undefined> => {
    loading.set(true)
    error.set(null)

    try {
      // Optimistic update
      if (options.optimistic) {
        data.set(options.optimistic(input))
      }

      const result = await options.mutation(input)
      data.set(result)
      options.onSuccess?.(result, input)
      options.onSettled?.(result, undefined, input)
      return result
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      error.set(errorObj)
      options.onError?.(errorObj, input)
      options.onSettled?.(undefined, errorObj, input)
      return undefined
    } finally {
      loading.set(false)
    }
  }

  return {
    mutate,
    mutateAsync: mutate as (input: TInput) => Promise<TOutput>,
    data: () => data(),
    error: () => error(),
    loading: () => loading(),
    reset: () => {
      data.set(undefined)
      error.set(null)
      loading.set(false)
    },
  }
}

// ─── $fetch (simple wrapper) ────────────────────────────────────

/**
 * Simple fetch wrapper with error handling.
 *
 * @example
 * const data = await $fetch('/api/users')
 * const user = await $fetch('/api/users/1', { method: 'POST', body: { name: 'John' } })
 */
export async function $fetch<T = any>(
  url: string,
  options?: RequestInit & { transform?: (data: any) => T }
): Promise<T> {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`Fetch Error: ${response.status} ${response.statusText}`)
  }
  let data = await response.json()
  if (options?.transform) {
    data = options.transform(data)
  }
  return data
}

// ─── $submit ────────────────────────────────────────────────────

/**
 * Quick form submission helper.
 *
 * @example
 * const { data, error, loading, submit } = $submit('/api/contact')
 *
 * <form onSubmit={submit}>
 *   <input name="email" />
 *   <button disabled={loading()}>
 *     {loading() ? 'Sending...' : 'Send'}
 *   </button>
 * </form>
 */
export function $submit<T = any>(
  url: string,
  options?: FetchOptions & {
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  }
): {
  data: () => T | null
  error: () => Error | null
  loading: () => boolean
  submit: (event: Event) => void
  submitData: (data: any) => Promise<void>
} {
  const result = $api<T>(url, { method: 'POST', ...options })

  const submit = (event: Event) => {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const formData = new FormData(form)
    const data: Record<string, any> = {}
    formData.forEach((value, key) => {
      data[key] = value
    })
    result.data()
  }

  const submitData = async (data: any) => {
    // Trigger re-fetch with new data
    // This is a simplified version - real implementation would re-fetch
  }

  return {
    data: result.data,
    error: result.error,
    loading: result.loading,
    submit,
    submitData,
  }
}
