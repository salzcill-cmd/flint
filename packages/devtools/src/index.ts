// Flint DevTools — Client-side instrumentation
// Attaches to Flint's reactive system for debugging

import { effect, computed, state, type Signal } from '@flint/reactivity'

export interface DevToolsOptions {
  /** Enable devtools in production */
  enabled?: boolean
  /** Custom name for this app */
  appName?: string
  /** Log level */
  logLevel?: 'none' | 'error' | 'warn' | 'info' | 'debug'
}

export interface SignalInfo {
  id: string
  name: string
  value: any
  type: 'state' | 'computed' | 'effect'
  subscribers: number
  dependencies: string[]
}

export interface ComponentInfo {
  id: string
  name: string
  props: Record<string, any>
  signals: SignalInfo[]
  renderCount: number
  mountTime: number
}

// ─── Global DevTools State ──────────────────────────────────────

let _enabled = false
let _logLevel: DevToolsOptions['logLevel'] = 'warn'
const _signals = new Map<string, SignalInfo>()
const _components = new Map<string, ComponentInfo>()
let _signalCounter = 0
let _componentCounter = 0

// ─── DevTools API ───────────────────────────────────────────────

/**
 * Initialize Flint DevTools
 */
export function initDevTools(options: DevToolsOptions = {}): void {
  _enabled = options.enabled !== false && typeof window !== 'undefined'
  _logLevel = options.logLevel || 'warn'

  if (!_enabled) return

  // Attach to window for browser extension
  if (typeof window !== 'undefined') {
    (window as any).__FLINT_DEVTOOLS__ = {
      signals: _signals,
      components: _components,
      getSignal: getSignalInfo,
      getSignals: getAllSignals,
      getComponent: getComponentInfo,
      getComponents: getAllComponents,
      log: devToolsLog,
    }

    // Notify extension
    sendToExtension('INIT', { appName: options.appName })
  }
}

/**
 * Track a reactive signal
 */
export function trackSignal<T>(
  signal: Signal<T>,
  name: string,
  type: 'state' | 'computed' | 'effect' = 'state'
): void {
  if (!_enabled) return

  const id = `signal_${++_signalCounter}`
  const info: SignalInfo = {
    id,
    name,
    value: undefined,
    type,
    subscribers: 0,
    dependencies: [],
  }

  _signals.set(id, info)

  // Track value changes
  effect(() => {
    const value = signal()
    const prev = info.value
    info.value = value

    if (_logLevel === 'debug') {
      devToolsLog('info', `[Signal] ${name} changed:`, { prev, next: value })
    }

    sendToExtension('SIGNAL_UPDATE', { id, name, value, type })
  })
}

/**
 * Track a component
 */
export function trackComponent(
  name: string,
  props: Record<string, any> = {}
): string {
  if (!_enabled) return ''

  const id = `component_${++_componentCounter}`
  const info: ComponentInfo = {
    id,
    name,
    props,
    signals: [],
    renderCount: 1,
    mountTime: performance.now(),
  }

  _components.set(id, info)
  sendToExtension('COMPONENT_MOUNT', { id, name, props })

  return id
}

/**
 * Update component info
 */
export function updateComponent(
  id: string,
  updates: Partial<ComponentInfo>
): void {
  if (!_enabled) return

  const info = _components.get(id)
  if (!info) return

  Object.assign(info, updates)
  info.renderCount++

  sendToExtension('COMPONENT_UPDATE', { id, ...updates })
}

/**
 * Unmount component
 */
export function unmountComponent(id: string): void {
  if (!_enabled) return

  _components.delete(id)
  sendToExtension('COMPONENT_UNMOUNT', { id })
}

// ─── Query API ──────────────────────────────────────────────────

function getSignalInfo(id: string): SignalInfo | undefined {
  return _signals.get(id)
}

function getAllSignals(): SignalInfo[] {
  return Array.from(_signals.values())
}

function getComponentInfo(id: string): ComponentInfo | undefined {
  return _components.get(id)
}

function getAllComponents(): ComponentInfo[] {
  return Array.from(_components.values())
}

// ─── Logging ────────────────────────────────────────────────────

function devToolsLog(
  level: 'error' | 'warn' | 'info' | 'debug',
  message: string,
  data?: any
): void {
  const levels = ['error', 'warn', 'info', 'debug']
  const configLevel = levels.indexOf(_logLevel || 'warn')
  const msgLevel = levels.indexOf(level)

  if (msgLevel > configLevel) return

  const prefix = '%c[Flint DevTools]'
  const style = `color: ${level === 'error' ? 'red' : level === 'warn' ? 'orange' : level === 'info' ? 'blue' : 'gray'}; font-weight: bold;`

  switch (level) {
    case 'error':
      console.error(prefix, style, message, data)
      break
    case 'warn':
      console.warn(prefix, style, message, data)
      break
    case 'info':
      console.info(prefix, style, message, data)
      break
    case 'debug':
      console.debug(prefix, style, message, data)
      break
  }
}

// ─── Browser Extension Communication ────────────────────────────

function sendToExtension(type: string, payload: any): void {
  if (typeof window === 'undefined') return

  // Send via postMessage for browser extension
  window.postMessage({
    source: 'flint-devtools',
    type,
    payload,
  }, '*')
}

// ─── Performance Tracking ───────────────────────────────────────

export interface PerformanceMetric {
  name: string
  duration: number
  startTime: number
}

/**
 * Track performance metric
 */
export function trackPerformance(name: string): () => number {
  const startTime = performance.now()

  return () => {
    const duration = performance.now() - startTime
    const metric: PerformanceMetric = { name, duration, startTime }

    if (_logLevel === 'debug') {
      devToolsLog('info', `[Perf] ${name}:`, { duration: `${duration.toFixed(2)}ms` })
    }

    sendToExtension('PERF_METRIC', metric)
    return duration
  }
}

// ─── Error Tracking ─────────────────────────────────────────────

export interface ErrorInfo {
  message: string
  stack?: string
  componentId?: string
  signalId?: string
}

/**
 * Track error
 */
export function trackError(
  error: Error,
  context?: { componentId?: string; signalId?: string }
): void {
  const errorInfo: ErrorInfo = {
    message: error.message,
    stack: error.stack,
    ...context,
  }

  devToolsLog('error', '[Error]', errorInfo)
  sendToExtension('ERROR', errorInfo)
}

// ─── Signal Graph ───────────────────────────────────────────────

export interface SignalGraph {
  nodes: Array<{ id: string; name: string; type: string }>
  edges: Array<{ source: string; target: string; type: string }>
}

/**
 * Build dependency graph of signals
 */
export function buildSignalGraph(): SignalGraph {
  const nodes: SignalGraph['nodes'] = []
  const edges: SignalGraph['edges'] = []

  for (const [id, info] of _signals) {
    nodes.push({ id, name: info.name, type: info.type })

    // Add dependency edges
    for (const depId of info.dependencies) {
      edges.push({ source: depId, target: id, type: 'depends' })
    }
  }

  return { nodes, edges }
}
