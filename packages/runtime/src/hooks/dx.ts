// Flint Runtime — Advanced DX Features v4.1
// Developer experience improvements for faster, easier coding

import { state, computed, effect, batch } from 'flint-reactivity'
import type { Signal, Computed } from 'flint-reactivity'
import { h } from '../renderer/index.js'
import type { Child } from '../renderer/index.js'

// ─── $ref() — Quick Template Ref ────────────────────────────────

/**
 * Quick template ref creation with auto-populate on mount.
 *
 * @example
 * const input = $ref()
 * <input ref={input} />
 * // input.current is automatically set to the DOM element
 */
export function $ref<T = HTMLElement>(): { current: T | null } {
  return { current: null }
}

/**
 * Create a ref callback that auto-assigns on mount and clears on unmount.
 * Use when you need lifecycle integration.
 *
 * @example
 * const input = $refCallback<HTMLInputElement>((el) => {
 *   el.focus()  // Called when element mounts
 * })
 * <input ref={input} />
 */
export function $refCallback<T = HTMLElement>(
  onMount?: (el: T) => void,
  onUnmount?: (el: T) => void
): (el: T | null) => void {
  let currentEl: T | null = null
  return (el: T | null) => {
    if (el && currentEl !== el) {
      currentEl = el
      onMount?.(el)
    } else if (!el && currentEl) {
      onUnmount?.(currentEl as T)
      currentEl = null
    }
  }
}

// ─── $reactive() — Quick Reactive Object ────────────────────────

/**
 * Quick reactive object creation with automatic dependency tracking.
 *
 * @example
 * const user = $reactive({ name: 'John', age: 30 })
 * user.name = 'Jane' // triggers update
 */
