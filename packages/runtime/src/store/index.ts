// Flint Runtime — Enterprise State Management (v5)
// Production-ready state management with devtools, persistence, and middleware

import { state, computed, effect, batch } from '@flint/reactivity'
import type { Signal, Computed } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export interface StoreConfig<T> {
  name: string
  state: T
  getters?: Record<string, (state: T) => any>
  actions?: Record<string, (state: T, ...args: any[]) => any>
  mutations?: Record<string, (state: T, payload: any) => void>
  modules?: Record<string, StoreConfig<any>>
  plugins?: StorePlugin<T>[]
  persist?: PersistConfig | string[]
  devtools?: boolean
}

export interface StorePlugin<T> {
  name: string
  onInit?: (store: Store<T>) => void
  onAction?: (store: Store<T>, action: string, payload: any) => any
  onMutation?: (store: Store<T>, mutation: string, payload: any) => void
  onDestroy?: (store: Store<T>) => void
}

export interface PersistConfig {
  key?: string
  storage?: Storage | 'local' | 'session' | 'memory'
  paths?: string[]
  serializer?: {
    serialize: (value: any) => string
    deserialize: (value: string) => any
  }
  version?: number
  migrate?: (persisted: any, version: number) => any
}

export interface Store<T> {
  state: T
  getters: Record<string, any>
  dispatch: (action: string, payload?: any) => Promise<any>
  commit: (mutation: string, payload?: any) => void
  subscribe: (callback: (mutation: string, state: T) => void) => () => void
  subscribeAction: (callback: (action: string, payload: any) => void) => () => void
  reset: () => void
  $id: string
  $name: string
  destroy: () => void
}

// ─── Store Registry ─────────────────────────────────────────────

const storeRegistry = new Map<string, Store<any>>()
const storeHistory: Array<{ store: string; action: string; payload: any; timestamp: number }> = []

/**
 * Create a production-ready store with enterprise features.
 *
 * @example
 * const userStore = createStore({
 *   name: 'user',
 *   state: {
 *     user: null,
 *     token: null,
 *     permissions: [],
 *   },
 *   getters: {
 *     isLoggedIn: (state) => !!state.token,
 *     isAdmin: (state) => state.permissions.includes('admin'),
 *   },
 *   actions: {
 *     async login({ commit }, credentials) {
 *       const user = await api.login(credentials)
 *       commit('SET_USER', user)
 *     },
 *     logout({ commit }) {
 *       commit('SET_USER', null)
 *     },
 *   },
 *   mutations: {
 *     SET_USER(state, user) {
 *       state.user = user
 *       state.token = user?.token
 *     },
 *   },
 *   persist: ['user', 'token'],
 *   devtools: true,
 * })
 */
