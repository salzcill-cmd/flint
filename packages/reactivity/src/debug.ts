// Flint Reactivity v2 — Debug Mode & Signal Tracking
// Enhanced debugging capabilities for signals and computed values

import { state, computed, effect, batch } from './signals.js'
import type { Signal, Computed } from './types.js'

// ─── Types ──────────────────────────────────────────────────────

export interface DebugOptions {
  /** Enable debug mode */
  enabled: boolean
  /** Log signal changes */
  logChanges: boolean
  /** Log computed recalculations */
  logComputed: boolean
  /** Log effect executions */
  logEffects: boolean
  /** Log batch operations */
  logBatch: boolean
  /** Maximum history entries per signal */
  maxHistory: number
  /** Enable performance tracking */
  trackPerformance: boolean
}

export interface SignalDebugInfo {
  id: string
  name: string
  value: any
  previousValue: any
  changeCount: number
  lastChange: number
  history: SignalHistoryEntry[]
  subscribers: string[]
  computedFrom: string[]
}

export interface SignalHistoryEntry {
  value: any
  timestamp: number
  stackTrace?: string
}

export interface ComputedDebugInfo {
  id: string
  name: string
  value: any
  recalculationCount: number
  lastRecalculation: number
  dependencies: string[]
  isDirty: boolean
  computationTime: number
}

export interface EffectDebugInfo {
  id: string
  name: string
  executionCount: number
  lastExecution: number
  dependencies: string[]
  executionTime: number
}

// ─── Debug Manager ──────────────────────────────────────────────

let debugManager: DebugManager | null = null

export class DebugManager {
  private options: DebugOptions
  private signalRegistry: Map<string, SignalDebugInfo> = new Map()
  private computedRegistry: Map<string, ComputedDebugInfo> = new Map()
  private effectRegistry: Map<string, EffectDebugInfo> = new Map()
  private idCounter = 0
  private enabled = false

  constructor(options: Partial<DebugOptions> = {}) {
    this.options = {
      enabled: false,
      logChanges: true,
      logComputed: true,
      logEffects: true,
      logBatch: true,
      maxHistory: 100,
      trackPerformance: true,
      ...options,
    }
    this.enabled = this.options.enabled
  }

  /**
   * Enable debug mode
   */
  enable(): void {
    this.enabled = true
    this.options.enabled = true
    console.log('[Flint Debug] Debug mode enabled')
  }

  /**
   * Disable debug mode
   */
  disable(): void {
    this.enabled = false
    this.options.enabled = false
    console.log('[Flint Debug] Debug mode disabled')
  }

  /**
   * Track a signal
   */
  trackSignal<T>(name: string, signal: Signal<T>): Signal<T> {
    if (!this.enabled) return signal

    const id = `signal_${this.idCounter++}`
    const debugInfo: SignalDebugInfo = {
      id,
      name,
      value: signal(),
      previousValue: undefined,
      changeCount: 0,
      lastChange: Date.now(),
      history: [],
      subscribers: [],
      computedFrom: [],
    }

    this.signalRegistry.set(id, debugInfo)

    // Wrap signal with tracking - create a proper Signal wrapper
    const tracked = (() => {
      // Read
      return signal()
    }) as Signal<T>

    // Copy the set method with tracking
    tracked.set = (value: T | ((prev: T) => T)) => {
      const oldValue = signal()
      signal.set(value)
      const newValue = signal()

      debugInfo.previousValue = oldValue
      debugInfo.value = newValue
      debugInfo.changeCount++
      debugInfo.lastChange = Date.now()

      debugInfo.history.push({
        value: newValue,
        timestamp: Date.now(),
      })

      // Trim history
      if (debugInfo.history.length > this.options.maxHistory) {
        debugInfo.history.shift()
      }

      if (this.options.logChanges) {
        console.log(
          `[Flint Debug] Signal "${name}" changed:`,
          oldValue,
          '->',
          newValue
        )
      }
    }

    // Copy the peek method
    tracked.peek = () => signal.peek()

    return tracked
  }

