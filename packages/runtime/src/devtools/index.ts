// Flint Runtime — DevTools
// Debugging tools, component inspector, state inspector, profiler

import { state, computed } from '@flint/reactivity'
import type { Signal, Computed } from '@flint/reactivity'

// ─── Helpers ────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ─── Types ──────────────────────────────────────────────────────

export interface DevToolsComponent {
  id: string
  name: string
  parentId: string | null
  props: Record<string, any>
  state: Record<string, any>
  renderTime: number
  mountTime: number
  updateCount: number
  children: string[]
}

export interface DevToolsSignal {
  id: string
  value: any
  subscribers: number
  createdAt: number
  lastUpdated: number
  history: SignalSnapshot[]
}

export interface SignalSnapshot {
  value: any
  timestamp: number
}

export interface DevToolsStore {
  id: string
  name: string
  state: Record<string, any>
  subscribers: number
}

export interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
}

export interface DevToolsOptions {
  /** Enable DevTools */
  enabled?: boolean
  /** Enable performance profiler */
  profiler?: boolean
  /** Enable component tree */
  components?: boolean
  /** Enable state inspector */
  state?: boolean
  /** Max history snapshots */
  maxHistory?: number
}

export interface DevToolsEvent {
  type: 'component:mount' | 'component:update' | 'component:unmount' |
        'signal:create' | 'signal:update' | 'signal:delete' |
        'store:create' | 'store:update' | 'store:delete' |
        'performance:measure' | 'error' | 'warning'
  data: any
  timestamp: number
}

// ─── DevTools Singleton ─────────────────────────────────────────

let devtoolsInstance: DevTools | null = null

// ─── DevTools Class ─────────────────────────────────────────────

export class DevTools {
  private options!: Required<DevToolsOptions>
  private components = new Map<string, DevToolsComponent>()
  private signals = new Map<string, DevToolsSignal>()
  private stores = new Map<string, DevToolsStore>()
  private performance: PerformanceMetric[] = []
  private events: DevToolsEvent[] = []
  private listeners = new Map<string, Set<(event: DevToolsEvent) => void>>()
  private enabled!: boolean

  constructor(options: DevToolsOptions = {}) {
    if (devtoolsInstance) {
      return devtoolsInstance
    }

    this.options = {
      enabled: options.enabled ?? true,
      profiler: options.profiler ?? true,
      components: options.components ?? true,
      state: options.state ?? true,
      maxHistory: options.maxHistory ?? 100,
    }

    this.enabled = this.options.enabled && typeof window !== 'undefined'

    if (this.enabled) {
      this.setupGlobalHook()
    }

    devtoolsInstance = this
  }

  // ─── Global Hook ──────────────────────────────────────────

  private setupGlobalHook(): void {
    const hook = (window as any).__FLINT_DEVTOOLS__

    if (hook) {
      // Integrate with existing hook
      hook.devtools = this
    } else {
      // Create global hook
      ;(window as any).__FLINT_DEVTOOLS__ = {
        devtools: this,
        version: '0.1.0',
      }
    }
  }

  // ─── Event System ─────────────────────────────────────────

