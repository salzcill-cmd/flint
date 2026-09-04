import { describe, it, expect, vi } from 'vitest'
import { create } from '../src/index.js'

describe('Flint Store', () => {
  it('creates a store with initial state', () => {
    const useStore = create((set: any) => ({
      count: 0,
      increment: () => set((state: any) => ({ count: state.count + 1 })),
    }))

    const store = useStore
    expect(store.getState().count).toBe(0)
  })

  it('updates state', () => {
    const useStore = create((set: any) => ({
      count: 0,
      increment: () => set((state: any) => ({ count: state.count + 1 })),
    }))

    const store = useStore
    store.getState().increment()
    expect(store.getState().count).toBe(1)
  })

  it('subscribes to changes', () => {
    const useStore = create((set: any) => ({
      count: 0,
      increment: () => set((state: any) => ({ count: state.count + 1 })),
    }))

    const store = useStore
    const listener = vi.fn()
    store.subscribe(listener)

    store.getState().increment()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('unsubscribes correctly', () => {
    const useStore = create((set: any) => ({
      count: 0,
      increment: () => set((state: any) => ({ count: state.count + 1 })),
    }))

    const store = useStore
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    unsubscribe()
    store.getState().increment()
    expect(listener).not.toHaveBeenCalled()
  })

  it('supports setState with partial state', () => {
    const useStore = create((set: any) => ({
      count: 0,
      name: 'test',
    }))

    const store = useStore
    store.setState({ count: 5 })
    expect(store.getState().count).toBe(5)
    expect(store.getState().name).toBe('test')
  })

  it('supports setState with function updater', () => {
    const useStore = create((set: any) => ({
      count: 0,
    }))

    const store = useStore
    store.setState((state: any) => ({ count: state.count + 10 }))
    expect(store.getState().count).toBe(10)
  })

  it('getState throws when store is destroyed', () => {
    const useStore = create((set: any) => ({
      count: 0,
    }))

    const store = useStore
    store.destroy()
    expect(() => store.getState()).toThrow()
  })

  it('setState throws when store is destroyed', () => {
    const useStore = create((set: any) => ({
      count: 0,
    }))

    const store = useStore
    store.destroy()
    expect(() => store.setState({ count: 1 })).toThrow()
  })
})
