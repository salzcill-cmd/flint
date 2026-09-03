// Flint Runtime — Activity & KeepAlive Components
// React 19 Activity / Vue KeepAlive equivalents

import { state, effect, onCleanup } from '@flint/reactivity'
import type { Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export interface ActivityProps {
  /** Whether the activity is active */
  active?: boolean
  /** The content to render */
  children: any
  /** Called when activity becomes visible */
  onVisible?: () => void
  /** Called when activity becomes hidden */
  onHidden?: () => void
  /** Keep alive even when hidden (preserves state) */
  keepAlive?: boolean
  /** Max number of inactive instances to keep */
  max?: number
  /** Cache key for this activity */
  cacheKey?: string
}

export interface KeepAliveProps {
  /** The content to render */
  children: any
  /** Whether to keep the component alive */
  keep?: boolean
  /** Cache key */
  cacheKey?: string
  /** Max number of cached components */
  max?: number
  /** Called when component is deactivated */
  onDeactivate?: () => void
  /** Called when component is activated */
  onActivate?: () => void
  /** Include patterns - only cache these components */
  include?: string | string[] | RegExp
  /** Exclude patterns - never cache these components */
  exclude?: string | string[] | RegExp
}

export interface ActivityInstance {
  /** Unique ID */
  id: string
  /** The component element */
  element: any
  /** Whether currently active */
  active: boolean
  /** Timestamp when deactivated */
  deactivatedAt?: number
  /** State snapshot for restoration */
  stateSnapshot?: Record<string, any>
}

// ─── Activity Component ─────────────────────────────────────────

/**
 * Hide/restore UI and internal state (React 19 Activity equivalent).
 * When inactive, the component tree is hidden but its state is preserved.
 *
 * @example
 * ```tsx
 * function App() {
 *   const [showSidebar, setShowSidebar] = state(true)
 *
 *   return (
 *     <div>
 *       <button onClick={() => setShowSidebar(!showSidebar)}>
 *         Toggle Sidebar
 *       </button>
 *
 *       <Activity active={showSidebar} keepAlive>
 *         <Sidebar />
 *       </Activity>
 *
 *       <main>
 *         <Content />
 *       </main>
 *     </div>
 *   )
 * }
 * ```
 */
export function Activity(props: ActivityProps): any {
  const {
    active = true,
    children,
    onVisible,
    onHidden,
    keepAlive = true,
    cacheKey,
  } = props

  // Create activity state
  const activityState = state<{
    isActive: boolean
    hasBeenActive: boolean
    instance: ActivityInstance | null
  }>({
    isActive: active,
    hasBeenActive: false,
    instance: null,
  })

  // Track activation/deactivation
  effect(() => {
    const current = activityState()
    if (active && !current.isActive) {
      // Becoming active
      activityState.set({
        ...current,
        isActive: true,
        hasBeenActive: true,
      })
      onVisible?.()
    } else if (!active && current.isActive) {
      // Becoming inactive
      activityState.set({
        ...current,
        isActive: false,
      })
      onHidden?.()
    }
  })

  // Handle cleanup
  onCleanup(() => {
    if (!keepAlive) {
      // Remove from cache if not keeping alive
      if (cacheKey) {
        activityCache.delete(cacheKey)
      }
    }
  })

  // Return rendered content based on active state
  if (active) {
    return children
  }

  // If not active but keepAlive, return null (hidden but preserved)
  if (keepAlive) {
    return null
  }

  // If not active and not keepAlive, don't render
  return null
}

/**
 * Simplified Activity component for toggling visibility.
 *
 * @example
 * ```tsx
 * function App() {
 *   const [show, setShow] = state(false)
 *
 *   return (
 *     <div>
 *       <button onClick={() => setShow(!show)}>Toggle</button>
 *       <Show when={show}>
 *         <Activity keepAlive>
 *           <ExpensiveComponent />
 *         </Activity>
 *       </Show>
 *     </div>
 *   )
 * }
 * ```
 */
export function KeepAlive(props: KeepAliveProps): any {
  const {
    children,
    keep = true,
    cacheKey,
    max = 100,
    onDeactivate,
    onActivate,
    include,
    exclude,
  } = props

  // Get component name for caching
  const componentName = getComponentName(children)

  // Check include/exclude patterns
  const shouldCache = checkShouldCache(componentName, include, exclude)

  if (!shouldCache || !keep) {
    return children
  }

  // Generate cache key
  const key = cacheKey || componentName || `keepalive_${Math.random().toString(36).slice(2)}`

  // Manage cache
  const cached = activityCache.get(key)
  if (cached) {
    // Reactivate
    cached.active = true
    onActivate?.()
  } else {
    // Add to cache
    addToCache(key, {
      id: key,
      element: children,
      active: true,
      deactivatedAt: undefined,
    }, max)
  }

  // Cleanup on unmount
  onCleanup(() => {
    const entry = activityCache.get(key)
    if (entry) {
      entry.active = false
      entry.deactivatedAt = Date.now()
      onDeactivate?.()
    }
  })

  return children
}

// ─── Activity Cache ─────────────────────────────────────────────

const activityCache = new Map<string, ActivityInstance>()

function addToCache(key: string, instance: ActivityInstance, max: number): void {
  // Remove oldest if at capacity
  if (activityCache.size >= max) {
    const oldest = Array.from(activityCache.entries())
      .sort((a, b) => (a[1].deactivatedAt || 0) - (b[1].deactivatedAt || 0))[0]
    if (oldest) {
      activityCache.delete(oldest[0])
    }
  }

  activityCache.set(key, instance)
}

function getComponentName(children: any): string {
  if (typeof children === 'function') {
    return children.displayName || children.name || 'Anonymous'
  }
  if (children && typeof children === 'object') {
    return children.type?.displayName || children.type?.name || 'Anonymous'
  }
  return 'Anonymous'
}

function checkShouldCache(
  name: string,
  include?: string | string[] | RegExp,
  exclude?: string | string[] | RegExp
): boolean {
  // If no patterns, cache everything
  if (!include && !exclude) return true

  // Check exclude first
  if (exclude) {
    if (Array.isArray(exclude)) {
      if (exclude.includes(name)) return false
    } else if (exclude instanceof RegExp) {
      if (exclude.test(name)) return false
    } else if (exclude === name) {
      return false
    }
  }

  // Check include
  if (include) {
    if (Array.isArray(include)) {
      return include.includes(name)
    } else if (include instanceof RegExp) {
      return include.test(name)
    } else {
      return include === name
    }
  }

  return true
}

/**
 * Clear the activity cache.
 */
export function clearActivityCache(): void {
  activityCache.clear()
}

/**
 * Get activity cache stats.
 */
export function getActivityCacheStats(): {
  size: number
  keys: string[]
  instances: ActivityInstance[]
} {
  return {
    size: activityCache.size,
    keys: Array.from(activityCache.keys()),
    instances: Array.from(activityCache.values()),
  }
}

// ─── useActivity Hook ───────────────────────────────────────────

/**
 * Hook to control activity state.
 *
 * @example
 * ```tsx
 * function Sidebar() {
 *   const { isActive, activate, deactivate, toggle } = useActivity('sidebar')
 *
 *   return (
 *     <div>
 *       <button onClick={toggle}>Toggle Sidebar</button>
 *       {isActive() && <SidebarContent />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useActivity(key?: string): {
  isActive: () => boolean
  activate: () => void
  deactivate: () => void
  toggle: () => void
  isCached: () => boolean
} {
  const activityKey = key || `activity_${Math.random().toString(36).slice(2)}`

  const cached = activityCache.get(activityKey)
  const isActiveState = state<boolean>(cached?.active ?? false)

  const activate = () => {
    isActiveState.set(true)
    const cached = activityCache.get(activityKey)
    if (cached) {
      cached.active = true
    }
  }

  const deactivate = () => {
    isActiveState.set(false)
    const cached = activityCache.get(activityKey)
    if (cached) {
      cached.active = false
      cached.deactivatedAt = Date.now()
    }
  }

  const toggle = () => {
    if (isActiveState()) {
      deactivate()
    } else {
      activate()
    }
  }

  const isCached = () => activityCache.has(activityKey)

  return { isActive: isActiveState, activate, deactivate, toggle, isCached }
}
