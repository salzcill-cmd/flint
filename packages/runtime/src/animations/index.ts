// Flint Runtime v2 — Animations & Transitions
// Built-in animation system with CSS and JS animations

import { state, computed, effect } from '@flint/reactivity'
import type { Signal } from '@flint/reactivity'
import { h } from '../renderer/index.js'
import type { Child } from '../renderer/index.js'

// ─── Types ──────────────────────────────────────────────────────

export type EasingFunction = (t: number) => number

export interface AnimationOptions {
  duration?: number
  easing?: EasingFunction | string
  delay?: number
  fill?: FillMode
  iterations?: number | 'infinity'
  direction?: PlaybackDirection
}

export interface TransitionOptions {
  enter?: AnimationOptions
  exit?: AnimationOptions
  appear?: AnimationOptions
}

export interface Keyframe {
  offset?: number
  [property: string]: any
}

export interface Animation {
  play(): void
  pause(): void
  cancel(): void
  finish(): void
  reverse(): void
  onfinish: (() => void) | null
  oncancel: (() => void) | null
  finished: Promise<void>
}

// ─── Easing Functions ───────────────────────────────────────────

export const easings = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t: number) => {
    if (t === 0 || t === 1) return t
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2
  },
  easeInBack: (t: number) => t * t * (2.70158 * t - 1.70158),
  easeOutBack: (t: number) => {
    const s = 1.70158
    return (t -= 1) * t * ((s + 1) * t + s) + 1
  },
  easeInOutBack: (t: number) => {
    const s = 1.70158 * 1.525
    if ((t *= 2) < 1) return 0.5 * (t * t * ((s + 1) * t - s))
    return 0.5 * ((t -= 2) * t * ((s + 1) * t + s) + 2)
  },
}

// ─── Animation Engine ───────────────────────────────────────────

export class AnimationEngine {
  private animations: Map<Element, Animation> = new Map()

  /**
   * Animate element with keyframes
   */
  animate(
    element: Element,
    keyframes: Keyframe[],
    options: AnimationOptions = {}
  ): Animation {
    const {
      duration = 300,
      easing = 'easeInOutCubic',
      delay = 0,
      fill = 'forwards',
      iterations = 1,
      direction = 'normal',
    } = options

    // Cancel existing animation on this element
    this.cancel(element)

    // Create Web Animation API animation
    const webAnimation = element.animate(keyframes, {
      duration,
      delay,
      fill: fill as FillMode,
      iterations: iterations === 'infinity' ? Infinity : iterations,
      direction: direction as PlaybackDirection,
    })

    // Create Flint Animation wrapper
    const animation: Animation = {
      play: () => webAnimation.play(),
      pause: () => webAnimation.pause(),
      cancel: () => webAnimation.cancel(),
      finish: () => webAnimation.finish(),
      reverse: () => webAnimation.reverse(),
      onfinish: null,
      oncancel: null,
      finished: webAnimation.finished.then(() => {}),
    }

    // Set up callbacks
    webAnimation.onfinish = () => {
      animation.onfinish?.()
    }
    webAnimation.oncancel = () => {
      animation.oncancel?.()
    }

    this.animations.set(element, animation)
    return animation
  }

  /**
   * Cancel animation on element
   */
  cancel(element: Element): void {
    const existing = this.animations.get(element)
    if (existing) {
      existing.cancel()
      this.animations.delete(element)
    }
  }

  /**
   * Cancel all animations
   */
  cancelAll(): void {
    this.animations.forEach((animation) => animation.cancel())
    this.animations.clear()
  }
}

// ─── Transition Component ───────────────────────────────────────

export interface TransitionProps {
  /** Whether to show the content */
  show: boolean
  /** Transition options */
  options?: TransitionOptions
  /** Transition name (preset) */
  name?: string
  /** Children to transition */
  children: Child | Child[]
  /** Called when enter starts */
  onEnter?: () => void
  /** Called when enter completes */
  onAfterEnter?: () => void
  /** Called when leave starts */
  onLeave?: () => void
  /** Called when leave completes */
  onAfterLeave?: () => void
}

/**
 * Transition component for enter/leave animations
 *
 * @example
 * <Transition show={isVisible()} options={{ enter: { duration: 300 }, exit: { duration: 200 } }}>
 *   <div class="modal">Content</div>
 * </Transition>
 */
export function Transition(props: TransitionProps): Child {
  const { show, options = {}, name, children, onEnter, onAfterEnter, onLeave, onAfterLeave } = props

  const isVisible = state(show)
  const isAnimating = state(false)
  const container = state<HTMLElement | null>(null)

  // Watch for show changes
  effect(() => {
    const shouldShow = show
    isVisible.set(shouldShow)

    if (shouldShow) {
      // Entering
      onEnter?.()
      isAnimating.set(true)

      // Apply enter animation
      const enterOptions = options.enter || options.appear || { duration: 300 }
      setTimeout(() => {
        isAnimating.set(false)
        onAfterEnter?.()
      }, enterOptions.duration || 300)
    } else if (isVisible()) {
      // Leaving
      onLeave?.()
      isAnimating.set(true)

      // Apply exit animation
      const exitOptions = options.exit || { duration: 200 }
      setTimeout(() => {
        isAnimating.set(false)
        onAfterLeave?.()
      }, exitOptions.duration || 200)
    }
  })

  const shouldRender = computed(() => {
    if (show) return true
    if (isAnimating()) return true
    return isVisible()
  })

  if (!shouldRender()) return null

  return h(
    'div',
    {
      ref: (el: HTMLElement) => container.set(el),
      style: {
        transition: `all ${options.enter?.duration || 300}ms`,
      },
    },
    ...(Array.isArray(children) ? children : [children])
  )
}

