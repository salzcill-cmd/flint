// Flint Runtime — Performance Monitoring
// Lightweight performance tracking and metrics

// ─── Types ──────────────────────────────────────────────────────

export interface PerformanceMetric {
  name: string
  startTime: number
  endTime: number
  duration: number
  metadata?: Record<string, any>
}

export interface PerformanceEntry {
  name: string
  duration: number
  timestamp: number
  type: 'component' | 'effect' | 'navigation' | 'api' | 'custom'
  metadata?: Record<string, any>
}

export interface PerformanceConfig {
  /** Enable performance monitoring */
  enabled?: boolean
  /** Maximum entries to keep */
  maxEntries?: number
  /** Log to console */
  logToConsole?: boolean
  /** Send to analytics endpoint */
  sendTo?: (entries: PerformanceEntry[]) => void
}

// ─── Performance Monitor ────────────────────────────────────────

const entries: PerformanceEntry[] = []
const timers = new Map<string, number>()
let config: PerformanceConfig = {
  enabled: true,
  maxEntries: 100,
  logToConsole: false,
}

/**
 * Initialize performance monitoring.
 *
 * @example
 * initPerformance({
 *   enabled: true,
 *   logToConsole: true,
 *   maxEntries: 200,
 * })
 */
export function initPerformance(options: PerformanceConfig): void {
  config = { ...config, ...options }
}

/**
 * Start a performance timer.
 *
 * @example
 * performanceStart('api-fetch')
 * const data = await fetch('/api/data')
 * performanceEnd('api-fetch', { url: '/api/data' })
 */
export function performanceStart(name: string): void {
  if (!config.enabled) return
  timers.set(name, performance.now())
}

/**
 * End a performance timer and record the metric.
 */
export function performanceEnd(
  name: string,
  metadata?: Record<string, any>,
  type: PerformanceEntry['type'] = 'custom'
): PerformanceMetric | null {
  if (!config.enabled) return null

  const startTime = timers.get(name)
  if (startTime === undefined) {
    console.warn(`[Flint Perf] No timer started for "${name}"`)
    return null
  }

  timers.delete(name)
  const endTime = performance.now()
  const duration = endTime - startTime

  const entry: PerformanceEntry = {
    name,
    duration,
    timestamp: Date.now(),
    type,
    metadata,
  }

  entries.push(entry)

  // Trim old entries
  if (entries.length > (config.maxEntries ?? 100)) {
    entries.shift()
  }

  // Log to console
  if (config.logToConsole && process.env.NODE_ENV !== 'production') {
    console.log(`[Flint Perf] ${name}: ${duration.toFixed(2)}ms`, metadata ?? '')
  }

  return { name, startTime, endTime, duration, metadata }
}

/**
 * Record a single performance metric.
 */
export function recordMetric(
  name: string,
  duration: number,
  type: PerformanceEntry['type'] = 'custom',
  metadata?: Record<string, any>
): void {
  if (!config.enabled) return

  const entry: PerformanceEntry = {
    name,
    duration,
    timestamp: Date.now(),
    type,
    metadata,
  }

  entries.push(entry)

  if (entries.length > (config.maxEntries ?? 100)) {
    entries.shift()
  }

  if (config.logToConsole && process.env.NODE_ENV !== 'production') {
    console.log(`[Flint Perf] ${name}: ${duration.toFixed(2)}ms`, metadata ?? '')
  }
}

/**
 * Get all recorded performance entries.
 */
export function getEntries(): PerformanceEntry[] {
  return [...entries]
}

/**
 * Get entries filtered by type.
 */
export function getEntriesByType(type: PerformanceEntry['type']): PerformanceEntry[] {
  return entries.filter(e => e.type === type)
}

/**
 * Get average duration for a metric name.
 */
export function getAverageDuration(name: string): number {
  const matching = entries.filter(e => e.name === name)
  if (matching.length === 0) return 0
  return matching.reduce((sum, e) => sum + e.duration, 0) / matching.length
}

/**
 * Get performance summary.
 */
