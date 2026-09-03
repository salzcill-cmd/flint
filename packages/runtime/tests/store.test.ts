import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { create as createStore, logger, persist } from '@flint/store'
import { state, computed, effect } from '@flint/reactivity'

describe('Store', () => {
  describe('create', () => {
    it('should create store with initial state', () => {
      const store = createStore(() => ({ count: 0, name: 'Flint' }))
      expect(store.getState()).toEqual({ count: 0, name: 'Flint' })
    })

    it('should get state', () => {
      const store = createStore(() => ({ count: 0 }))
      expect(store.getState().count).toBe(0)
    })

    it('should update state with partial object', () => {
      const store = createStore((set) => ({
        count: 0,
        name: 'Flint',
        increment: () => set({ count: 5 }),
      }))
      store.getState().increment()
      expect(store.getState().count).toBe(5)
      expect(store.getState().name).toBe('Flint')
    })

    it('should update state with function', () => {
      const store = createStore((set) => ({
        count: 0,
        increment: () => set((prev) => ({ count: prev.count + 1 })),
      }))
      store.getState().increment()
      expect(store.getState().count).toBe(1)
    })

    it('should subscribe to changes', () => {
      const store = createStore(() => ({ count: 0 }))
      const listener = vi.fn()

      store.subscribe(listener)
      store.setState({ count: 1 })

      expect(listener).toHaveBeenCalledWith(
        { count: 1 },
        { count: 0 }
      )
    })

    it('should unsubscribe from changes', () => {
      const store = createStore(() => ({ count: 0 }))
      const listener = vi.fn()

      const unsubscribe = store.subscribe(listener)
      unsubscribe()
      store.setState({ count: 1 })

      expect(listener).not.toHaveBeenCalled()
    })

    it('should destroy store', () => {
      const store = createStore(() => ({ count: 0 }))
      store.destroy()
      // After destroy, setState and getState throw
      expect(() => store.getState()).toThrow()
      expect(() => store.setState({ count: 1 })).toThrow()
    })
  })

  describe('Middleware', () => {
    it('should apply logger middleware', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const store = createStore(
        (set) => ({
          count: 0,
          increment: () => set((prev) => ({ count: prev.count + 1 })),
        }),
        [logger()]
      )

      store.getState().increment()

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('signal', () => {
    it('should return a signal from store', () => {
      const store = createStore(() => ({ count: 0 }))
      const sig = store.signal()

      expect(typeof sig).toBe('function')
      expect(sig()).toEqual({ count: 0 })
    })
  })
})
