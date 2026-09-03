// Flint Runtime — Developer Experience
// Better error messages, warnings, and debugging utilities

// ─── Error Enhancement ──────────────────────────────────────────

interface FlintErrorInfo {
  message: string
  component?: string
  stack?: string
  hint?: string
  docs?: string
}

/**
 * Enhanced error message with component context and helpful hints.
 */
export function createDevError(info: FlintErrorInfo): Error {
  const { message, component, stack, hint, docs } = info

  let enhancedMessage = `\n🔷 Flint Error`
  if (component) {
    enhancedMessage += ` in <${component}>`
  }
  enhancedMessage += `\n${'─'.repeat(50)}`
  enhancedMessage += `\n❌ ${message}`

  if (hint) {
    enhancedMessage += `\n\n💡 Hint: ${hint}`
  }

  if (docs) {
    enhancedMessage += `\n📖 Docs: ${docs}`
  }

  if (stack) {
    enhancedMessage += `\n\nStack trace:\n${stack}`
  }

  enhancedMessage += `\n${'─'.repeat(50)}\n`

  const error = new Error(enhancedMessage)
  error.name = 'FlintError'
  return error
}

/**
 * Development warning with context.
 */
export function devWarning(message: string, component?: string): void {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return
  }

  let warning = `⚠️ Flint Warning`
  if (component) {
    warning += ` in <${component}>`
  }
  warning += `: ${message}`

  console.warn(warning)
}

// ─── Common Error Messages ──────────────────────────────────────

export const ErrorMessages = {
  // Reactivity
  SIGNAL_READ_OUTSIDE_EFFECT: 'Signal read outside of an effect. This may cause unexpected behavior.',
  COMPUTED_IN_LOOP: 'Computed value used inside a loop. Consider using a state instead.',
  EFFECT_DISPOSE_CALLED_TWICE: 'Effect dispose was called multiple times.',

  // Components
  COMPONENT_MISSING_KEY: 'List item missing key prop. Add a unique key for better performance.',
  COMPONENT_FUNCTION_EXPECTED: 'Expected a function component, got {type}.',
  COMPONENT_MISSING_CHILDREN: 'Component expects children but none were provided.',

  // Rendering
  RENDER_CONTAINER_NOT_FOUND: 'Render container not found: {selector}',
  RENDER_ALREADY_MOUNTED: 'Component is already mounted to a container.',
  RENDER_HYDRATION_MISMATCH: 'Server and client markup do not match. Hydration failed.',

  // Forms
  FORM_VALIDATOR_NOT_FUNCTION: 'Validator must be a function, got {type}.',
  FORM_FIELD_NOT_FOUND: 'Form field "{name}" not found.',

  // Router
  ROUTE_NOT_FOUND: 'Route "{path}" not found.',
  ROUTE_GUARD_REJECTED: 'Navigation to "{path}" was rejected by route guard.',

  // Store
  STORE_KEY_NOT_FOUND: 'Store key "{key}" not found.',
  STORE_READONLY: 'Store is in read-only mode.',

  // SSR
  SSR_TIMEOUT: 'Server-side rendering timed out after {ms}ms.',
  SSR_STREAM_ERROR: 'Error during streaming render.',

  // Security
  UNSAFE_URL_DETECTED: 'Unsafe URL detected: {url}. Use isSafeUrl() to validate.',
  CSP_VIOLATION: 'Content Security Policy violation: {directive}',

  // Performance
  RENDER_LOOP_DETECTED: 'Possible render loop detected. Check for state updates in render.',
  SLOW_EFFECT: 'Effect took {ms}ms to execute. Consider optimizing.',

  // Development
  HMR_UPDATE_FAILED: 'Hot Module Replacement update failed: {error}',
  DEVTOOLS_NOT_CONNECTED: 'DevTools not connected. Check your browser extension.',
} as const

/**
 * Format an error message with interpolation.
 *
 * @example
 * formatMessage(ErrorMessages.RENDER_CONTAINER_NOT_FOUND, { selector: '#app' })
 */
export function formatMessage(
  template: string,
  values?: Record<string, string | number>
): string {
  if (!values) return template

  return Object.entries(values).reduce(
    (msg, [key, value]) => msg.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template
  )
}

// ─── Development Helpers ────────────────────────────────────────

/**
 * Log a warning in development mode only.
 */
export function devLog(message: string, ...args: any[]): void {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return
  }
  console.log(`🔷 [Flint] ${message}`, ...args)
}

/**
 * Log an error in development mode only.
 */
export function devError(message: string, ...args: any[]): void {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return
  }
  console.error(`🔷 [Flint] ${message}`, ...args)
}

/**
 * Log a performance metric in development mode.
 */
export function devPerf(label: string, fn: () => void): void {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    fn()
    return
  }

  const start = performance.now()
  fn()
  const end = performance.now()
  const duration = end - start

  if (duration > 16) {
    console.warn(`🔷 [Flint] Slow operation "${label}": ${duration.toFixed(2)}ms`)
  } else {
    console.log(`🔷 [Flint] ${label}: ${duration.toFixed(2)}ms`)
  }
}

/**
 * Assert a condition and throw a dev error if false.
 */
export function devAssert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw createDevError({ message })
  }
}

/**
 * Deprecated function warning.
 */
export function devDeprecated(
  oldName: string,
  newName: string,
  removalVersion?: string
): void {
  let message = `${oldName} is deprecated. Use ${newName} instead.`
  if (removalVersion) {
    message += ` Will be removed in v${removalVersion}.`
  }
  devWarning(message)
}

// ─── Component Display Names ────────────────────────────────────

/**
 * Set a display name for a component (useful for debugging).
 */
export function setDisplayName<T extends (...args: any[]) => any>(
  component: T,
  name: string
): T {
  Object.defineProperty(component, 'displayName', {
    value: name,
    writable: true,
    configurable: true,
  })
  return component
}

/**
 * Get the display name of a component.
 */
export function getDisplayName(component: any): string {
  if (typeof component === 'string') return component
  if (typeof component === 'function') {
    return component.displayName || component.name || 'Anonymous'
  }
  return 'Unknown'
}

// ─── Performance Monitoring ─────────────────────────────────────

interface PerfEntry {
  label: string
  duration: number
  timestamp: number
}

const perfEntries: PerfEntry[] = []

/**
 * Record a performance entry.
 */
export function recordPerf(label: string, duration: number): void {
  perfEntries.push({
    label,
    duration,
    timestamp: Date.now(),
  })

  // Keep only last 100 entries
  if (perfEntries.length > 100) {
    perfEntries.shift()
  }
}

/**
 * Get all performance entries.
 */
export function getPerfEntries(): PerfEntry[] {
  return [...perfEntries]
}

/**
 * Clear performance entries.
 */
export function clearPerfEntries(): void {
  perfEntries.length = 0
}

/**
 * Get average duration for a label.
 */
export function getAvgPerf(label: string): number {
  const entries = perfEntries.filter(e => e.label === label)
  if (entries.length === 0) return 0
  return entries.reduce((sum, e) => sum + e.duration, 0) / entries.length
}
