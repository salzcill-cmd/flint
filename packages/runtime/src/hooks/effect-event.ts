// Flint Runtime — useEffectEvent Hook
// React 19 useEffectEvent equivalent

import { state, effect, untrack } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export interface EffectEventOptions {
  /** Whether the event should be stable across renders */
  stable?: boolean
  /** Debug name for development */
  name?: string
}

export interface EffectEventReturn<T extends (...args: any[]) => any> {
  /** The stable event function */
  event: T
  /** Update the event implementation */
  setEvent: (newEvent: T) => void
}

// ─── useEffectEvent Implementation ──────────────────────────────

/**
 * Create a stable event handler that doesn't trigger effects when changed.
 * React 19 useEffectEvent equivalent - extract non-reactive logic into an Effect Event.
 *
 * The event function reference stays stable across renders, but always calls
 * the latest implementation. This allows you to:
 * - Avoid adding unstable values to effect dependency arrays
 * - Keep effects clean and focused on their actual dependencies
 * - Prevent unnecessary effect re-runs
 *
 * @example
 * ```tsx
 * function SearchResults({ query, filters }) {
 *   // This event function stays stable across renders
 *   const logSearch = useEffectEvent((q: string) => {
 *     // Always calls the latest implementation
 *     analytics.logSearch(q, filters)
 *   })
 *
 *   // Effect only re-runs when query changes
 *   useEffect(() => {
 *     logSearch(query)
 *   }, [query]) // No need to include filters!
 *
 *   return <Results query={query} />
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Without useEffectEvent (BAD - unnecessary re-runs)
 * function Counter({ count, theme }) {
 *   useEffect(() => {
 *     document.title = `Count: ${count}`
 *     logCount(count, theme) // theme causes unnecessary re-runs
 *   }, [count, theme])
 * }
 *
 * // With useEffectEvent (GOOD - clean effect)
 * function Counter({ count, theme }) {
 *   const logCountEvent = useEffectEvent((c: number) => {
 *     logCount(c, theme) // Always uses latest theme
 *   })
 *
 *   useEffect(() => {
 *     document.title = `Count: ${count}`
 *     logCountEvent(count) // Only re-runs when count changes
 *   }, [count])
 * }
 * ```
 */
export function useEffectEvent<T extends (...args: any[]) => any>(
  eventFn: T,
  options?: EffectEventOptions
): EffectEventReturn<T> {
  // Store the latest event implementation
  const latestEventState = state<T>(eventFn)

  // Create a stable wrapper that always calls the latest implementation
  const stableEvent = ((...args: any[]) => {
    return latestEventState()(...args)
  }) as T

  // In development, add name for debugging
  if (options?.name && typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
    Object.defineProperty(stableEvent, 'name', {
      value: options.name,
      writable: false,
    })
  }

  // Wrap set to always pass value directly (not as updater function)
  const setEvent = (newEvent: T) => {
    latestEventState.set(() => newEvent)
  }

  return {
    event: stableEvent,
    setEvent,
  }
}

/**
 * Simplified version that returns just the stable event function.
 *
 * @example
 * ```tsx
 * function SearchResults({ query, filters }) {
 *   const logSearch = useStableEvent((q: string) => {
 *     analytics.logSearch(q, filters)
 *   })
 *
 *   useEffect(() => {
 *     logSearch(query)
 *   }, [query])
 *
 *   return <Results query={query} />
 * }
 * ```
 */
export function useStableEvent<T extends (...args: any[]) => any>(
  eventFn: T
): T {
  const { event } = useEffectEvent(eventFn)
  return event
}

// ─── useEffectEvent with Cleanup ────────────────────────────────

/**
 * Create an effect event with cleanup support.
 * The cleanup function runs before the event is called again or on unmount.
 *
 * @example
 * ```tsx
 * function Timer({ interval }) {
 *   const startTimer = useEffectEventWithCleanup(
 *     (ms: number) => {
 *       const id = setInterval(() => {
 *         console.log('tick')
 *       }, ms)
 *
 *       // Cleanup function
 *       return () => clearInterval(id)
 *     }
 *   )
 *
 *   useEffect(() => {
 *     const cleanup = startTimer(interval)
 *     return cleanup
 *   }, [interval])
 * }
 * ```
 */
export function useEffectEventWithCleanup<T extends (...args: any[]) => (() => void) | void>(
  eventFn: T,
  options?: EffectEventOptions
): EffectEventReturn<T> {
  let lastCleanup: (() => void) | null = null

  const wrappedEvent = ((...args: any[]) => {
    // Run previous cleanup
    if (lastCleanup) {
      lastCleanup()
      lastCleanup = null
    }

    // Call the event and store cleanup
    const result = eventFn(...args)
    if (typeof result === 'function') {
      lastCleanup = result
    }
  }) as T

  const result = useEffectEvent(wrappedEvent, options)

  // Add cleanup to the setEvent
  const originalSetEvent = result.setEvent
  const enhancedSetEvent = (newEvent: T) => {
    // Run cleanup before changing event
    if (lastCleanup) {
      lastCleanup()
      lastCleanup = null
    }
    originalSetEvent(newEvent)
  }

  return {
    ...result,
    setEvent: enhancedSetEvent,
  }
}

// ─── useEffectEvent Debounced ───────────────────────────────────