  /**
   * Track a computed value
   */
  trackComputed<T>(name: string, computed$: Computed<T>): Computed<T> {
    if (!this.enabled) return computed$

    const id = `computed_${this.idCounter++}`
    const debugInfo: ComputedDebugInfo = {
      id,
      name,
      value: computed$(),
      recalculationCount: 0,
      lastRecalculation: Date.now(),
      dependencies: [],
      isDirty: false,
      computationTime: 0,
    }

    this.computedRegistry.set(id, debugInfo)

    // Wrap computed with tracking
    const original = computed$
    const tracked = (() => {
      const startTime = performance.now()
      const value = original()
      const endTime = performance.now()

      debugInfo.value = value
      debugInfo.recalculationCount++
      debugInfo.lastRecalculation = Date.now()
      debugInfo.computationTime = endTime - startTime

      if (this.options.logComputed) {
        console.log(
          `[Flint Debug] Computed "${name}" recalculated:`,
          value,
          `(${(endTime - startTime).toFixed(2)}ms)`
        )
      }

      return value
    }) as Computed<T>

    return tracked
  }

  /**
   * Get debug info for a signal
   */
  getSignalDebugInfo(id: string): SignalDebugInfo | undefined {
    return this.signalRegistry.get(id)
  }

  /**
   * Get debug info for a computed
   */
  getComputedDebugInfo(id: string): ComputedDebugInfo | undefined {
    return this.computedRegistry.get(id)
  }

  /**
   * Get all tracked signals
   */
  getAllSignals(): SignalDebugInfo[] {
    return Array.from(this.signalRegistry.values())
  }

  /**
   * Get all tracked computed values
   */
  getAllComputed(): ComputedDebugInfo[] {
    return Array.from(this.computedRegistry.values())
  }

  /**
   * Clear all tracking data
   */
  clear(): void {
    this.signalRegistry.clear()
    this.computedRegistry.clear()
    this.effectRegistry.clear()
    this.idCounter = 0
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalSignals: number
    totalComputed: number
    totalEffects: number
    averageComputationTime: number
  } {
    const signals = this.getAllSignals()
    const computed = this.getAllComputed()

    const avgTime = computed.length > 0
      ? computed.reduce((sum, c) => sum + c.computationTime, 0) / computed.length
      : 0

    return {
      totalSignals: signals.length,
      totalComputed: computed.length,
      totalEffects: this.effectRegistry.size,
      averageComputationTime: avgTime,
    }
  }
}

// ─── Singleton Functions ────────────────────────────────────────

export function createDebugManager(options?: Partial<DebugOptions>): DebugManager {
  if (!debugManager) {
    debugManager = new DebugManager(options)
  }
  return debugManager
}

export function getDebugManager(): DebugManager | null {
  return debugManager
}

export function enableDebug(): DebugManager {
  if (!debugManager) {
    debugManager = new DebugManager({ enabled: true })
  } else {
    debugManager.enable()
  }
  return debugManager
}

export function disableDebug(): void {
  debugManager?.disable()
}

/**
 * Track a signal in debug mode
 */
export function trackSignal<T>(name: string, signal: Signal<T>): Signal<T> {
  if (!debugManager) {
    debugManager = new DebugManager({ enabled: true })
  }
  return debugManager.trackSignal(name, signal)
}

/**
 * Track a computed in debug mode
 */
export function trackComputed<T>(name: string, computed$: Computed<T>): Computed<T> {
  if (!debugManager) {
    debugManager = new DebugManager({ enabled: true })
  }
  return debugManager.trackComputed(name, computed$)
}

/**
 * Print signal history
 */
export function printSignalHistory(signalId: string): void {
  const info = debugManager?.getSignalDebugInfo(signalId)
  if (!info) {
    console.log('[Flint Debug] Signal not found:', signalId)
    return
  }

  console.log(`[Flint Debug] Signal "${info.name}" history:`)
  console.table(info.history)
}

/**
 * Print computed stats
 */
export function printComputedStats(computedId: string): void {
  const info = debugManager?.getComputedDebugInfo(computedId)
  if (!info) {
    console.log('[Flint Debug] Computed not found:', computedId)
    return
  }

  console.log(`[Flint Debug] Computed "${info.name}" stats:`)
  console.log('  Value:', info.value)
  console.log('  Recalculations:', info.recalculationCount)
  console.log('  Last Recalculation:', new Date(info.lastRecalculation).toISOString())
  console.log('  Computation Time:', info.computationTime.toFixed(2), 'ms')
}

/**
 * Print performance summary
 */
export function printPerformanceSummary(): void {
  if (!debugManager) {
    console.log('[Flint Debug] Debug manager not initialized')
    return
  }

  const summary = debugManager.getPerformanceSummary()
  console.log('[Flint Debug] Performance Summary:')
  console.log('  Total Signals:', summary.totalSignals)
  console.log('  Total Computed:', summary.totalComputed)
  console.log('  Total Effects:', summary.totalEffects)
  console.log('  Average Computation Time:', summary.averageComputationTime.toFixed(2), 'ms')
}
