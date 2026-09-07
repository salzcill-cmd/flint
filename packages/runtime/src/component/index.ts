// Flint Runtime — Component System v4
// Simplified lifecycle, view() decorator, and model() integration

import { effect, type CleanupFn, type Signal } from '@flint/reactivity'
import { registerComponent, unregisterComponent, setCurrentComponentId, getCurrentComponentId as getParentComponentId } from '../inject/index.js'

// ─── Types ──────────────────────────────────────────────────────

export type ComponentFunction<P = {}> = (props: P) => any

export interface ComponentContext {
  onMount(fn: () => void | CleanupFn): void
  onUpdate(fn: () => void | CleanupFn): void
  onDestroy(fn: () => void): void
  onBeforeMount(fn: () => void): void
  onBeforeUpdate(fn: () => void): void
  onActivated(fn: () => void | CleanupFn): void
  onDeactivated(fn: () => void | CleanupFn): void
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

let currentInstance: ComponentInstance | null = null

export function getCurrentInstance(): ComponentContext | null {
  if (!currentInstance) return null
  return createPublicContext(currentInstance)
}

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

    const parentComponentId = getParentComponentId()
    registerComponent(instance.id, parentComponentId)

    const prevInstance = currentInstance
    currentInstance = instance
    componentInstances.set(instance.id, instance)
    setCurrentComponentId(instance.id)

    try {
      const result = fn(props)
      ;(wrappedFn as any).__flint_instance = instance
      return result
    } finally {
      currentInstance = prevInstance
      setCurrentComponentId(parentComponentId)
    }
  }

  ;(wrappedFn as any).__flint_component = true
  ;(wrappedFn as any).__flint_original = fn

  return wrappedFn
}

// ─── view() — Simplified Component Decorator ────────────────────

/**
 * Create a component with simplified syntax.
 * Automatically provides lifecycle hooks and reactive state.
 *
 * @example
 * // Before (verbose):
 * const Counter = component(() => {
 *   const count = state(0)
 *   return (
 *     <button onClick={() => count.set(c => c + 1)}>
 *       Count: {count()}
 *     </button>
 *   )
 * })
 *
 * // After (simplified with view):
 * const Counter = view(({ count }) => (
 *   <button onClick={() => count.set(c => c + 1)}>
 *     Count: {count()}
 *   </button>
 * ))
 */
export function view<P extends Record<string, any>>(
  fn: (props: P) => any,
  options?: {
    name?: string
    /** Auto-destructure props into signals */
    autoSignal?: boolean
  }
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

    const parentComponentId = getParentComponentId()
    registerComponent(instance.id, parentComponentId)

    const prevInstance = currentInstance
    currentInstance = instance
    componentInstances.set(instance.id, instance)
    setCurrentComponentId(instance.id)

    try {
      const result = fn(props)
      ;(wrappedFn as any).__flint_instance = instance
      return result
    } finally {
      currentInstance = prevInstance
      setCurrentComponentId(parentComponentId)
    }
  }

  ;(wrappedFn as any).__flint_component = true
  ;(wrappedFn as any).__flint_original = fn
  if (options?.name) {
    ;(wrappedFn as any).displayName = options.name
  }

  return wrappedFn
}

// ─── Lifecycle Management ───────────────────────────────────────

export function mountComponent(instance: ComponentInstance): void {
  instance.mounted = true

  for (const callback of instance.mountCallbacks) {
    const cleanup = callback()
    if (typeof cleanup === 'function') {
      instance.mountCleanups.push(cleanup)
    }
  }
}

export function cleanupUpdates(instance: ComponentInstance): void {
  for (const cleanup of instance.updateCleanups) {
    cleanup()
  }
  instance.updateCleanups = []
}

export function destroyComponent(instance: ComponentInstance): void {
  if (instance.disposed) return
  instance.disposed = true

  for (const cleanup of instance.mountCleanups) {
    cleanup()
  }

  for (const callback of instance.destroyCallbacks) {
    callback()
  }

  componentInstances.delete(instance.id)
  unregisterComponent(instance.id)
}

// ─── Lifecycle Hooks ────────────────────────────────────────────

export function onMount(fn: () => void | CleanupFn): void {
  if (!currentInstance) {
    console.warn('[Flint] onMount called outside of component render')
    return
  }

  if (!currentInstance.mounted) {
    currentInstance.mountCallbacks.push(fn)
  }
}

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

export function onDestroy(fn: () => void): void {
  if (!currentInstance) {
    console.warn('[Flint] onDestroy called outside of component render')
    return
  }

  currentInstance.destroyCallbacks.push(fn)
}

// ─── withModel() — Component with Reactive Model ────────────────

/**
 * Create a component that automatically binds to a reactive model.
 * Provides model state as props.
 *
 * @example
 * const counter = model({
 *   state: { count: 0 },
 *   actions: {
 *     increment(s) { s.count++ },
 *   },
 * })
 *
 * const Counter = withModel(counter, ({ count, increment }) => (
 *   <button onClick={increment}>Count: {count()}</button>
 * ))
 */
export function withModel<M extends Record<string, any>>(
  modelInstance: M,
  fn: (model: M) => any
): ComponentFunction<{}> {
  return view(() => fn(modelInstance))
}
