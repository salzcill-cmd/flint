// Flint Runtime — Store Pattern
// Shared reactive state with fine-grained updates

import { state, computed, effect, batch, type Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export interface Store<T extends Record<string, any>> {
  getState(): Readonly<T>
  getSignal<K extends keyof T>(key: K): Signal<T[K]>
  setState(update: Partial<T> | ((prev: T) => Partial<T>)): void
  subscribe(key: keyof T, callback: (value: any, oldValue: any) => void): () => void
  destroy(): void
}

export interface StoreOptions<T> {
  /** Persist to localStorage */
  persist?: boolean | string
  /** Middleware */
  middleware?: StoreMiddleware<T>[]
}

export type StoreMiddleware<T> = {
  onSet?: (key: keyof T, value: any, prev: any) => any | void
  onGet?: (key: keyof T, value: any) => any | void
}

// ─── createStore() ──────────────────────────────────────────────

/**
 * Create a reactive store with fine-grained subscriptions.
 *
 * @example
 * const counterStore = createStore({
 *   count: 0,
 *   name: 'Flint',
 * })
 *
 * // Read state
 * counterStore.getState().count
 *
 * // Get a signal for a specific key
 * const countSignal = counterStore.getSignal('count')
 * countSignal() // read
 * countSignal.set(5) // write
 *
 * // Subscribe to changes
 * counterStore.subscribe('count', (newVal, oldVal) => {
 *   console.log(`Count changed: ${oldVal} → ${newVal}`)
 * })
 *
 * // Update multiple keys at once
 * counterStore.setState({ count: 10, name: 'Updated' })
 */
export function createStore<T extends Record<string, any>>(
  initialState: T,
  options: StoreOptions<T> = {}
): Store<T> {
  // Create signals for each key
  const signals = new Map<keyof T, Signal<any>>()
  const subscriptions = new Map<keyof T, Set<(value: any, oldValue: any) => void>>()

  for (const key of Object.keys(initialState) as (keyof T)[]) {
    signals.set(key, state(initialState[key]))
  }

  // Load persisted state
  let destroyed = false

  if (options.persist) {
    const storageKey = typeof options.persist === 'string'
      ? options.persist
      : `flint-store-${Math.random().toString(36).slice(2)}`

    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        batch(() => {
          for (const [key, value] of Object.entries(parsed)) {
            const sig = signals.get(key as keyof T)
            if (sig) {
              sig.set(value)
            }
          }
        })
      }

      // Save on changes
      effect(() => {
        const state: any = {}
        for (const [key, sig] of signals) {
          state[key] = sig()
        }
        localStorage.setItem(storageKey, JSON.stringify(state))
      })
    } catch (e) {
      console.warn('[Flint Store] Failed to load persisted state:', e)
    }
  }

  return {
    getState(): Readonly<T> {
      if (destroyed) {
        throw new Error('[Flint Store] Store has been destroyed')
      }
      const result: any = {}
      for (const [key, sig] of signals) {
        const value = sig()
        // Run onGet middleware
        if (options.middleware) {
          for (const mw of options.middleware) {
            if (mw.onGet) {
              result[key] = mw.onGet(key, value)
            }
          }
        }
        result[key] = value
      }
      return result as Readonly<T>
    },

    getSignal<K extends keyof T>(key: K): Signal<T[K]> {
      const sig = signals.get(key)
      if (!sig) {
        throw new Error(`[Flint Store] Key "${String(key)}" not found in store`)
      }
      return sig as Signal<T[K]>
    },

    setState(update: Partial<T> | ((prev: T) => Partial<T>)) {
      batch(() => {
        const currentState = this.getState()
        const updates = typeof update === 'function'
          ? update(currentState)
          : update

        for (const [key, value] of Object.entries(updates)) {
          const sig = signals.get(key as keyof T)
          if (sig) {
            let finalValue = value
            // Run onSet middleware
            if (options.middleware) {
              for (const mw of options.middleware) {
                if (mw.onSet) {
                  const result = mw.onSet(key as keyof T, value, sig())
                  if (result !== undefined) {
                    finalValue = result
                  }
                }
              }
            }

            const oldValue = sig()
            sig.set(finalValue)

            // Notify subscribers
            const subs = subscriptions.get(key as keyof T)
            if (subs) {
              for (const callback of subs) {
                callback(finalValue, oldValue)
              }
            }
          }
        }
      })
    },

    subscribe<K extends keyof T>(
      key: K,
      callback: (value: T[K], oldValue: T[K]) => void
    ): () => void {
      if (!subscriptions.has(key)) {
        subscriptions.set(key, new Set())
      }
      subscriptions.get(key)!.add(callback)

      return () => {
        subscriptions.get(key)?.delete(callback)
      }
    },

    destroy() {
      destroyed = true
      signals.clear()
      subscriptions.clear()
    },
  }
}
