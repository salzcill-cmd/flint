// Flint Runtime — Provide/Inject (Tree-Scoped)
// Dependency injection for component trees with proper tree traversal

import { type Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export interface InjectionKey<T> {
  readonly __flint_injection_key: unique symbol
  readonly defaultValue?: T
}

export interface InjectionContext {
  <T>(key: InjectionKey<T> | string): T
}

// ─── Component Tree ─────────────────────────────────────────────

interface TreeNode {
  id: number
  parentId: number | null
  provides: Map<InjectionKey<any> | string, any>
}

const tree = new Map<number, TreeNode>()
let currentComponentId = 0

/**
 * Register a component in the tree (called by component())
 */
export function registerComponent(id: number, parentId: number | null): void {
  tree.set(id, { id, parentId, provides: new Map() })
}

/**
 * Unregister a component from the tree
 */
export function unregisterComponent(id: number): void {
  tree.delete(id)
}

/**
 * Get current component ID
 */
export function getCurrentComponentId(): number {
  return currentComponentId
}

/**
 * Set current component ID (called during render)
 */
export function setCurrentComponentId(id: number): void {
  currentComponentId = id
}

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
  const node = tree.get(currentComponentId)
  if (node) {
    node.provides.set(key, value)
  } else {
    // Fallback: create node if not registered
    const newNode: TreeNode = {
      id: currentComponentId,
      parentId: null,
      provides: new Map([[key, value]]),
    }
    tree.set(currentComponentId, newNode)
  }
}

// ─── inject() ───────────────────────────────────────────────────

/**
 * Inject a value provided by an ancestor component.
 * Traverses up the component tree to find the nearest provider.
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
  // Traverse up the component tree
  let nodeId: number | null = currentComponentId

  while (nodeId !== null) {
    const node = tree.get(nodeId)
    if (node && node.provides.has(key)) {
      return node.provides.get(key) as T
    }
    // Move to parent
    nodeId = node?.parentId ?? null
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
  let nodeId: number | null = currentComponentId

  while (nodeId !== null) {
    const node = tree.get(nodeId)
    if (node && node.provides.has(key)) {
      return true
    }
    nodeId = node?.parentId ?? null
  }

  return false
}

// ─── Cleanup ────────────────────────────────────────────────────

/**
 * Clear all injection contexts. Used for testing.
 */
export function clearInjectionContext(): void {
  tree.clear()
  currentComponentId = 0
}
