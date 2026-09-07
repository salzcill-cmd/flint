// Flint Reactivity — Core signals implementation v4
// Version-based dirty tracking with automatic dependency tracking

import type {
  Signal,
  Computed,
  Effect,
  Readable,
  Writable,
  WatchHandle,
  SignalState,
  ComputedState,
  EffectState,
  Subscriber,
  CleanupFn,
  Selector,
  Scope,
  ScopeState,
  ReactiveProxy,
  Ref,
} from './types.js'
import {
  SIGNAL_BRAND,
  COMPUTED_BRAND,
  EFFECT_BRAND,
} from './types.js'

// ─── Global State ───────────────────────────────────────────────

let currentSubscriber: Subscriber | null = null
let currentScope: ScopeState | null = null
let writeVersion = 0
let readVersion = 0
let batchDepth = 0
let pendingEffects: Set<EffectState> = new Set()
let pendingComputeds: Set<ComputedState<any>> = new Set()
let flushScheduled = false

// ─── Equality ───────────────────────────────────────────────────

function defaultEquals(a: unknown, b: unknown): boolean {
  return Object.is(a, b)
}

// ─── Dependency Tracking ────────────────────────────────────────

function track(signal: SignalState<any> | ComputedState<any>): void {
  if (currentSubscriber) {
    signal.observers.add(currentSubscriber)
    currentSubscriber.dependencies.add(signal)
  }
}

function untrackAll(subscriber: Subscriber): void {
  for (const dep of subscriber.dependencies) {
    dep.observers.delete(subscriber)
  }
  subscriber.dependencies.clear()
}

// ─── Dirty Marking ──────────────────────────────────────────────

const updatingComputeds = new WeakSet<ComputedState<any>>()

function markDirty(signal: SignalState<any> | ComputedState<any>): void {
  signal.version = writeVersion

  for (const observer of signal.observers) {
    if (observer.kind === 'computed') {
      if (!observer.dirty) {
        if (updatingComputeds.has(observer)) {
          console.warn('[Flint] Circular computed dependency detected:', observer)
          continue
        }
        observer.dirty = true
        markDirty(observer)
      }
    } else if (observer.kind === 'effect') {
      scheduleEffect(observer)
    }
  }
}

function isDirty(computed: ComputedState<any>): boolean {
  for (const dep of computed.dependencies) {
    if (dep.version > computed.version) {
      return true
    }
  }
  return false
}

function refreshComputedDeps(deps: Set<SignalState<any> | ComputedState<any>>): void {
  for (const dep of deps) {
    if (dep.kind === 'computed' && !dep.disposed) {
      refreshComputedDeps(dep.dependencies)
      if (dep.dirty || isDirty(dep)) {
        updateComputed(dep)
      }
    }
  }
}

function isEffectStale(effectState: EffectState): boolean {
  refreshComputedDeps(effectState.dependencies)
  for (const dep of effectState.dependencies) {
    if (dep.changeVersion > effectState.version) {
      return true
    }
  }
  return false
}

// ─── Effect Scheduling ──────────────────────────────────────────

function scheduleEffect(effect: EffectState): void {
  if (!effect.disposed) {
    pendingEffects.add(effect)
  }
  scheduleFlush()
}

function scheduleFlush(): void {
  if (!flushScheduled && batchDepth === 0) {
    flushScheduled = true
    queueMicrotask(flush)
  }
}

function flush(): void {
  flushScheduled = false

  while (pendingComputeds.size > 0) {
    const computeds = [...pendingComputeds]
    pendingComputeds.clear()
    for (const computed of computeds) {
      if (computed.dirty && !computed.disposed) {
        updateComputed(computed)
      }
    }
  }

  const effects = [...pendingEffects]
  pendingEffects.clear()
  for (const effectState of effects) {
    if (!effectState.disposed && isEffectStale(effectState)) {
      runEffect(effectState)
    }
  }
}

// ─── Core Primitives ────────────────────────────────────────────

function updateComputed<T>(computed: ComputedState<T>): void {
  updateComputedWithEquals(computed, computed.equals ?? defaultEquals)
}

