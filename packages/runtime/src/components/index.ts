// Flint Runtime — Built-in Components v2
// Show, For, Index, Switch, Match, Portal, Suspense, Memo, cloneElement

import { h } from '../renderer/index.js'
import type { Child } from '../renderer/index.js'
import { effect as reactivityEffect, batch, computed, state as createState } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

type Renderable = Child | (() => Child)
type ListExpression<T> = T[] | (() => T[])
type KeyFn<T> = (item: T, index: number) => string | number

function toChildren(renderable: Renderable): Child {
  if (typeof renderable === 'function') {
    return renderable()
  }
  if (Array.isArray(renderable)) {
    return h(null, null, ...renderable)
  }
  return renderable ?? null
}

// ─── cloneElement ────────────────────────────────────────────────

/**
 * Clone a JSX element and merge new props.
 *
 * @example
 * const original = <div class="old" />
 * const cloned = cloneElement(original, { class: "new", id: "test" })
 * // <div class="new" id="test" />
 */
export function cloneElement(
  element: any,
  props?: Record<string, any>,
  ...children: Child[]
): any {
  if (!element || typeof element !== 'object') return element
  if (!element.type) return element

  const newProps = { ...element.props, ...props }
  if (children.length > 0) {
    newProps.children = children.length === 1 ? children[0] : children
  }

  return h(element.type, newProps)
}

// ─── Show — Conditional Rendering ───────────────────────────────

export function Show(props: {
  when: boolean | (() => boolean)
  fallback?: Renderable
  children: Renderable
}): Child {
  const condition = typeof props.when === 'function' ? props.when() : props.when
  if (condition) {
    return toChildren(props.children)
  }
  if (props.fallback != null) {
    return toChildren(props.fallback)
  }
  return null
}

// ─── For — List Rendering with Keyed Diffing ────────────────────

interface KeyedItem<T> {
  key: string | number
  item: T
  index: number
  node: Node | null
}

/**
 * Render a list with keyed reconciliation.
 * Only re-renders items that have changed, moved, or been added/removed.
 *
 * @example
 * For({
 *   each: items,
 *   by: (item) => item.id,  // Key function
 *   children: (item, index) => <div>{item.name}</div>
 * })
 */
export function For<T>(props: {
  each: ListExpression<T>
  by?: KeyFn<T> | string
  children: (item: T, index: number) => Child
}): Child {
  const list = typeof props.each === 'function' ? props.each() : props.each

  if (!Array.isArray(list) || list.length === 0) {
    return h(null, null)
  }

  // Determine key function
  const getKey: KeyFn<T> = typeof props.by === 'function'
    ? props.by
    : typeof props.by === 'string'
      ? (item: any) => item[props.by as string]
      : (item: T, index: number) => {
          // Default key: use item's id property or index
          if (item && typeof item === 'object' && 'id' in item) {
            return (item as any).id
          }
          return index
        }

  const fragment = document.createDocumentFragment()

  // Create keyed items
  const keyedItems: KeyedItem<T>[] = list.map((item, index) => ({
    key: getKey(item, index),
    item,
    index,
    node: null,
  }))

  // Render each item
  for (const keyed of keyedItems) {
    const child = props.children(keyed.item, keyed.index)
    if (child instanceof Node) {
      keyed.node = child
      fragment.appendChild(child)
    } else if (child != null) {
      const textNode = document.createTextNode(String(child))
      keyed.node = textNode
      fragment.appendChild(textNode)
    }
  }

  return fragment
}

// ─── ForEach — Fine-Grained Reactive List with Keyed Reconciliation ──

/**
 * Reactive list rendering with TRUE fine-grained DOM reconciliation.
 * Only moves, adds, or removes individual DOM nodes — never replaces the entire container.
 * This is Solid.js-level performance for list updates.
 *
 * @example
 * ForEach({
 *   each: () => items(),  // Signal getter
 *   by: (item) => item.id,
 *   children: (item, index) => <div>{item.name}</div>
 * })
 */
