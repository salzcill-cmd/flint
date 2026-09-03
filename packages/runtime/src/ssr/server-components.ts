// Flint Runtime — Server Components & Server Actions
// React Server Components (RSC) equivalent

// ─── Types ──────────────────────────────────────────────────────

export type ServerComponent<T = Record<string, any>> = (props: T) => any

export interface ServerActionOptions {
  /** Action function */
  action: (...args: any[]) => Promise<any>
  /** Revalidation keys after action completes */
  revalidate?: string[]
  /** Custom error handler */
  onError?: (error: Error) => void
  /** Custom success handler */
  onSuccess?: (result: any) => void
}

export interface ServerActionResult<T = any> {
  data: T | null
  error: Error | null
  pending: boolean
  /** Revalidation keys to trigger */
  revalidate?: string[]
}

export interface ServerComponentMeta {
  /** Whether this is a server component */
  isServer: boolean
  /** Component name for debugging */
  name: string
  /** Dependencies to track */
  dependencies?: string[]
  /** Cache strategy */
  cache?: 'none' | 'session' | 'static'
  /** Revalidation interval (ms) for static cache */
  revalidateInterval?: number
}

export interface ServerComponentContext {
  /** Request object (server only) */
  request?: Request
  /** Response object (server only) */
  response?: Response
  /** Route params */
  params: Record<string, string>
  /** Query params */
  query: Record<string, string>
  /** Shared data between components */
  data: Record<string, any>
  /** Headers */
  headers: Record<string, string>
  /** Set a response header */
  setHeader: (name: string, value: string) => void
  /** Redirect */
  redirect: (url: string, status?: number) => void
  /** Throw not found */
  notFound: () => never
}

export interface ServerActionRegistry {
  /** Registered server actions */
  actions: Map<string, ServerActionHandler>
  /** Register a new action */
  register: (id: string, handler: ServerActionHandler) => void
  /** Execute an action by ID */
  execute: (id: string, ...args: any[]) => Promise<any>
  /** Check if action exists */
  has: (id: string) => boolean
}

export type ServerActionHandler = (
  ...args: any[]
) => Promise<any>

// ─── Server Action Registry ─────────────────────────────────────

/**
 * Global registry for server actions.
 * Server actions are functions that run on the server and can be called from client components.
 */
let actionRegistry: ServerActionRegistry | null = null

export function getServerActionRegistry(): ServerActionRegistry {
  if (!actionRegistry) {
    actionRegistry = createActionRegistry()
  }
  return actionRegistry
}

function createActionRegistry(): ServerActionRegistry {
  const actions = new Map<string, ServerActionHandler>()

  return {
    actions,

    register(id: string, handler: ServerActionHandler): void {
      if (actions.has(id)) {
        console.warn(`[Flint] Server action "${id}" already registered, overwriting.`)
      }
      actions.set(id, handler)
    },

    async execute(id: string, ...args: any[]): Promise<any> {
      const handler = actions.get(id)
      if (!handler) {
        throw new Error(`[Flint] Server action "${id}" not found. Make sure it's registered with "use server" directive.`)
      }
      return handler(...args)
    },

    has(id: string): boolean {
      return actions.has(id)
    },
  }
}

// ─── Server Action Creator ──────────────────────────────────────

/**
 * Create a server action that can be called from client components.
 * Server actions run on the server and return results to the client.
 *
 * @example
 * ```ts
 * // server/actions.ts
 * 'use server'
 *
 * export const saveTodo = createServerAction(async (title: string) => {
 *   const todo = await db.todos.create({ title })
 *   return todo
 * }, { revalidate: ['todos'] })
 *
 * // client/Component.tsx
 * import { saveTodo } from '../server/actions'
 *
 * export function TodoForm() {
 *   const handleSubmit = async (title: string) => {
 *     const result = await saveTodo(title)
 *     console.log(result)
 *   }
 * }
 * ```
 */