export function createStore<T extends Record<string, any>>(
  config: StoreConfig<T>
): Store<T> {
  const {
    name,
    state: initialState,
    getters = {},
    actions = {},
    mutations = {},
    plugins = [],
    persist,
    devtools = true,
  } = config

  const storeId = `store-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  // Initialize state
  let currentState = { ...initialState }

  // Restore persisted state
  if (persist) {
    currentState = restorePersistedState(name, currentState, persist)
  }

  // Create signals for each state property
  const signals: Record<string, Signal<any>> = {}
  for (const [key, value] of Object.entries(currentState)) {
    signals[key] = state(value)
  }

  // Create getters
  const getterSignals: Record<string, Computed<any>> = {}
  for (const [key, getter] of Object.entries(getters)) {
    getterSignals[key] = computed(() => {
      const stateObj: Record<string, any> = {}
      for (const [k, s] of Object.entries(signals)) {
        stateObj[k] = s()
      }
      return getter(stateObj as T)
    })
  }

  // Create action context
  const actionContext = {
    state: new Proxy({} as T, {
      get(_, prop: string) {
        return signals[prop as string]?.()
      },
    }),
    commit: (mutation: string, payload: any) => {
      executeMutation(mutation, payload)
    },
    dispatch: (action: string, payload: any) => {
      return executeAction(action, payload)
    },
    getters: new Proxy({} as Record<string, any>, {
      get(_, prop: string) {
        return getterSignals[prop as string]?.()
      },
    }),
    rootState: new Proxy({} as T, {
      get(_, prop: string) {
        return signals[prop as string]?.()
      },
    }),
  }

  // Subscribers
  const mutationSubscribers: Set<(mutation: string, state: T) => void> = new Set()
  const actionSubscribers: Set<(action: string, payload: any) => void> = new Set()

  // Execute mutation
  function executeMutation(mutation: string, payload: any): void {
    if (!mutations[mutation]) {
      console.warn(`[Flint Store] Unknown mutation: ${mutation}`)
      return
    }

    // Get current state object
    const stateObj: Record<string, any> = {}
    for (const [k, s] of Object.entries(signals)) {
      stateObj[k] = s()
    }

    // Execute mutation
    mutations[mutation](stateObj as T, payload)

    // Update signals
    batch(() => {
      for (const [k, s] of Object.entries(signals)) {
        const newValue = stateObj[k]
        if (s() !== newValue) {
          s.set(newValue)
        }
      }
    })

    // Notify subscribers
    mutationSubscribers.forEach(cb => cb(mutation, currentState))

    // Devtools
    if (devtools) {
      logMutation(name, mutation, payload)
    }
  }

  // Execute action
  async function executeAction(action: string, payload: any): Promise<any> {
    if (!actions[action]) {
      console.warn(`[Flint Store] Unknown action: ${action}`)
      return
    }

    // Notify action subscribers
    actionSubscribers.forEach(cb => cb(action, payload))

    // Execute plugins
    for (const plugin of plugins) {
      if (plugin.onAction) {
        plugin.onAction(store, action, payload)
      }
    }

    // Devtools
    if (devtools) {
      logAction(name, action, payload)
    }

    // Execute action
    return actions[action](actionContext, payload)
  }

  // Create store object
  const store: Store<T> = {
    state: new Proxy({} as T, {
      get(_, prop: string) {
        return signals[prop as string]?.()
      },
      set(_, prop: string, value) {
        if (signals[prop as string]) {
          signals[prop as string].set(value)
          return true
        }
        return false
      },
    }),
    getters: new Proxy({} as Record<string, any>, {
      get(_, prop: string) {
        return getterSignals[prop as string]?.()
      },
    }),
    dispatch: executeAction,
    commit: executeMutation,
    subscribe: (callback) => {
      mutationSubscribers.add(callback)
      return () => mutationSubscribers.delete(callback)
    },
    subscribeAction: (callback) => {
      actionSubscribers.add(callback)
      return () => actionSubscribers.delete(callback)
    },
    reset: () => {
      batch(() => {
        for (const [key, s] of Object.entries(signals)) {
          s.set((initialState as any)[key])
        }
      })
    },
    $id: storeId,
    $name: name,
    destroy: () => {
      plugins.forEach(p => p.onDestroy?.(store))
      storeRegistry.delete(name)
    },
  }

  // Initialize plugins
  plugins.forEach(p => p.onInit?.(store))

  // Register store
  storeRegistry.set(name, store)

  // Auto-persist
  if (persist) {
    effect(() => {
      const stateToSave: Record<string, any> = {}
      for (const [key, s] of Object.entries(signals)) {
        stateToSave[key] = s()
      }
      savePersistedState(name, stateToSave, persist)
    })
  }

  // Devtools
  if (devtools && typeof window !== 'undefined') {
    registerStoreForDevtools(store)
  }

  return store
}

// ─── Persistence Helpers ────────────────────────────────────────

function getStorage(storage?: Storage | 'local' | 'session' | 'memory'): Storage | MemoryStorage {
  if (!storage || storage === 'memory') {
    return new MemoryStorage()
  }
  if (typeof storage === 'string') {
    return storage === 'session' ? sessionStorage : localStorage
  }
  return storage
}

function restorePersistedState<T>(
  storeName: string,
  defaultState: T,
  config: PersistConfig | string[]
): T {
  try {
    const paths = Array.isArray(config) ? config : config.paths
    const storage = getStorage(
      Array.isArray(config) ? 'local' : config.storage
    )
    const key = Array.isArray(config) ? `flint-store-${storeName}` : (config.key || `flint-store-${storeName}`)

    const saved = storage.getItem(key)
    if (!saved) return defaultState

    const serializer = Array.isArray(config)
      ? { deserialize: JSON.parse }
      : config.serializer || { deserialize: JSON.parse }

    let parsed = serializer.deserialize(saved)

    // Version migration
    if (!Array.isArray(config) && config.version && config.migrate) {
      const savedVersion = parsed.__version || 0
      if (savedVersion < config.version) {
        parsed = config.migrate(parsed, savedVersion)
        parsed.__version = config.version
      }
    }

    // Merge with default state
    if (paths) {
      const merged = { ...defaultState }
      for (const path of paths) {
        if (parsed[path] !== undefined) {
          ;(merged as any)[path] = parsed[path]
        }
      }
      return merged
    }

    return { ...defaultState, ...parsed }
  } catch (error) {
    console.warn(`[Flint Store] Failed to restore persisted state for "${storeName}":`, error)
    return defaultState
  }
}

function savePersistedState<T>(
  storeName: string,
  state: T,
  config: PersistConfig | string[]
): void {
  try {
    const paths = Array.isArray(config) ? config : config.paths
    const storage = getStorage(
      Array.isArray(config) ? 'local' : config.storage
    )
    const key = Array.isArray(config) ? `flint-store-${storeName}` : (config.key || `flint-store-${storeName}`)

    const toSave = paths
      ? Object.fromEntries(paths.filter(p => p in state).map(p => [p, (state as any)[p]]))
      : state

    const serializer = Array.isArray(config)
      ? { serialize: JSON.stringify }
      : config.serializer || { serialize: JSON.stringify }

    storage.setItem(key, serializer.serialize(toSave))
  } catch (error) {
    console.warn(`[Flint Store] Failed to persist state for "${storeName}":`, error)
  }
}

class MemoryStorage implements Storage {
  private data = new Map<string, string>()

  get length() { return this.data.size }
  clear() { this.data.clear() }
  getItem(key: string) { return this.data.get(key) ?? null }
  key(index: number) { return Array.from(this.data.keys())[index] ?? null }
  removeItem(key: string) { this.data.delete(key) }
  setItem(key: string, value: string) { this.data.set(key, value) }
}

// ─── Devtools Integration ───────────────────────────────────────

function registerStoreForDevtools(store: Store<any>): void {
  if (typeof window === 'undefined') return

  const win = window as any
  if (!win.__FLINT_DEVTOOLS__) {
    win.__FLINT_DEVTOOLS__ = {
      stores: new Map(),
      history: [],
      version: '5.0.0',
    }
  }

  win.__FLINT_DEVTOOLS__.stores.set(store.$name, store)
}

function logMutation(storeName: string, mutation: string, payload: any): void {
  const win = window as any
  if (!win.__FLINT_DEVTOOLS__) return

  win.__FLINT_DEVTOOLS__.history.push({
    type: 'mutation',
    store: storeName,
    mutation,
    payload,
    timestamp: Date.now(),
  })

  if (win.__FLINT_DEVTOOLS__.history.length > 100) {
    win.__FLINT_DEVTOOLS__.history.shift()
  }
}

function logAction(storeName: string, action: string, payload: any): void {
  const win = window as any
  if (!win.__FLINT_DEVTOOLS__) return

  win.__FLINT_DEVTOOLS__.history.push({
    type: 'action',
    store: storeName,
    action,
    payload,
    timestamp: Date.now(),
  })
}

// ─── Store Utilities ────────────────────────────────────────────

/**
 * Get a registered store by name.
 *
 * @example
 * const userStore = getStore('user')
 * console.log(userStore.state.user)
 */
export function getStore<T = any>(name: string): Store<T> | undefined {
  return storeRegistry.get(name)
}

/**
 * Get all registered stores.
 */
export function getAllStores(): Store<any>[] {
  return Array.from(storeRegistry.values())
}

/**
 * Destroy all stores.
 */
export function destroyAllStores(): void {
  for (const store of storeRegistry.values()) {
    store.destroy()
  }
  storeRegistry.clear()
}

/**
 * Get store history for debugging.
 */
export function getStoreHistory(): Array<{ store: string; action: string; payload: any; timestamp: number }> {
  return [...storeHistory]
}

// ─── Middleware System ───────────────────────────────────────────

/**
 * Create a logging middleware.
 *
 * @example
 * createStore({
 *   plugins: [createLoggerMiddleware()],
 * })
 */
export function createLoggerMiddleware(options?: {
  collapsed?: boolean
  filter?: string[]
}): StorePlugin<any> {
  return {
    name: 'logger',
    onAction: (store, action, payload) => {
      if (options?.filter && !options.filter.includes(action)) return
      console.log(`[Flint Store] Action: ${action}`, payload)
    },
    onMutation: (store, mutation, payload) => {
      if (options?.filter && !options.filter.includes(mutation)) return
      console.log(`[Flint Store] Mutation: ${mutation}`, payload)
    },
  }
}

/**
 * Create a persist middleware.
 *
 * @example
 * createStore({
 *   plugins: [createPersistMiddleware({ key: 'user', storage: localStorage })],
 * })
 */
export function createPersistMiddleware<T>(
  config: PersistConfig
): StorePlugin<T> {
  return {
    name: 'persist',
    onInit: (store) => {
      // Restore state on init
      const saved = localStorage.getItem(config.key || `flint-store-${store.$name}`)
      if (saved) {
        const parsed = config.serializer?.deserialize(saved) ?? JSON.parse(saved)
        Object.assign(store.state, parsed)
      }
    },
    onMutation: (store, mutation, payload) => {
      // Save state on mutation
      const stateToSave: Record<string, any> = {}
      const paths = config.paths || Object.keys(store.state)
      for (const key of paths) {
        stateToSave[key] = (store.state as any)[key]
      }
      const serialized = config.serializer?.serialize(stateToSave) ?? JSON.stringify(stateToSave)
      localStorage.setItem(config.key || `flint-store-${store.$name}`, serialized)
    },
  }
}

/**
 * Create a validation middleware.
 *
 * @example
 * createStore({
 *   plugins: [createValidationMiddleware({
 *     SET_USER: (state, payload) => {
 *       if (!payload.email) throw new Error('Email required')
 *     },
 *   })],
 * })
 */
export function createValidationMiddleware<T>(
  rules: Record<string, (state: T, payload: any) => void>
): StorePlugin<T> {
  return {
    name: 'validation',
    onAction: (store, action, payload) => {
      const validator = rules[action]
      if (validator) {
        validator(store.state, payload)
      }
    },
  }
}

/**
 * Create a debounce middleware for actions.
 *
 * @example
 * createStore({
 *   plugins: [createDebounceMiddleware({ search: 300 })],
 * })
 */
export function createDebounceMiddleware<T>(
  delays: Record<string, number>
): StorePlugin<T> {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  return {
    name: 'debounce',
    onAction: (store, action, payload) => {
      const delay = delays[action]
      if (delay === undefined) return payload

      return new Promise((resolve) => {
        const existing = timers.get(action)
        if (existing) clearTimeout(existing)

        timers.set(action, setTimeout(() => {
          resolve(payload)
          timers.delete(action)
        }, delay))
      })
    },
  }
}

// ─── Computed Helpers ───────────────────────────────────────────

/**
 * Create a computed value that depends on multiple signals.
 *
 * @example
 * const fullName = createSelector([firstName, lastName], (first, last) => `${first} ${last}`)
 */
export function createSelector<T>(
  sources: Array<() => T>,
  combiner: (...values: T[]) => any
): Computed<any> {
  return computed(() => {
    const values = sources.map(s => s())
    return combiner(...values)
  })
}

/**
 * Create a memoized value.
 *
 * @example
 * const expensive = createMemo(() => heavyCalculation(data()))
 */
export function createMemo<T>(fn: () => T): Computed<T> {
  return computed(fn)
}