// ─── TransitionGroup ────────────────────────────────────────────

export interface TransitionGroupProps {
  /** Tag to render */
  tag?: string
  /** Transition options */
  options?: TransitionOptions
  /** Children to transition */
  children: Child[]
  /** Class name */
  class?: string
}

/**
 * TransitionGroup for animating list items
 *
 * @example
 * <TransitionGroup tag="ul" options={{ enter: { duration: 200 }, exit: { duration: 150 } }}>
 *   {items().map(item => <li key={item.id}>{item.name}</li>)}
 * </TransitionGroup>
 */
export function TransitionGroup(props: TransitionGroupProps): Child {
  const { tag = 'div', options = {}, children, class: className } = props

  const childrenArray = Array.isArray(children) ? children : [children]

  return h(
    tag,
    { class: className },
    ...childrenArray
  )
}

// ─── useTransition Hook ─────────────────────────────────────────

export interface UseTransitionReturn {
  /** Start transition */
  start: (callback: () => void) => void
  /** Whether transition is pending */
  isPending: Signal<boolean>
}

/**
 * Hook for concurrent transitions
 *
 * @example
 * const { start, isPending } = useTransition()
 *
 * start(() => {
 *   setState(newState)
 * })
 */
export function useTransition(): UseTransitionReturn {
  const isPending = state(false)

  const start = (callback: () => void) => {
    isPending.set(true)
    callback()
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      isPending.set(false)
    })
  }

  return { start, isPending }
}

// ─── useAnimate Hook ────────────────────────────────────────────

export interface UseAnimateReturn {
  /** Animate element */
  animate: (keyframes: Keyframe[], options?: AnimationOptions) => Animation | null
  /** Cancel animation */
  cancel: () => void
  /** Whether animating */
  isAnimating: Signal<boolean>
}

/**
 * Hook for element animations
 *
 * @example
 * const { animate, isAnimating } = useAnimate()
 *
 * <div ref={element}>
 *   <button onClick={() => animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500 })}>
 *     Fade In
 *   </button>
 * </div>
 */
export function useAnimate(): UseAnimateReturn {
  const element = state<Element | null>(null)
  const isAnimating = state(false)
  const engine = new AnimationEngine()

  const animate = (keyframes: Keyframe[], options: AnimationOptions = {}): Animation | null => {
    const el = element()
    if (!el) return null

    isAnimating.set(true)
    const animation = engine.animate(el, keyframes, {
      ...options,
      duration: options.duration || 300,
    })

    animation.finished.then(() => {
      isAnimating.set(false)
    })

    return animation
  }

  const cancel = () => {
    const el = element()
    if (el) {
      engine.cancel(el)
      isAnimating.set(false)
    }
  }

  return { animate, cancel, isAnimating }
}

// ─── Preset Animations ──────────────────────────────────────────

export const presets = {
  fadeIn: {
    enter: [{ opacity: 0 }, { opacity: 1 }],
    exit: [{ opacity: 1 }, { opacity: 0 }],
  },
  fadeOut: {
    enter: [{ opacity: 1 }, { opacity: 0 }],
    exit: [{ opacity: 0 }, { opacity: 1 }],
  },
  slideUp: {
    enter: [
      { transform: 'translateY(20px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 },
    ],
    exit: [
      { transform: 'translateY(0)', opacity: 1 },
      { transform: 'translateY(20px)', opacity: 0 },
    ],
  },
  slideDown: {
    enter: [
      { transform: 'translateY(-20px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 },
    ],
    exit: [
      { transform: 'translateY(0)', opacity: 1 },
      { transform: 'translateY(-20px)', opacity: 0 },
    ],
  },
  scale: {
    enter: [
      { transform: 'scale(0.9)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 },
    ],
    exit: [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(0.9)', opacity: 0 },
    ],
  },
  bounce: {
    enter: [
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(1.1)', opacity: 1, offset: 0.7 },
      { transform: 'scale(1)', opacity: 1 },
    ],
    exit: [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.1)', opacity: 0, offset: 0.3 },
      { transform: 'scale(0)', opacity: 0 },
    ],
  },
  flip: {
    enter: [
      { transform: 'rotateX(90deg)', opacity: 0 },
      { transform: 'rotateX(0deg)', opacity: 1 },
    ],
    exit: [
      { transform: 'rotateX(0deg)', opacity: 1 },
      { transform: 'rotateX(90deg)', opacity: 0 },
    ],
  },
}

// ─── Global Animation Engine ────────────────────────────────────

let globalEngine: AnimationEngine | null = null

export function getAnimationEngine(): AnimationEngine {
  if (!globalEngine) {
    globalEngine = new AnimationEngine()
  }
  return globalEngine
}

/**
 * Animate element globally
 */
export function animate(
  element: Element,
  keyframes: Keyframe[],
  options?: AnimationOptions
): Animation {
  return getAnimationEngine().animate(element, keyframes, options)
}
