// Flint Store — Zustand-compatible API with reactive signals
// Provides create() for store creation, middleware support, and devtools integration

import { state, type Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export type SetState<T> = Partial<T> | ((state: T) => Partial<T> | T)
export type GetState<T> = () => T
export type StateListener<T> = (state: T, prevState: T) => void
export type StateSelector<T, U> = (state: T) => U
export type EqualityFn<U> = (a: U, b: U) => boolean

export interface StoreApi<T> {
  getState: GetState<T>
  setState: (partial: SetState<T>) => void
  subscribe: (listener: StateListener<T>) => () => void
  destroy: () => void
  signal: () => Signal<T>
}

export type StateCreator<T> = (
  set: (partial: SetState<T>) => void,
  get: GetState<T>,
  store: StoreApi<T>
) => T

export type Middleware<T> = (stateCreator: StateCreator<T>) => StateCreator<T>

// ─── Store Implementation ───────────────────────────────────────

class Store<T extends object> implements StoreApi<T> {
  private _value: T
  private _listeners: Set<StateListener<T>> = new Set()
  private _signal: Signal<T>

  constructor(initialState: T) {
    this._value = initialState
    // Create a signal that reads from the store
    const getRef = () => this._value
    this._signal = state(initialState) as Signal<T>
    // Override to always return current value
    const self = this
    const original = this._signal
    this._signal = (() => self._value) as Signal<T>
    // Copy over the brand symbol
    ;(this._signal as any)[Symbol.for('flint.signal')] = true
  }

  getState(): T {
    return this._value
  }

  setState(partial: SetState<T>): void {
    const prevState = this._value
    const nextState = typeof partial === 'function'
      ? (partial as (s: T) => T)(prevState)
      : { ...prevState, ...partial } as T

    this._value = nextState

    for (const listener of this._listeners) {
      listener(nextState, prevState)
    }
  }

  subscribe(listener: StateListener<T>): () => void {
    this._listeners.add(listener)
    return () => { this._listeners.delete(listener) }
  }

  destroy(): void {
    this._listeners.clear()
  }

  signal(): Signal<T> {
    return this._signal
  }
}

// ─── create() — Main API ────────────────────────────────────────

export function create<T extends object>(
  stateCreator: StateCreator<T>,
  middlewares?: Middleware<T>[]
): StoreApi<T> {
  let creator = stateCreator
  if (middlewares) {
    for (const mw of middlewares) {
      creator = mw(creator)
    }
  }

  const store = new Store<T>({} as T)
  const initialState = creator(
    (partial) => store.setState(partial),
    () => store.getState(),
    store
  )
  store.setState(() => initialState)

  return store
}

// ─── Middleware ──────────────────────────────────────────────────

export function logger<T extends object>(): Middleware<T> {
  return (stateCreator) => (set, get, store) => {
    const loggedSet = (partial: SetState<T>) => {
      const prev = get()
      set(partial)
      const next = get()
      console.log('[Flint Store] prev:', prev)
      console.log('[Flint Store] next:', next)
    }
    return stateCreator(loggedSet, get, store)
  }
}

export function persist<T extends object>(
  name: string,
  options?: {
    storage?: Storage
    partialize?: (state: T) => Partial<T>
    merge?: (persisted: any, current: T) => T
  }
): Middleware<T> {
  const storage = options?.storage || (typeof localStorage !== 'undefined' ? localStorage : null)

  return (stateCreator) => (set, get, store) => {
    if (storage) {
      try {
        const persisted = storage.getItem(name)
        if (persisted) {
          const parsed = JSON.parse(persisted)
          const merged = options?.merge ? options.merge(parsed, {} as T) : { ...parsed }
          set(() => merged as T)
        }
      } catch (e) {
        console.warn(`[Flint Store] Failed to load persisted state for "${name}":`, e)
      }
    }

    const wrappedSet = (partial: SetState<T>) => {
      set(partial)
      if (storage) {
        try {
          const state = get()
          const toPersist = options?.partialize ? options.partialize(state) : state
          storage.setItem(name, JSON.stringify(toPersist))
        } catch (e) {
          console.warn(`[Flint Store] Failed to persist state for "${name}":`, e)
        }
      }
    }

    return stateCreator(wrappedSet, get, store)
  }
}

export function devtools<T extends object>(
  options?: { name?: string; enabled?: boolean }
): Middleware<T> {
  return (stateCreator) => (set, get, store) => {
    if (typeof window === 'undefined') {
      return stateCreator(set, get, store)
    }

    const ext = (window as any).__REDUX_DEVTOOLS_EXTENSION__
    const enabled = options?.enabled !== false && ext

    if (!enabled) {
      return stateCreator(set, get, store)
    }

    const devtoolsStore = ext.connect({
      name: options?.name || 'Flint Store',
      trace: true,
    })

    const wrappedSet = (partial: SetState<T>) => {
      set(partial)
      devtoolsStore.send({ type: 'setState' }, get())
    }

    const wrappedStore: StoreApi<T> = {
      getState: get,
      setState: wrappedSet,
      subscribe: store.subscribe.bind(store),
      destroy: store.destroy.bind(store),
      signal: store.signal.bind(store),
    }

    devtoolsStore.init(get())

    return stateCreator(wrappedSet, get, wrappedStore)
  }
}

export function immer<T extends object>(): Middleware<T> {
  return (stateCreator) => (set, get, store) => {
    const wrappedSet = (partial: SetState<T>) => {
      if (typeof partial === 'function') {
        const current = get()
        const draft = JSON.parse(JSON.stringify(current))
        const result = (partial as any)(draft)
        set(result !== draft ? result : draft)
      } else {
        set(partial)
      }
    }

    return stateCreator(wrappedSet, get, store)
  }
}

// ─── Selector ───────────────────────────────────────────────────

export function createSelector<T, U>(
  selector: StateSelector<T, U>,
  equalityFn?: EqualityFn<U>
): StateSelector<T, U> {
  let lastResult: U | undefined
  let lastInput: T | undefined

  return (input: T) => {
    const result = selector(input)
    if (lastInput !== undefined && lastResult !== undefined && equalityFn) {
      if (equalityFn(lastResult, result)) return lastResult
    }
    lastInput = input
    lastResult = result
    return result
  }
}

// ─── useStore hook ──────────────────────────────────────────────

export function useStore<T, U>(
  store: StoreApi<T>,
  selector?: StateSelector<T, U>,
  equalityFn?: EqualityFn<U>
): U {
  const sig = store.signal()
  if (selector) {
    const result = selector(sig())
    return result as U
  }
  return sig() as unknown as U
}
