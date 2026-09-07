// Flint Reactivity — Fine-grained signals system v4

export {
  state,
  computed,
  effect,
  watch,
  batch,
  flushSync,
  untrack,
  captureScope,
  createSelector,
  createRoot,
  onCleanup,
  // NEW v4 simplified APIs
  reactive,
  model,
  bind,
  createRef,
  shallowRef,
  derive,
  signals,
  poll,
  watchDebounced,
  watchThrottled,
  computedSet,
} from './signals.js'
export type {
  Signal,
  Computed,
  Effect,
  CleanupFn,
  Selector,
  Scope,
  ReactiveProxy,
  Ref,
  Writable,
  Readable,
  WatchHandle,
} from './types.js'

// Debug mode v2
export {
  DebugManager,
  createDebugManager,
  getDebugManager,
  enableDebug,
  disableDebug,
  trackSignal,
  trackComputed,
  printSignalHistory,
  printComputedStats,
  printPerformanceSummary,
} from './debug.js'
export type {
  DebugOptions,
  SignalDebugInfo,
  ComputedDebugInfo,
  EffectDebugInfo,
  SignalHistoryEntry,
} from './debug.js'