export function createServerAction<T extends (...args: any[]) => Promise<any>>(
  action: T,
  options?: {
    revalidate?: string[]
    onError?: (error: Error) => void
    onSuccess?: (result: any) => void
  }
): T & { actionId: string; isServerAction: true } {
  const actionId = generateActionId(action)

  // Register the action
  const registry = getServerActionRegistry()
  registry.register(actionId, async (...args: any[]) => {
    try {
      const result = await action(...args)
      options?.onSuccess?.(result)
      return { data: result, error: null, revalidate: options?.revalidate }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      options?.onError?.(err)
      return { data: null, error: err, revalidate: options?.revalidate }
    }
  })

  // Create the callable wrapper
  const wrapper = async (...args: any[]): Promise<any> => {
    // If running on server, execute directly
    if (typeof window === 'undefined') {
      return action(...args)
    }

    // If running on client, send to server
    return callServerAction(actionId, args)
  }

  // Attach metadata
  const result = Object.assign(wrapper, {
    actionId,
    isServerAction: true as const,
  })

  return result as T & { actionId: string; isServerAction: true }
}

function generateActionId(fn: (...args: any[]) => any): string {
  // Generate a stable ID from function name + hash
  const name = fn.name || 'anonymous'
  const hash = simpleHash(fn.toString())
  return `action_${name}_${hash}`
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return Math.abs(hash).toString(36)
}

// ─── Client-Side Server Action Caller ───────────────────────────

/**
 * Call a server action from client side.
 * This sends the action ID and arguments to the server for execution.
 */
export async function callServerAction(
  actionId: string,
  args: any[]
): Promise<any> {
  // If we have a custom transport, use it
  if (serverTransport) {
    return serverTransport(actionId, args)
  }

  // Default: use fetch to call the server action endpoint
  const response = await fetch('/__flint_server_action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Flint-Action-Id': actionId,
    },
    body: JSON.stringify({ actionId, args }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Server action failed' }))
    throw new Error(error.message || 'Server action failed')
  }

  const result = await response.json()
  return result
}

// ─── Transport Configuration ────────────────────────────────────

let serverTransport: ((actionId: string, args: any[]) => Promise<any>) | null = null

/**
 * Configure a custom transport for server actions.
 * Useful for WebSocket or custom RPC implementations.
 */
export function configureServerTransport(
  transport: (actionId: string, args: any[]) => Promise<any>
): void {
  serverTransport = transport
}

// ─── Server Component Wrapper ───────────────────────────────────

/**
 * Mark a component as a server component.
 * Server components run on the server and serialize their output for the client.
 *
 * @example
 * ```tsx
 * export const UserList = createServerComponent(async (props: { limit: number }) => {
 *   const users = await db.users.findMany({ take: props.limit })
 *   return (
 *     <ul>
 *       {users.map(user => <li key={user.id}>{user.name}</li>)}
 *     </ul>
 *   )
 * })
 * ```
 */
export function createServerComponent<T extends Record<string, any>>(
  component: (props: T, context: ServerComponentContext) => any | Promise<any>,
  options?: Partial<ServerComponentMeta>
): ServerComponent<T> & { meta: ServerComponentMeta } {
  const meta: ServerComponentMeta = {
    isServer: true,
    name: component.name || 'AnonymousServerComponent',
    ...options,
  }

  const wrapper: any = async (props: T) => {
    // Server components can only run on server
    if (typeof window !== 'undefined') {
      throw new Error(
        `[Flint] Server component "${meta.name}" cannot run on client. ` +
        `Use createClientComponent() or createUniversalComponent() instead.`
      )
    }

    return component(props, getServerComponentContext())
  }

  wrapper.meta = meta
  wrapper.displayName = meta.name
  return wrapper
}

/**
 * Create a universal component that works on both server and client.
 * Server renders the initial HTML, client hydrates with interactivity.
 *
 * @example
 * ```tsx
 * export const TodoApp = createUniversalComponent(
 *   // Server: fetch initial data
 *   async (props, ctx) => {
 *     const todos = await fetchTodos()
 *     return { todos }
 *   },
 *   // Client: render with data
 *   (serverData, props) => {
 *     const [todos, setTodos] = state(serverData.todos)
 *     return <TodoList todos={todos} />
 *   }
 * )
 * ```
 */
export function createUniversalComponent<S, C extends Record<string, any>>(
  serverFn: (props: C, context: ServerComponentContext) => S | Promise<S>,
  clientFn: (serverData: S, props: C) => any,
  options?: Partial<ServerComponentMeta>
): ServerComponent<C> & { meta: ServerComponentMeta } {
  const meta: ServerComponentMeta = {
    isServer: false,
    name: options?.name || 'AnonymousUniversalComponent',
    ...options,
  }

  const wrapper: any = async (props: C) => {
    if (typeof window === 'undefined') {
      // Server: run server function
      const serverData = await serverFn(props, getServerComponentContext())
      // Serialize server data for client hydration
      return clientFn(serverData, props)
    } else {
      // Client: this would receive serialized server data via hydration
      // For now, we pass empty data - hydration will provide real data
      return clientFn({} as S, props)
    }
  }

  wrapper.meta = meta
  wrapper.displayName = meta.name
  return wrapper
}

