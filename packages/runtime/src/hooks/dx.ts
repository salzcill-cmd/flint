// Flint Runtime — Advanced DX Features v4.1
// Developer experience improvements for faster, easier coding

import { state, computed, effect, batch } from '@flint/reactivity'
import type { Signal, Computed } from '@flint/reactivity'
import { h } from '../renderer/index.js'
import type { Child } from '../renderer/index.js'

// ─── $ref() — Quick Template Ref ────────────────────────────────

/**
 * Quick template ref creation.
 *
 * @example
 * const input = $ref()
 * <input ref={input} />
 * // input.current is the DOM element
 */
export function $ref<T = HTMLElement>(): { current: T | null } {
  return { current: null }
}

// ─── $reactive() — Quick Reactive Object ────────────────────────

/**
 * Quick reactive object creation (shorthand for reactive()).
 *
 * @example
 * const user = $reactive({ name: 'John', age: 30 })
 * user.name = 'Jane' // triggers update
 */
export function $reactive<T extends Record<string, any>>(obj: T): T {
  return new Proxy(obj, {
    get(target, prop) {
      const value = target[prop as keyof T]
      if (typeof value === 'function') {
        return value.bind(target)
      }
      return value
    },
    set(target, prop, value) {
      target[prop as keyof T] = value
      return true
    },
  })
}

// ─── $store() — Quick Store Creation ────────────────────────────

/**
 * Quick store with immer-like mutations.
 *
 * @example
 * const counter = $store({
 *   count: 0,
 *   increment() { this.count++ },
 *   decrement() { this.count-- },
 *   reset() { this.count = 0 },
 * })
 *
 * counter.increment()
 * counter.count // 0
 */
export function $store<T extends Record<string, any>>(config: T): any {
  const stateObj: Record<string, any> = {}
  const computeds: Record<string, () => any> = {}
  const actions: Record<string, Function> = {}

  // Separate state, computed, and actions
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'function') {
      // Check if it's a getter (computed)
      const descriptor = Object.getOwnPropertyDescriptor(config, key)
      if (descriptor && descriptor.get) {
        computeds[key] = descriptor.get
      } else {
        actions[key] = value
      }
    } else {
      stateObj[key] = value
    }
  }

  // Create reactive state
  const signals: Record<string, Signal<any>> = {}
  for (const [key, value] of Object.entries(stateObj)) {
    signals[key] = state(value)
  }

  // Create computed values
  const computedSignals: Record<string, Computed<any>> = {}
  for (const [key, getter] of Object.entries(computeds)) {
    computedSignals[key] = computed(() => {
      const context = {}
      for (const [k, s] of Object.entries(signals)) {
        Object.defineProperty(context, k, {
          get: () => s(),
          set: (v) => s.set(v),
        })
      }
      return getter.call(context)
    })
  }

  // Create actions
  const boundActions: Record<string, Function> = {}
  for (const [key, action] of Object.entries(actions)) {
    boundActions[key] = (...args: any[]) => {
      const context = {}
      for (const [k, s] of Object.entries(signals)) {
        Object.defineProperty(context, k, {
          get: () => s(),
          set: (v) => s.set(v),
          enumerable: true,
        })
      }
      return action.call(context, ...args)
    }
  }

  // Create proxy
  return new Proxy(
    {},
    {
      get(_, prop: string) {
        if (signals[prop]) return signals[prop]()
        if (computedSignals[prop]) return computedSignals[prop]()
        if (boundActions[prop]) return boundActions[prop]
        return undefined
      },
      set(_, prop: string, value) {
        if (signals[prop]) {
          signals[prop].set(value)
          return true
        }
        return false
      },
    }
  )
}

// ─── $computed() — Quick Computed ────────────────────────────────

/**
 * Quick computed creation (shorthand).
 *
 * @example
 * const doubled = $computed(() => count() * 2)
 */
export function $computed<T>(fn: () => T): Computed<T> {
  return computed(fn)
}

// ─── $effect() — Quick Effect ───────────────────────────────────

/**
 * Quick effect creation with optional cleanup.
 *
 * @example
 * $effect(() => {
 *   console.log(count())
 *   return () => console.log('cleanup')
 * })
 */
export function $effect(fn: () => void | (() => void)): void {
  effect(fn)
}

// ─── $watch() — Quick Watch ─────────────────────────────────────

/**
 * Quick watch with immediate option.
 *
 * @example
 * $watch(count, (newVal, oldVal) => {
 *   console.log(`Changed from ${oldVal} to ${newVal}`)
 * }, { immediate: true })
 */
export function $watch<T>(
  source: () => T,
  callback: (value: T, oldValue: T | undefined) => void,
  options?: { immediate?: boolean }
): () => void {
  let lastValue: T | undefined = options?.immediate ? source() : undefined
  let initialized = false

  const eff = effect(() => {
    const value = source()
    if (initialized) {
      callback(value, lastValue)
    }
    lastValue = value
    initialized = true
  })

  return () => eff.dispose()
}

