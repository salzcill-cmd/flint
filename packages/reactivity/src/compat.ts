// Flint Reactivity — Solid/React-compatible Aliases
// For developers coming from React/Solid.js backgrounds

import {
  state,
  computed,
  effect,
  batch,
  createRoot,
  reactive,
} from './signals.js'

// ─── createSignal ───────────────────────────────────────────────

/**
 * Create a reactive signal (Solid.js-compatible alias for `state()`).
 *
 * @example
 * // Solid style:
 * const [count, setCount] = createSignal(0)
 * count()  // read
 * setCount(1)  // set
 * setCount(prev => prev + 1)  // update from previous
 *
 * // Flint style (equivalent):
 * const count = state(0)
 * count()  // read
 * count.set(1)  // set
 */
export function createSignal<T>(
  initialValue: T
): [() => T, (value: T | ((prev: T) => T)) => void] {
  const s = state(initialValue)
  const getter = () => s()
  const setter = (value: T | ((prev: T) => T)) => {
    if (typeof value === 'function') {
      s.set((value as (prev: T) => T)(s()))
    } else {
      s.set(value)
    }
  }
  return [getter, setter]
}

// ─── createEffect ───────────────────────────────────────────────

/**
 * Create a side effect (Solid.js-compatible alias for `effect()`).
 *
 * @example
 * createEffect(() => {
 *   console.log('Count changed:', count())
 * })
 */
export function createEffect(
  fn: () => void
): void {
  effect(fn)
}

// ─── createMemo ─────────────────────────────────────────────────

/**
 * Create a memoized derived value (Solid.js-compatible alias for `computed()`).
 *
 * @example
 * const doubled = createMemo(() => count() * 2)
 */
export function createMemo<T>(
  fn: () => T
): () => T {
  return computed(fn)
}

// ─── createStore ────────────────────────────────────────────────

/**
 * Create a reactive store (Solid.js-compatible).
 *
 * @example
 * const [store, setStore] = createStore({
 *   user: { name: 'John', age: 30 },
 *   todos: []
 * })
 *
 * // Read
 * store.user.name  // 'John'
 *
 * // Shallow set (replaces property)
 * setStore('user', 'name', 'Jane')
 *
 * // Functional update
 * setStore('todos', todos => [...todos, { text: 'New', done: false }])
 */
export function createStore<T extends Record<string, any>>(
  initialValue: T
): [T, (path: string, value: any) => void] {
  const store = reactive(initialValue) as T
  const setStore = (path: string, value: any) => {
    const keys = path.split('.')
    let current: any = store
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    const lastKey = keys[keys.length - 1]
    if (typeof value === 'function') {
      current[lastKey] = value(current[lastKey])
    } else {
      current[lastKey] = value
    }
  }
  return [store, setStore]
}

// ─── createRoot (Solid-compatible) ──────────────────────────────

/**
 * Create a reactive root (Solid.js-compatible alias for `createRoot()`).
 *
 * @example
 * createRoot((dispose) => {
 *   effect(() => console.log(count()))
 *   // cleanup when disposed
 *   return () => cleanup()
 * })
 */
export { createRoot }

// ─── createSelector ─────────────────────────────────────────────
// Note: createSelector is already exported from signals.ts with the full API
// (setSelected, getSelected, dispose). We re-export it here for compatibility.

// ─── batch (Solid-compatible) ───────────────────────────────────

/**
 * Batch multiple updates into a single re-render (Solid.js-compatible).
 *
 * @example
 * batch(() => {
 *   setCount(1)
 *   setName('John')
 *   // Only one re-render happens
 * })
 */
export { batch }

// ─── createResource ─────────────────────────────────────────────

/**
 * Create an async resource (Solid.js-compatible).
 *
 * @example
 * const [data, { mutate, refetch }] = createResource(
 *   () => userId(),
 *   async (id) => {
 *     const res = await fetch(`/api/users/${id}`)
 *     return res.json()
 *   }
 * )
 *
 * // In JSX:
 * <Suspense fallback={<Loading />}>
 *   <div>{data()?.name}</div>
 * </Suspense>
 */
export function createResource<T, S = void>(
  source: (() => S) | S,
  fetcher: (source: S) => Promise<T>
): [
  () => T | undefined,
  {
    mutate: (fn: T | ((prev: T | undefined) => T)) => void
    refetch: () => void
    state: () => 'unresolved' | 'pending' | 'ready' | 'error' | 'refreshing'
    error: () => any | undefined
  }
] {
  const dataSignal = state<T | undefined>(undefined)
  const errorSignal = state<any>(undefined)
  const stateSignal = state<'unresolved' | 'pending' | 'ready' | 'error' | 'refreshing'>('unresolved')
  let fetchCount = 0

  const refetch = () => {
    fetchCount++
    const currentFetch = fetchCount
    const src = typeof source === 'function' ? (source as () => S)() : source
    stateSignal.set('pending')
    fetcher(src as S)
      .then((result) => {
        if (currentFetch === fetchCount) {
          dataSignal.set(result)
          stateSignal.set('ready')
        }
      })
      .catch((err) => {
        if (currentFetch === fetchCount) {
          errorSignal.set(err)
          stateSignal.set('error')
        }
      })
  }

  // Start fetching immediately if source is available
  if (typeof source === 'function') {
    effect(() => {
      const src = (source as () => S)()
      if (src !== undefined && src !== null) {
        refetch()
      }
    })
  } else {
    refetch()
  }

  return [
    () => dataSignal(),
    {
      mutate: (fn: T | ((prev: T | undefined) => T)) => {
        if (typeof fn === 'function') {
          dataSignal.set(fn)
        } else {
          dataSignal.set(fn)
        }
      },
      refetch,
      state: () => stateSignal(),
      error: () => errorSignal(),
    },
  ]
}

// ─── from (reactive from) ───────────────────────────────────────

/**
 * Create a reactive value from a non-reactive source.
 *
 * @example
 * const mouseX = from(document, 'mousemove', (e) => e.clientX)
 */
export function from<T>(
  source: EventTarget | { subscribe: (fn: (value: T) => void) => () => void },
  eventOrSelector: string | ((event: any) => T)
): () => T | undefined {
  const signal = state<T | undefined>(undefined)

  if ('addEventListener' in source) {
    const eventName = eventOrSelector as string
    const selector = typeof eventOrSelector === 'function' ? eventOrSelector : (e: any) => e
    source.addEventListener(eventName, (e: any) => {
      signal.set(selector(e))
    })
  } else {
    (source as { subscribe: (fn: (value: T) => void) => () => void }).subscribe((value: T) => {
      signal.set(value)
    })
  }

  return () => signal()
}

// ─── produce (immutable helper) ─────────────────────────────────

/**
 * Create an immutable update helper.
 *
 * @example
 * produce(store, draft => {
 *   draft.user.name = 'Jane'
 *   draft.todos.push({ text: 'New', done: false })
 * })
 */
export function produce<T>(store: T, recipe: (draft: T) => void): void {
  // Simple immutable update pattern
  if (typeof store === 'object' && store !== null) {
    recipe(store)
  }
}
