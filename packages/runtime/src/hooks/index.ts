// Flint Runtime — Missing Hooks
// useTransition, useDeferredValue, useId, useImperativeHandle, forwardRef

import { state, computed, effect, type Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export type TransitionStartFunction = (callback: () => void) => void

export interface ImperativeHandle<T> {
  current: T | null
}

export interface ForwardRefRenderFunction<T, P = {}> {
  (props: P, ref: { current: T | null }): any
  displayName?: string
}

// ─── useTransition ──────────────────────────────────────────────

/**
 * Mark a state update as a transition (low priority).
 *
 * @example
 * const [isPending, startTransition] = useTransition()
 *
 * function handleClick() {
 *   startTransition(() => {
 *     setSearch(input.value) // Low priority update
 *   })
 * }
 */
export function useTransition(): [Signal<boolean>, TransitionStartFunction] {
  const isPending = state(false)
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  function startTransition(callback: () => void) {
    isPending.set(true)

    // Use microtask to batch updates
    Promise.resolve().then(() => {
      callback()

      // Use requestAnimationFrame for smooth transition
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => {
          isPending.set(false)
        })
      } else {
        setTimeout(() => {
          isPending.set(false)
        }, 16)
      }
    })
  }

  return [isPending, startTransition]
}

// ─── useDeferredValue ───────────────────────────────────────────

/**
 * Defer updating a value (low priority).
 *
 * @example
 * const deferredQuery = useDeferredValue(query)
 * // deferredQuery updates after the browser is free
 */
export function useDeferredValue<T>(value: T, initialValue?: T): Signal<T> {
  const deferred = state(initialValue ?? value)
  const isPending = state(false)
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  effect(() => {
    const current = value

    // Mark as pending
    isPending.set(true)

    // Clear previous timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    // Defer the update
    timeoutId = setTimeout(() => {
      deferred.set(current)
      isPending.set(false)
      timeoutId = null
    }, 100)
  })

  return deferred
}

// ─── useId ──────────────────────────────────────────────────────

/**
 * Generate a unique ID for accessibility.
 *
 * @example
 * const inputId = useId('input')
 * const labelId = useId('label')
 * // <label id={labelId}>Name</label>
 * // <input id={inputId} aria-labelledby={labelId} />
 */
let idCounter = 0
const idPrefix = typeof window !== 'undefined'
  ? `flint-${Math.random().toString(36).slice(2, 9)}`
  : `flint-ssr`

export function useId(prefix?: string): string {
  idCounter++
  return `${prefix || 'flint-id'}-${idCounter}`
}

// ─── useImperativeHandle ────────────────────────────────────────

/**
 * Customize the instance value exposed with ref.
 *
 * @example
 * const ref = useRef(null)
 * useImperativeHandle(ref, () => ({
 *   focus: () => ref.current?.focus(),
 *   scrollIntoView: () => ref.current?.scrollIntoView(),
 * }))
 */
export function useImperativeHandle<T>(
  ref: { current: T | null },
  createHandle: () => T,
  deps?: any[]
): void {
  // Create handle on mount and when deps change
  effect(() => {
    const handle = createHandle()
    ref.current = handle

    return () => {
      // Cleanup: set to null
      ref.current = null
    }
  })
}

// ─── forwardRef ─────────────────────────────────────────────────

/**
 * Forward ref to a child component.
 *
 * @example
 * const MyInput = forwardRef((props, ref) => {
 *   return <input ref={ref} {...props} />
 * })
 * MyInput.displayName = 'MyInput'
 *
 * // Usage
 * const inputRef = useRef(null)
 * <MyInput ref={inputRef} />
 */
export function forwardRef<T, P = {}>(
  render: ForwardRefRenderFunction<T, P>
): (props: P & { ref?: { current: T | null } }) => any {
  function ForwardedComponent(props: P & { ref?: { current: T | null } }) {
    return render(props, props.ref || { current: null })
  }

  ForwardedComponent.displayName = render.displayName || `ForwardRef`
  return ForwardedComponent
}

// ─── useRef (bonus — commonly used with forwardRef) ─────────────

/**
 * Create a mutable ref that persists across renders.
 *
 * @example
 * const inputRef = useRef(null)
 * inputRef.current.focus()
 */
export function useRef<T>(initialValue: T): { current: T } {
  return { current: initialValue }
}