// ─── $event() — Quick Event Handler ─────────────────────────────

/**
 * Create an event handler that prevents default and stops propagation.
 *
 * @example
 * <form onsubmit={$event(handleSubmit)}>
 *   <button onclick={$event(handleClick, { prevent: true })}>
 */
export function $event(
  handler: (e: Event) => void,
  options?: { prevent?: boolean; stop?: boolean }
): (e: Event) => void {
  return (e: Event) => {
    if (options?.prevent) e.preventDefault()
    if (options?.stop) e.stopPropagation()
    handler(e)
  }
}

// ─── $class() — Conditional Class Names ─────────────────────────

/**
 * Conditional class name builder.
 *
 * @example
 * <div class={$class({
 *   'btn': true,
 *   'btn-active': isActive(),
 *   'btn-disabled': isDisabled(),
 * })}>
 */
export function $class(classes: Record<string, boolean>): string {
  return Object.entries(classes)
    .filter(([, condition]) => condition)
    .map(([name]) => name)
    .join(' ')
}

// ─── $style() — Dynamic Style Object ────────────────────────────

/**
 * Dynamic style object builder.
 *
 * @example
 * <div style={$style({
 *   color: isActive() ? 'blue' : 'gray',
 *   fontSize: '16px',
 * })}>
 */
export function $style(styles: Record<string, string | number | (() => string | number)>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(styles)) {
    result[key] = typeof value === 'function' ? String(value()) : String(value)
  }
  return result
}

// ─── $if() / $else() — Quick Conditional Rendering ──────────────

/**
 * Quick conditional rendering (alternative to <When>).
 *
 * @example
 * $if(isLoggedIn(), () => <p>Welcome!</p>)
 * $if(isLoggedIn(), () => <p>Welcome!</p>, () => <p>Please login</p>)
 */
export function $if(
  condition: boolean,
  render: () => Child,
  fallback?: () => Child
): Child {
  return condition ? render() : (fallback?.() ?? null)
}

// ─── $map() — Quick List Rendering ──────────────────────────────

/**
 * Quick list rendering with automatic key extraction.
 *
 * @example
 * $map(items(), item => <div key={item.id}>{item.name}</div>)
 */
export function $map<T>(
  items: T[],
  render: (item: T, index: number) => Child,
  keyFn?: (item: T) => string | number
): Child[] {
  return items.map((item, index) => {
    const key = keyFn ? keyFn(item) : (item as any).id ?? index
    const result = render(item, index)
    if (result && typeof result === 'object' && 'props' in result) {
      return h('span', { key }, result)
    }
    return result
  })
}

// ─── $await() — Quick Async Rendering ───────────────────────────

/**
 * Quick async rendering with loading/error states.
 *
 * @example
 * $await(fetchUser(id), {
 *   loading: () => <Spinner />,
 *   error: (err) => <p>Error: {err.message}</p>,
 *   data: (user) => <p>{user.name}</p>,
 * })
 */
export function $await<T>(
  promise: Promise<T>,
  handlers: {
    loading?: () => Child
    error?: (err: Error) => Child
    data?: (value: T) => Child
  }
): Child {
  const data = state<T | undefined>(undefined)
  const error = state<Error | null>(null)
  const loading = state(true)

  promise
    .then((result) => {
      data.set(result)
      loading.set(false)
    })
    .catch((err) => {
      error.set(err instanceof Error ? err : new Error(String(err)))
      loading.set(false)
    })

  return computed(() => {
    if (loading()) return handlers.loading?.() ?? null
    if (error()) return handlers.error?.(error()!) ?? null
    return handlers.data?.(data()!) ?? null
  })()
}

// ─── $store() with Immer-like Mutations ─────────────────────────

/**
 * Store with immer-like direct mutations.
 *
 * @example
 * const todos = $immerStore({
 *   items: [],
 *   addTodo(text) {
 *     this.items.push({ id: Date.now(), text, done: false })
 *   },
 *   toggleTodo(id) {
 *     const todo = this.items.find(t => t.id === id)
 *     if (todo) todo.done = !todo.done
 *   },
 * })
 */
