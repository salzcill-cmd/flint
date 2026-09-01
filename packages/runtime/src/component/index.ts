// Flint Runtime — Component System
// Lifecycle hooks, context, and component management

import { effect, type CleanupFn, type Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export type ComponentFunction<P = {}> = (props: P) => any

export interface ComponentContext {
  onMount(fn: () => void | CleanupFn): void
  onUpdate(fn: () => void | CleanupFn): void
  onDestroy(fn: () => void): void
}

export interface ComponentInstance {
  id: number
  mountCleanups: CleanupFn[]
  updateCleanups: CleanupFn[]
  destroyCallbacks: (() => void)[]
  mounted: boolean
  disposed: boolean
}

// ─── Component Instance Management ──────────────────────────────

let nextComponentId = 0
const componentInstances = new Map<number, ComponentInstance>()

// Current component being rendered (for lifecycle hook registration)
let currentInstance: ComponentInstance | null = null

export function getCurrentInstance(): ComponentContext | null {
  if (!currentInstance) return null
  return createPublicContext(currentInstance)
}

function createPublicContext(instance: ComponentInstance): ComponentContext {
  return {
    onMount(fn: () => void | CleanupFn) {
      if (!instance.mounted) {
        // Queue for after mount
        const cleanup = fn()
        if (typeof cleanup === 'function') {
          instance.mountCleanups.push(cleanup)
        }
      }
    },

    onUpdate(fn: () => void | CleanupFn) {
      const cleanup = fn()
      if (typeof cleanup === 'function') {
        instance.updateCleanups.push(cleanup)
      }
    },

    onDestroy(fn: () => void) {
      instance.destroyCallbacks.push(fn)
    },
  }
}

// ─── Component Wrapper ──────────────────────────────────────────

/**
 * Create a Flint component with lifecycle support.
 *
 * @example
 * const Counter = component((props) => {
 *   const count = state(0)
 *   const ctx = getCurrentInstance()
 *
 *   ctx.onMount(() => {
 *     console.log('Counter mounted!')
 *     return () => console.log('Counter unmounted')
 *   })
 *
 *   return (
 *     <button onClick={() => count.set(c => c + 1)}>
 *       Count: {count()}
 *     </button>
 *   )
 * })
 */
export function component<P extends Record<string, any>>(
  fn: ComponentFunction<P>
): ComponentFunction<P> {
  const wrappedFn = (props: P) => {
    const instance: ComponentInstance = {
      id: nextComponentId++,
      mountCleanups: [],
      updateCleanups: [],
      destroyCallbacks: [],
      mounted: false,
      disposed: false,
    }

    // Set current instance for lifecycle hook registration
    const prevInstance = currentInstance
    currentInstance = instance
    componentInstances.set(instance.id, instance)

    try {
      const result = fn(props)
      return result
    } finally {
      currentInstance = prevInstance
    }
  }

  // Mark as Flint component for runtime identification
  ;(wrappedFn as any).__flint_component = true
  ;(wrappedFn as any).__flint_original = fn

  return wrappedFn
}

// ─── Component Lifecycle Management ─────────────────────────────

/**
 * Mark a component instance as mounted.
 * Called by the renderer after DOM insertion.
 */
export function mountComponent(instance: ComponentInstance): void {
  instance.mounted = true

  // Run mount cleanups (these were queued during render)
  for (const cleanup of instance.mountCleanups) {
    cleanup()
  }
}

/**
 * Clean up update effects for a component instance.
 */
export function cleanupUpdates(instance: ComponentInstance): void {
  for (const cleanup of instance.updateCleanups) {
    cleanup()
  }
  instance.updateCleanups = []
}

/**
 * Destroy a component instance.
 * Runs all destroy callbacks and removes from tracking.
 */
export function destroyComponent(instance: ComponentInstance): void {
  if (instance.disposed) return
  instance.disposed = true

  // Run mount cleanups
  for (const cleanup of instance.mountCleanups) {
    cleanup()
  }

  // Run destroy callbacks
  for (const callback of instance.destroyCallbacks) {
    callback()
  }

  // Remove from tracking
  componentInstances.delete(instance.id)
}

// ─── Lifecycle Hooks ────────────────────────────────────────────

/**
 * Lifecycle hook: run after component is mounted to DOM.
 *
 * @example
 * const MyComponent = () => {
 *   onMount(() => {
 *     console.log('Mounted!')
 *     return () => console.log('Cleanup on unmount')
 *   })
 *   return <div>Hello</div>
 * }
 */
export function onMount(fn: () => void | CleanupFn): void {
  if (!currentInstance) {
    console.warn('[Flint] onMount called outside of component render')
    return
  }

  const cleanup = fn()
  if (typeof cleanup === 'function') {
    currentInstance.mountCleanups.push(cleanup)
  }
}

/**
 * Lifecycle hook: run after component updates.
 *
 * @example
 * const MyComponent = () => {
 *   onUpdate(() => {
 *     console.log('Updated!')
 *     return () => console.log('Cleanup before next update')
 *   })
 *   return <div>Hello</div>
 * }
 */
export function onUpdate(fn: () => void | CleanupFn): void {
  if (!currentInstance) {
    console.warn('[Flint] onUpdate called outside of component render')
    return
  }

  const cleanup = fn()
  if (typeof cleanup === 'function') {
    currentInstance.updateCleanups.push(cleanup)
  }
}

/**
 * Lifecycle hook: run before component is destroyed.
 *
 * @example
 * const MyComponent = () => {
 *   onDestroy(() => {
 *     console.log('Component destroyed!')
 *   })
 *   return <div>Hello</div>
 * }
 */
export function onDestroy(fn: () => void): void {
  if (!currentInstance) {
    console.warn('[Flint] onDestroy called outside of component render')
    return
  }

  currentInstance.destroyCallbacks.push(fn)
}
