// Flint Router v3 — Code Splitting & Lazy Routes
// Automatic route-based code splitting with dynamic imports

import { state, computed } from '@flint/reactivity'
import type { Signal } from '@flint/reactivity'
import { h } from '../renderer/index.js'
import type { Child } from '../renderer/index.js'
import { Suspense } from '../components/index.js'

// ─── Types ──────────────────────────────────────────────────────

export type LazyRouteLoader = () => Promise<{ default: () => Child }>

export interface LazyRouteConfig {
  path: string
  loader: LazyRouteLoader
  name?: string
  meta?: Record<string, any>
  children?: LazyRouteConfig[]
  /** Preload strategy */
  preload?: 'hover' | 'viewport' | 'idle' | 'none'
  /** Loading component */
  loading?: Child | (() => Child)
  /** Error component */
  error?: Child | ((error: Error) => Child)
}

export interface PreloadOptions {
  /** Preload on hover */
  onHover?: boolean
  /** Preload when in viewport */
  onViewport?: boolean
  /** Preload when idle */
  onIdle?: boolean
}

// ─── Lazy Route Cache ───────────────────────────────────────────

const routeCache = new Map<string, { component: any; promise: Promise<any> }>()
const preloadQueue = new Set<Promise<any>>()

// ─── Lazy Route Component ───────────────────────────────────────

export function createLazyRoute(config: LazyRouteConfig): {
  component: (props?: any) => Child
  preload: () => Promise<void>
} {
  const {
    loader,
    loading = null,
    error,
    preload: preloadStrategy = 'hover',
  } = config

  const isLoaded = state(false)
  const component = state<any>(null)
  const loadError = state<Error | null>(null)
  const isLoading = state(false)

  const loadComponent = async () => {
    const cacheKey = loader.toString()

    // Check cache
    if (routeCache.has(cacheKey)) {
      const cached = routeCache.get(cacheKey)!
      component.set(cached.component)
      isLoaded.set(true)
      return cached.component
    }

    isLoading.set(true)
    loadError.set(null)

    try {
      const mod = await loader()
      const comp = mod.default || mod
      component.set(comp)
      isLoaded.set(true)
      routeCache.set(cacheKey, { component: comp, promise: Promise.resolve() })
      return comp
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      loadError.set(error)
      throw error
    } finally {
      isLoading.set(false)
    }
  }

  const preload = async () => {
    if (!isLoaded() && !isLoading()) {
      await loadComponent()
    }
  }

  // Auto preload based on strategy
  if (preloadStrategy === 'idle') {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => preload())
    } else {
      setTimeout(() => preload(), 0)
    }
  }

  const LazyComponent = (props?: any): Child => {
    // Load on first render if not preloaded
    if (!isLoaded() && !isLoading()) {
      loadComponent().catch(() => {})
    }

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
      return h(
        'div',
        { style: { color: 'red', padding: '20px' } },
        `Error loading route: ${loadError()!.message}`
      )
    }

    // Show loading state
    if (typeof loading === 'function') {
      return loading()
    }
    return loading ?? h('div', null, 'Loading...')
  }

  return { component: LazyComponent, preload }
}

// ─── Route Preloader ────────────────────────────────────────────

export class RoutePreloader {
  private routes = new Map<string, { preload: () => Promise<void>; strategy: string }>()
  private observer: IntersectionObserver | null = null

  constructor(options: PreloadOptions = {}) {
    if (options.onViewport && typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const path = entry.target.getAttribute('data-preload-path')
              if (path) {
                this.preload(path)
              }
            }
          })
        },
        { rootMargin: '200px' }
      )
    }
  }

  register(path: string, preload: () => Promise<void>, strategy = 'hover'): void {
    this.routes.set(path, { preload, strategy })
  }

  async preload(path: string): Promise<void> {
    const route = this.routes.get(path)
    if (route) {
      await route.preload()
    }
  }

  observe(element: HTMLElement, path: string): void {
    if (this.observer) {
      element.setAttribute('data-preload-path', path)
      this.observer.observe(element)
    }
  }

  disconnect(): void {
    this.observer?.disconnect()
  }
}

// ─── Singleton Preloader ────────────────────────────────────────

let globalPreloader: RoutePreloader | null = null

export function getRoutePreloader(): RoutePreloader {
  if (!globalPreloader) {
    globalPreloader = new RoutePreloader({ onViewport: true })
  }
  return globalPreloader
}

// ─── Code Splitting Hints ───────────────────────────────────────

export interface SplitPoint {
  id: string
  name: string
  size: number
  chunks: string[]
}

/**
 * Mark a split point for the bundler
 */
export function defineSplitPoint(id: string): void {
  // This is a hint for the Vite plugin
  if (typeof __SPLIT_POINT__ !== 'undefined') {
    __SPLIT_POINT__(id)
  }
}

// Vite-specific HMR interface
declare const __SPLIT_POINT__: ((id: string) => void) | undefined
