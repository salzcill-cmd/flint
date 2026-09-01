// Flint DevTools v2 — Advanced Debugging
// State diff, time travel, performance insights

import { state, computed } from '@flint/reactivity'
import type { Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export interface StateDiff {
  added: Record<string, any>
  removed: Record<string, any>
  changed: Record<string, { old: any; new: any }>
  unchanged: string[]
}

export interface TimeTravelEntry {
  id: string
  timestamp: number
  state: Record<string, any>
  action: string
  duration?: number
}

export interface PerformanceInsight {
  type: 'slow_render' | 'excessive_rerender' | 'memory_leak' | 'slow_computation'
  component?: string
  message: string
  suggestion: string
  severity: 'low' | 'medium' | 'high'
}

export interface StateSnapshot {
  id: string
  timestamp: number
  state: Record<string, any>
  components: string[]
}

// ─── State Diff ─────────────────────────────────────────────────

/**
 * Calculate diff between two states
 *
 * @example
 * const diff = calculateStateDiff(
 *   { count: 1, name: 'John' },
 *   { count: 2, name: 'John', age: 30 }
 * )
 * // diff = {
 * //   added: { age: 30 },
 * //   removed: {},
 * //   changed: { count: { old: 1, new: 2 } },
 * //   unchanged: ['name']
 * // }
 */
export function calculateStateDiff(
  oldState: Record<string, any>,
  newState: Record<string, any>
): StateDiff {
  const diff: StateDiff = {
    added: {},
    removed: {},
    changed: {},
    unchanged: [],
  }

  const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)])

  for (const key of allKeys) {
    const oldVal = oldState[key]
    const newVal = newState[key]

    if (oldVal === undefined) {
      diff.added[key] = newVal
    } else if (newVal === undefined) {
      diff.removed[key] = oldVal
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff.changed[key] = { old: oldVal, new: newVal }
    } else {
      diff.unchanged.push(key)
    }
  }

  return diff
}

/**
 * Format diff for console output
 */
export function formatStateDiff(diff: StateDiff): string {
  const lines: string[] = []

  if (Object.keys(diff.added).length > 0) {
    lines.push('Added:')
    for (const [key, value] of Object.entries(diff.added)) {
      lines.push(`  + ${key}: ${JSON.stringify(value)}`)
    }
  }

  if (Object.keys(diff.removed).length > 0) {
    lines.push('Removed:')
    for (const [key, value] of Object.entries(diff.removed)) {
      lines.push(`  - ${key}: ${JSON.stringify(value)}`)
    }
  }

  if (Object.keys(diff.changed).length > 0) {
    lines.push('Changed:')
    for (const [key, { old, new: newVal }] of Object.entries(diff.changed)) {
      lines.push(`  ~ ${key}: ${JSON.stringify(old)} -> ${JSON.stringify(newVal)}`)
    }
  }

  return lines.join('\n')
}

// ─── Time Travel Debugging ──────────────────────────────────────

export class TimeTravelDebugger {
  private history: TimeTravelEntry[] = []
  private currentIndex = -1
  private maxHistory: number

  constructor(maxHistory = 50) {
    this.maxHistory = maxHistory
  }

  /**
   * Record state snapshot
   */
  record(state: Record<string, any>, action: string): void {
    // Remove any future entries if we're not at the end
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1)
    }

    const entry: TimeTravelEntry = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      state: { ...state },
      action,
    }

    this.history.push(entry)

    // Trim history
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }

    this.currentIndex = this.history.length - 1
  }

  /**
   * Go to previous state
   */
  undo(): Record<string, any> | null {
    if (this.currentIndex > 0) {
      this.currentIndex--
      return { ...this.history[this.currentIndex].state }
    }
    return null
  }

  /**
   * Go to next state
   */
  redo(): Record<string, any> | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++
      return { ...this.history[this.currentIndex].state }
    }
    return null
  }

  /**
   * Go to specific index
   */
  goTo(index: number): Record<string, any> | null {
    if (index >= 0 && index < this.history.length) {
      this.currentIndex = index
      return { ...this.history[this.currentIndex].state }
    }
    return null
  }

  /**
   * Get current state
   */
  getCurrent(): Record<string, any> | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return { ...this.history[this.currentIndex].state }
    }
    return null
  }

  /**
   * Get history
   */
  getHistory(): TimeTravelEntry[] {
    return [...this.history]
  }

  /**
   * Get history length
   */
  getLength(): number {
    return this.history.length
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = []
    this.currentIndex = -1
  }
}

// ─── Performance Insights ───────────────────────────────────────

export class PerformanceAnalyzer {
  private insights: PerformanceInsight[] = []
  private componentRenderTimes: Map<string, number[]> = new Map()
  private renderThreshold = 16.67 // 60fps

