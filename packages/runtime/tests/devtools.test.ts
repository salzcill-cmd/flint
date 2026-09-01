/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  DevTools,
  createDevTools,
  getDevTools,
  destroyDevTools,
  devWarning,
  devError,
  isDevelopment,
  logComponentTree,
  logSignals,
  logStores,
  startTrace,
} from '../src/devtools/index.js'

describe('DevTools', () => {
  let devtools: DevTools

  beforeEach(() => {
    devtools = new DevTools({ enabled: false })
  })

  afterEach(() => {
    devtools.reset()
  })

  it('creates a DevTools instance', () => {
    expect(devtools).toBeDefined()
  })

  it('registers components', () => {
    devtools.registerComponent('comp-1', 'App', null, { name: 'Test' })
    const tree = devtools.getComponentTree()
    expect(tree.length).toBe(1)
    expect(tree[0].name).toBe('App')
  })

  it('tracks component updates', () => {
    devtools.registerComponent('comp-1', 'App', null, {})
    devtools.updateComponent('comp-1', { count: 1 })
    const component = devtools.getComponent('comp-1')
    expect(component?.state.count).toBe(1)
    expect(component?.updateCount).toBe(1)
  })

  it('unregisters components', () => {
    devtools.registerComponent('comp-1', 'App', null, {})
    devtools.unregisterComponent('comp-1')
    expect(devtools.getComponent('comp-1')).toBeUndefined()
  })

  it('tracks component hierarchy', () => {
    devtools.registerComponent('parent', 'App', null, {})
    devtools.registerComponent('child', 'Button', 'parent', {})
    const parent = devtools.getComponent('parent')
    expect(parent?.children).toContain('child')
  })

  it('registers signals', () => {
    devtools.registerSignal('sig-1', 42)
    const signals = devtools.getSignals()
    expect(signals.length).toBe(1)
    expect(signals[0].value).toBe(42)
  })

  it('updates signals with history', () => {
    devtools.registerSignal('sig-1', 0)
    devtools.updateSignal('sig-1', 1)
    devtools.updateSignal('sig-1', 2)
    const signal = devtools.getSignals()[0]
    expect(signal.value).toBe(2)
    expect(signal.history.length).toBe(3)
  })

  it('deletes signals', () => {
    devtools.registerSignal('sig-1', 42)
    devtools.deleteSignal('sig-1')
    expect(devtools.getSignals().length).toBe(0)
  })

  it('registers stores', () => {
    devtools.registerStore('store-1', 'counter', { count: 0 })
    const stores = devtools.getStores()
    expect(stores.length).toBe(1)
    expect(stores[0].name).toBe('counter')
  })

  it('updates stores', () => {
    devtools.registerStore('store-1', 'counter', { count: 0 })
    devtools.updateStore('store-1', { count: 5 })
    const store = devtools.getStores()[0]
    expect(store.state.count).toBe(5)
  })

  it('deletes stores', () => {
    devtools.registerStore('store-1', 'counter', { count: 0 })
    devtools.deleteStore('store-1')
    expect(devtools.getStores().length).toBe(0)
  })

  it('measures performance', () => {
    const stop = devtools.startMeasure('test-operation')
    // Simulate work
    for (let i = 0; i < 1000; i++) {}
    const duration = stop()
    expect(duration).toBeGreaterThanOrEqual(0)

    const metrics = devtools.getPerformanceMetrics()
    expect(metrics.length).toBe(1)
    expect(metrics[0].name).toBe('test-operation')
  })

  it('clears performance metrics', () => {
    const stop = devtools.startMeasure('test')
    stop()
    devtools.clearPerformanceMetrics()
    expect(devtools.getPerformanceMetrics().length).toBe(0)
  })

  it('tracks events', () => {
    devtools.registerComponent('comp-1', 'App', null, {})
    const events = devtools.getEvents()
    expect(events.some(e => e.type === 'component:mount')).toBe(true)
  })

  it('clears events', () => {
    devtools.registerComponent('comp-1', 'App', null, {})
    devtools.clearEvents()
    expect(devtools.getEvents().length).toBe(0)
  })

  it('subscribes to events', () => {
    const callback = vi.fn()
    devtools.on('component:mount', callback)
    devtools.registerComponent('comp-1', 'App', null, {})
    expect(callback).toHaveBeenCalled()
  })

  it('resets all data', () => {
    devtools.registerComponent('comp-1', 'App', null, {})
    devtools.registerSignal('sig-1', 42)
    devtools.registerStore('store-1', 'counter', { count: 0 })
    devtools.reset()
    expect(devtools.getComponentTree().length).toBe(0)
    expect(devtools.getSignals().length).toBe(0)
    expect(devtools.getStores().length).toBe(0)
  })
})

describe('Singleton functions', () => {
  beforeEach(() => {
    destroyDevTools()
  })

  it('createDevTools creates singleton', () => {
    const dt = createDevTools({ enabled: false })
    expect(dt).toBeDefined()
  })

  it('getDevTools returns instance', () => {
    createDevTools({ enabled: false })
    const dt = getDevTools()
    expect(dt).toBeDefined()
  })

  it('destroyDevTools clears instance', () => {
    createDevTools({ enabled: false })
    destroyDevTools()
    // Next create should create new instance
    const dt = createDevTools({ enabled: false })
    expect(dt).toBeDefined()
  })
})

describe('Development utilities', () => {
  it('isDevelopment returns boolean', () => {
    expect(typeof isDevelopment()).toBe('boolean')
  })

  it('devWarning does not throw', () => {
    expect(() => devWarning(true, 'test')).not.toThrow()
    expect(() => devWarning(false, 'test')).not.toThrow()
  })

  it('devError does not throw', () => {
    expect(() => devError(true, 'test')).not.toThrow()
    expect(() => devError(false, 'test')).not.toThrow()
  })
})

describe('Console utilities', () => {
  beforeEach(() => {
    destroyDevTools()
    createDevTools({ enabled: false })
  })

  it('logComponentTree does not throw', () => {
    expect(() => logComponentTree()).not.toThrow()
  })

  it('logSignals does not throw', () => {
    expect(() => logSignals()).not.toThrow()
  })

  it('logStores does not throw', () => {
    expect(() => logStores()).not.toThrow()
  })

  it('startTrace returns stop function', () => {
    const stop = startTrace('test')
    expect(typeof stop).toBe('function')
  })
})