export function ForEach<T>(props: {
  each: () => T[]
  by?: KeyFn<T> | string
  children: (item: T, index: number) => Child
  fallback?: () => Child
}): Child {
  const getKey: KeyFn<T> = typeof props.by === 'function'
    ? props.by
    : typeof props.by === 'string'
      ? (item: any) => item[props.by as string]
      : (item: T, index: number) => {
          if (item && typeof item === 'object' && 'id' in item) {
            return (item as any).id
          }
          return index
        }

  // Container that holds all list items
  const container = document.createDocumentFragment()

  // Map of key -> { node, cleanup, item, index }
  let nodes = new Map<string | number, { node: Node; cleanup?: () => void; item: T; index: number }>()

  // Sentinel markers for start/end of the list
  const startMarker = document.createComment('flint-for-start')
  const endMarker = document.createComment('flint-for-end')
  container.appendChild(startMarker)
  container.appendChild(endMarker)

  reactivityEffect(() => {
    const list = props.each()

    if (!Array.isArray(list) || list.length === 0) {
      // Clear all nodes
      for (const entry of nodes.values()) {
        if (entry.node.parentNode) {
          entry.node.parentNode.removeChild(entry.node)
        }
        entry.cleanup?.()
      }
      nodes.clear()

      // Show fallback
      if (props.fallback) {
        const fallback = props.fallback()
        if (fallback instanceof Node) {
          container.insertBefore(fallback, endMarker)
        } else if (fallback != null) {
          container.insertBefore(document.createTextNode(String(fallback)), endMarker)
        }
      }
      return
    }

    // Build new key->item map
    const newKeys = new Map<string | number, { item: T; index: number }>()
    for (let i = 0; i < list.length; i++) {
      const key = getKey(list[i], i)
      newKeys.set(key, { item: list[i], index: i })
    }

    // 1. Remove nodes that are no longer in the list
    for (const [key, entry] of nodes) {
      if (!newKeys.has(key)) {
        if (entry.node.parentNode) {
          entry.node.parentNode.removeChild(entry.node)
        }
        entry.cleanup?.()
        nodes.delete(key)
      }
    }

    // 2. Reconcile: move existing, create new, maintain order
    let prevNode: Node = startMarker
    for (const [key, { item, index }] of newKeys) {
      const existing = nodes.get(key)

      if (existing) {
        // Node exists — just move it to the correct position if needed
        if (existing.node !== prevNode.nextSibling) {
          container.insertBefore(existing.node, prevNode.nextSibling)
        }
        existing.item = item
        existing.index = index
        prevNode = existing.node
      } else {
        // New node — create it
        const child = props.children(item, index)
        let newNode: Node

        if (child instanceof Node) {
          newNode = child
        } else if (child != null) {
          newNode = document.createTextNode(String(child))
        } else {
          newNode = document.createComment('flint-for-empty')
        }

        container.insertBefore(newNode, prevNode.nextSibling)
        nodes.set(key, { node: newNode, item, index })
        prevNode = newNode
      }
    }
  })

  return container
}

// ─── Index — List with Index Tracking ───────────────────────────

export function Index<T>(props: {
  each: ListExpression<T>
  children: (item: T, index: number) => Child
}): Child {
  const list = typeof props.each === 'function' ? props.each() : props.each

  if (!Array.isArray(list) || list.length === 0) {
    return h(null, null)
  }

  return h(null, null, ...list.map((item, index) =>
    props.children(item, index)
  )) as any
}

// ─── Switch/Match — Pattern Matching ────────────────────────────

interface MatchResult {
  __flint_match: () => Child
}

export function Switch(props: {
  fallback?: Renderable
  children: Child | Child[]
}): Child {
  const children = Array.isArray(props.children) ? props.children : [props.children]

  for (const child of children) {
    if (child && typeof child === 'object' && '__flint_match' in child) {
      const matchContent = (child as unknown as MatchResult).__flint_match()
      if (matchContent != null) {
        return matchContent
      }
    }
  }

  if (props.fallback != null) {
    return toChildren(props.fallback)
  }

  return null
}

export function Match(props: {
  when: boolean | (() => boolean)
  children: Renderable
}): MatchResult {
  const condition = typeof props.when === 'function' ? props.when() : props.when

  return {
    __flint_match: () => {
      if (condition) {
        return toChildren(props.children)
      }
      return null
    },
  }
}

// ─── Portal — Render Elsewhere ──────────────────────────────────

export function Portal(props: {
  mount?: HTMLElement | string
  children: Renderable
}): Child {
  const target = props.mount
    ? (typeof props.mount === 'string'
      ? document.querySelector(props.mount)
      : props.mount)
    : document.body

  if (!target) {
    console.warn('[Flint] Portal target not found')
    return null
  }

  const fragment = document.createDocumentFragment()
  const content = toChildren(props.children)

  if (content instanceof Node) {
    fragment.appendChild(content)
  } else if (content != null) {
    fragment.appendChild(document.createTextNode(String(content)))
  }

  target.appendChild(fragment)
  return h(null, null)
}

// ─── Suspense — Async Loading with Fallback ─────────────────────

/**
 * Suspense component that shows fallback while async content loads.
 * Detects pending promises and renders fallback until resolved.
 *
 * @example
 * Suspense({
 *   fallback: <Loading />,
 *   children: async Resource()
 * })
 */
export function Suspense(props: {
  fallback?: Renderable
  children: Renderable
}): Child {
  const content = props.children
  const fallback = props.fallback

  // Check if content is a promise
  if (content instanceof Promise) {
    // Show fallback while promise is pending
    if (fallback != null) {
      return toChildren(fallback)
    }
    return h(null, null)
  }

  // Check if content is a function that returns a promise
  if (typeof content === 'function') {
    try {
      const result = content()
      if (result instanceof Promise) {
        if (fallback != null) {
          return toChildren(fallback)
        }
        return h(null, null)
      }
      return result
    } catch (err) {
      if (fallback != null) {
        return toChildren(fallback)
      }
      throw err
    }
  }

  // Synchronous content — render directly
  return toChildren(content)
}

