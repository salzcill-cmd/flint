// Flint Runtime — Ref System
// Access DOM elements and component instances directly

import { state, type Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export interface Ref<T = any> {
  readonly current: T | null
  (element: T | null): void
}

// ─── ref() — Create a Ref ───────────────────────────────────────

/**
 * Create a ref to access a DOM element.
 *
 * @example
 * const MyComponent = () => {
 *   const inputRef = ref()
 *
 *   onMount(() => {
 *     inputRef.current?.focus()
 *   })
 *
 *   return <input ref={inputRef} />
 * }
 */
export function ref<T = HTMLElement>(): Ref<T> {
  const signal = state<T | null>(null)

  const refFn = (element: T | null) => {
    signal.set(element)
  }

  Object.defineProperty(refFn, 'current', {
    get() {
      return signal()
    },
    set(value: T) {
      signal.set(value)
    },
  })

  return refFn as Ref<T>
}

// ─── useSignal() — Reactive Ref ─────────────────────────────────

/**
 * Create a signal-based ref that triggers updates when changed.
 * Useful for tracking DOM element references reactively.
 *
 * @example
 * const MyComponent = () => {
 *   const [containerRef, setContainerRef] = useSignal<HTMLElement>()
 *
 *   effect(() => {
 *     const el = containerRef()
 *     if (el) {
 *       console.log('Container dimensions:', el.offsetWidth, el.offsetHeight)
 *     }
 *   })
 *
 *   return <div ref={setContainerRef}>Content</div>
 * }
 */
export function useSignal<T>(): [Signal<T | null>, (value: T | null) => void] {
  const sig = state<T | null>(null)
  return [sig, (value: T | null) => sig.set(value)]
}
