import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ServiceWorkerManager, CacheManager, initPWA, getPWA, isOnline, onOnline, onOffline } from '../src/pwa/index.js'

describe('PWA', () => {
  describe('ServiceWorkerManager', () => {
    it('should create service worker manager', () => {
      const manager = new ServiceWorkerManager()
      expect(manager).toBeDefined()
    })

    it('should create with custom config', () => {
      const manager = new ServiceWorkerManager({
        swPath: '/custom-sw.js',
        scope: '/app',
      })
      expect(manager).toBeDefined()
    })

    it('should handle registration in non-browser environment', async () => {
      const manager = new ServiceWorkerManager()
      // In test environment (jsdom), serviceWorker might not be available
      const result = await manager.register()
      // Should not throw
      expect(result).toBeDefined()
    })
  })

  describe('CacheManager', () => {
    it('should create cache manager', () => {
      const manager = new CacheManager({
        name: 'test-cache',
        ttl: 60000,
        maxEntries: 100,
      })
      expect(manager).toBeDefined()
    })

    it('should have open method', () => {
      const manager = new CacheManager({
        name: 'test-cache',
      })
      expect(typeof manager.open).toBe('function')
    })

    it('should have add method', () => {
      const manager = new CacheManager({
        name: 'test-cache',
      })
      expect(typeof manager.add).toBe('function')
    })

    it('should have delete method', () => {
      const manager = new CacheManager({
        name: 'test-cache',
      })
      expect(typeof manager.delete).toBe('function')
    })

    it('should have clear method', () => {
      const manager = new CacheManager({
        name: 'test-cache',
      })
      expect(typeof manager.clear).toBe('function')
    })

    it('should have getSize method', () => {
      const manager = new CacheManager({
        name: 'test-cache',
      })
      expect(typeof manager.getSize).toBe('function')
    })
  })

  describe('Online/Offline Detection', () => {
    it('should check online status', () => {
      const online = isOnline()
      expect(typeof online).toBe('boolean')
    })

    it('should register online handler', () => {
      const handler = vi.fn()
      const unsubscribe = onOnline(handler)
      
      expect(typeof unsubscribe).toBe('function')
      unsubscribe()
    })

    it('should register offline handler', () => {
      const handler = vi.fn()
      const unsubscribe = onOffline(handler)
      
      expect(typeof unsubscribe).toBe('function')
      unsubscribe()
    })
  })

  describe('initPWA', () => {
    it('should initialize PWA', () => {
      const pwa = initPWA({
        swPath: '/sw.js',
      })
      
      expect(pwa).toBeDefined()
      expect(pwa.serviceWorker).toBeDefined()
      expect(pwa.cache).toBeDefined()
    })

    it('should get PWA instance', () => {
      const pwa1 = initPWA({ swPath: '/sw.js' })
      const pwa2 = getPWA()
      
      expect(pwa1.serviceWorker).toBe(pwa2)
    })
  })
})
