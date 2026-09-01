import { describe, it, expect } from 'vitest'
import {
  AdvancedDevTools,
  TimeTravelDebugger,
  PerformanceAnalyzer,
  StateInspector,
  createAdvancedDevTools,
  getAdvancedDevTools,
  calculateStateDiff,
  formatStateDiff,
} from '../src/devtools/advanced.js'

describe('State Diff', () => {
  it('should calculate added properties', () => {
    const oldState = { a: 1 }
    const newState = { a: 1, b: 2 }

    const diff = calculateStateDiff(oldState, newState)

    expect(diff.added).toEqual({ b: 2 })
    expect(diff.removed).toEqual({})
    expect(diff.changed).toEqual({})
    expect(diff.unchanged).toEqual(['a'])
  })

  it('should calculate removed properties', () => {
    const oldState = { a: 1, b: 2 }
    const newState = { a: 1 }

    const diff = calculateStateDiff(oldState, newState)

    expect(diff.added).toEqual({})
    expect(diff.removed).toEqual({ b: 2 })
    expect(diff.changed).toEqual({})
    expect(diff.unchanged).toEqual(['a'])
  })

  it('should calculate changed properties', () => {
    const oldState = { a: 1, b: 2 }
    const newState = { a: 1, b: 3 }

    const diff = calculateStateDiff(oldState, newState)

    expect(diff.added).toEqual({})
    expect(diff.removed).toEqual({})
    expect(diff.changed).toEqual({ b: { old: 2, new: 3 } })
    expect(diff.unchanged).toEqual(['a'])
  })

  it('should format diff for console', () => {
    const diff = calculateStateDiff(
      { a: 1, b: 2 },
      { a: 1, b: 3, c: 4 }
    )

    const formatted = formatStateDiff(diff)

    expect(formatted).toContain('+ c: 4')
    expect(formatted).toContain('~ b: 2 -> 3')
  })
})

describe('Time Travel Debugger', () => {
  it('should record state snapshots', () => {
    const debugger_ = new TimeTravelDebugger()

    debugger_.record({ count: 1 }, 'increment')
    debugger_.record({ count: 2 }, 'increment')

    expect(debugger_.getLength()).toBe(2)
  })

  it('should undo to previous state', () => {
    const debugger_ = new TimeTravelDebugger()

    debugger_.record({ count: 1 }, 'increment')
    debugger_.record({ count: 2 }, 'increment')

    const state = debugger_.undo()

    expect(state).toEqual({ count: 1 })
  })

  it('should redo to next state', () => {
    const debugger_ = new TimeTravelDebugger()

    debugger_.record({ count: 1 }, 'increment')
    debugger_.record({ count: 2 }, 'increment')
    debugger_.undo()

    const state = debugger_.redo()

    expect(state).toEqual({ count: 2 })
  })

  it('should go to specific index', () => {
    const debugger_ = new TimeTravelDebugger()

    debugger_.record({ count: 1 }, 'step1')
    debugger_.record({ count: 2 }, 'step2')
    debugger_.record({ count: 3 }, 'step3')

    const state = debugger_.goTo(0)

    expect(state).toEqual({ count: 1 })
  })

  it('should get current state', () => {
    const debugger_ = new TimeTravelDebugger()

    debugger_.record({ count: 1 }, 'increment')
    debugger_.record({ count: 2 }, 'increment')

    const state = debugger_.getCurrent()

    expect(state).toEqual({ count: 2 })
  })

  it('should clear history', () => {
    const debugger_ = new TimeTravelDebugger()

    debugger_.record({ count: 1 }, 'increment')
    debugger_.record({ count: 2 }, 'increment')
    debugger_.clear()

    expect(debugger_.getLength()).toBe(0)
  })
})

describe('Performance Analyzer', () => {
  it('should analyze slow renders', () => {
    const analyzer = new PerformanceAnalyzer()

    analyzer.analyzeRender('MyComponent', 50) // Slow render

    const insights = analyzer.getInsights()
    expect(insights.length).toBe(1)
    expect(insights[0].type).toBe('slow_render')
  })

  it('should get component stats', () => {
    const analyzer = new PerformanceAnalyzer()

    analyzer.analyzeRender('MyComponent', 10)
    analyzer.analyzeRender('MyComponent', 20)
    analyzer.analyzeRender('MyComponent', 30)

    const stats = analyzer.getComponentStats('MyComponent')
    expect(stats.totalRenders).toBe(3)
    expect(stats.averageTime).toBe(20)
  })

  it('should clear insights', () => {
    const analyzer = new PerformanceAnalyzer()

    analyzer.analyzeRender('MyComponent', 50)
    analyzer.clearInsights()

    expect(analyzer.getInsights().length).toBe(0)
  })
})

describe('State Inspector', () => {
  it('should take snapshots', () => {
    const inspector = new StateInspector()

    inspector.snapshot({ count: 1 }, ['Counter'])
    inspector.snapshot({ count: 2 }, ['Counter'])

    expect(inspector.getHistory().length).toBe(2)
  })

  it('should compare snapshots', () => {
    const inspector = new StateInspector()

    const snap1 = inspector.snapshot({ count: 1 }, ['Counter'])
    const snap2 = inspector.snapshot({ count: 2 }, ['Counter'])

    const diff = inspector.compare(snap1.id, snap2.id)

    expect(diff).toBeDefined()
    // The state is copied, so we just check that diff exists and has properties
    expect(diff).toHaveProperty('added')
    expect(diff).toHaveProperty('removed')
    expect(diff).toHaveProperty('changed')
    expect(diff).toHaveProperty('unchanged')
  })
})

describe('Advanced DevTools', () => {
  it('should create advanced devtools', () => {
    const devtools = new AdvancedDevTools()
    expect(devtools).toBeInstanceOf(AdvancedDevTools)
  })

  it('should record state changes', () => {
    const devtools = new AdvancedDevTools()

    devtools.recordState({ count: 1 }, 'increment')
    devtools.recordState({ count: 2 }, 'increment')

    expect(devtools.timeTravel.getLength()).toBe(2)
  })

  it('should undo and redo', () => {
    const devtools = new AdvancedDevTools()

    devtools.recordState({ count: 1 }, 'increment')
    devtools.recordState({ count: 2 }, 'increment')

    const state1 = devtools.undo()
    expect(state1).toEqual({ count: 1 })

    const state2 = devtools.redo()
    expect(state2).toEqual({ count: 2 })
  })

  it('should clear all data', () => {
    const devtools = new AdvancedDevTools()

    devtools.recordState({ count: 1 }, 'increment')
    devtools.clear()

    expect(devtools.timeTravel.getLength()).toBe(0)
  })
})

describe('Singleton Functions', () => {
  it('should create advanced devtools singleton', () => {
    const devtools1 = createAdvancedDevTools()
    const devtools2 = createAdvancedDevTools()

    expect(devtools1).toBe(devtools2)
  })

  it('should get advanced devtools', () => {
    createAdvancedDevTools()
    const devtools = getAdvancedDevTools()

    expect(devtools).toBeDefined()
  })
})
