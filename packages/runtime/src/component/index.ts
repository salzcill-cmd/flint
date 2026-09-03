// Flint Runtime — Component System v2
// Lifecycle hooks, context, and component management

import { effect, type CleanupFn, type Signal } from '@flint/reactivity'
import { registerComponent, unregisterComponent, setCurrentComponentId, getCurrentComponentId as getParentComponentId } from '../inject/index.js'

// ─── Types ──────────────────────────────────────────────────────

export type ComponentFunction<P = {}> = (props: P) => any

export interface ComponentContext {
  /** Called after the component is mounted to the DOM */
  onMount(fn: () => void | CleanupFn): void
  /** Called after each re-render */
  onUpdate(fn: () => void | CleanupFn): void
  /** Called before the component is destroyed */
  onDestroy(fn: () => void): void
  /** Called before the component is mounted */
  onBeforeMount(fn: () => void): void
  /** Called before each re-render */
  onBeforeUpdate(fn: () => void): void
  /** Called when the component is activated (keep-alive) */
  onActivated(fn: () => void | CleanupFn): void
  /** Called when the component is deactivated (keep-alive) */
  onDeactivated(fn: () => void | CleanupFn): void
  /** Called when a child component throws an error */
  onErrorCaptured(fn: (error: Error, info: { componentStack: string }) => boolean | void): void
}

export interface ComponentInstance {
  id: number
  mountCallbacks: Array<() => void | CleanupFn>
  mountCleanups: CleanupFn[]
  updateCleanups: CleanupFn[]
  destroyCallbacks: (() => void)[]
  beforeMountCallbacks: (() => void)[]
  beforeUpdateCallbacks: (() => void)[]
  activatedCallbacks: (() => void | CleanupFn)[]
  deactivatedCallbacks: (() => void | CleanupFn)[]
  errorCapturedCallbacks: ((error: Error, info: { componentStack: string }) => boolean | void)[]
  mounted: boolean
  disposed: boolean
  active: boolean
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

/**
 * Get a component instance by its ID.
 */
export function getComponentInstance(id: number): ComponentInstance | undefined {
  return componentInstances.get(id)
}

function createPublicContext(instance: ComponentInstance): ComponentContext {
  return {
    onMount(fn: () => void | CleanupFn) {
      if (!instance.mounted) {
        instance.mountCallbacks.push(fn)
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

    onBeforeMount(fn: () => void) {
      if (!instance.mounted) {
        instance.beforeMountCallbacks.push(fn)
      }
    },

    onBeforeUpdate(fn: () => void) {
      instance.beforeUpdateCallbacks.push(fn)
    },

    onActivated(fn: () => void | CleanupFn) {
      instance.activatedCallbacks.push(fn)
    },

    onDeactivated(fn: () => void | CleanupFn) {
      instance.deactivatedCallbacks.push(fn)
    },

    onErrorCaptured(fn: (error: Error, info: { componentStack: string }) => boolean | void) {
      instance.errorCapturedCallbacks.push(fn)
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
      mountCallbacks: [],
      mountCleanups: [],
      updateCleanups: [],
      destroyCallbacks: [],
      beforeMountCallbacks: [],
      beforeUpdateCallbacks: [],
      activatedCallbacks: [],
      deactivatedCallbacks: [],
      errorCapturedCallbacks: [],
      mounted: false,
      disposed: false,
      active: true,
    }

    // Register in component tree for provide/inject
    const parentComponentId = getParentComponentId()
    registerComponent(instance.id, parentComponentId)

    // Set current instance for lifecycle hook registration
    const prevInstance = currentInstance
    currentInstance = instance
    componentInstances.set(instance.id, instance)
    setCurrentComponentId(instance.id)

    try {
      const result = fn(props)

      // Store instance on wrapper so renderer can access it after render
      ;(wrappedFn as any).__flint_instance = instance

      return result
    } finally {
      currentInstance = prevInstance
      setCurrentComponentId(parentComponentId)
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

  // Run mount callbacks and collect cleanups
  for (const callback of instance.mountCallbacks) {
    const cleanup = callback()
    if (typeof cleanup === 'function') {
      instance.mountCleanups.push(cleanup)
    }
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
  unregisterComponent(instance.id)
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

  if (!currentInstance.mounted) {
    currentInstance.mountCallbacks.push(fn)
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
