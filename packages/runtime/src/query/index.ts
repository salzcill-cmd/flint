// Flint Runtime — Query/Data Fetching
// Like TanStack Query for server state management

import { state, computed, effect } from '@flint/reactivity'
import type { Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export type QueryKey = readonly any[]

export interface QueryOptions<T> {
  /** Query function */
  queryFn: () => Promise<T>
  /** Query key for caching */
  queryKey: QueryKey
  /** Enable/disable query */
  enabled?: boolean
  /** Cache time in ms */
  cacheTime?: number
  /** Stale time in ms */
  staleTime?: number
  /** Refetch interval in ms */
  refetchInterval?: number
  /** Refetch on window focus */
  refetchOnWindowFocus?: boolean
  /** Retry count */
  retry?: number
  /** Retry delay in ms */
  retryDelay?: number
  /** On success callback */
  onSuccess?: (data: T) => void
  /** On error callback */
  onError?: (error: Error) => void
}

export interface QueryResult<T> {
  data: Signal<T | undefined>
  error: Signal<Error | null>
  isLoading: Signal<boolean>
  isError: Signal<boolean>
  isSuccess: Signal<boolean>
  isFetching: Signal<boolean>
  refetch: () => Promise<void>
}

export interface MutationOptions<TData, TVariables> {
  /** Mutation function */
  mutationFn: (variables: TVariables) => Promise<TData>
  /** On success callback */
  onSuccess?: (data: TData, variables: TVariables) => void
  /** On error callback */
  onError?: (error: Error, variables: TVariables) => void
  /** On mutate callback */
  onMutate?: (variables: TVariables) => Promise<any>
  /** On settled callback */
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void
}

export interface MutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => void
  data: Signal<TData | undefined>
  error: Signal<Error | null>
  isLoading: Signal<boolean>
  isError: Signal<boolean>
  isSuccess: Signal<boolean>
  reset: () => void
}

// ─── Query Cache ────────────────────────────────────────────────

interface CacheEntry {
  data: any
  timestamp: number
  subscribers: Set<() => void>
}

class QueryCache {
  private cache = new Map<string, CacheEntry>()
  private defaultCacheTime = 5 * 60 * 1000 // 5 minutes

  get(key: string): any | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    // Check if expired
    if (Date.now() - entry.timestamp > this.defaultCacheTime) {
      this.cache.delete(key)
      return undefined
    }

    return entry.data
  }

  set(key: string, data: any): void {
    const existing = this.cache.get(key)
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      subscribers: existing?.subscribers || new Set(),
    }
    this.cache.set(key, entry)

    // Notify subscribers
    entry.subscribers.forEach((cb) => cb())
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  invalidateAll(): void {
    this.cache.clear()
  }

  subscribe(key: string, callback: () => void): () => void {
    const entry = this.cache.get(key)
    if (entry) {
      entry.subscribers.add(callback)
      return () => entry.subscribers.delete(callback)
    }
    return () => {}
  }

  getQueryKey(queryKey: QueryKey): string {
    return JSON.stringify(queryKey)
  }
}

// ─── Query Manager ──────────────────────────────────────────────

let queryManager: QueryManager | null = null

export class QueryManager {
  private cache: QueryCache
  private queries = new Map<string, { options: QueryOptions<any>; result: QueryResult<any> }>()

  constructor() {
    this.cache = new QueryCache()
  }