  /**
   * Subscribe to DevTools events.
   */
  on(event: string, callback: (event: DevToolsEvent) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  /**
   * Emit a DevTools event.
   */
  emit(type: DevToolsEvent['type'], data: any): void {
    const event: DevToolsEvent = {
      type,
      data,
      timestamp: Date.now(),
    }

    this.events.push(event)

    // Keep only last N events
    if (this.events.length > 1000) {
      this.events.shift()
    }

    // Notify listeners
    const listeners = this.listeners.get(type)
    if (listeners) {
      for (const listener of listeners) {
        listener(event)
      }
    }

    // Log to console in development
    if (this.options.enabled && typeof console !== 'undefined') {
      console.log(`[Flint DevTools] ${type}`, data)
    }
  }

  // ─── Component Tracking ───────────────────────────────────

  /**
   * Register a component.
   */
  registerComponent(
    id: string,
    name: string,
    parentId: string | null,
    props: Record<string, any>
  ): void {
    if (!this.options.components) return

    const component: DevToolsComponent = {
      id,
      name,
      parentId,
      props: { ...props },
      state: {},
      renderTime: 0,
      mountTime: Date.now(),
      updateCount: 0,
      children: [],
    }

    this.components.set(id, component)

    // Add to parent
    if (parentId) {
      const parent = this.components.get(parentId)
      if (parent) {
        parent.children.push(id)
      }
    }

    this.emit('component:mount', { id, name, props })
  }

  /**
   * Update component state.
   */
  updateComponent(id: string, state: Record<string, any>): void {
    if (!this.options.components) return

    const component = this.components.get(id)
    if (component) {
      component.state = { ...state }
      component.updateCount++
    }

    this.emit('component:update', { id, state })
  }

  /**
   * Unregister a component.
   */
  unregisterComponent(id: string): void {
    if (!this.options.components) return

    const component = this.components.get(id)
    if (component) {
      // Remove from parent
      if (component.parentId) {
        const parent = this.components.get(component.parentId)
        if (parent) {
          parent.children = parent.children.filter((childId) => childId !== id)
        }
      }

      // Remove children recursively
      for (const childId of component.children) {
        this.unregisterComponent(childId)
      }

      this.components.delete(id)
    }

    this.emit('component:unmount', { id })
  }

  /**
   * Set component render time.
   */
  setRenderTime(id: string, time: number): void {
    const component = this.components.get(id)
    if (component) {
      component.renderTime = time
    }
  }

  /**
   * Get component tree.
   */
  getComponentTree(): DevToolsComponent[] {
    return Array.from(this.components.values())
  }

  /**
   * Get component by ID.
   */
  getComponent(id: string): DevToolsComponent | undefined {
    return this.components.get(id)
  }

  // ─── Signal Tracking ──────────────────────────────────────

  /**
   * Register a signal.
   */
  registerSignal(id: string, value: any): void {
    if (!this.options.state) return

    const signal: DevToolsSignal = {
      id,
      value,
      subscribers: 0,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      history: [{ value, timestamp: Date.now() }],
    }

    this.signals.set(id, signal)
    this.emit('signal:create', { id, value })
  }

  /**
   * Update signal value.
   */
  updateSignal(id: string, value: any): void {
    if (!this.options.state) return

    const signal = this.signals.get(id)
    if (signal) {
      signal.value = value
      signal.lastUpdated = Date.now()
      signal.history.push({ value, timestamp: Date.now() })

      // Keep only max history
      if (signal.history.length > this.options.maxHistory) {
        signal.history.shift()
      }
    }

    this.emit('signal:update', { id, value })
  }

  /**
   * Delete a signal.
   */
  deleteSignal(id: string): void {
    this.signals.delete(id)
    this.emit('signal:delete', { id })
  }

  /**
   * Get all signals.
   */
  getSignals(): DevToolsSignal[] {
    return Array.from(this.signals.values())
  }

  // ─── Store Tracking ───────────────────────────────────────

  /**
   * Register a store.
   */
  registerStore(id: string, name: string, state: Record<string, any>): void {
    if (!this.options.state) return

    const store: DevToolsStore = {
      id,
      name,
      state: { ...state },
      subscribers: 0,
    }

    this.stores.set(id, store)
    this.emit('store:create', { id, name, state })
  }

  /**
   * Update store state.
   */
  updateStore(id: string, state: Record<string, any>): void {
    if (!this.options.state) return

    const store = this.stores.get(id)
    if (store) {
      store.state = { ...state }
    }

    this.emit('store:update', { id, state })
  }

  /**
   * Delete a store.
   */
  deleteStore(id: string): void {
    this.stores.delete(id)
    this.emit('store:delete', { id })
  }

  /**
   * Get all stores.
   */
  getStores(): DevToolsStore[] {
    return Array.from(this.stores.values())
  }

  // ─── Performance ──────────────────────────────────────────

  /**
   * Start a performance measurement.
   */
  startMeasure(name: string): () => number {
    const start = performance.now()

    return () => {
      const duration = performance.now() - start

      if (this.options.profiler) {
        const metric: PerformanceMetric = {
          name,
          duration,
          timestamp: Date.now(),
        }

        this.performance.push(metric)

        // Keep only last 100 measurements
        if (this.performance.length > 100) {
          this.performance.shift()
        }

        this.emit('performance:measure', metric)
      }

      return duration
    }
  }

  /**
   * Get performance metrics.
   */
  getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performance]
  }

  /**
   * Clear performance metrics.
   */
  clearPerformanceMetrics(): void {
    this.performance = []
  }

  // ─── Events ───────────────────────────────────────────────

  /**
   * Get all events.
   */
  getEvents(): DevToolsEvent[] {
    return [...this.events]
  }

  /**
   * Clear events.
   */
  clearEvents(): void {
    this.events = []
  }

  // ─── Cleanup ──────────────────────────────────────────────

  /**
   * Reset all DevTools data.
   */
  reset(): void {
    this.components.clear()
    this.signals.clear()
    this.stores.clear()
    this.performance = []
    this.events = []
  }
}

// ─── Singleton Functions ────────────────────────────────────────

/**
 * Create or get the DevTools instance.
 */
