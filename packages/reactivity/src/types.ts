// Flint Reactivity Types v4

export type CleanupFn = () => void

export interface Readable<T> {
  (): T
  readonly [SIGNAL_BRAND]: true
}

export interface Writable<T> extends Readable<T> {
  set(value: T | ((prev: T) => T)): void
  peek(): T
  /** Subscribe to changes (returns unsubscribe fn) */
  subscribe(fn: (value: T) => void): () => void
  /** Map transform that creates a new derived signal */
  map<U>(fn: (value: T) => U): Readable<U>
  /** Pipe through multiple transforms */
  pipe<A>(fn1: (v: T) => A): Readable<A>
}

export interface Computed<T> extends Readable<T> {
  readonly [COMPUTED_BRAND]: true
}

export type Signal<T> = Writable<T>

export interface Effect {
  readonly [EFFECT_BRAND]: true
  dispose(): void
}

export interface WatchHandle {
  dispose(): void
}

// Internal types
export const SIGNAL_BRAND = Symbol.for('flint.signal')
export const COMPUTED_BRAND = Symbol.for('flint.computed')
export const EFFECT_BRAND = Symbol.for('flint.effect')

export type Subscriber =
  | EffectState
  | ComputedState<any>

export interface SignalState<T> {
  kind: 'signal'
  value: T
  version: number
  changeVersion: number
  observers: Set<Subscriber>
  comparator: (prev: T, next: T) => boolean
}

export interface ComputedState<T> {
  kind: 'computed'
  value: T
  version: number
  changeVersion: number
  dirty: boolean
  disposed: boolean
  fn: () => T
  observers: Set<Subscriber>
  dependencies: Set<SignalState<any> | ComputedState<any>>
  tracking: boolean
  equals?: (prev: T, next: T) => boolean
}

export interface EffectState {
  kind: 'effect'
  fn: () => void | CleanupFn
  cleanup: CleanupFn | null
  dependencies: Set<SignalState<any> | ComputedState<any>>
  tracking: boolean
  disposed: boolean
  version: number
}

export interface WatchState<T> {
  kind: 'watch'
  source: () => T
  callback: (value: T, oldValue: T | undefined) => void
  lastValue: T | undefined
  effect: EffectState
}

export interface Selector<T> {
  (key: T): boolean
  setSelected(key: T): void
  setSelected(keys: Set<T>): void
  getSelected(): Set<T>
  isSelected(key: T): boolean
  dispose(): void
}

export interface Scope {
  dispose(): void
  onCleanup(fn: CleanupFn): void
  get disposed(): boolean
}

export interface ScopeState {
  kind: 'scope'
  disposables: CleanupFn[]
  disposed: boolean
  parent: ScopeState | null
}

/** Reactive proxy object type */
export type ReactiveProxy<T> = {
  [K in keyof T]: T[K] extends object ? ReactiveProxy<T[K]> : T[K]
}

/** Mutable ref type */
export interface Ref<T> {
  current: T
}
