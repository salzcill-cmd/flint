import { describe, it, expect, vi } from 'vitest'
import { state, computed, effect, watch, batch } from '../src/signals.js'

describe('state', () => {
  it('creates a signal with initial value', () => {
    const count = state(0)
    expect(count()).toBe(0)
  })

  it('reads current value', () => {
    const name = state('Flint')
    expect(name()).toBe('Flint')
  })

  it('sets value directly', () => {
    const count = state(0)
    count.set(5)
    expect(count()).toBe(5)
  })

  it('sets value with updater function', () => {
    const count = state(0)
    count.set(c => c + 1)
    expect(count()).toBe(1)
  })

  it('peek does not track dependency', () => {
    const count = state(42)
    expect(count.peek()).toBe(42)
    // peek should work the same as read for value
    count.set(100)
    expect(count.peek()).toBe(100)
  })
})

describe('computed', () => {
  it('creates a computed value', () => {
    const count = state(0)
    const doubled = computed(() => count() * 2)
    expect(doubled()).toBe(0)
  })

  it('updates when dependency changes', () => {
    const count = state(0)
    const doubled = computed(() => count() * 2)
    
    count.set(5)
    expect(doubled()).toBe(10)
  })

  it('lazily evaluates', () => {
    const count = state(0)
    let computeCount = 0
    const doubled = computed(() => {
      computeCount++
      return count() * 2
    })
    
    // Initial evaluation
    doubled()
    expect(computeCount).toBe(1)
    
    // Read again — should not recompute
    doubled()
    expect(computeCount).toBe(1)
    
    // Change dependency
    count.set(1)
    doubled()
    expect(computeCount).toBe(2)
  })

  it('chains computeds', () => {
    const count = state(1)
    const doubled = computed(() => count() * 2)
    const quadrupled = computed(() => doubled() * 2)
    
    expect(quadrupled()).toBe(4)
    
    count.set(3)
    expect(quadrupled()).toBe(12)
  })
})

describe('effect', () => {
  it('runs immediately', () => {
    const count = state(0)
    let runs = 0
    effect(() => {
      count()
      runs++
    })
    expect(runs).toBe(1)
  })

  it('re-runs when dependency changes', async () => {
    const count = state(0)
    let runs = 0
    effect(() => {
      count()
      runs++
    })
    
    count.set(1)
    
    // Wait for microtask
    await new Promise(r => setTimeout(r, 0))
    expect(runs).toBe(2)
  })

  it('runs cleanup before re-run', async () => {
    const count = state(0)
    const cleanups: string[] = []
    
    effect(() => {
      count()
      return () => {
        cleanups.push('cleanup')
      }
    })
    
    count.set(1)
    await new Promise(r => setTimeout(r, 0))
    expect(cleanups).toHaveLength(1)
  })

  it('can be disposed', async () => {
    const count = state(0)
    let runs = 0
    const eff = effect(() => {
      count()
      runs++
    })
    
    eff.dispose()
    count.set(1)
    await new Promise(r => setTimeout(r, 0))
    expect(runs).toBe(1) // Should not re-run
  })
})

describe('watch', () => {
  it('does not fire initially', () => {
    const count = state(0)
    const cb = vi.fn()
    watch(() => count(), cb)
    expect(cb).not.toHaveBeenCalled()
  })

  it('fires when value changes', async () => {
    const count = state(0)
    const cb = vi.fn()
    watch(() => count(), cb)
    
    count.set(5)
    await new Promise(r => setTimeout(r, 0))
    
    expect(cb).toHaveBeenCalledWith(5, 0)
  })

  it('can be disposed', async () => {
    const count = state(0)
    const cb = vi.fn()
    const handle = watch(() => count(), cb)
    
    handle.dispose()
    count.set(5)
    await new Promise(r => setTimeout(r, 0))
    
    expect(cb).not.toHaveBeenCalled()
  })
})

describe('batch', () => {
  it('batches multiple updates', async () => {
    const count = state(0)
    const name = state('a')
    let runs = 0
    
    effect(() => {
      count()
      name()
      runs++
    })
    
    batch(() => {
      count.set(1)
      name.set('b')
    })
    
    // Should only run once for the batch
    await new Promise(r => setTimeout(r, 0))
    expect(runs).toBe(2) // initial + 1 batched
  })
})
