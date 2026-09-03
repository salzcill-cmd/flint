// Flint Runtime — Optimistic Updates & use() API
// React 19 useOptimistic, useActionState, useFormStatus, use() equivalents

import { state, effect, computed } from '@flint/reactivity'
import type { Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export interface OptimisticState<T> {
  /** Current optimistic value (signal) */
  optimistic: Signal<T>
  /** Whether an update is in flight (signal) */
  isPending: Signal<boolean>
  /** Whether an error occurred (signal) */
  isError: Signal<boolean>
  /** Error if any (signal) */
  error: Signal<Error | null>
  /** The last resolved value (signal) */
  latest: Signal<T>
  /** Set optimistic value */
  set: (value: T | ((prev: T) => T)) => void
  /** Reset to initial value */
  reset: () => void
}

export interface UseOptimisticOptions<T> {
  /** Update function: (currentState, newValue) => optimisticValue */
  update?: (current: T, newValue: T) => T
  /** Called when the async operation completes */
  onResolved?: (finalValue: T) => void
  /** Called on error */
  onError?: (error: Error) => void
}

export interface ActionState<T> {
  /** Current state */
  state: T
  /** Whether the action is executing */
  isPending: boolean
  /** Last error if any */
  error: Error | null
  /** Execute the action */
  execute: (...args: any[]) => Promise<T>
  /** Reset state */
  reset: () => void
}

export interface FormStatus {
  /** Whether the form is submitting */
  pending: boolean
  /** The form data */
  data: FormData | null
  /** The method */
  method: string
  /** The action URL/function */
  action: string | ((formData: FormData) => Promise<any>) | null
}

export interface UseFormStatusOptions {
  /** The form element or ref */
  formRef?: { current: HTMLFormElement | null }
}

// ─── useOptimistic Hook ─────────────────────────────────────────

/**
 * Show optimistic state while an async operation is in progress.
 * When the operation completes, the state reverts to the resolved value.
 *
 * @example
 * ```tsx
 * function TodoItem({ todo }) {
 *   const [optimisticTodo, setOptimisticTodo] = useOptimistic(
 *     todo,
 *     (currentTodo, newTitle) => ({ ...currentTodo, title: newTitle })
 *   )
 *
 *   const handleSubmit = async (newTitle: string) => {
 *     setOptimisticTodo(newTitle)
 *     await updateTodo(todo.id, newTitle)
 *   }
 *
 *   return <div>{optimisticTodo.title}</div>
 * }
 * ```
 */
export function useOptimistic<T>(
  initialValue: T,
  options?: UseOptimisticOptions<T>
): OptimisticState<T> {
  const optimisticState = state<T>(initialValue)
  const isPendingState = state<boolean>(false)
  const isErrorState = state<boolean>(false)
  const errorState = state<Error | null>(null)
  const latestState = state<T>(initialValue)

  const updateOptimistic = (value: T | ((prev: T) => T)) => {
    isPendingState.set(true)
    isErrorState.set(false)
    errorState.set(null)

    optimisticState.set((current: T) => {
      const newValue = typeof value === 'function'
        ? (value as (prev: T) => T)(current)
        : value
      return options?.update ? options.update(current, newValue) : newValue
    })
  }

  const reset = () => {
    optimisticState.set(initialValue)
    isPendingState.set(false)
    isErrorState.set(false)
    errorState.set(null)
  }

  // Expose resolve function to mark operation as complete
  const resolve = (finalValue: T) => {
    latestState.set(finalValue)
    optimisticState.set(finalValue)
    isPendingState.set(false)
    options?.onResolved?.(finalValue)
  }

  const reject = (err: Error) => {
    isPendingState.set(false)
    isErrorState.set(true)
    errorState.set(err)
    // Revert to latest resolved value
    optimisticState.set(latestState())
    options?.onError?.(err)
  }

  // Attach resolve/reject to the result for external use
  const result: any = {
    optimistic: optimisticState,
    isPending: isPendingState,
    isError: isErrorState,
    error: errorState,
    latest: latestState,
    set: updateOptimistic,
    reset,
    _resolve: resolve,
    _reject: reject,
  }

  return result
}

/**
 * Helper to use useOptimistic with async actions.
 * Wraps an async function with optimistic state management.
 *
 * @example
 * ```tsx
 * const [state, { execute }] = useOptimisticAction(
 *   async (title: string) => {
 *     const todo = await api.createTodo(title)
 *     return todo
 *   },
 *   { revalidate: ['todos'] }
 * )
 * ```
 */
export function useOptimisticAction<T extends (...args: any[]) => Promise<any>>(
  action: T,
  options?: {
    update?: (current: any, newValue: any) => any
    revalidate?: string[]
  }
): {
  state: OptimisticState<any>
  execute: (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>
  formAction?: (formData: FormData) => Promise<any>
} {
  const optimisticState = state<any>(null)
  const isPendingState = state<boolean>(false)
  const isErrorState = state<boolean>(false)
  const errorState = state<Error | null>(null)

  const execute = async (...args: any[]) => {
    isPendingState.set(true)
    isErrorState.set(false)
    errorState.set(null)

    // Set optimistic value
    optimisticState.set((prev: any) => {
      return options?.update ? options.update(prev, args[0]) : args[0]
    })

    try {
      const result = await action(...args)
      optimisticState.set(result)
      isPendingState.set(false)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      isErrorState.set(true)
      errorState.set(error)
      isPendingState.set(false)
      throw error
    }
  }

  const formAction = async (formData: FormData) => {
    const args = Array.from(formData.entries()).reduce(
      (acc, [key, value]) => {
        acc[key] = value
        return acc
      },
      {} as Record<string, any>
    )
    return execute(args)
  }

  return {
    state: {
      optimistic: optimisticState,
      isPending: isPendingState,
      isError: isErrorState,
      error: errorState,
      latest: optimisticState,
      set: optimisticState.set,
      reset: () => {
        optimisticState.set(null)
        isPendingState.set(false)
        isErrorState.set(false)
        errorState.set(null)
      },
    },
    execute,
    formAction,
  }
}

// ─── useActionState Hook ────────────────────────────────────────

/**
 * Manage state for form actions (React 19 useActionState equivalent).
 *
 * @example
 * ```tsx
 * function CreateTodo() {
 *   const [state, formAction, isPending] = useActionState(
 *     async (prev, formData) => {
 *       const title = formData.get('title')
 *       const todo = await createTodo(title)
 *       return { success: true, todo }
 *     },
 *     { success: false, todo: null }
 *   )
 *
 *   return (
 *     <form action={formAction}>
 *       <input name="title" />
 *       <button disabled={isPending}>
 *         {isPending ? 'Creating...' : 'Create'}
 *       </button>
 *       {state.success && <p>Created!</p>}
 *     </form>
 *   )
 * }
 * ```
 */
export function useActionState<T, D = any>(
  action: (prevState: T, formData: D) => Promise<T> | T,
  initialState: T,
  permalink?: string
): [T, (formData: D) => Promise<void>, boolean] {
  const currentState = state<T>(initialState)
  const isPendingState = state<boolean>(false)

  const wrappedAction = async (formData: D): Promise<void> => {
    isPendingState.set(true)
    try {
      const newState = await action(currentState(), formData)
      currentState.set(newState)
    } finally {
      isPendingState.set(false)
    }
  }

  return [currentState(), wrappedAction, isPendingState()]
}

// ─── useFormStatus Hook ─────────────────────────────────────────

/**
 * Get the status of a parent form (React 19 useFormStatus equivalent).
 * Must be used within a <form> component.
 *
 * @example
 * ```tsx
 * function SubmitButton() {
 *   const { pending, data, method } = useFormStatus()
 *
 *   return (
 *     <button type="submit" disabled={pending}>
 *       {pending ? 'Submitting...' : 'Submit'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useFormStatus(options?: UseFormStatusOptions): FormStatus {
  // In a real implementation, this would use React Context
  // to get the parent form's status
  const pendingState = state<boolean>(false)
  const dataState = state<FormData | null>(null)
  const methodState = state<string>('GET')
  const actionState = state<string | ((formData: FormData) => Promise<any>) | null>(null)

  // If we have a form ref, listen to its events
  if (options?.formRef?.current) {
    const form = options.formRef.current

    const handleSubmit = (e: Event) => {
      const submitEvent = e as SubmitEvent
      pendingState.set(true)
      dataState.set(new FormData(form))
      methodState.set(form.method)
      actionState.set(form.action)
    }

    const handleDone = () => {
      pendingState.set(false)
      dataState.set(null)
    }

    form.addEventListener('submit', handleSubmit)
    form.addEventListener('loadend', handleDone)

    // Cleanup would be handled by the component lifecycle
  }

  return {
    pending: pendingState(),
    data: dataState(),
    method: methodState(),
    action: actionState(),
  }
}

// ─── use() API ──────────────────────────────────────────────────

/**
 * Read a Promise or Context in render (React 19 use() equivalent).
 * Unlike other hooks, use() can be called conditionally.
 *
 * @example
 * ```tsx
 * // Reading a promise
 * function UserProfile({ userPromise }) {
 *   const user = use(userPromise)
 *   return <div>{user.name}</div>
 * }
 *
 * // Reading context
 * function ThemeConsumer() {
 *   const theme = use(ThemeContext)
 *   return <div style={{ color: theme.color }}>Hello</div>
 * }
 * ```
 */
export function use<T>(promiseOrContext: Promise<T> | Context<T>): T {
  // Check if it's a context
  if (isContext(promiseOrContext)) {
    return useContext(promiseOrContext)
  }

  // It's a promise - suspend if not resolved
  return usePromise(promiseOrContext)
}

/**
 * Create a context that can be used with use().
 *
 * @example
 * ```tsx
 * const ThemeContext = createContext('light')
 *
 * function App() {
 *   return (
 *     <ThemeContext.Provider value="dark">
 *       <ThemeConsumer />
 *     </ThemeContext.Provider>
 *   )
 * }
 *
 * function ThemeConsumer() {
 *   const theme = use(ThemeContext)
 *   return <div className={theme}>Hello</div>
 * }
 * ```
 */
export function createContext<T>(defaultValue: T): Context<T> {
  return {
    _flintContext: true,
    defaultValue,
    _providers: new Map(),
    _nextId: 0,
  }
}

export interface Context<T> {
  _flintContext: true
  defaultValue: T
  _providers: Map<number, T>
  _nextId: number
}

function isContext<T>(value: any): value is Context<T> {
  return value && value._flintContext === true
}

// ─── Context Provider ───────────────────────────────────────────

let currentProviderId = 0

/**
 * Provide a context value to child components.
 * Use this with use() to read context values.
 *
 * @example
 * ```tsx
 * function App() {
 *   const theme = useProvider(ThemeContext, 'dark')
 *   return <Child />
 * }
 * ```
 */
export function useProvider<T>(context: Context<T>, value: T): T {
  const id = ++currentProviderId
  context._providers.set(id, value)

  // Register cleanup to remove provider when scope ends
  // This is simplified - in production, you'd track the scope
  return value
}

// ─── Promise Handling ───────────────────────────────────────────

// Cache for resolved promises
const promiseCache = new WeakMap<Promise<any>, { status: string; value?: any; error?: any }>()

/**
 * Read a promise in render context.
 * Suspends if the promise is pending.
 */
function usePromise<T>(promise: Promise<T>): T {
  const cached = promiseCache.get(promise)

  if (cached) {
    if (cached.status === 'fulfilled') {
      return cached.value
    }
    if (cached.status === 'rejected') {
      throw cached.error
    }
    // Still pending - suspend
    throw promise
  }

  // First time seeing this promise - start tracking it
  const cacheEntry: { status: string; value?: any; error?: any } = { status: 'pending' }
  promiseCache.set(promise, cacheEntry)

  promise.then(
    (value) => {
      cacheEntry.status = 'fulfilled'
      cacheEntry.value = value
    },
    (error) => {
      cacheEntry.status = 'rejected'
      cacheEntry.error = error
    }
  )

  // Suspend
  throw promise
}

/**
 * Read a context value in render context.
 */
function useContext<T>(context: Context<T>): T {
  // Get the nearest provider value
  // This is simplified - in production, you'd use the component tree
  const providers = Array.from(context._providers.values())
  if (providers.length > 0) {
    return providers[providers.length - 1]
  }
  return context.defaultValue
}

// ─── useDeferredValue Hook ──────────────────────────────────────

/**
 * Defer a value update to avoid jank.
 * Shows the previous value while the new value is being processed.
 *
 * @example
 * ```tsx
 * function SearchResults({ query }) {
 *   const deferredQuery = useDeferredValue(query)
 *   return <Results query={deferredQuery} />
 * }
 * ```
 */
export function useDeferredValue<T>(value: T): T {
  const deferredState = state<T>(value)

  // Update deferred value after current render
  effect(() => {
    // Use microtask to defer
    Promise.resolve().then(() => {
      deferredState.set(value)
    })
  })

  return deferredState()
}

// ─── useTransition Hook ─────────────────────────────────────────

/**
 * Mark updates as non-blocking transitions.
 *
 * @example
 * ```tsx
 * function TabContainer() {
 *   const [isPending, startTransition] = useTransition()
 *   const [tab, setTab] = useState('home')
 *
 *   const selectTab = (nextTab) => {
 *     startTransition(() => {
 *       setTab(nextTab)
 *     })
 *   }
 *
 *   return (
 *     <div>
 *       <TabButtons onSelect={selectTab} />
 *       <div style={{ opacity: isPending ? 0.5 : 1 }}>
 *         <TabContent tab={tab} />
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 */
export function useTransition(): [boolean, (callback: () => void) => void] {
  const isPendingState = state<boolean>(false)

  const startTransition = (callback: () => void) => {
    isPendingState.set(true)

    // Run callback and then mark as not pending
    Promise.resolve()
      .then(() => {
        callback()
        return Promise.resolve()
      })
      .finally(() => {
        isPendingState.set(false)
      })
  }

  return [isPendingState(), startTransition]
}

// ─── useRef Hook ────────────────────────────────────────────────

/**
 * Create a mutable ref that persists across renders.
 *
 * @example
 * ```tsx
 * function TextInput() {
 *   const inputRef = useRef<HTMLInputElement>(null)
 *
 *   const focus = () => {
 *     inputRef.current?.focus()
 *   }
 *
 *   return <input ref={inputRef} />
 * }
 * ```
 */
export function useRef<T>(initialValue: T): { current: T } {
  const ref = { current: initialValue }

  // In a real implementation, this would persist across renders
  // For now, we return a stable object
  return ref
}

// ─── useCallback Hook ───────────────────────────────────────────

/**
 * Memoize a callback function.
 *
 * @example
 * ```tsx
 * function TodoList({ todos, onToggle }) {
 *   const handleToggle = useCallback((id) => {
 *     onToggle(id)
 *   }, [onToggle])
 *
 *   return todos.map(todo => (
 *     <TodoItem key={todo.id} onToggle={handleToggle} />
 *   ))
 * }
 * ```
 */
export function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T {
  // Simplified - in production, compare deps
  return callback
}

// ─── useMemo Hook ───────────────────────────────────────────────

/**
 * Memoize a computed value.
 *
 * @example
 * ```tsx
 * function ExpensiveComponent({ items }) {
 *   const sortedItems = useMemo(() => {
 *     return items.sort((a, b) => a.name.localeCompare(b.name))
 *   }, [items])
 *
 *   return <List items={sortedItems} />
 * }
 * ```
 */
export function useMemo<T>(factory: () => T, deps: any[]): T {
  // Simplified - in production, compare deps and cache
  return factory()
}

// ─── useEffect Hook ─────────────────────────────────────────────

/**
 * Run side effects with dependency tracking.
 *
 * @example
 * ```tsx
 * function Timer() {
 *   const [count, setCount] = state(0)
 *
 *   useEffect(() => {
 *     const interval = setInterval(() => {
 *       setCount(c => c + 1)
 *     }, 1000)
 *     return () => clearInterval(interval)
 *   }, [])
 *
 *   return <div>{count}</div>
 * }
 * ```
 */
export function useEffect(effect: () => void | (() => void), deps?: any[]): void {
  // Use Flint's effect from reactivity
  effectFn(effect)
}

// Re-export the effect from reactivity
import { effect as effectFn } from '@flint/reactivity'