// ─── Server Component Context ───────────────────────────────────

let currentServerContext: ServerComponentContext | null = null

function getServerComponentContext(): ServerComponentContext {
  if (!currentServerContext) {
    currentServerContext = createDefaultServerContext()
  }
  return currentServerContext
}

function createDefaultServerContext(): ServerComponentContext {
  const headers: Record<string, string> = {}
  return {
    params: {},
    query: {},
    data: {},
    headers,
    setHeader: (name: string, value: string) => {
      headers[name] = value
    },
    redirect: (url: string, status = 302) => {
      throw new RedirectError(url, status)
    },
    notFound: () => {
      throw new NotFoundError()
    },
  }
}

/**
 * Set the current server component context.
 * Called by the framework during SSR rendering.
 */
export function setServerComponentContext(context: ServerComponentContext): void {
  currentServerContext = context
}

/**
 * Clear the current server component context.
 */
export function clearServerComponentContext(): void {
  currentServerContext = null
}

// ─── Special Errors ─────────────────────────────────────────────

export class RedirectError extends Error {
  constructor(
    public url: string,
    public status: number = 302
  ) {
    super(`Redirect to ${url}`)
    this.name = 'RedirectError'
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Not Found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

// ─── Server Action Middleware ───────────────────────────────────

export type ServerActionMiddleware = (
  actionId: string,
  args: any[],
  next: (...args: any[]) => Promise<any>
) => Promise<any>

const actionMiddlewares: ServerActionMiddleware[] = []

/**
 * Add middleware to server actions.
 * Useful for authentication, logging, validation, etc.
 *
 * @example
 * ```ts
 * addServerActionMiddleware(async (actionId, args, next) => {
 *   const session = await getSession()
 *   if (!session.user) throw new Error('Unauthorized')
 *   return next(...args)
 * })
 * ```
 */
export function addServerActionMiddleware(middleware: ServerActionMiddleware): void {
  actionMiddlewares.push(middleware)
}

/**
 * Execute an action through middleware chain.
 */
export async function executeWithMiddleware(
  actionId: string,
  args: any[],
  handler: (...args: any[]) => Promise<any>
): Promise<any> {
  // Build middleware chain
  let idx = 0
  const next = async (...nextArgs: any[]): Promise<any> => {
    if (idx < actionMiddlewares.length) {
      const middleware = actionMiddlewares[idx++]
      return middleware(actionId, nextArgs, next)
    }
    return handler(...nextArgs)
  }

  return next(...args)
}

// ─── Server Action HTTP Handler ─────────────────────────────────

/**
 * Handle server action HTTP requests.
 * Use this in your server entry point to handle POST /__flint_server_action.
 *
 * @example
 * ```ts
 * // server.ts
 * import { handleServerAction } from '@flint/runtime/server'
 *
 * const server = createServer()
 * server.post('/__flint_server_action', handleServerAction)
 * ```
 */
export async function handleServerAction(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const { actionId, args } = body

    if (!actionId) {
      return new Response(
        JSON.stringify({ message: 'Missing action ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const registry = getServerActionRegistry()
    if (!registry.has(actionId)) {
      return new Response(
        JSON.stringify({ message: `Action "${actionId}" not found` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Execute through middleware
    const result = await executeWithMiddleware(actionId, args, (...a) =>
      registry.execute(actionId, ...a)
    )

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({ message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// ─── Server Action Form Handler ─────────────────────────────────

/**
 * Handle form submissions to server actions.
 * Extracts form data and calls the appropriate server action.
 *
 * @example
 * ```tsx
 * <form action={handleFormAction}>
 *   <input name="title" />
 *   <button type="submit">Save</button>
 * </form>
 * ```
 */
export function createFormActionHandler(actionId: string) {
  return async (formData: FormData): Promise<any> => {
    const args = Array.from(formData.entries()).reduce(
      (acc, [key, value]) => {
        acc[key] = value
        return acc
      },
      {} as Record<string, any>
    )

    return callServerAction(actionId, [args])
  }
}