export function createDevTools(options?: DevToolsOptions): DevTools {
  if (!devtoolsInstance) {
    devtoolsInstance = new DevTools(options)
  }
  return devtoolsInstance
}

/**
 * Get the current DevTools instance.
 */
export function getDevTools(): DevTools | null {
  return devtoolsInstance
}

/**
 * Destroy DevTools instance.
 */
export function destroyDevTools(): void {
  devtoolsInstance?.reset()
  devtoolsInstance = null
}

// ─── Development Warnings ───────────────────────────────────────

const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'

/**
 * Show a development warning.
 */
export function devWarning(condition: boolean, message: string): void {
  if (isDev && !condition) {
    console.warn(`[Flint Warning] ${message}`)
  }
}

/**
 * Show a development error.
 */
export function devError(condition: boolean, message: string): void {
  if (isDev && !condition) {
    console.error(`[Flint Error] ${message}`)
  }
}

// ─── Error Overlay ──────────────────────────────────────────────

let overlayElement: HTMLElement | null = null

/**
 * Show an error overlay (development only).
 */
export function showErrorOverlay(
  error: Error,
  componentStack?: string
): void {
  if (!isDev || typeof document === 'undefined') return

  // Remove existing overlay
  hideErrorOverlay()

  // Create overlay
  overlayElement = document.createElement('div')
  overlayElement.id = 'flint-error-overlay'
  overlayElement.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      padding: 20px;
      overflow: auto;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="max-width: 800px; margin: 0 auto;">
        <h2 style="color: #ff6b6b; margin-top: 0;">
          ${escapeHtml(error.name)}: ${escapeHtml(error.message)}
        </h2>
        <pre style="
          background: #1a1a1a;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          font-size: 14px;
          line-height: 1.5;
        ">${escapeHtml(error.stack || 'No stack trace')}</pre>
        ${componentStack ? `
          <h3 style="margin-top: 24px;">Component Stack:</h3>
          <pre style="
            background: #1a1a1a;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 14px;
            line-height: 1.5;
          ">${escapeHtml(componentStack)}</pre>
        ` : ''}
        <button onclick="this.closest('#flint-error-overlay').remove()" style="
          margin-top: 16px;
          padding: 8px 16px;
          background: #ff6b6b;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        ">Dismiss</button>
      </div>
    </div>
  `

  document.body.appendChild(overlayElement)
}

/**
 * Hide error overlay.
 */
export function hideErrorOverlay(): void {
  if (overlayElement) {
    overlayElement.remove()
    overlayElement = null
  }
}

// ─── Debug Utilities ────────────────────────────────────────────

/**
 * Log component tree to console.
 */
export function logComponentTree(): void {
  if (process.env.NODE_ENV === 'production') return

  const devtools = getDevTools()
  if (!devtools) {
    console.log('[Flint] DevTools not initialized')
    return
  }

  const tree = devtools.getComponentTree()
  console.group('[Flint Component Tree]')
  for (const component of tree) {
    console.log(`${component.name} (${component.id})`, component)
  }
  console.groupEnd()
}

/**
 * Log signals to console.
 */
export function logSignals(): void {
  if (process.env.NODE_ENV === 'production') return

  const devtools = getDevTools()
  if (!devtools) {
    console.log('[Flint] DevTools not initialized')
    return
  }

  const signals = devtools.getSignals()
  console.group('[Flint Signals]')
  for (const signal of signals) {
    console.log(`${signal.id}:`, signal.value)
  }
  console.groupEnd()
}

/**
 * Log stores to console.
 */
export function logStores(): void {
  if (process.env.NODE_ENV === 'production') return

  const devtools = getDevTools()
  if (!devtools) {
    console.log('[Flint] DevTools not initialized')
    return
  }

  const stores = devtools.getStores()
  console.group('[Flint Stores]')
  for (const store of stores) {
    console.log(`${store.name}:`, store.state)
  }
  console.groupEnd()
}

/**
 * Start a performance trace.
 */
export function startTrace(name: string): () => void {
  const devtools = getDevTools()
  if (!devtools) {
    return () => {}
  }

  return devtools.startMeasure(name)
}

/**
 * Check if running in development mode.
 */
export function isDevelopment(): boolean {
  return isDev
}

// Advanced DevTools v2
export {
  AdvancedDevTools,
  TimeTravelDebugger,
  PerformanceAnalyzer,
  StateInspector,
  createAdvancedDevTools,
  getAdvancedDevTools,
  recordState,
  undo,
  redo,
  calculateStateDiff,
  formatStateDiff,
} from './advanced.js'
export type {
  StateDiff,
  TimeTravelEntry,
  PerformanceInsight,
  StateSnapshot,
} from './advanced.js'
