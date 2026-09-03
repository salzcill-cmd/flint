// Flint Runtime — PWA Support
// Service workers and offline capabilities

// ─── Types ──────────────────────────────────────────────────────

export interface ServiceWorkerConfig {
  /** Service worker file path */
  swPath?: string
  /** Scope */
  scope?: string
  /** Update on reload */
  updateOnReload?: boolean
  /** Offline fallback page */
  offlineFallback?: string
}

export interface CacheConfig {
  /** Cache name */
  name: string
  /** TTL in ms */
  ttl?: number
  /** Max entries */
  maxEntries?: number
  /** Patterns to cache */
  patterns?: string[]
}

// ─── Service Worker Manager ─────────────────────────────────────

export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null
  private config: ServiceWorkerConfig

  constructor(config: ServiceWorkerConfig = {}) {
    this.config = {
      swPath: '/sw.js',
      scope: '/',
      updateOnReload: true,
      ...config,
    }
  }

  /**
   * Register service worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('[Flint PWA] Service workers not supported')
      return null
    }

    try {
      this.registration = await navigator.serviceWorker.register(
        this.config.swPath!,
        { scope: this.config.scope }
      )

      console.log('[Flint PWA] Service worker registered')

      // Handle updates
      if (this.config.updateOnReload) {
        this.registration.addEventListener('updatefound', () => {
          console.log('[Flint PWA] New service worker found')
        })
      }

      return this.registration
    } catch (error) {
      console.error('[Flint PWA] Service worker registration failed:', error)
      return null
    }
  }

  /**
   * Unregister service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) return false

    try {
      const result = await this.registration.unregister()
      console.log('[Flint PWA] Service worker unregistered')
      return result
    } catch (error) {
      console.error('[Flint PWA] Service worker unregistration failed:', error)
      return false
    }
  }

  /**
   * Update service worker
   */
  async update(): Promise<void> {
    if (!this.registration) return

    try {
      await this.registration.update()
      console.log('[Flint PWA] Service worker updated')
    } catch (error) {
      console.error('[Flint PWA] Service worker update failed:', error)
    }
  }

  /**
   * Get service worker registration
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration
  }
}

// ─── Cache Manager ──────────────────────────────────────────────

export class CacheManager {
  private config: CacheConfig

  constructor(config: CacheConfig) {
    this.config = {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxEntries: 100,
      ...config,
    }
  }

  /**
   * Open cache
   */
  async open(): Promise<Cache> {
    return caches.open(this.config.name)
  }

  /**
   * Add to cache
   */
  async add(url: string, response?: Response): Promise<void> {
    const cache = await this.open()

    if (response) {
      await cache.put(url, response)
    } else {
      await cache.add(url)
    }
  }

  /**
   * Get from cache
   */
  async get(url: string): Promise<Response | undefined> {
    const cache = await this.open()
    return cache.match(url)
  }

  /**
   * Delete from cache
   */
  async delete(url: string): Promise<boolean> {
    const cache = await this.open()
    return cache.delete(url)
  }

  /**
   * Clear cache
   */
  async clear(): Promise<void> {
    await caches.delete(this.config.name)
  }

  /**
   * Get cache size
   */
  async getSize(): Promise<number> {
    const cache = await this.open()
    const keys = await cache.keys()
    return keys.length
  }
}

// ─── Offline Detection ──────────────────────────────────────────

export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

export function onOnline(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  window.addEventListener('online', callback)
  return () => window.removeEventListener('online', callback)
}

export function onOffline(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  window.addEventListener('offline', callback)
  return () => window.removeEventListener('offline', callback)
}

// ─── Web App Manifest ───────────────────────────────────────────

export interface ManifestConfig {
  name: string
  short_name: string
  description: string
  start_url: string
  display: string
  background_color: string
  theme_color: string
  icons: {
    src: string
    sizes: string
    type: string
  }[]
}

export function generateManifest(config: ManifestConfig): string {
  return JSON.stringify({
    name: config.name,
    short_name: config.short_name,
    description: config.description,
    start_url: config.start_url,
    display: config.display || 'standalone',
    background_color: config.background_color,
    theme_color: config.theme_color,
    icons: config.icons,
  })
}

export function injectManifest(config: ManifestConfig): void {
  if (typeof document === 'undefined') return

  const manifest = generateManifest(config)
  const blob = new Blob([manifest], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('link')
  link.rel = 'manifest'
  link.href = url
  document.head.appendChild(link)
}

// ─── Singleton Functions ────────────────────────────────────────

let swManager: ServiceWorkerManager | null = null

export function initPWA(config?: ServiceWorkerConfig): {
  serviceWorker: ServiceWorkerManager
  cache: CacheManager
} {
  if (!swManager) {
    swManager = new ServiceWorkerManager(config)
  }
  const cacheConfig: CacheConfig = { name: config?.swPath || 'flint-cache' }
  return {
    serviceWorker: swManager,
    cache: new CacheManager(cacheConfig),
  }
}

export function getPWA(): ServiceWorkerManager | null {
  return swManager
}
