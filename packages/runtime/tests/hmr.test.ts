import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isHMR,
  acceptHMR,
  onHMRDispose,
  triggerHMRUpdate,
  runHMRDisposers,
  initHMR,
} from '../src/hmr/index'

describe('HMR', () => {
  beforeEach(() => {
    // Reset HMR state by triggering cleanup
    vi.restoreAllMocks()
  })

  describe('isHMR()', () => {
    it('should return false when import.meta.hot is not defined', () => {
      expect(isHMR()).toBe(false)
    })
  })

  describe('acceptHMR()', () => {
    it('should return an unsubscribe function', () => {
      const unsub = acceptHMR('module-1', () => {})
      expect(typeof unsub).toBe('function')
      unsub()
    })

    it('should register callback for module updates', () => {
      const callback = vi.fn()
      const unsub = acceptHMR('module-1', callback)

      const update = {
        type: 'update' as const,
        moduleId: 'module-1',
        acceptedBy: 'module-1',
        timestamp: Date.now(),
      }
      triggerHMRUpdate(update)

      expect(callback).toHaveBeenCalledWith(update)
      unsub()
    })

    it('should not call callback for different module', () => {
      const callback = vi.fn()
      const unsub = acceptHMR('module-1', callback)

      const update = {
        type: 'update' as const,
        moduleId: 'module-2',
        acceptedBy: 'module-2',
        timestamp: Date.now(),
      }
      triggerHMRUpdate(update)

      expect(callback).not.toHaveBeenCalled()
      unsub()
    })

    it('should support wildcard listener', () => {
      const callback = vi.fn()
      const unsub = acceptHMR('*', callback)

      const update = {
        type: 'create' as const,
        moduleId: 'any-module',
        acceptedBy: 'any-module',
        timestamp: Date.now(),
      }
      triggerHMRUpdate(update)

      expect(callback).toHaveBeenCalledWith(update)
      unsub()
    })

    it('should unsubscribe correctly', () => {
      const callback = vi.fn()
      const unsub = acceptHMR('module-1', callback)
      unsub()

      const update = {
        type: 'update' as const,
        moduleId: 'module-1',
        acceptedBy: 'module-1',
        timestamp: Date.now(),
      }
      triggerHMRUpdate(update)

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('onHMRDispose()', () => {
    it('should return an unsubscribe function', () => {
      const unsub = onHMRDispose('module-1', () => {})
      expect(typeof unsub).toBe('function')
      unsub()
    })

    it('should register disposal callback', () => {
      const callback = vi.fn()
      onHMRDispose('module-1', callback)

      runHMRDisposers('module-1')
      expect(callback).toHaveBeenCalled()
    })

    it('should not call callback for different module', () => {
      const callback = vi.fn()
      onHMRDispose('module-1', callback)

      runHMRDisposers('module-2')
      expect(callback).not.toHaveBeenCalled()
    })

    it('should unsubscribe correctly', () => {
      const callback = vi.fn()
      const unsub = onHMRDispose('module-1', callback)
      unsub()

      runHMRDisposers('module-1')
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('runHMRDisposers()', () => {
    it('should run all disposal handlers for module', () => {
      const cb1 = vi.fn()
      const cb2 = vi.fn()
      onHMRDispose('module-1', cb1)
      onHMRDispose('module-1', cb2)

      runHMRDisposers('module-1')

      expect(cb1).toHaveBeenCalled()
      expect(cb2).toHaveBeenCalled()
    })

    it('should not throw for non-existent module', () => {
      expect(() => runHMRDisposers('non-existent')).not.toThrow()
    })

    it('should clear handlers after running', () => {
      const callback = vi.fn()
      onHMRDispose('module-1', callback)

      runHMRDisposers('module-1')
      runHMRDisposers('module-1')

      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('triggerHMRUpdate()', () => {
    it('should trigger callbacks for matching module', () => {
      const cb1 = vi.fn()
      const cb2 = vi.fn()
      acceptHMR('module-1', cb1)
      acceptHMR('module-2', cb2)

      triggerHMRUpdate({
        type: 'update',
        moduleId: 'module-1',
        acceptedBy: 'module-1',
        timestamp: Date.now(),
      })

      expect(cb1).toHaveBeenCalled()
      expect(cb2).not.toHaveBeenCalled()
    })

    it('should trigger wildcard callbacks', () => {
      const cb = vi.fn()
      acceptHMR('*', cb)

      triggerHMRUpdate({
        type: 'create',
        moduleId: 'any',
        acceptedBy: 'any',
        timestamp: Date.now(),
      })

      expect(cb).toHaveBeenCalled()
    })
  })

  describe('initHMR()', () => {
    it('should not throw when called', () => {
      expect(() => initHMR(null)).not.toThrow()
    })
  })
})
