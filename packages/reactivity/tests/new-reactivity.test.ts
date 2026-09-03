import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  state,
  computed,
  effect,
  watch,
  batch,
  untrack,
  createSelector,
  createRoot,
  onCleanup,
} from '@flint/reactivity'

// Helper to wait for effects to flush
function flush() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

describe('untrack', () => {
  it('reads signal without subscribing', async () => {
    const count = state(0)
    let runs = 0

    effect(() => {
      untrack(() => count())
      runs++
    })

    expect(runs).toBe(1)
    count.set(1)
    await flush()
    // Should NOT re-run because we used untrack
    expect(runs).toBe(1)
  })

  it('returns the value from the function', () => {
    const count = state(42)
    const value = untrack(() => count())
    expect(value).toBe(42)
  })

  it('can be nested', async () => {
    const count = state(0)
    let runs = 0

    effect(() => {
      untrack(() => {
        untrack(() => count())
      })
      runs++
    })

    expect(runs).toBe(1)
    count.set(1)
    await flush()
    expect(runs).toBe(1)
  })
})

describe('createSelector', () => {
  it('tracks which key is selected', async () => {
    const selected = state<string>('a')
    const isSelected = createSelector(selected)

    expect(isSelected('a')).toBe(true)
    expect(isSelected('b')).toBe(false)

    selected.set('b')
    await flush()
    expect(isSelected('b')).toBe(true)
    expect(isSelected('a')).toBe(false)
  })

  it('setSelected updates the source signal', () => {
    const selected = state<string>('a')
    const isSelected = createSelector(selected)

    isSelected.setSelected('c')
    expect(selected()).toBe('c')
  })

  it('getSelected returns current selection', async () => {
    const selected = state<string>('a')
    const isSelected = createSelector(selected)

    expect(isSelected.getSelected()).toEqual(new Set(['a']))
    selected.set('b')
    await flush()
    expect(isSelected.getSelected()).toEqual(new Set(['b']))
  })

  it('works with function source', async () => {
    const count = state(0)
    const isSelected = createSelector(() => count() % 2 === 0)

    expect(isSelected(true)).toBe(true)
    expect(isSelected(false)).toBe(false)

    count.set(1)
    await flush()
    expect(isSelected(true)).toBe(false)
    expect(isSelected(false)).toBe(true)
  })

  it('dispose cleans up', () => {
    const selected = state<string>('a')
    const isSelected = createSelector(selected)

    isSelected.dispose()
    // After dispose, should still work but not track
    expect(isSelected('a')).toBe(true)
  })
})

describe('createRoot', () => {
  it('dispose method is available', () => {
    const scope = createRoot((dispose) => {
      return { value: 42 }
    })

    expect(scope.dispose).toBeDefined()
    expect(scope.dispose()).toBeUndefined()
  })

  it('onCleanup registers cleanup functions', () => {
    const cleanupFn = vi.fn()

    const scope = createRoot(() => {
      onCleanup(cleanupFn)
      return {}
    })

    scope.dispose()
    expect(cleanupFn).toHaveBeenCalled()
  })

  it('nested scopes', () => {
    const outerCleanup = vi.fn()
    const innerCleanup = vi.fn()

    const outer = createRoot(() => {
      onCleanup(outerCleanup)

      const inner = createRoot(() => {
        onCleanup(innerCleanup)
        return {}
      })

      return { inner }
    })

    outer.inner.dispose()
    expect(innerCleanup).toHaveBeenCalled()
    expect(outerCleanup).not.toHaveBeenCalled()

    outer.dispose()
    expect(outerCleanup).toHaveBeenCalled()
  })
})

describe('onCleanup', () => {
  it('registers cleanup in effect', async () => {
    const cleanupFn = vi.fn()
    const count = state(0)

    effect(() => {
      count()
      onCleanup(cleanupFn)
    })

    count.set(1)
    await flush()
    // Cleanup runs on effect re-run
    // Note: cleanup is called before the effect re-runs
  })

  it('runs cleanup on effect dispose', () => {
    const cleanupFn = vi.fn()

    const eff = effect(() => {
      onCleanup(cleanupFn)
    })

    eff.dispose()
    expect(cleanupFn).toHaveBeenCalled()
  })
})

describe('computed with custom comparator', () => {
  it('defaults to Object.is when no comparator', async () => {
    const count = state(0)
    let computeCount = 0

    const doubled = computed(() => {
      computeCount++
      return count() * 2
    })

    doubled()
    expect(computeCount).toBe(1)

    count.set(5)
    await flush()
    doubled()
    expect(computeCount).toBe(2)
  })
})

describe('batch', () => {
  it('batches multiple updates', async () => {
    const a = state(0)
    const b = state(0)
    let effectRuns = 0

    effect(() => {
      a()
      b()
      effectRuns++
    })

    expect(effectRuns).toBe(1)

    batch(() => {
      a.set(1)
      b.set(1)
    })

    await flush()
    // Effect should run once more (after batch flushes)
    expect(effectRuns).toBe(2)
  })

  it('nested batches', async () => {
    const count = state(0)
    let effectRuns = 0

    effect(() => {
      count()
      effectRuns++
    })

    expect(effectRuns).toBe(1)

    batch(() => {
      batch(() => {
        count.set(1)
      })
    })

    await flush()
    expect(effectRuns).toBe(2)
  })
})

describe('watch', () => {
  it('provides old and new values', async () => {
    const count = state(0)
    const changes: { new: number; old: number | undefined }[] = []

    watch(() => count(), (newVal, oldVal) => {
      changes.push({ new: newVal, old: oldVal })
    })

    count.set(1)
    await flush()
    count.set(2)
    await flush()
    count.set(3)
    await flush()

    expect(changes).toEqual([
      { new: 1, old: 0 },
      { new: 2, old: 1 },
      { new: 3, old: 2 },
    ])
  })

  it('can be disposed', async () => {
    const count = state(0)
    const changes: number[] = []

    const w = watch(() => count(), (newVal) => {
      changes.push(newVal)
    })

    count.set(1)
    await flush()
    expect(changes).toEqual([1])

    w.dispose()
    count.set(2)
    await flush()
    expect(changes).toEqual([1]) // No more changes
  })
})
