import { describe, it, expect, vi } from 'vitest'
import { state, computed, effect } from '../src/signals.js'
import {
  DebugManager,
  createDebugManager,
  getDebugManager,
  enableDebug,
  disableDebug,
  trackSignal,
  trackComputed,
  printSignalHistory,
  printComputedStats,
  printPerformanceSummary,
} from '../src/debug.js'

describe('Debug Manager', () => {
  it('should create debug manager', () => {
    const manager = new DebugManager({ enabled: true })
    expect(manager).toBeInstanceOf(DebugManager)
  })

  it('should enable debug mode', () => {
    const manager = new DebugManager()
    manager.enable()
    // No error means success
  })

  it('should disable debug mode', () => {
    const manager = new DebugManager()
    manager.enable()
    manager.disable()
    // No error means success
  })
})

describe('Signal Tracking', () => {
  it('should track signal changes', () => {
    const manager = new DebugManager({ enabled: true })
    const count = state(0)
    const tracked = manager.trackSignal('count', count)

    tracked.set(1)
    tracked.set(2)

    const info = manager.getSignalDebugInfo('signal_0')
    expect(info).toBeDefined()
    expect(info?.name).toBe('count')
    expect(info?.value).toBe(2)
    expect(info?.changeCount).toBe(2)
  })

  it('should track signal history', () => {
    const manager = new DebugManager({ enabled: true })
    const count = state(0)
    const tracked = manager.trackSignal('count', count)

    tracked.set(1)
    tracked.set(2)
    tracked.set(3)

    const info = manager.getSignalDebugInfo('signal_0')
    expect(info?.history.length).toBe(3)
  })

  it('should get all tracked signals', () => {
    const manager = new DebugManager({ enabled: true })
    const count = state(0)
    const name = state('test')

    manager.trackSignal('count', count)
    manager.trackSignal('name', name)

    const signals = manager.getAllSignals()
    expect(signals.length).toBe(2)
  })
})

describe('Computed Tracking', () => {
  it('should track computed recalculations', () => {
    const manager = new DebugManager({ enabled: true })
    const count = state(0)
    const doubled = computed(() => count() * 2)
    const tracked = manager.trackComputed('doubled', doubled)

    // Read to trigger calculation
    tracked()
    count.set(1)
    tracked()

    const info = manager.getComputedDebugInfo('computed_0')
    expect(info).toBeDefined()
    expect(info?.name).toBe('doubled')
    expect(info?.recalculationCount).toBeGreaterThanOrEqual(1)
  })
})

describe('Singleton Functions', () => {
  it('should create debug manager singleton', () => {
    const manager1 = createDebugManager()
    const manager2 = createDebugManager()
    expect(manager1).toBe(manager2)
  })

  it('should get debug manager', () => {
    createDebugManager()
    const manager = getDebugManager()
    expect(manager).toBeDefined()
  })

  it('should enable debug globally', () => {
    const manager = enableDebug()
    expect(manager).toBeDefined()
  })

  it('should track signal globally', () => {
    const count = state(0)
    const tracked = trackSignal('count', count)
    expect(tracked).toBeDefined()
  })

  it('should track computed globally', () => {
    const count = state(0)
    const doubled = computed(() => count() * 2)
    const tracked = trackComputed('doubled', doubled)
    expect(tracked).toBeDefined()
  })
})

describe('Performance Summary', () => {
  it('should print performance summary', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    enableDebug()

    printPerformanceSummary()

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