  /**
   * Use a query
   */
  useQuery<T>(options: QueryOptions<T>): QueryResult<T> {
    const cacheKey = this.cache.getQueryKey(options.queryKey)

    // Check if query already exists
    if (this.queries.has(cacheKey)) {
      return this.queries.get(cacheKey)!.result
    }

    // Create new query
    const data = state<T | undefined>(undefined)
    const error = state<Error | null>(null)
    const isLoading = state(true)
    const isError = state(false)
    const isSuccess = state(false)
    const isFetching = state(true)

    const fetch = async () => {
      if (options.enabled === false) {
        isLoading.set(false)
        isFetching.set(false)
        return
      }

      isFetching.set(true)

      // Check cache first
      const cached = this.cache.get(cacheKey)
      if (cached !== undefined) {
        data.set(cached)
        isLoading.set(false)
        isFetching.set(false)
        isSuccess.set(true)
        return
      }

      try {
        const result = await options.queryFn()
        data.set(result)
        this.cache.set(cacheKey, result)
        isSuccess.set(true)
        options.onSuccess?.(result)
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err))
        error.set(e)
        isError.set(true)
        options.onError?.(e)
      } finally {
        isLoading.set(false)
        isFetching.set(false)
      }
    }

    // Initial fetch
    fetch()

    // Refetch interval
    if (options.refetchInterval) {
      setInterval(fetch, options.refetchInterval)
    }

    const refetch = async () => {
      // Invalidate cache to force re-fetch
      this.cache.invalidate(cacheKey)
      await fetch()
    }

    const result: QueryResult<T> = {
      data,
      error,
      isLoading,
      isError,
      isSuccess,
      isFetching,
      refetch,
    }

    this.queries.set(cacheKey, { options, result })
    return result
  }

  /**
   * Invalidate a query
   */
  invalidate(queryKey: QueryKey): void {
    const cacheKey = this.cache.getQueryKey(queryKey)
    this.cache.invalidate(cacheKey)
    this.queries.delete(cacheKey)
  }

  /**
   * Invalidate all queries
   */
  invalidateAll(): void {
    this.cache.invalidateAll()
    this.queries.clear()
  }

  /**
   * Get cached data
   */
  getCached<T>(queryKey: QueryKey): T | undefined {
    const cacheKey = this.cache.getQueryKey(queryKey)
    return this.cache.get(cacheKey)
  }
}

// ─── Mutation Manager ───────────────────────────────────────────

export class MutationManager {
  /**
   * Use a mutation
   */
  useMutation<TData, TVariables>(
    options: MutationOptions<TData, TVariables>
  ): MutationResult<TData, TVariables> {
    const data = state<TData | undefined>(undefined)
    const error = state<Error | null>(null)
    const isLoading = state(false)
    const isError = state(false)
    const isSuccess = state(false)

    const mutate = async (variables: TVariables) => {
      isLoading.set(true)
      isError.set(false)
      isSuccess.set(false)
      error.set(null)

      try {
        const result = await options.mutationFn(variables)
        data.set(result)
        isSuccess.set(true)
        options.onSuccess?.(result, variables)
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err))
        error.set(e)
        isError.set(true)
        options.onError?.(e, variables)
      } finally {
        isLoading.set(false)
        options.onSettled?.(data(), error(), variables)
      }
    }

    const reset = () => {
      data.set(undefined)
      error.set(null)
      isLoading.set(false)
      isError.set(false)
      isSuccess.set(false)
    }

    return {
      mutate,
      data,
      error,
      isLoading,
      isError,
      isSuccess,
      reset,
    }
  }
}

// ─── Singleton Functions ────────────────────────────────────────

export function createQueryManager(): QueryManager {
  if (!queryManager) {
    queryManager = new QueryManager()
  }
  return queryManager
}

export function getQueryManager(): QueryManager | null {
  return queryManager
}

/**
 * Use a query (convenience function)
 */
export function useQuery<T>(options: QueryOptions<T>): QueryResult<T> {
  return createQueryManager().useQuery(options)
}

/**
 * Use a mutation (convenience function)
 */
export function useMutation<TData, TVariables>(
  options: MutationOptions<TData, TVariables>
): MutationResult<TData, TVariables> {
  return new MutationManager().useMutation(options)
}

/**
 * Invalidate queries
 */
export function invalidateQueries(queryKey: QueryKey): void {
  queryManager?.invalidate(queryKey)
}

/**
 * Get cached data
 */
export function getQueryData<T>(queryKey: QueryKey): T | undefined {
  return queryManager?.getCached<T>(queryKey)
}
