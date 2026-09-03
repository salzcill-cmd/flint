import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isOnline,
  onOnline,
  onOffline,
  generateManifest,
  ServiceWorkerManager,
  CacheManager,
} from '../src/pwa/index'

describe('PWA', () => {
  describe('isOnline()', () => {
    it('should return a boolean', () => {
      expect(typeof isOnline()).toBe('boolean')
    })
  })

  describe('onOnline() / onOffline()', () => {
    it('should return unsubscribe functions', () => {
      const unsubOnline = onOnline(() => {})
      const unsubOffline = onOffline(() => {})

      expect(typeof unsubOnline).toBe('function')
      expect(typeof unsubOffline).toBe('function')

      unsubOnline()
      unsubOffline()
    })

    it('should not throw when unsubscribed', () => {
      const unsub = onOnline(() => {})
      expect(() => unsub()).not.toThrow()
    })
  })

  describe('generateManifest()', () => {
    it('should generate valid JSON', () => {
      const manifest = generateManifest({
        name: 'My App',
        short_name: 'App',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
      })

      const parsed = JSON.parse(manifest)
      expect(parsed.name).toBe('My App')
      expect(parsed.short_name).toBe('App')
      expect(parsed.start_url).toBe('/')
      expect(parsed.display).toBe('standalone')
    })

    it('should include icons if provided', () => {
      const manifest = generateManifest({
        name: 'App',
        short_name: 'App',
        start_url: '/',
        display: 'standalone',
        background_color: '#fff',
        theme_color: '#000',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      })

      const parsed = JSON.parse(manifest)
      expect(parsed.icons).toHaveLength(2)
    })

    it('should handle minimal config', () => {
      const manifest = generateManifest({
        name: 'App',
        short_name: 'App',
        start_url: '/',
        display: 'standalone',
        background_color: '#fff',
        theme_color: '#000',
      })

      const parsed = JSON.parse(manifest)
      expect(parsed.name).toBe('App')
      expect(parsed).not.toHaveProperty('icons')
    })
  })

  describe('ServiceWorkerManager', () => {
    it('should create instance', () => {
      const manager = new ServiceWorkerManager({ scope: '/' })
      expect(manager).toBeDefined()
    })

    it('should create instance with default config', () => {
      const manager = new ServiceWorkerManager()
      expect(manager).toBeDefined()
    })

    it('should have register method', () => {
      const manager = new ServiceWorkerManager()
      expect(typeof manager.register).toBe('function')
    })

    it('should have unregister method', () => {
      const manager = new ServiceWorkerManager()
      expect(typeof manager.unregister).toBe('function')
    })
  })

  describe('CacheManager', () => {
    it('should create instance', () => {
      expect(() => new CacheManager({ ttl: 60000, maxEntries: 100, name: 'test-cache' })).not.toThrow()
    })

    it('should create instance with default name', () => {
      expect(() => new CacheManager({ ttl: 60000, maxEntries: 100 })).not.toThrow()
    })
  })
})