export function $reactive<T extends Record<string, any>>(obj: T): T {
  const signals: Record<string, Signal<any>> = {}
  const keys = Object.keys(obj) as Array<keyof T>

  for (const key of keys) {
    signals[key as string] = state(obj[key])
  }

  return new Proxy(obj, {
    get(_, prop) {
      const key = prop as string
      if (signals[key]) return signals[key]()
      const value = (obj as any)[prop]
      if (typeof value === 'function') {
        return value.bind(obj)
      }
      return value
    },
    set(_, prop, value) {
      const key = prop as string
      if (signals[key]) {
        signals[key].set(value)
        return true
      }
      return false
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

  // Create actions with proper batched mutations
  const boundActions: Record<string, Function> = {}
  for (const [key, action] of Object.entries(actions)) {
    boundActions[key] = (...args: any[]) => {
      return batch(() => {
        const context: Record<string, any> = {}
        for (const [k, s] of Object.entries(signals)) {
          Object.defineProperty(context, k, {
            get: () => s(),
            set: (v) => { s.set(v) },
            enumerable: true,
            configurable: true,
          })
        }
        return action.call(context, ...args)
      })
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

// ─── $model() — Simplest State Management ───────────────────────

/**
 * The simplest way to create reactive state. One function, one object.
 * Infers computed from getters, actions from methods.
 *
 * @example
 * // Simple counter
 * const counter = $model({
 *   count: 0,
 *   get doubled() { return this.count * 2 },
 *   increment() { this.count++ },
 *   decrement() { this.count-- },
 * })
 *
 * counter.count      // 0
 * counter.doubled    // 0
 * counter.increment()
 * counter.count      // 1
 * counter.doubled    // 2
 *
 * // In JSX:
 * <button onClick={counter.increment}>Count: {counter.count}</button>
 */
export function $model<T extends Record<string, any>>(config: T): any {
  const stateObj: Record<string, any> = {}
  const computedGetters: Record<string, () => any> = {}
  const actions: Record<string, Function> = {}

  for (const [key, value] of Object.entries(config)) {
    const desc = Object.getOwnPropertyDescriptor(config, key)
    if (desc?.get) {
      computedGetters[key] = desc.get
    } else if (typeof value === 'function') {
      actions[key] = value
    } else {
      stateObj[key] = value
    }
  }

  const signals: Record<string, Signal<any>> = {}
  for (const [key, value] of Object.entries(stateObj)) {
    signals[key] = state(value)
  }

  const computedSignals: Record<string, any> = {}
  for (const [key, getter] of Object.entries(computedGetters)) {
    computedSignals[key] = computed(() => {
      const ctx: Record<string, any> = {}
      for (const [k, s] of Object.entries(signals)) {
        Object.defineProperty(ctx, k, { get: () => s(), configurable: true })
      }
      return getter.call(ctx)
    })
  }

  const boundActions: Record<string, Function> = {}
  for (const [key, action] of Object.entries(actions)) {
    boundActions[key] = (...args: any[]) => {
      return batch(() => {
        const ctx: Record<string, any> = {}
        for (const [k, s] of Object.entries(signals)) {
          Object.defineProperty(ctx, k, {
            get: () => s(),
            set: (v) => { s.set(v) },
            enumerable: true,
            configurable: true,
          })
        }
        return action.call(ctx, ...args)
      })
    }
  }

  return new Proxy({} as any, {
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
  })
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
  let prevProps: P | null = null
  let cached: Child = null
  let dirty = true

  return (props: P) => {
    if (prevProps !== null && areEqual) {
      if (!areEqual(prevProps, props)) dirty = true
    } else if (prevProps !== null) {
      // Shallow compare by key
      const prevKeys = Object.keys(prevProps)
      const nextKeys = Object.keys(props)
      if (prevKeys.length !== nextKeys.length) {
        dirty = true
      } else {
        for (const key of nextKeys) {
          if ((prevProps as any)[key] !== (props as any)[key]) {
            dirty = true
            break
          }
        }
      }
    } else {
      dirty = true
    }

    if (dirty) {
      cached = render(props)
      prevProps = props
      dirty = false
    }
    return cached
  }
}

// ─── $form() — Simplified Form Handling ─────────────────────────

/**
 * Simplified form handling with built-in validation and submission.
 *
 * @example
 * const form = $form({
 *   email: '',
 *   password: '',
 * }, {
 *   email: (v) => v.includes('@') ? null : 'Email tidak valid',
 *   password: (v) => v.length >= 6 ? null : 'Password minimal 6 karakter',
 * }, async (values) => {
 *   await login(values)
 * })
 *
 * <form onsubmit={form.submit}>
 *   <input value={form.values.email} oninput={form.set('email')} />
 *   <span>{form.errors.email}</span>
 *   <button disabled={form.isSubmitting}>Login</button>
 * </form>
 */
export function $form<T extends Record<string, any>>(
  initialValues: T,
  validators?: Partial<Record<keyof T, (value: any) => string | null>>,
  onSubmit?: (values: T) => void | Promise<void>
): {
  values: T
  errors: Partial<Record<keyof T, string>>
  isSubmitting: boolean
  isValid: boolean
  submit: (e: Event) => void
  set: (field: keyof T) => (e: Event) => void
  reset: () => void
} {
  const values = $reactive({ ...initialValues })
  const errors = $reactive<Partial<Record<keyof T, string>>>({})
  const isSubmitting = state(false)

  const isValid = computed(() => {
    if (!validators) return true
    for (const [field, validator] of Object.entries(validators)) {
      if (!validator) continue
      const error = validator(values[field as keyof T])
      if (error) return false
    }
    return true
  })

  const validate = () => {
    if (!validators) return true
    let valid = true
    for (const [field, validator] of Object.entries(validators)) {
      if (!validator) continue
      const error = validator(values[field as keyof T])
      errors[field as keyof T] = error || undefined
      if (error) valid = false
    }
    return valid
  }

  const submit = async (e: Event) => {
    e.preventDefault()
    if (!validate()) return
    isSubmitting.set(true)
    try {
      await onSubmit?.(values as T)
    } finally {
      isSubmitting.set(false)
    }
  }

  const set = (field: keyof T) => (e: Event) => {
    const target = e.target as HTMLInputElement
    values[field as keyof T] = target.value as any
    const validatorFn = validators?.[field as keyof T]
    if (validatorFn) {
      const error = validatorFn(target.value)
      errors[field as keyof T] = error || undefined
    }
  }

  const reset = () => {
    for (const [key, value] of Object.entries(initialValues)) {
      values[key as keyof T] = value as any
    }
    for (const key of Object.keys(errors)) {
      delete (errors as any)[key]
    }
    isSubmitting.set(false)
  }

  return {
    values: values as T,
    errors,
    isSubmitting: isSubmitting as any,
    isValid: isValid as any,
    submit,
    set,
    reset,
  }
}

// ─── $load() — Simplified Data Loading ──────────────────────────

/**
 * Simplified data loading with loading and error states.
 *
 * @example
 * const users = $load('/api/users')
 *
 * if (users.loading()) return <Spinner />
 * if (users.error()) return <p>Error: {users.error().message}</p>
 * return <ul>{users.data().map(u => <li>{u.name}</li>)}</ul>
 */
export function $load<T>(
  url: string | (() => string),
  options?: {
    method?: string
    headers?: Record<string, string>
    body?: any
    immediate?: boolean
  }
): {
  data: () => T | null
  error: () => Error | null
  loading: () => boolean
  refetch: () => void
} {
  const data = state<T | null>(null)
  const error = state<Error | null>(null)
  const loading = state(false)

  const fetcher = async () => {
    loading.set(true)
    error.set(null)
    try {
      const actualUrl = typeof url === 'function' ? url() : url
      const res = await fetch(actualUrl, {
        method: options?.method ?? 'GET',
        headers: options?.headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      data.set(await res.json())
    } catch (err) {
      error.set(err instanceof Error ? err : new Error(String(err)))
    } finally {
      loading.set(false)
    }
  }

  if (options?.immediate !== false) {
    fetcher()
  }

  return {
    data,
    error,
    loading,
    refetch: fetcher,
  }
}

// ─── $modal() — Simplified Modal State ──────────────────────────

/**
 * Simplified modal state management.
 *
 * @example
 * const modal = $modal()
 *
 * <button onclick={modal.open}>Buka</button>
 * {modal.isOpen() && (
 *   <div class="modal">
 *     <p>Isi modal</p>
 *     <button onclick={modal.close}>Tutup</button>
 *   </div>
 * )}
 */
export function $modal(initialState = false): {
  isOpen: () => boolean
  open: () => void
  close: () => void
  toggle: () => void
} {
  const isOpen = state(initialState)

  return {
    isOpen,
    open: () => isOpen.set(true),
    close: () => isOpen.set(false),
    toggle: () => isOpen.set(v => !v),
  }
}

// ─── $toast() — Simplified Notifications ────────────────────────

/**
 * Simplified toast notifications.
 *
 * @example
 * const toast = $toast()
 *
 * toast.success('Berhasil!')
 * toast.error('Gagal!')
 * toast.info('Informasi')
 */
export function $toast(): {
  show: (message: string, type?: 'success' | 'error' | 'info') => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
} {
  const show = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Create toast element
    const toast = document.createElement('div')
    toast.className = `flint-toast flint-toast-${type}`
    toast.textContent = message
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      border-radius: 8px;
      color: white;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      z-index: 10000;
      animation: flint-toast-in 0.3s ease;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `
    document.body.appendChild(toast)

    // Auto remove
    setTimeout(() => {
      toast.style.animation = 'flint-toast-out 0.3s ease'
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }

  return {
    show,
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error'),
    info: (msg) => show(msg, 'info'),
  }
}

// ─── $storage() — Simplified localStorage ───────────────────────

/**
 * Simplified localStorage with reactivity.
 *
 * @example
 * const theme = $storage('theme', 'light')
 *
 * theme() // 'light'
 * theme.set('dark') // saves to localStorage
 */
export function $storage<T>(
  key: string,
  defaultValue: T
): {
  (): T
  set: (value: T) => void
  remove: () => void
} {
  let stored: T
  try {
    const item = localStorage.getItem(key)
    stored = item ? JSON.parse(item) : defaultValue
  } catch {
    stored = defaultValue
  }

  const signal = state(stored)

  const getter = () => signal()
  const setter = (value: T) => {
    signal.set(value)
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // localStorage full or unavailable
    }
  }
  const remover = () => {
    signal.set(defaultValue)
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }

  // Copy function properties
  Object.assign(getter, { set: setter, remove: remover })

  return getter as any
}

// ─── $debounce() — Simplified Debounce ──────────────────────────

/**
 * Simplified debounce function.
 *
 * @example
 * const search = $debounce((query) => {
 *   fetchResults(query)
 * }, 300)
 *
 * <input oninput={(e) => search(e.target.value)} />
 */
export function $debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

// ─── $throttle() — Simplified Throttle ──────────────────────────

/**
 * Simplified throttle function.
 *
 * @example
 * const handleScroll = $throttle((e) => {
 *   console.log('Scroll position:', e.target.scrollTop)
 * }, 100)
 *
 * <div onscroll={handleScroll}>...</div>
 */
export function $throttle<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): T {
  let lastCall = 0
  return ((...args: any[]) => {
    const now = Date.now()
    if (now - lastCall >= ms) {
      lastCall = now
      fn(...args)
    }
  }) as T
}

// ─── $time() — Simplified Time Formatting ───────────────────────

/**
 * Simplified time formatting.
 *
 * @example
 * $time.format(new Date()) // '2 menit yang lalu'
 * $time.distance(new Date('2024-01-01')) // '3 bulan yang lalu'
 */
export const $time = {
  format(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'baru saja'
    if (minutes < 60) return `${minutes} menit yang lalu`
    if (hours < 24) return `${hours} jam yang lalu`
    if (days < 30) return `${days} hari yang lalu`
    return date.toLocaleDateString('id-ID')
  },

  distance(from: Date, to: Date = new Date()): string {
    const diff = to.getTime() - from.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 30) return `${Math.floor(days / 30)} bulan`
    if (hours > 24) return `${days} hari`
    if (minutes > 60) return `${hours} jam`
    return `${minutes} menit`
  },

  now(): string {
    return new Date().toLocaleTimeString('id-ID')
  },
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
