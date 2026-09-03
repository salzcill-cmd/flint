// Flint Reactivity — Fine-grained signals system
// Inspired by Solid.js, Svelte 5 Runes, and Angular Signals

export {
  state,
  computed,
  effect,
  watch,
  batch,
  untrack,
  createSelector,
  createRoot,
  onCleanup,
} from './signals.js'
export type {
  Signal,
  Computed,
  Effect,
  CleanupFn,
  Selector,
  Scope,
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
