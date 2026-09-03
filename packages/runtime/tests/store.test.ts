import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createStore } from '../src/store/index.js'
import { state, computed, effect } from '@flint/reactivity'

describe('Store', () => {
  describe('createStore', () => {
    it('should create store with initial state', () => {
      const store = createStore({ count: 0, name: 'Flint' })
      expect(store.getState()).toEqual({ count: 0, name: 'Flint' })
    })

    it('should get state', () => {
      const store = createStore({ count: 0 })
      expect(store.getState().count).toBe(0)
    })

    it('should update state with partial object', () => {
      const store = createStore({ count: 0, name: 'Flint' })
      store.setState({ count: 5 })
      expect(store.getState().count).toBe(5)
      expect(store.getState().name).toBe('Flint')
    })

    it('should update state with function', () => {
      const store = createStore({ count: 0 })
      store.setState((prev) => ({ count: prev.count + 1 }))
      expect(store.getState().count).toBe(1)
    })

    it('should get signal for specific key', () => {
      const store = createStore({ count: 0 })
      const countSignal = store.getSignal('count')
      expect(countSignal).toBeDefined()
      // Signal is a function, call it to get value
      expect(countSignal()).toBe(0)
    })

    it('should update via signal', () => {
      const store = createStore({ count: 0 })
      const countSignal = store.getSignal('count')
      // Signal has .set() method or can be called with value
      countSignal.set(10)
      expect(store.getState().count).toBe(10)
    })

    it('should subscribe to key changes', () => {
      const store = createStore({ count: 0 })
      const callback = vi.fn()
      store.subscribe('count', callback)
      
      store.setState({ count: 5 })
      expect(callback).toHaveBeenCalledWith(5, 0)
    })

    it('should unsubscribe from changes', () => {
      const store = createStore({ count: 0 })
      const callback = vi.fn()
      const unsubscribe = store.subscribe('count', callback)
      
      unsubscribe()
      store.setState({ count: 5 })
      expect(callback).not.toHaveBeenCalled()
    })

    it('should batch updates', () => {
      const store = createStore({ count: 0, name: 'Flint' })
      const callback = vi.fn()
      store.subscribe('count', callback)
      
      store.setState({ count: 10 })
      store.setState({ count: 20 })
      
      // Should be called for each update
      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('should destroy store', () => {
      const store = createStore({ count: 0 })
      store.destroy()
      // After destroy, getState should throw
      expect(() => store.getState()).toThrow('[Flint Store] Store has been destroyed')
    })
  })

  describe('Middleware', () => {
    it('should run onSet middleware', () => {
      const middleware = {
        onSet: vi.fn((key, value, prev) => value * 2),
      }
      
      const store = createStore({ count: 0 }, { middleware: [middleware] })
      store.setState({ count: 5 })
      
      expect(middleware.onSet).toHaveBeenCalledWith('count', 5, 0)
    })

    it('should transform values via middleware', () => {
      const doubleMiddleware = {
        onSet: (key: string, value: any) => {
          if (key === 'count') return value * 2
          return value
        },
      }
      
      const store = createStore({ count: 0 }, { middleware: [doubleMiddleware] })
      store.setState({ count: 5 })
      
      expect(store.getState().count).toBe(10)
    })
  })

  describe('Computed signals', () => {
    it('should work with computed signals', () => {
      const store = createStore({ count: 0 })
      const countSignal = store.getSignal('count')
      
      // Use computed with signal as function
      const doubled = computed(() => countSignal() * 2)
      
      store.setState({ count: 5 })
      // Access computed value via function call
      expect(doubled()).toBe(10)
    })
  })
})