/**
 * Create a debounced effect event.
 * Useful for search inputs, resize handlers, etc.
 *
 * @example
 * ```tsx
 * function SearchInput({ onSearch }) {
 *   const debouncedSearch = useEffectEventDebounced(
 *     (query: string) => {
 *       onSearch(query)
 *     },
 *     300 // 300ms debounce
 *   )
 *
 *   return (
 *     <input
 *       type="search"
 *       onChange={(e) => debouncedSearch(e.target.value)}
 *     />
 *   )
 * }
 * ```
 */
export function useEffectEventDebounced<T extends (...args: any[]) => any>(
  eventFn: T,
  delay: number,
  options?: EffectEventOptions & { maxWait?: number }
): EffectEventReturn<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastCallTime = 0
  let lastArgs: any[] | null = null

  const debouncedFn = ((...args: any[]) => {
    lastArgs = args
    lastCallTime = Date.now()

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      eventFn(...args)
      timeoutId = null
    }, delay)
  }) as T

  // Add cancel method
  const debouncedWithCancel = Object.assign(debouncedFn, {
    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    },
    flush: () => {
      if (timeoutId && lastArgs) {
        clearTimeout(timeoutId)
        timeoutId = null
        eventFn(...lastArgs)
      }
    },
  })

  const { event, setEvent } = useEffectEvent(debouncedWithCancel as any, options)

  // Propagate cancel/flush to the stable wrapper
  const eventWithMethods = Object.assign(event as any, {
    cancel: debouncedWithCancel.cancel,
    flush: debouncedWithCancel.flush,
  })

  // Cleanup on unmount
  const originalSetEvent = setEvent
  const enhancedSetEvent = (newEvent: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    originalSetEvent(newEvent)
  }

  return {
    event: eventWithMethods as T,
    setEvent: enhancedSetEvent,
  }
}

// ─── useEffectEvent Throttled ───────────────────────────────────

/**
 * Create a throttled effect event.
 * Limits how often the event can fire.
 *
 * @example
 * ```tsx
 * function ScrollHandler({ onScroll }) {
 *   const throttledScroll = useEffectEventThrottled(
 *     (scrollY: number) => {
 *       onScroll(scrollY)
 *     },
 *     100 // 100ms throttle
 *   )
 *
 *   useEffect(() => {
 *     const handleScroll = () => throttledScroll(window.scrollY)
 *     window.addEventListener('scroll', handleScroll)
 *     return () => window.removeEventListener('scroll', handleScroll)
 *   }, [])
 * }
 * ```
 */
export function useEffectEventThrottled<T extends (...args: any[]) => any>(
  eventFn: T,
  limit: number,
  options?: EffectEventOptions
): EffectEventReturn<T> {
  let inThrottle = false
  let lastArgs: any[] | null = null

  const throttledFn = ((...args: any[]) => {
    lastArgs = args

    if (!inThrottle) {
      eventFn(...args)
      inThrottle = true

      setTimeout(() => {
        inThrottle = false

        // Call with last args if any were queued
        if (lastArgs) {
          const currentArgs = lastArgs
          lastArgs = null
          throttledFn(...currentArgs)
        }
      }, limit)
    }
  }) as T

  const { event, setEvent } = useEffectEvent(throttledFn, options)

  return { event, setEvent }
}

// ─── useAnimationFrame Event ────────────────────────────────────

/**
 * Create an effect event that runs on animation frames.
 * Useful for animations, scroll handlers, etc.
 *
 * @example
 * ```tsx
 * function Animation() {
 *   const animate = useEffectAnimationFrame(
 *     (time: number) => {
 *       console.log('Frame at', time)
 *     }
 *   )
 *
 *   useEffect(() => {
 *     let frameId: number
 *     const loop = (time: number) => {
 *       animate(time)
 *       frameId = requestAnimationFrame(loop)
 *     }
 *     frameId = requestAnimationFrame(loop)
 *     return () => cancelAnimationFrame(frameId)
 *   }, [])
 * }
 * ```
 */
export function useEffectAnimationFrame<T extends (time: number) => void>(
  eventFn: T,
  options?: EffectEventOptions
): EffectEventReturn<T> {
  let frameId: number | null = null

  const { event, setEvent } = useEffectEvent(eventFn, options)

  // Cleanup on unmount
  const originalSetEvent = setEvent
  const enhancedSetEvent = (newEvent: T) => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId)
      frameId = null
    }
    originalSetEvent(newEvent)
  }

  return {
    event,
    setEvent: enhancedSetEvent,
  }
}

// ─── useEffectEvent Intersection Observer ───────────────────────

/**
 * Create an effect event for intersection observer.
 * Useful for lazy loading, infinite scroll, etc.
 *
 * @example
 * ```tsx
 * function LazyImage({ src }) {
 *   const [isVisible, setIsVisible] = state(false)
 *   const imgRef = useRef(null)
 *
 *   const onIntersect = useEffectEventIntersection(
 *     (entries: IntersectionObserverEntry[]) => {
 *       if (entries[0].isIntersecting) {
 *         setIsVisible(true)
 *       }
 *     },
 *     { threshold: 0.1 }
 *   )
 *
 *   useEffect(() => {
 *     const observer = new IntersectionObserver(onIntersect)
 *     if (imgRef.current) observer.observe(imgRef.current)
 *     return () => observer.disconnect()
 *   }, [])
 *
 *   return (
 *     <div ref={imgRef}>
 *       {isVisible && <img src={src} />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useEffectEventIntersection(
  eventFn: (entries: IntersectionObserverEntry[]) => void,
  options?: EffectEventOptions & IntersectionObserverInit
): EffectEventReturn<(entries: IntersectionObserverEntry[]) => void> {
  return useEffectEvent(eventFn, options)
}