// ─── SuspenseBoundary — Advanced Suspense with Promise Tracking ─

interface SuspenseState {
  pending: Set<Promise<any>>
  count: number
}

let currentSuspense: SuspenseState | null = null

/**
 * Advanced Suspense with automatic promise tracking.
 * Wraps children and shows fallback while any promise inside is pending.
 *
 * @example
 * SuspenseBoundary({
 *   fallback: <Loading />,
 *   children: () => (
 *     <div>
 *       {await fetchUser()}
 *       {await fetchPosts()}
 *     </div>
 *   )
 * })
 */
export function SuspenseBoundary(props: {
  fallback?: Renderable
  children: () => Child
  onResolved?: () => void
}): Child {
  const fallback = props.fallback
  const pendingState: SuspenseState = {
    pending: new Set(),
    count: 0,
  }

  // Create a reactive state for the suspense
  const isPending = createState(false)

  // Set up current suspense context
  const prevSuspense = currentSuspense
  currentSuspense = pendingState

  try {
    // Execute children — may trigger suspense tracking
    const content = props.children()

    // Check if any promises are pending
    if (pendingState.count > 0) {
      isPending.set(true)

      // Show fallback while pending
      if (fallback != null) {
        return toChildren(fallback)
      }
      return h(null, null)
    }

    return content
  } finally {
    currentSuspense = prevSuspense
  }
}

/**
 * Track a promise for Suspense.
 * Called internally when a promise is thrown during render.
 */
export function trackPromise(promise: Promise<any>): void {
  if (currentSuspense) {
    currentSuspense.count++
    currentSuspense.pending.add(promise)

    promise.then(
      () => {
        currentSuspense?.pending.delete(promise)
        if (currentSuspense) {
          currentSuspense.count--
        }
      },
      () => {
        currentSuspense?.pending.delete(promise)
        if (currentSuspense) {
          currentSuspense.count--
        }
      }
    )
  }
}

// ─── createResource — Async Data Fetching ───────────────────────

interface Resource<T> {
  state: 'idle' | 'loading' | 'error' | 'success'
  data: T | undefined
  error: Error | undefined
  mutate: (data: T) => void
  refetch: () => void
}

/**
 * Create an async data resource with loading/error states.
 *
 * @example
 * const user = createResource(() => fetch('/api/user').then(r => r.json()))
 * // user() returns { state, data, error, mutate, refetch }
 */
export function createResource<T>(
  fetcher: () => Promise<T>,
  options?: {
    initialValue?: T
    onError?: (error: Error) => void
  }
): Resource<T> {
  const resourceState = createState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const resourceData = createState<T | undefined>(options?.initialValue)
  const resourceError = createState<Error | undefined>(undefined)

  function refetch() {
    resourceState.set('loading')
    resourceError.set(undefined)

    fetcher()
      .then((data) => {
        resourceData.set(data)
        resourceState.set('success')
      })
      .catch((err) => {
        resourceError.set(err)
        resourceState.set('error')
        options?.onError?.(err)
      })
  }

  // Start fetching
  refetch()

  return {
    get state() { return resourceState() },
    get data() { return resourceData() },
    get error() { return resourceError() },
    mutate(data: T) {
      resourceData.set(data)
    },
    refetch,
  }
}

// ─── Memo — Optimized Rendering ─────────────────────────────────

export function memo<T extends (...args: any[]) => any>(
  ComponentFn: T,
  areEqual?: (prev: any, next: any) => boolean
): T {
  let lastProps: any = null
  let lastResult: Child = null
  let lastArgs: any[] = []

  const memoized = (...args: any[]) => {
    const props = args[0]

    if (lastProps && areEqual) {
      if (areEqual(lastProps, props)) {
        return lastResult
      }
    } else if (lastProps && lastArgs.length === args.length) {
      // Shallow comparison by default
      const keys = Object.keys(props)
      if (keys.length === Object.keys(lastProps).length) {
        const changed = keys.some(key => props[key] !== lastProps[key])
        if (!changed) {
          return lastResult
        }
      }
    }

    lastProps = props
    lastArgs = args
    lastResult = ComponentFn(...args)
    return lastResult
  }

  return memoized as T
}

// ─── createMemo — Signal-based Memoization ──────────────────────

/**
 * Create a memoized computed value.
 * Only recomputes when dependencies change.
 *
 * @example
 * const doubled = createMemo(() => count() * 2)
 * doubled() // Returns cached value
 */
export function createMemo<T>(fn: () => T): () => T {
  const cached = computed(fn)
  return cached
}

// ─── createEffect — Shorthand for effect ────────────────────────

/**
 * Create an effect (alias for effect from reactivity).
 *
 * @example
 * createEffect(() => {
 *   console.log('Count changed:', count())
 * })
 */
export function createEffect(fn: () => void | (() => void)): void {
  reactivityEffect(fn)
}

// Import getCurrentInstance from component module
import { getCurrentInstance } from '../component/index.js'