export function getSummary(): Record<string, { count: number; avgDuration: number; totalDuration: number }> {
  const summary: Record<string, { count: number; avgDuration: number; totalDuration: number }> = {}

  for (const entry of entries) {
    if (!summary[entry.name]) {
      summary[entry.name] = { count: 0, avgDuration: 0, totalDuration: 0 }
    }
    summary[entry.name].count++
    summary[entry.name].totalDuration += entry.duration
  }

  for (const key of Object.keys(summary)) {
    summary[key].avgDuration = summary[key].totalDuration / summary[key].count
  }

  return summary
}

/**
 * Clear all recorded entries.
 */
export function clearEntries(): void {
  entries.length = 0
  timers.clear()
}

// ─── Component Performance Tracking ─────────────────────────────

/**
 * Wrap a component render function with performance tracking.
 *
 * @example
 * const TrackedComponent = trackRender('MyComponent', () => {
 *   return <div>...</div>
 * })
 */
export function trackRender<T>(
  name: string,
  renderFn: () => T
): () => T {
  return () => {
    performanceStart(`render:${name}`)
    try {
      const result = renderFn()
      return result
    } finally {
      performanceEnd(`render:${name}`, undefined, 'component')
    }
  }
}

// ─── API Performance Tracking ───────────────────────────────────

/**
 * Track API call performance.
 *
 * @example
 * const data = await trackApi('/api/users', async () => {
 *   const res = await fetch('/api/users')
 *   return res.json()
 * })
 */
export async function trackApi<T>(
  name: string,
  apiFn: () => Promise<T>
): Promise<T> {
  performanceStart(`api:${name}`)
  try {
    const result = await apiFn()
    performanceEnd(`api:${name}`, { success: true }, 'api')
    return result
  } catch (error) {
    performanceEnd(`api:${name}`, {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, 'api')
    throw error
  }
}

// ─── Effect Performance Tracking ────────────────────────────────

/**
 * Track effect execution performance.
 *
 * @example
 * effect(() => {
 *   trackEffect('ui-update', () => {
 *     updateDOM(state())
 *   })
 * })
 */
export function trackEffect(name: string, effectFn: () => void): void {
  performanceStart(`effect:${name}`)
  try {
    effectFn()
  } finally {
    performanceEnd(`effect:${name}`, undefined, 'effect')
  }
}

// ─── Navigation Performance ─────────────────────────────────────

/**
 * Track page navigation performance.
 */
export function trackNavigation(name: string, navigationFn: () => void | Promise<void>): void | Promise<void> {
  performanceStart(`nav:${name}`)
  const result = navigationFn()
  if (result instanceof Promise) {
    return result.then(() => {
      performanceEnd(`nav:${name}`, undefined, 'navigation')
    })
  }
  performanceEnd(`nav:${name}`, undefined, 'navigation')
}

// ─── Resource Timing ────────────────────────────────────────────

/**
 * Get resource timing data for all loaded resources.
 */
export function getResourceTimings(): Array<{
  name: string
  duration: number
  type: string
}> {
  if (typeof performance === 'undefined') return []

  const resources = performance.getEntriesByType('resource')
  return resources.map(r => ({
    name: r.name,
    duration: r.duration,
    type: (r as any).initiatorType || 'unknown',
  }))
}

/**
 * Get Core Web Vitals (if available).
 */
export function getWebVitals(): Promise<{
  CLS?: number
  FID?: number
  LCP?: number
}> {
  return new Promise((resolve) => {
    const vitals: { CLS?: number; FID?: number; LCP?: number } = {}

    // CLS
    if ('PerformanceObserver' in window) {
      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ('value' in entry) {
              vitals.CLS = (vitals.CLS || 0) + (entry as any).value
            }
          }
        })
        clsObserver.observe({ type: 'layout-shift', buffered: true })
      } catch (e) {
        console.warn('[Flint] CLS observer setup failed:', e)
      }
    }

    // Give some time for metrics to be collected
    setTimeout(() => {
      resolve(vitals)
    }, 1000)
  })
}
