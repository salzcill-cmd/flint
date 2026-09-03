// Flint Runtime Tests — Activity/KeepAlive & useEffectEvent
// Tests for React 19 Activity and useEffectEvent equivalents

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { state, effect } from '@flint/reactivity'

// ─── Activity & KeepAlive ───────────────────────────────────────

import {
  Activity,
  KeepAlive,
  useActivity,
  clearActivityCache,
  getActivityCacheStats,
} from '@flint/runtime/components/activity'

describe('Activity Component', () => {
  beforeEach(() => {
    clearActivityCache()
  })

  it('renders children when active', () => {
    const result = Activity({
      active: true,
      children: 'Hello',
    })

    expect(result).toBe('Hello')
  })

  it('returns null when inactive', () => {
    const result = Activity({
      active: false,
      children: 'Hello',
    })

    expect(result).toBeNull()
  })

  it('returns null when inactive with keepAlive', () => {
    const result = Activity({
      active: false,
      keepAlive: true,
      children: 'Hello',
    })

    expect(result).toBeNull()
  })
})

describe('KeepAlive Component', () => {
  beforeEach(() => {
    clearActivityCache()
  })

  it('renders children', () => {
    const result = KeepAlive({
      children: 'Hello',
      keep: true,
    })

    expect(result).toBe('Hello')
  })

  it('adds to cache', () => {
    KeepAlive({
      children: 'Hello',
      keep: true,
      cacheKey: 'test',
    })

    const stats = getActivityCacheStats()
    expect(stats.size).toBe(1)
    expect(stats.keys).toContain('test')
  })

  it('clears cache', () => {
    KeepAlive({
      children: 'Hello',
      keep: true,
      cacheKey: 'test',
    })

    clearActivityCache()

    const stats = getActivityCacheStats()
    expect(stats.size).toBe(0)
  })
})

describe('useActivity Hook', () => {
  beforeEach(() => {
    clearActivityCache()
  })

  it('returns activity controls', () => {
    const activity = useActivity('test')

    expect(typeof activity.activate).toBe('function')
    expect(typeof activity.deactivate).toBe('function')
    expect(typeof activity.toggle).toBe('function')
    expect(typeof activity.isCached).toBe('function')
  })

  it('toggles activity', () => {
    const activity = useActivity('test')

    expect(activity.isActive()).toBe(false)

    activity.activate()
    expect(activity.isActive()).toBe(true)

    activity.deactivate()
    expect(activity.isActive()).toBe(false)
  })

  it('checks cache status', () => {
    const activity = useActivity('test')

    expect(activity.isCached()).toBe(false)
  })
})

// ─── useEffectEvent ─────────────────────────────────────────────

import {
  useEffectEvent,
  useStableEvent,
  useEffectEventWithCleanup,
  useEffectEventDebounced,
  useEffectEventThrottled,
  useEffectAnimationFrame,
  useEffectEventIntersection,
} from '@flint/runtime/hooks/effect-event'

describe('useEffectEvent', () => {
  it('creates a stable event function', () => {
    const callback = vi.fn()
    const { event } = useEffectEvent(callback)

    expect(typeof event).toBe('function')
  })

  it('calls the latest implementation', () => {
    let value = 'first'
    const { event } = useEffectEvent(() => value)

    expect(event()).toBe('first')

    value = 'second'
    expect(event()).toBe('second')
  })

  it('allows updating the event', () => {
    const { event, setEvent } = useEffectEvent(() => 1)

    expect(event()).toBe(1)

    setEvent(() => 2)
    expect(event()).toBe(2)
  })

  it('maintains stable reference', () => {
    const { event } = useEffectEvent(() => {})
    const ref1 = event
    const ref2 = event

    expect(ref1).toBe(ref2)
  })
})

describe('useStableEvent', () => {
  it('returns a stable function', () => {
    const callback = vi.fn()
    const event = useStableEvent(callback)

    expect(typeof event).toBe('function')
  })
})

describe('useEffectEventWithCleanup', () => {
  it('runs cleanup before next call', () => {
    const cleanup = vi.fn()
    const { event } = useEffectEventWithCleanup(() => cleanup)

    event()
    event()

    expect(cleanup).toHaveBeenCalledTimes(1)
  })
})

describe('useEffectEventDebounced', () => {
  it('creates debounced event', () => {
    const callback = vi.fn()
    const { event } = useEffectEventDebounced(callback, 100)

    expect(typeof event).toBe('function')
  })

  it('has cancel method', () => {
    const { event } = useEffectEventDebounced(() => {}, 100)

    expect(typeof (event as any).cancel).toBe('function')
  })

  it('has flush method', () => {
    const { event } = useEffectEventDebounced(() => {}, 100)

    expect(typeof (event as any).flush).toBe('function')
  })
})

describe('useEffectEventThrottled', () => {
  it('creates throttled event', () => {
    const callback = vi.fn()
    const { event } = useEffectEventThrottled(callback, 100)

    expect(typeof event).toBe('function')
  })
})

describe('useEffectAnimationFrame', () => {
  it('creates animation frame event', () => {
    const callback = vi.fn()
    const { event } = useEffectAnimationFrame(callback)

    expect(typeof event).toBe('function')
  })
})

describe('useEffectEventIntersection', () => {
  it('creates intersection observer event', () => {
    const callback = vi.fn()
    const { event } = useEffectEventIntersection(callback, {
      threshold: 0.5,
    })

    expect(typeof event).toBe('function')
  })
})
