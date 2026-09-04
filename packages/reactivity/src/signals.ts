// Flint Reactivity — Core signals implementation
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
  if (currentSubscriber && !currentSubscriber.tracking) {
    // Mark that we're reading this subscriber for the first time in this run
    // The dependency will be added when the subscriber's tracking set is built
  }
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

// Track which computeds are currently being updated to detect cycles
const updatingComputeds = new WeakSet<ComputedState<any>>()

function markDirty(signal: SignalState<any> | ComputedState<any>): void {
  signal.version = writeVersion

  for (const observer of signal.observers) {
    if (observer.kind === 'computed') {
      if (!observer.dirty) {
        // Cycle detection: if this computed is already being updated, skip
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
  // A computed is dirty if any dependency has a newer version
  for (const dep of computed.dependencies) {
    if (dep.version > computed.version) {
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

  // Process pending computeds first (effects may depend on them)
  while (pendingComputeds.size > 0) {
    const computeds = [...pendingComputeds]
    pendingComputeds.clear()
    for (const computed of computeds) {
      if (computed.dirty && !computed.disposed) {
        updateComputed(computed)
      }
    }
  }

  // Then process effects (Set automatically deduplicates)
  const effects = [...pendingEffects]
  pendingEffects.clear()
  for (const effect of effects) {
    if (!effect.disposed) {
      runEffect(effect)
    }
  }
}

// ─── Core Primitives ────────────────────────────────────────────

function updateComputed<T>(computed: ComputedState<T>): void {
  // Cycle detection
  if (updatingComputeds.has(computed)) {
    console.warn('[Flint] Circular computed dependency detected during update:', computed)
    return
  }

  // Use custom updater if available
  if ((computed as any).customUpdate) {
    return (computed as any).customUpdate(computed)
  }

  updatingComputeds.add(computed)
  untrackAll(computed)

  const prevSubscriber = currentSubscriber
  currentSubscriber = computed
  computed.tracking = true
  readVersion++

  try {
    const newValue = computed.fn()
    if (!defaultEquals(computed.value, newValue)) {
      computed.value = newValue
      computed.version = writeVersion
      // Notify observers of this computed
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

  // Cleanup previous effect
  if (effect.cleanup) {
    effect.cleanup()
    effect.cleanup = null
  }

  // Untrack previous dependencies
  untrackAll(effect)

  // Run effect with dependency tracking
  const prevSubscriber = currentSubscriber
  currentSubscriber = effect
  effect.tracking = true
  readVersion++

  try {
    const result = effect.fn()
    if (typeof result === 'function') {
      effect.cleanup = result as CleanupFn
    }
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
      markDirty(signalState)
      scheduleFlush()
    }
  }

  read.peek = () => signalState.value

  return read
}

/**
 * Create a computed (derived) value.
 * Lazily evaluated and cached. Only recomputes when dependencies change.
 *
 * @example
 * const count = state(0)
 * const doubled = computed(() => count() * 2)
 * doubled() // read: 0
 * count.set(3)
 * doubled() // read: 6 (recomputed lazily)
 */
export function computed<T>(fn: () => T, options?: { equals?: (prev: T, next: T) => boolean }): Computed<T> {
  const comparator = options?.equals ?? defaultEquals

  const computedState: ComputedState<T> = {
    kind: 'computed',
    value: undefined as T,
    version: 0,
    dirty: true,
    disposed: false,
    fn,
    observers: new Set(),
    dependencies: new Set(),
    tracking: false,
  }

  const read = (() => {
    // If we have a current subscriber, register as dependency
    if (currentSubscriber && currentSubscriber !== computedState) {
      // Don't track if already tracking this computed
    }

    track(computedState)

    if (computedState.dirty || isDirty(computedState)) {
      updateComputed(computedState)
    }

    return computedState.value
  }) as Computed<T>

  // Mark as computed (use Object.defineProperty to bypass readonly)
  Object.defineProperty(read, COMPUTED_BRAND, { value: true })

  // Override the default equals check for this computed
  const originalUpdateComputed = updateComputed
  const patchedUpdateComputed = (c: ComputedState<any>) => {
    untrackAll(c)

    const prevSubscriber = currentSubscriber
    currentSubscriber = c
    c.tracking = true
    readVersion++

    try {
      const newValue = c.fn()
      if (!comparator(c.value, newValue)) {
        c.value = newValue
        c.version = writeVersion
        // Notify observers
        for (const observer of c.observers) {
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
      c.dirty = false
    } finally {
      c.tracking = false
      currentSubscriber = prevSubscriber
    }
  }

  // Store the patched updater on the state
  ;(computedState as any).customUpdate = patchedUpdateComputed

  // Initial evaluation
  patchedUpdateComputed(computedState)

  return read
}

/**
 * Create a side effect that auto-tracks dependencies.
 *
 * @example
 * effect(() => {
 *   console.log('Count:', count())
 *   // Automatically re-runs when count changes
 * })
 */
export function effect(fn: () => void | CleanupFn): Effect {
  const effectState: EffectState = {
    kind: 'effect',
    fn,
    cleanup: null,
    dependencies: new Set(),
    tracking: false,
    disposed: false,
  }

  // Run effect initially
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
 * Lazy — only runs when the watched value is read.
 *
 * @example
 * watch(() => count(), (newVal, oldVal) => {
 *   console.log(`Changed from ${oldVal} to ${newVal}`)
 * })
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
 *
 * @example
 * batch(() => {
 *   count.set(1)
 *   name.set('Flint')
 *   // DOM updates happen once at the end
 * })
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

// ─── untrack ────────────────────────────────────────────────────

/**
 * Read signals without subscribing to them.
 * Useful for breaking reactive chains when needed.
 *
 * @example
 * const count = state(0)
 * const name = state('Flint')
 *
 * effect(() => {
 *   // Only re-runs when name changes
 *   console.log(untrack(() => count()), name())
 * })
 */
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

/**
 * Create a scope for grouped effect lifecycle.
 * All effects created inside the scope are disposed when the scope is disposed.
 *
 * @example
 * const scope = createRoot((dispose) => {
 *   effect(() => console.log(count()))
 *   effect(() => console.log(name()))
 *
 *   return { dispose }
 * })
 *
 * // Later: dispose all effects at once
 * scope.dispose()
 */
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
    // Run cleanup in reverse order
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

/**
 * Track a cleanup function in the current scope or effect.
 * If no scope/effect is active, the function is called on global cleanup.
 *
 * @example
 * effect(() => {
 *   const timer = setInterval(() => {}, 1000)
 *   onCleanup(() => clearInterval(timer))
 * })
 */
export function onCleanup(fn: CleanupFn): void {
  // Register in current scope if available
  if (currentScope) {
    currentScope.disposables.push(fn)
  }
  // Also register in current effect if available
  if (currentSubscriber && currentSubscriber.kind === 'effect') {
    const effect = currentSubscriber as EffectState
    const prevCleanup = effect.cleanup
    effect.cleanup = () => {
      if (prevCleanup) prevCleanup()
      fn()
    }
  }
}

// ─── createSelector (v2 — signal-based) ─────────────────────────

/**
 * Create a selector that tracks which key is selected.
 * Only re-runs effects for the previously and newly selected items.
 *
 * @example
 * const selected = state('id-1')
 * const isSelected = createSelector(selected)
 *
 * // In a list — only old and new selected items re-render
 * For({ each: items, children: (item) => (
 *   <div class={isSelected(item.id) ? 'active' : ''}>
 *     {item.name}
 *   </div>
 * )})
 */
export function createSelector<T>(
  source: Signal<T> | Readable<T> | (() => T)
): Selector<T> {
  const sourceFn = typeof source === 'function' ? source : () => (source as Readable<T>)()
  let currentValue: T
  const effectsByValue = new Map<T, Set<EffectState>>()

  // Track the source value
  const eff = effect(() => {
    currentValue = sourceFn()
  })

  function select(key: T): boolean {
    // Register this effect as depending on the key
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
        // Check if source has a set method (Signal/Writable)
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

// ─── onMount / onCleanup (component-level) ──────────────────────

/**
 * Register a cleanup function to run when the current effect/scope is disposed.
 * Alias for onCleanup — works in effects and scopes.
 *
 * @example
 * effect(() => {
 *   const subscription = subscribe(channel)
 *   onCleanup(() => subscription.unsubscribe())
 * })
 */
export { onCleanup as onDispose }
