// Flint Reactivity Types

export type CleanupFn = () => void

export interface Readable<T> {
  (): T
  readonly [SIGNAL_BRAND]: true
}

export interface Writable<T> extends Readable<T> {
  set(value: T | ((prev: T) => T)): void
  peek(): T
}

export interface Computed<T> extends Readable<T> {
  readonly [COMPUTED_BRAND]: true
}

// Signal is an alias for Writable
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
  observers: Set<Subscriber>
  comparator: (prev: T, next: T) => boolean
}

export interface ComputedState<T> {
  kind: 'computed'
  value: T
  version: number
  dirty: boolean
  disposed: boolean
  fn: () => T
  observers: Set<Subscriber>
  dependencies: Set<SignalState<any> | ComputedState<any>>
  tracking: boolean
}

export interface EffectState {
  kind: 'effect'
  fn: () => void | CleanupFn
  cleanup: CleanupFn | null
  dependencies: Set<SignalState<any> | ComputedState<any>>
  tracking: boolean
  disposed: boolean
}

export interface WatchState<T> {
  kind: 'watch'
  source: () => T
  callback: (value: T, oldValue: T | undefined) => void
  lastValue: T | undefined
  effect: EffectState
}

// Selector — efficient keyed list tracking
export interface Selector<T> {
  /** Check if a key is selected (reads current value) */
  (key: T): boolean
  /** Set the selected key */
  setSelected(key: T): void
  /** Set multiple selected keys */
  setSelected(keys: Set<T>): void
  /** Get all selected keys */
  getSelected(): Set<T>
  /** Check if a key is selected without tracking */
  isSelected(key: T): boolean
  /** Dispose the selector */
  dispose(): void
}

// Scope — grouped effect lifecycle
export interface Scope {
  /** Dispose all effects in this scope */
  dispose(): void
  /** Track a cleanup function */
  onCleanup(fn: CleanupFn): void
  /** Check if scope is disposed */
  get disposed(): boolean
}

export interface ScopeState {
  kind: 'scope'
  disposables: CleanupFn[]
  disposed: boolean
  parent: ScopeState | null
}
