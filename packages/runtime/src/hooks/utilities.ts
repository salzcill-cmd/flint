// Flint Runtime — React 19+ Utilities
// ref as prop, reactive(), shallowRef(), readonly(), mergeProps(), splitProps(), two-way binding

import { state, computed, effect, type Signal } from '@flint/reactivity'

// ─── ref as prop (React 19 style) ───────────────────────────────

/**
 * Create a ref that can be passed as a regular prop (no forwardRef needed).
 * React 19 pattern: ref is just a prop, not a special mechanism.
 *
 * @example
 * // No forwardRef needed!
 * function MyInput({ ref, ...props }) {
 *   return <input ref={ref} {...props} />
 * }
 *
 * // Usage
 * const myRef = ref()
 * <MyInput ref={myRef} />
 */
export function createRef<T = any>(): { current: T | null } {
  return { current: null }
}

/**
 * Assign ref from props (handles both callback refs and ref objects).
 */
export function assignRef<T>(
  ref: any,
  value: T | null
): void {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref && typeof ref === 'object' && 'current' in ref) {
    ref.current = value
  }
}

/**
 * Merge multiple refs into a single ref callback.
 */
export function mergeRefs<T>(
  ...refs: any[]
): (instance: T | null) => void {
  return (value) => {
    for (const ref of refs) {
      assignRef(ref, value)
    }
  }
}

// ─── reactive() — Deep Reactive Objects (Vue-style) ─────────────

/**
 * Create a deeply reactive proxy object.
 * Mutations are tracked and trigger effects automatically.
 *
 * @example
 * const state = reactive({ count: 0, user: { name: 'John' } })
 *
 * effect(() => {
 *   console.log(state.count) // tracked
 * })
 *
 * state.count++ // triggers effect
 * state.user.name = 'Jane' // triggers effect (deep)
 */
export function reactive<T extends object>(target: T): T {
  const signalMap = new Map<string | symbol, ReturnType<typeof state>>()
  const proxyMap = new WeakMap<object, any>()

  function getOrCreateSignal(key: string | symbol, value: any) {
    if (!signalMap.has(key)) {
      signalMap.set(key, state(value))
    }
    return signalMap.get(key)!
  }

  function createProxy(obj: any): any {
    if (proxyMap.has(obj)) return proxyMap.get(obj)

    const proxy = new Proxy(obj, {
      get(target, key, receiver) {
        if (key === '__flint_reactive') return true

        const value = Reflect.get(target, key, receiver)

        // Deep reactive for nested objects
        if (typeof value === 'object' && value !== null && !value.__flint_reactive) {
          return createProxy(value)
        }

        // Read signal value
        const sig = signalMap.get(key)
        if (sig) return sig()

        return value
      },

      set(target, key, value, receiver) {
        const oldValue = target[key as keyof typeof target]
        const result = Reflect.set(target, key, value, receiver)

        // Update or create signal
        const sig = getOrCreateSignal(key, value)
        if (oldValue !== value) {
          sig.set(() => value)
        }

        return result
      },

      deleteProperty(target, key) {
        const result = Reflect.deleteProperty(target, key)
        signalMap.delete(key)
        return result
      },
    })

    proxyMap.set(obj, proxy)
    return proxy
  }

  // Initialize signals for all properties
  for (const key of Object.keys(target)) {
    getOrCreateSignal(key, (target as any)[key])
  }

  return createProxy(target)
}

// ─── shallowRef() — Shallow Signal ──────────────────────────────

/**
 * Create a signal that only triggers on reference changes, not deep mutations.
 *
 * @example
 * const ref = shallowRef({ count: 0 })
 * ref.set({ count: 1 }) // triggers
 * ref().count = 2 // does NOT trigger
 */
export function shallowRef<T>(value: T): Signal<T> & { set: (v: T | ((prev: T) => T)) => void } {
  return state(value)
}

// ─── readonly() — Read-Only Proxy ───────────────────────────────

/**
 * Create a read-only proxy that prevents mutations.
 *
 * @example
 * const original = reactive({ count: 0 })
 * const readonly = readonly(original)
 *
 * readonly.count // works
 * readonly.count = 1 // throws error
 */
export function readonly<T extends object>(target: T): Readonly<T> {
  return new Proxy(target, {
    get(target, key, receiver) {
      return Reflect.get(target, key, receiver)
    },
    set() {
      throw new Error('[Flint] Cannot modify readonly proxy')
    },
    deleteProperty() {
      throw new Error('[Flint] Cannot delete from readonly proxy')
    },
  })
}