function updateComputedWithEquals<T>(
  computed: ComputedState<T>,
  comparator: (prev: T, next: T) => boolean
): void {
  if (updatingComputeds.has(computed)) {
    console.warn('[Flint] Circular computed dependency detected during update:', computed)
    return
  }

  updatingComputeds.add(computed)
  untrackAll(computed)

  const prevSubscriber = currentSubscriber
  currentSubscriber = computed
  computed.tracking = true
  readVersion++

  try {
    const prevValue = computed.value
    const newValue = computed.fn()
    const unchanged = comparator(prevValue, newValue)

    if (!unchanged) {
      computed.value = newValue
      computed.version = writeVersion
      computed.changeVersion = writeVersion
      for (const observer of computed.observers) {
        if (observer.kind === 'computed') {
          if (!observer.dirty) {
            observer.dirty = true
            pendingComputeds.add(observer)
          }
        } else if (observer.kind === 'effect') {
          scheduleEffect(observer)
        }
      }
    }
    computed.dirty = false
  } finally {
    computed.tracking = false
    currentSubscriber = prevSubscriber
    updatingComputeds.delete(computed)
  }
}

function runEffect(effect: EffectState): void {
  if (effect.disposed) return

  if (effect.cleanup) {
    effect.cleanup()
    effect.cleanup = null
  }

  untrackAll(effect)

  const prevSubscriber = currentSubscriber
  currentSubscriber = effect
  effect.tracking = true
  readVersion++

  try {
    const result = effect.fn()
    if (typeof result === 'function') {
      effect.cleanup = result as CleanupFn
    }
    effect.version = writeVersion
  } finally {
    effect.tracking = false
    currentSubscriber = prevSubscriber
  }
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Create a reactive state signal.
 *
 * @example
 * const count = state(0)
 * count()      // read: 0
 * count.set(5) // write: 5
 * count.set(c => c + 1) // write: 6
 */
export function state<T>(initial: T): Writable<T> & Signal<T> {
  const signalState: SignalState<T> = {
    kind: 'signal',
    value: initial,
    version: 0,
    changeVersion: 0,
    observers: new Set(),
    comparator: defaultEquals,
  }

  const read = (() => {
    track(signalState)
    return signalState.value
  }) as Writable<T> & Signal<T>

  Object.defineProperty(read, SIGNAL_BRAND, { value: true })

  read.set = (value: T | ((prev: T) => T)) => {
    const newValue = typeof value === 'function'
      ? (value as (prev: T) => T)(signalState.value)
      : value

    if (!signalState.comparator(signalState.value, newValue)) {
      signalState.value = newValue
      writeVersion++
      signalState.changeVersion = writeVersion
      markDirty(signalState)
      scheduleFlush()
    }
  }

  read.peek = () => signalState.value

  read.subscribe = (fn: (value: T) => void) => {
    const eff = effect(() => fn(signalState.value))
    return () => eff.dispose()
  }

  read.map = <U>(fn: (value: T) => U) => {
    return computed(() => fn(signalState.value))
  }

  read.pipe = <A>(fn1: (v: T) => A) => {
    return computed(() => fn1(signalState.value))
  }

  return read
}

/**
 * Create a computed (derived) value.
 * Lazily evaluated and cached. Only recomputes when dependencies change.
 */
export function computed<T>(fn: () => T, options?: { equals?: (prev: T, next: T) => boolean }): Computed<T> {
  const comparator = options?.equals ?? defaultEquals

  const computedState: ComputedState<T> = {
    kind: 'computed',
    value: undefined as T,
    version: 0,
    changeVersion: 0,
    dirty: true,
    disposed: false,
    fn,
    observers: new Set(),
    dependencies: new Set(),
    tracking: false,
  }

  const read = (() => {
    track(computedState)

    if (computedState.dirty || isDirty(computedState)) {
      updateComputedWithEquals(computedState, comparator)
    }

    return computedState.value
  }) as Computed<T>

  Object.defineProperty(read, COMPUTED_BRAND, { value: true })
  computedState.equals = comparator
  updateComputedWithEquals(computedState, comparator)

  return read
}

/**
 * Create a writable computed value.
 * Like computed, but can be set directly.
 *
 * @example
 * const count = state(0)
 * const doubled = computedSet({
 *   get: () => count() * 2,
 *   set: (value) => count.set(value / 2)
 * })
 *
 * doubled()      // read: 0
 * doubled.set(10) // write: sets count to 5
 */
export function computedSet<T>(options: {
  get: () => T
  set: (value: T) => void
  equals?: (prev: T, next: T) => boolean
}): Writable<T> & Computed<T> {
  const comparator = options.equals ?? defaultEquals

  const computedState: ComputedState<T> = {
    kind: 'computed',
    value: undefined as T,
    version: 0,
    changeVersion: 0,
    dirty: true,
    disposed: false,
    fn: options.get,
    observers: new Set(),
    dependencies: new Set(),
    tracking: false,
  }

  const read = (() => {
    track(computedState)

    if (computedState.dirty || isDirty(computedState)) {
      updateComputedWithEquals(computedState, comparator)
    }

    return computedState.value
  }) as Writable<T> & Computed<T>

  Object.defineProperty(read, COMPUTED_BRAND, { value: true })
  computedState.equals = comparator
  updateComputedWithEquals(computedState, comparator)

  // Add set method
  read.set = (value: T | ((prev: T) => T)) => {
    const newValue = typeof value === 'function'
      ? (value as (prev: T) => T)(computedState.value)
      : value
    options.set(newValue)
  }

  read.peek = () => computedState.value

  return read
}

/**
 * Create a side effect that auto-tracks dependencies.
 */
export function effect(fn: () => void | CleanupFn): Effect {
  const effectState: EffectState = {
    kind: 'effect',
    fn,
    cleanup: null,
    dependencies: new Set(),
    tracking: false,
    disposed: false,
    version: 0,
  }

  runEffect(effectState)

  return {
    [EFFECT_BRAND]: true as const,
    dispose() {
      effectState.disposed = true
      if (effectState.cleanup) {
        effectState.cleanup()
        effectState.cleanup = null
      }
      untrackAll(effectState)
    },
  }
}

/**
 * Watch a source function and call callback when value changes.
 */
export function watch<T>(
  source: () => T,
  callback: (value: T, oldValue: T | undefined) => void
): WatchHandle {
  let lastValue: T | undefined = undefined
  let initialized = false

  const eff = effect(() => {
    const value = source()
    if (initialized) {
      callback(value, lastValue)
    }
    lastValue = value
    initialized = true
  })

  return {
    dispose() {
      eff.dispose()
    },
  }
}

/**
 * Batch multiple signal updates into a single flush.
 */
export function batch(fn: () => void): void {
  batchDepth++
  try {
    fn()
  } finally {
    batchDepth--
    if (batchDepth === 0) {
      scheduleFlush()
    }
  }
}

/**
 * Run queued effects/computeds immediately.
 */
export function flushSync(): void {
  flush()
}

// ─── captureScope ─────────────────────────────────────────────

export function captureScope<T>(fn: () => T): {
  value: T
  dependencies: Set<SignalState<any> | ComputedState<any>>
} {
  const probe: EffectState = {
    kind: 'effect',
    fn: () => undefined,
    cleanup: null,
    dependencies: new Set(),
    tracking: true,
    disposed: true,
    version: 0,
  }

  const prevSubscriber = currentSubscriber
  currentSubscriber = probe
  let value: T
  try {
    value = fn()
  } finally {
    currentSubscriber = prevSubscriber
    for (const dep of probe.dependencies) {
      dep.observers.delete(probe)
    }
  }
  return { value, dependencies: probe.dependencies }
}

// ─── untrack ────────────────────────────────────────────────────

export function untrack<T>(fn: () => T): T {
  const prevSubscriber = currentSubscriber
  currentSubscriber = null
  try {
    return fn()
  } finally {
    currentSubscriber = prevSubscriber
  }
}

// ─── createRoot / Scope ─────────────────────────────────────────

export function createRoot<T>(
  fn: (dispose: () => void) => T
): T & Scope {
  const scopeState: ScopeState = {
    kind: 'scope',
    disposables: [],
    disposed: false,
    parent: currentScope,
  }

  const prevScope = currentScope
  currentScope = scopeState

  function dispose() {
    if (scopeState.disposed) return
    scopeState.disposed = true
    for (let i = scopeState.disposables.length - 1; i >= 0; i--) {
      try {
        scopeState.disposables[i]()
      } catch (e) {
        console.warn('[Flint] Disposable cleanup failed:', e)
      }
    }
    scopeState.disposables.length = 0
    currentScope = prevScope
  }

  try {
    const result = fn(dispose)
    const scope: Scope = {
      dispose,
      onCleanup(fn: CleanupFn) {
        if (!scopeState.disposed) {
          scopeState.disposables.push(fn)
        }
      },
      get disposed() {
        return scopeState.disposed
      },
    }
    return Object.assign(result as any, scope)
  } finally {
    currentScope = prevScope
  }
}

export function onCleanup(fn: CleanupFn): void {
  if (currentScope) {
    currentScope.disposables.push(fn)
  }
  if (currentSubscriber && currentSubscriber.kind === 'effect') {
    const effectState = currentSubscriber as EffectState
    const prevCleanup = effectState.cleanup
    effectState.cleanup = () => {
      if (prevCleanup) prevCleanup()
      fn()
    }
  }
}

// ─── createSelector ─────────────────────────────────────────────

export function createSelector<T>(
  source: Signal<T> | Readable<T> | (() => T)
): Selector<T> {
  const sourceFn = typeof source === 'function' ? source : () => (source as Readable<T>)()
  let currentValue: T
  const effectsByValue = new Map<T, Set<EffectState>>()

  const eff = effect(() => {
    currentValue = sourceFn()
  })

  function select(key: T): boolean {
    if (currentSubscriber) {
      if (!effectsByValue.has(key)) {
        effectsByValue.set(key, new Set())
      }
      effectsByValue.get(key)!.add(currentSubscriber as EffectState)
    }
    return key === currentValue
  }

  return Object.assign(select, {
    setSelected(keyOrSet: T | Set<T>) {
      if (keyOrSet instanceof Set) {
        batch(() => {
          for (const key of keyOrSet) {
            const subs = effectsByValue.get(key)
            if (subs) {
              for (const sub of subs) {
                scheduleEffect(sub)
              }
            }
          }
        })
      } else {
        if (typeof source === 'function' && 'set' in source) {
          (source as any).set(keyOrSet as T)
        } else if (typeof source !== 'function' && 'set' in source) {
          (source as any).set(keyOrSet as T)
        }
      }
    },
    getSelected() {
      return new Set([currentValue])
    },
    isSelected(key: T): boolean {
      return key === currentValue
    },
    dispose() {
      eff.dispose()
      effectsByValue.clear()
    },
  })
}

export { onCleanup as onDispose }

// ─── NEW: Simplified APIs for Maximum DX ───────────────────────

/**
 * Create a reactive object with Proxy. Reads auto-track, writes auto-trigger.
 *
 * @example
 * const user = reactive({ name: 'John', age: 30 })
 * user.name  // tracked
 * user.age = 31  // triggers effects
 */
export function reactive<T extends object>(obj: T): ReactiveProxy<T> {
  const signalMap = new Map<keyof T, Signal<any>>()

  for (const key of Object.keys(obj) as (keyof T)[]) {
    signalMap.set(key, state(obj[key]))
  }

  return new Proxy(obj, {
    get(target, key) {
      const sig = signalMap.get(key as keyof T)
      if (sig) return sig()
      return (target as any)[key]
    },
    set(target, key, value) {
      const sig = signalMap.get(key as keyof T)
      if (sig) {
        sig.set(value)
      } else {
        signalMap.set(key as keyof T, state(value))
        ;(target as any)[key] = value
      }
      return true
    },
    has(target, key) {
      return key in target
    },
    ownKeys(target) {
      return Reflect.ownKeys(target)
    },
    getOwnPropertyDescriptor(target, key) {
      return Reflect.getOwnPropertyDescriptor(target, key)
    },
  }) as ReactiveProxy<T>
}

/**
 * Create a model — a reactive container with actions.
 * Combines state + computed + actions in one clean API.
 *
 * @example
 * const counter = model({
 *   state: { count: 0, step: 1 },
 *   computed: {
 *     doubled: (s) => s.count * 2,
 *     isPositive: (s) => s.count > 0,
 *   },
 *   actions: {
 *     increment(s) { s.count += s.step },
 *     decrement(s) { s.count -= s.step },
 *     reset(s) { s.count = 0 },
 *   },
 * })
 *
 * counter.count()       // 0
 * counter.doubled()     // 0
 * counter.increment()   // s.count = 1
 */
export function model<T extends Record<string, any>, C extends Record<string, (state: T) => any>, A extends Record<string, (state: T, ...args: any[]) => void>>(config: {
  state: T
  computed?: C
  actions?: A
}): {
  [K in keyof T]: T[K] extends object ? Writable<T[K]> : Signal<T[K]>
} & {
  [K in keyof C]: C[K] extends (s: T) => infer R ? Readable<R> : never
} & {
  [K in keyof A]: A[K] extends (s: T, ...args: infer P) => void ? (...args: P) => void : never
} {
  const signals: Record<string, Signal<any>> = {}
  const result: any = {}

  // Create signals for state
  for (const [key, value] of Object.entries(config.state)) {
    signals[key] = state(value)
    result[key] = signals[key]
  }

  // Create computeds
  if (config.computed) {
    for (const [key, fn] of Object.entries(config.computed)) {
      result[key] = computed(() => {
        const currentState = {} as T
        for (const [k, sig] of Object.entries(signals)) {
          ;(currentState as any)[k] = sig()
        }
        return (fn as any)(currentState)
      })
    }
  }

  // Create actions
  if (config.actions) {
    for (const [key, fn] of Object.entries(config.actions)) {
      result[key] = (...args: any[]) => {
        const mutableState = {} as T
        for (const [k, sig] of Object.entries(signals)) {
          ;(mutableState as any)[k] = sig.peek()
        }
        ;(fn as any)(mutableState, ...args)
        for (const [k, sig] of Object.entries(signals)) {
          if ((mutableState as any)[k] !== sig.peek()) {
            sig.set((mutableState as any)[k])
          }
        }
      }
    }
  }

  return result
}

/**
 * Create a two-way binding between a signal and a DOM element property.
 * Simplifies form handling dramatically.
 *
 * @example
 * const name = state('')
 * <input {...bind(name, 'value')} onInput={(e) => name.set(e.target.value)} />
 */
export function bind<T>(signal: Writable<T>, prop: string): Record<string, () => T> {
  return {
    [prop]: () => signal(),
  }
}

/**
 * Create a mutable ref (like React's useRef).
 */
export function createRef<T>(initial: T): Ref<T> {
  return { current: initial }
}

/**
 * Create a shallow ref — only triggers on reference change, not deep mutation.
 */
export function shallowRef<T>(value: T): Writable<T> & { readonly current: T } {
  const sig = state(value)
  const ref = Object.assign((() => sig()) as any, {
    get current() { return sig() },
    set current(v: T) { sig.set(v) },
    set: sig.set.bind(sig),
    peek: sig.peek.bind(sig),
  })
  return ref
}

/**
 * Group multiple signals into a single derived signal.
 *
 * @example
 * const [doubled, tripled] = derive(
 *   [count],
 *   (c) => [c * 2, c * 3]
 * )
 */
export function derive<T extends Readable<any>[], R>(
  sources: T,
  fn: (...values: { [K in keyof T]: T[K] extends Readable<infer V> ? V : never }) => R
): Readable<R> {
  return computed(() => {
    const values = sources.map(s => s()) as any
    return fn(...values)
  })
}

/**
 * Batch create multiple signals from an object.
 *
 * @example
 * const [count, name, items] = signals(0, 'hello', [])
 */
export function signals<T extends any[]>(...initials: T): {
  [K in keyof T]: Signal<T[K]>
} {
  return initials.map(init => state(init)) as any
}

/**
 * Create an effect that runs on a specific interval.
 *
 * @example
 * poll(() => fetchData(), 5000) // poll every 5 seconds
 */
export function poll(fn: () => void | CleanupFn, ms: number): Effect {
  const id = setInterval(() => fn(), ms)
  return {
    [EFFECT_BRAND]: true as const,
    dispose() {
      clearInterval(id)
    },
  }
}

/**
 * Create an effect that runs when a signal changes (debounced).
 *
 * @example
 * watchDebounced(searchQuery, (q) => fetchResults(q), 300)
 */
export function watchDebounced<T>(
  source: () => T,
  callback: (value: T, oldValue: T | undefined) => void,
  ms: number
): WatchHandle {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let lastValue: T | undefined
  let initialized = false

  const eff = effect(() => {
    const value = source()
    if (initialized) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => callback(value, lastValue), ms)
    }
    lastValue = value
    initialized = true
  })

  return {
    dispose() {
      clearTimeout(timeoutId)
      eff.dispose()
    },
  }
}

/**
 * Create an effect that runs when a signal changes (throttled).
 */
export function watchThrottled<T>(
  source: () => T,
  callback: (value: T, oldValue: T | undefined) => void,
  ms: number
): WatchHandle {
  let lastRun = 0
  let lastValue: T | undefined
  let initialized = false
  let pendingValue: T | undefined = false as any

  const eff = effect(() => {
    const value = source()
    if (initialized) {
      const now = Date.now()
      if (now - lastRun >= ms) {
        lastRun = now
        callback(value, lastValue)
      } else {
        pendingValue = value
        setTimeout(() => {
          if (pendingValue !== undefined) {
            callback(pendingValue, lastValue)
            pendingValue = undefined as any
            lastRun = Date.now()
          }
        }, ms - (now - lastRun))
      }
    }
    lastValue = value
    initialized = true
  })

  return {
    dispose() {
      eff.dispose()
    },
  }
}
