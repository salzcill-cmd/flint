// Flint — User-facing package
// Re-exports everything from @flint/runtime for convenient imports

export * from 'flint-runtime'

// Re-export store
export { create, useStore, immer, logger, persist, devtools } from 'flint-store'
export type { StoreApi, StateCreator, Middleware } from 'flint-store'

// Re-export reactivity aliases
export {
  createSignal,
  createEffect,
  createMemo,
  createStore,
  batch,
  createResource,
  from,
  produce,
} from 'flint-reactivity'