export function $immerStore<T extends Record<string, any>>(config: T): any {
  const signals: Record<string, Signal<any>> = {}
  const actions: Record<string, Function> = {}

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'function') {
      actions[key] = value
    } else {
      signals[key] = state(value)
    }
  }

  const boundActions: Record<string, Function> = {}
  for (const [key, action] of Object.entries(actions)) {
    boundActions[key] = (...args: any[]) => {
      // Create mutable proxy for state
      const mutableState: Record<string, any> = {}
      for (const [k, s] of Object.entries(signals)) {
        mutableState[k] = s()
      }

      // Create proxy that tracks mutations
      const mutations: Array<() => void> = []
      const proxy = new Proxy(mutableState, {
        set(target, prop, value) {
          const oldValue = target[prop as string]
          if (oldValue !== value) {
            mutations.push(() => signals[prop as string].set(value))
          }
          target[prop as string] = value
          return true
        },
      })

      // Execute action with proxy
      action.call(proxy, ...args)

      // Batch apply mutations
      if (mutations.length > 0) {
        batch(() => {
          for (const mutation of mutations) {
            mutation()
          }
        })
      }
    }
  }

  return new Proxy(
    {},
    {
      get(_, prop: string) {
        if (signals[prop]) return signals[prop]()
        if (boundActions[prop]) return boundActions[prop]
        return undefined
      },
      set(_, prop: string, value) {
        if (signals[prop]) {
          signals[prop].set(value)
          return true
        }
        return false
      },
    }
  )
}

// ─── Quick Component Helpers ────────────────────────────────────

/**
 * Create a component with automatic props typing.
 *
 * @example
 * const Greeting = component<{ name: string }>((props) => {
 *   return <div>Hello, {props.name}</div>
 * })
 */
export function component<P extends Record<string, any>>(
  render: (props: P) => Child
): (props: P) => Child {
  return render
}

/**
 * Create a memoized component.
 *
 * @example
 * const ExpensiveList = memo(({ items }) => {
 *   return <div>{items.map(i => <div>{i.name}</div>)}</div>
 * })
 */
export function memo<P extends Record<string, any>>(
  render: (props: P) => Child,
  areEqual?: (prev: P, next: P) => boolean
): (props: P) => Child {
  const cache = new Map<string, Child>()

  return (props: P) => {
    const key = JSON.stringify(props)
    if (!cache.has(key)) {
      cache.set(key, render(props))
    }
    return cache.get(key)!
  }
}

// ─── Debug Helpers ──────────────────────────────────────────────

/**
 * Log a signal value for debugging.
 *
 * @example
 * $log(count, 'count')
 */
export function $log<T>(signal: Signal<T>, label?: string): void {
  effect(() => {
    console.log(`[Flint] ${label ?? 'Signal'}:`, signal())
  })
}

/**
 * Inspect a reactive object.
 *
 * @example
 * $inspect(user)
 */
export function $inspect(obj: any): void {
  console.log('[Flint] Inspect:', JSON.stringify(obj, null, 2))
}

/**
 * Measure render performance.
 *
 * @example
 * $perf('MyComponent', () => {
 *   return <div>...</div>
 * })
 */
export function $perf(label: string, fn: () => void): void {
  const start = performance.now()
  fn()
  const end = performance.now()
  console.log(`[Flint] ${label}: ${(end - start).toFixed(2)}ms`)
}

// ─── hc() — Hyperscript Helper ──────────────────────────────────

/**
 * Hyperscript helper for creating elements without JSX.
 *
 * @example
 * // Instead of JSX:
 * // <div class="container"><h1>Hello</h1></div>
 *
 * // Use hc():
 * hc('div', { class: 'container' },
 *   hc('h1', null, 'Hello')
 * )
 *
 * // Or with shorthand:
 * hc.div({ class: 'container' },
 *   hc.h1(null, 'Hello')
 * )
 */
export function hc(
  tag: string,
  props?: Record<string, any> | null,
  ...children: any[]
): any {
  return h(tag, props ?? {}, ...children)
}

// Shorthand helpers
hc.div = (props: any, ...children: any[]) => h('div', props, ...children)
hc.span = (props: any, ...children: any[]) => h('span', props, ...children)
hc.p = (props: any, ...children: any[]) => h('p', props, ...children)
hc.h1 = (props: any, ...children: any[]) => h('h1', props, ...children)
hc.h2 = (props: any, ...children: any[]) => h('h2', props, ...children)
hc.h3 = (props: any, ...children: any[]) => h('h3', props, ...children)
hc.button = (props: any, ...children: any[]) => h('button', props, ...children)
hc.input = (props: any) => h('input', props)
hc.a = (props: any, ...children: any[]) => h('a', props, ...children)
hc.img = (props: any) => h('img', props)
hc.ul = (props: any, ...children: any[]) => h('ul', props, ...children)
hc.li = (props: any, ...children: any[]) => h('li', props, ...children)
hc.form = (props: any, ...children: any[]) => h('form', props, ...children)
hc.label = (props: any, ...children: any[]) => h('label', props, ...children)
hc.select = (props: any, ...children: any[]) => h('select', props, ...children)
hc.option = (props: any, ...children: any[]) => h('option', props, ...children)
hc.textarea = (props: any, ...children: any[]) => h('textarea', props, ...children)