// ─── shallowReadonly() ──────────────────────────────────────────

/**
 * Create a read-only proxy for shallow properties only.
 */
export function shallowReadonly<T extends object>(target: T): Readonly<T> {
  return readonly(target)
}

// ─── toRef() / toRefs() ─────────────────────────────────────────

/**
 * Create a signal from a reactive object's property.
 *
 * @example
 * const state = reactive({ count: 0 })
 * const countRef = toRef(state, 'count')
 *
 * countRef() // 0
 * state.count = 1
 * countRef() // 1
 */
export function toRef<T extends object, K extends keyof T>(
  obj: T,
  key: K
): Signal<T[K]> & { set: (v: T[K]) => void } {
  return computed(() => obj[key]) as any
}

/**
 * Create individual signals from all reactive object properties.
 *
 * @example
 * const state = reactive({ count: 0, name: 'John' })
 * const { count, name } = toRefs(state)
 *
 * count() // 0
 * count.set(1) // updates state.count
 */
export function toRefs<T extends object>(obj: T): { [K in keyof T]: Signal<T[K]> } {
  const refs = {} as any
  for (const key of Object.keys(obj)) {
    refs[key] = toRef(obj, key as keyof T)
  }
  return refs
}

// ─── triggerRef() ───────────────────────────────────────────────

/**
 * Force trigger effects that depend on a signal.
 *
 * @example
 * const ref = shallowRef({ count: 0 })
 * ref().count = 1
 * triggerRef(ref) // forces effect re-run
 */
export function triggerRef<T>(ref: Signal<T>): void {
  // Re-read the signal to force effect re-evaluation
  ref()
}

// ─── mergeProps() / splitProps() (Solid-style) ──────────────────

/**
 * Merge multiple props objects into one, with proper event handler merging.
 *
 * @example
 * const merged = mergeProps(
 *   { class: 'btn', onClick: handler1 },
 *   { class: 'btn-primary', onClick: handler2 }
 * )
 * // merged.class = 'btn btn-primary'
 * // merged.onClick calls both handler1 and handler2
 */
export function mergeProps<T extends Record<string, any>>(
  ...sources: (T | undefined | null)[]
): T {
  const result: Record<string, any> = {}

  for (const source of sources) {
    if (!source) continue

    for (const [key, value] of Object.entries(source)) {
      if (key.startsWith('on') && typeof value === 'function') {
        // Merge event handlers
        const existing = result[key]
        if (typeof existing === 'function') {
          result[key] = (...args: any[]) => {
            existing(...args)
            value(...args)
          }
        } else {
          result[key] = value
        }
      } else if (key === 'class' || key === 'className') {
        // Merge class names
        const existing = result[key] || ''
        result[key] = `${existing} ${value}`.trim()
      } else if (key === 'style' && typeof value === 'object') {
        // Merge styles
        result[key] = { ...(result[key] || {}), ...value }
      } else {
        result[key] = value
      }
    }
  }

  return result as T
}

/**
 * Split props into two groups.
 *
 * @example
 * const { local, rest } = splitProps(props, ['class', 'style'], ['onClick', 'onBlur'])
 * // local has class, style
 * // rest has onClick, onBlur
 */
export function splitProps<T extends Record<string, any>>(
  props: T,
  ...keyGroups: (keyof T)[]
): { local: Partial<T>; rest: Partial<T> } {
  const local: Record<string, any> = {}
  const rest: Record<string, any> = { ...props }

  for (const group of keyGroups) {
    if (group in props) {
      local[group as string] = props[group]
      delete rest[group as string]
    }
  }

  return { local: local as Partial<T>, rest: rest as Partial<T> }
}

// ─── Two-Way Binding ($bindable) ────────────────────────────────

/**
 * Create a two-way binding for props (Svelte 5 $bindable equivalent).
 *
 * @example
 * // Child component
 * function Input({ value, onValueChange }) {
 *   const [localValue, setLocalValue] = bindable(value, onValueChange)
 *
 *   return (
 *     <input
 *       value={localValue()}
 *       onInput={(e) => setLocalValue(e.target.value)}
 *     />
 *   )
 * }
 *
 * // Parent
 * const name = state('John')
 * <Input value={name()} onValueChange={(v) => name.set(v)} />
 */
