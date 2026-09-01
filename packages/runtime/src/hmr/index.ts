// Flint Runtime — Hot Module Replacement
// HMR support for Flint components

// ─── Types ──────────────────────────────────────────────────────

export interface HMRModule {
  id: string
  timestamp: number
}

export interface HMRUpdate {
  type: 'create' | 'update' | 'dispose'
  moduleId: string
  acceptedBy: string
  timestamp: number
}

// ─── HMR Runtime ────────────────────────────────────────────────

const hmrCallbacks = new Map<string, Set<(update: HMRUpdate) => void>>()
const hmrDisposers = new Map<string, Set<() => void>>()
let hmrEnabled = false

/**
 * Check if HMR is available.
 */
export function isHMR(): boolean {
  return hmrEnabled
}

/**
 * Register a module for HMR acceptance.
 * When the module is updated, the callback will be called.
 *
 * @example
 * if (import.meta.hot) {
 *   import.meta.hot.accept((update) => {
 *     console.log('Module updated:', update.moduleId)
 *   })
 * }
 */
export function acceptHMR(
  moduleId: string,
  callback: (update: HMRUpdate) => void
): () => void {
  if (!hmrCallbacks.has(moduleId)) {
    hmrCallbacks.set(moduleId, new Set())
  }
  hmrCallbacks.get(moduleId)!.add(callback)

  // Return unsubscribe function
  return () => {
    hmrCallbacks.get(moduleId)?.delete(callback)
  }
}

/**
 * Register a disposal handler for a module.
 * Called when the module is about to be replaced.
 *
 * @example
 * if (import.meta.hot) {
 *   import.meta.hot.dispose(() => {
 *     // Clean up resources
 *     clearInterval(timer)
 *   })
 * }
 */
export function onHMRDispose(
  moduleId: string,
  callback: () => void
): () => void {
  if (!hmrDisposers.has(moduleId)) {
    hmrDisposers.set(moduleId, new Set())
  }
  hmrDisposers.get(moduleId)!.add(callback)

  return () => {
    hmrDisposers.get(moduleId)?.delete(callback)
  }
}

/**
 * Trigger HMR update for a module.
 * Called by the Vite plugin when a file changes.
 */
export function triggerHMRUpdate(update: HMRUpdate): void {
  const callbacks = hmrCallbacks.get(update.moduleId)
  if (callbacks) {
    for (const callback of callbacks) {
      try {
        callback(update)
      } catch (err) {
        console.error(`[Flint HMR] Error in update callback for ${update.moduleId}:`, err)
      }
    }
  }

  // Also notify wildcard listeners
  const wildcardCallbacks = hmrCallbacks.get('*')
  if (wildcardCallbacks) {
    for (const callback of wildcardCallbacks) {
      try {
        callback(update)
      } catch (err) {
        console.error(`[Flint HMR] Error in wildcard callback:`, err)
      }
    }
  }
}

/**
 * Run disposal handlers for a module.
 */
export function runHMRDisposers(moduleId: string): void {
  const disposers = hmrDisposers.get(moduleId)
  if (disposers) {
    for (const disposer of disposers) {
      try {
        disposer()
      } catch (err) {
        console.error(`[Flint HMR] Error in disposer for ${moduleId}:`, err)
      }
    }
    disposers.clear()
  }
}

// ─── Vite HMR Integration ──────────────────────────────────────

/**
 * Initialize HMR with Vite's import.meta.hot API.
 * Call this in your entry point to enable HMR.
 *
 * @example
 * // src/main.jsx
 * import { initHMR } from 'flint'
 * initHMR(import.meta.hot)
 */
export function initHMR(hot: any): void {
  if (!hot) return

  hmrEnabled = true

  hot.on('flint:update', (update: HMRUpdate) => {
    runHMRDisposers(update.moduleId)
    triggerHMRUpdate(update)
  })

  hot.on('flint:dispose', (update: HMRUpdate) => {
    runHMRDisposers(update.moduleId)
  })

  hot.on('vite:beforeFullReload', () => {
    // Clean up all HMR state before full reload
    hmrCallbacks.clear()
    hmrDisposers.clear()
  })
}
