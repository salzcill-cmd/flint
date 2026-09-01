// Flint Runtime — Provide/Inject
// Dependency injection for component trees

import { state, type Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export interface InjectionContext {
  <T>(key: InjectionKey<T> | string): T
}

export interface InjectionKey<T> {
  readonly __flint_injection_key: unique symbol
  readonly defaultValue?: T
}

// ─── Context Storage ────────────────────────────────────────────

// Store for provided values, keyed by component ID
const provideMap = new Map<string, Map<InjectionKey<any> | string, any>>()
let currentComponentId = 0

// ─── createInjectionKey ─────────────────────────────────────────

/**
 * Create a typed injection key.
 *
 * @example
 * import { createInjectionKey } from 'flint'
 *
 * interface ThemeContext {
 *   color: string
 *   fontSize: string
 * }
 *
 * const ThemeKey = createInjectionKey<ThemeContext>()
 */
export function createInjectionKey<T>(defaultValue?: T): InjectionKey<T> {
  return {
    __flint_injection_key: Symbol('flint.injection') as any,
    defaultValue,
  }
}

// ─── provide() ──────────────────────────────────────────────────

/**
 * Provide a value to descendant components.
 *
 * @example
 * const ThemeKey = createInjectionKey<{ color: string }>()
 *
 * const App = component(() => {
 *   provide(ThemeKey, { color: 'blue' })
 *   return h('div', null, h(Child, {}))
 * })
 *
 * const Child = component(() => {
 *   const theme = inject(ThemeKey)
 *   return h('div', { style: { color: theme.color } }, 'Hello')
 * })
 */
export function provide<T>(
  key: InjectionKey<T> | string,
  value: T
): void {
  const componentId = String(currentComponentId)

  if (!provideMap.has(componentId)) {
    provideMap.set(componentId, new Map())
  }

  provideMap.get(componentId)!.set(key, value)
}

// ─── inject() ───────────────────────────────────────────────────

/**
 * Inject a value provided by an ancestor component.
 *
 * @example
 * const ThemeKey = createInjectionKey<{ color: string }>()
 *
 * const Child = component(() => {
 *   const theme = inject(ThemeKey, { color: 'red' })
 *   return h('div', { style: { color: theme.color } }, 'Hello')
 * })
 */
export function inject<T>(
  key: InjectionKey<T> | string,
  defaultValue?: T
): T {
  // Search up the component tree
  // For now, use a simple approach: search all provided values
  for (const [componentId, values] of provideMap) {
    if (values.has(key)) {
      return values.get(key) as T
    }
  }

  // Use default value
  if (defaultValue !== undefined) {
    return defaultValue
  }

  // Use injection key default
  if (typeof key === 'object' && key.defaultValue !== undefined) {
    return key.defaultValue as T
  }

  throw new Error(`[Flint] No provider found for injection key`)
}

// ─── hasInjection ───────────────────────────────────────────────

/**
 * Check if a value is provided for a given key.
 */
export function hasInjection(key: InjectionKey<any> | string): boolean {
  for (const [, values] of provideMap) {
    if (values.has(key)) {
      return true
    }
  }
  return false
}

// ─── Cleanup ────────────────────────────────────────────────────

/**
 * Clear all injection contexts. Used for testing.
 */
export function clearInjectionContext(): void {
  provideMap.clear()
}