  /**
   * Analyze component render time
   */
  analyzeRender(componentName: string, renderTime: number): void {
    const times = this.componentRenderTimes.get(componentName) || []
    times.push(renderTime)
    this.componentRenderTimes.set(componentName, times)

    // Check for slow render
    if (renderTime > this.renderThreshold * 2) {
      this.insights.push({
        type: 'slow_render',
        component: componentName,
        message: `Component "${componentName}" took ${renderTime.toFixed(2)}ms to render`,
        suggestion: 'Consider using memoization or reducing render complexity',
        severity: renderTime > this.renderThreshold * 4 ? 'high' : 'medium',
      })
    }

    // Check for excessive rerenders
    if (times.length > 10) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      if (avgTime > this.renderThreshold) {
        this.insights.push({
          type: 'excessive_rerender',
          component: componentName,
          message: `Component "${componentName}" is rerendering frequently (${times.length} times)`,
          suggestion: 'Check for unnecessary re-renders or missing memoization',
          severity: 'medium',
        })
      }
    }
  }

  /**
   * Get all insights
   */
  getInsights(): PerformanceInsight[] {
    return [...this.insights]
  }

  /**
   * Get insights by severity
   */
  getInsightsBySeverity(severity: 'low' | 'medium' | 'high'): PerformanceInsight[] {
    return this.insights.filter((i) => i.severity === severity)
  }

  /**
   * Clear insights
   */
  clearInsights(): void {
    this.insights = []
  }

  /**
   * Get component stats
   */
  getComponentStats(componentName: string): {
    totalRenders: number
    averageTime: number
    maxTime: number
    minTime: number
  } {
    const times = this.componentRenderTimes.get(componentName) || []
    if (times.length === 0) {
      return { totalRenders: 0, averageTime: 0, maxTime: 0, minTime: 0 }
    }

    return {
      totalRenders: times.length,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      maxTime: Math.max(...times),
      minTime: Math.min(...times),
    }
  }
}

// ─── State Inspector ────────────────────────────────────────────

export class StateInspector {
  private snapshots: StateSnapshot[] = []
  private maxSnapshots: number

  constructor(maxSnapshots = 100) {
    this.maxSnapshots = maxSnapshots
  }

  /**
   * Take snapshot of current state
   */
  snapshot(
    state: Record<string, any>,
    components: string[]
  ): StateSnapshot {
    const snap: StateSnapshot = {
      id: `snap_${Date.now()}`,
      timestamp: Date.now(),
      state: { ...state },
      components: [...components],
    }

    this.snapshots.push(snap)

    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift()
    }

    return snap
  }

  /**
   * Compare two snapshots
   */
  compare(snapId1: string, snapId2: string): StateDiff | null {
    const snap1 = this.snapshots.find((s) => s.id === snapId1)
    const snap2 = this.snapshots.find((s) => s.id === snapId2)

    if (!snap1 || !snap2) return null

    return calculateStateDiff(snap1.state, snap2.state)
  }

  /**
   * Get snapshot history
   */
  getHistory(): StateSnapshot[] {
    return [...this.snapshots]
  }

  /**
   * Clear history
   */
  clear(): void {
    this.snapshots = []
  }
}

// ─── Advanced DevTools Singleton ─────────────────────────────────

let advancedDevtools: AdvancedDevTools | null = null

export class AdvancedDevTools {
  timeTravel: TimeTravelDebugger
  performance: PerformanceAnalyzer
  inspector: StateInspector
  private enabled: boolean

  constructor(options: { maxHistory?: number; enabled?: boolean } = {}) {
    this.timeTravel = new TimeTravelDebugger(options.maxHistory)
    this.performance = new PerformanceAnalyzer()
    this.inspector = new StateInspector(options.maxHistory)
    this.enabled = options.enabled ?? true
  }

  /**
   * Record state change
   */
  recordState(state: Record<string, any>, action: string): void {
    if (!this.enabled) return
    this.timeTravel.record(state, action)
    this.inspector.snapshot(state, [])
  }

  /**
   * Undo last change
   */
  undo(): Record<string, any> | null {
    return this.timeTravel.undo()
  }

  /**
   * Redo last undone change
   */
  redo(): Record<string, any> | null {
    return this.timeTravel.redo()
  }

  /**
   * Get all performance insights
   */
  getInsights(): PerformanceInsight[] {
    return this.performance.getInsights()
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.timeTravel.clear()
    this.performance.clearInsights()
    this.inspector.clear()
  }
}

// ─── Singleton Functions ────────────────────────────────────────

export function createAdvancedDevTools(options?: {
  maxHistory?: number
  enabled?: boolean
}): AdvancedDevTools {
  if (!advancedDevtools) {
    advancedDevtools = new AdvancedDevTools(options)
  }
  return advancedDevtools
}

export function getAdvancedDevTools(): AdvancedDevTools | null {
  return advancedDevtools
}

/**
 * Record state change globally
 */
export function recordState(state: Record<string, any>, action: string): void {
  if (!advancedDevtools) {
    advancedDevtools = new AdvancedDevTools()
  }
  advancedDevtools.recordState(state, action)
}

/**
 * Undo last change globally
 */
export function undo(): Record<string, any> | null {
  return advancedDevtools?.undo() ?? null
}

/**
 * Redo last undone change globally
 */
export function redo(): Record<string, any> | null {
  return advancedDevtools?.redo() ?? null
}