export function bindable<T>(
  value: T,
  onChange?: (value: T) => void
): [Signal<T>, (newValue: T) => void] {
  const sig = state(value)

  const set = (newValue: T) => {
    sig.set(() => newValue)
    onChange?.(newValue)
  }

  return [sig, set]
}

/**
 * Create a two-way binding signal that syncs with an external value.
 *
 * @example
 * const [value, setValue] = twoWayBinding(
 *   () => props.value,
 *   (v) => props.onValueChange?.(v)
 * )
 */
export function twoWayBinding<T>(
  getter: () => T,
  setter: (value: T) => void
): [Signal<T>, (newValue: T) => void] {
  const sig = computed(getter) as unknown as Signal<T>

  const set = (newValue: T) => {
    setter(newValue)
  }

  return [sig, set]
}

// ─── CSS Class-Based Transitions (Vue-style) ────────────────────

/**
 * CSS transition classes (Vue v-enter-from / v-leave-to pattern).
 *
 * @example
 * const { isActive, classes } = useTransition(show, {
 *   enterFromClass: 'fade-enter',
 *   enterActiveClass: 'fade-enter-active',
 *   enterToClass: 'fade-enter-to',
 *   leaveFromClass: 'fade-leave',
 *   leaveActiveClass: 'fade-leave-active',
 *   leaveToClass: 'fade-leave-to',
 * })
 */
export interface TransitionClasses {
  enterFromClass?: string
  enterActiveClass?: string
  enterToClass?: string
  leaveFromClass?: string
  leaveActiveClass?: string
  leaveToClass?: string
}

export function useTransitionClasses(
  show: boolean | (() => boolean),
  classes: TransitionClasses
): { active: boolean; classList: string } {
  const isVisible = typeof show === 'function' ? show() : show
  let active = false
  let classList = ''

  if (isVisible) {
    // Entering
    active = true
    classList = [classes.enterFromClass, classes.enterActiveClass, classes.enterToClass]
      .filter(Boolean)
      .join(' ')
  }

  return { active, classList }
}

/**
 * Apply CSS transition classes to an element.
 *
 * @example
 * applyTransition(element, {
 *   enterFromClass: 'fade-enter',
 *   enterActiveClass: 'fade-enter-active',
 *   enterToClass: 'fade-enter-to',
 *   leaveFromClass: 'fade-leave',
 *   leaveActiveClass: 'fade-leave-active',
 *   leaveToClass: 'fade-leave-to',
 *   onEnter: () => console.log('entered'),
 *   onLeave: () => console.log('left'),
 * })
 */
export function applyTransition(
  element: HTMLElement,
  classes: TransitionClasses & {
    duration?: number
    onEnter?: () => void
    onLeave?: () => void
  }
): { enter: () => Promise<void>; leave: () => Promise<void> } {
  const duration = classes.duration || 300

  const enter = async () => {
    // Remove leave classes
    element.classList.remove(
      classes.leaveFromClass || '',
      classes.leaveActiveClass || '',
      classes.leaveToClass || ''
    )

    // Add enter classes
    element.classList.add(classes.enterFromClass || '')
    await nextFrame()
    element.classList.add(classes.enterActiveClass || '')
    await nextFrame()
    element.classList.remove(classes.enterFromClass || '')
    element.classList.add(classes.enterToClass || '')

    // Wait for transition
    await waitForTransition(element, duration)

    // Cleanup
    element.classList.remove(classes.enterActiveClass || '', classes.enterToClass || '')
    classes.onEnter?.()
  }

  const leave = async () => {
    // Add leave classes
    element.classList.add(classes.leaveFromClass || '')
    await nextFrame()
    element.classList.add(classes.leaveActiveClass || '')
    await nextFrame()
    element.classList.remove(classes.leaveFromClass || '')
    element.classList.add(classes.leaveToClass || '')

    // Wait for transition
    await waitForTransition(element, duration)

    // Cleanup
    element.classList.remove(classes.leaveActiveClass || '', classes.leaveToClass || '')
    classes.onLeave?.()
  }

  return { enter, leave }
}

function nextFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}

function waitForTransition(element: HTMLElement, duration: number): Promise<void> {
  return new Promise(resolve => {
    const computedStyle = getComputedStyle(element)
    const transitionDuration = parseFloat(computedStyle.transitionDuration) * 1000
    const timeout = transitionDuration || duration

    const handler = () => {
      element.removeEventListener('transitionend', handler)
      resolve()
    }
    element.addEventListener('transitionend', handler)

    // Fallback timeout
    setTimeout(handler, timeout + 50)
  })
}
