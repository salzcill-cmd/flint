// Flint Runtime — Form Actions & Resource Preloading
// React 19 Form Actions, preinit, preload, prefetchDNS, preconnect

import { state, type Signal } from '@flint/reactivity'

// ─── Form Actions ───────────────────────────────────────────────

export interface FormActionOptions {
  /** The action URL or function */
  action: string | ((formData: FormData) => Promise<any> | any)
  /** HTTP method (default: POST) */
  method?: string
  /** Called before form submission */
  onBeforeSubmit?: (formData: FormData) => void | Promise<void>
  /** Called after successful submission */
  onSubmit?: (result: any) => void
  /** Called on error */
  onError?: (error: Error) => void
  /** Reset form after successful submission */
  resetOnSuccess?: boolean
  /** Enable progressive enhancement */
  progressive?: boolean
}

export interface FormActionResult {
  /** Whether the form is submitting */
  pending: boolean
  /** The result data */
  data: any
  /** Error if any */
  error: Error | null
  /** Submit the form */
  submit: (formData: FormData) => Promise<any>
  /** Reset the form */
  reset: () => void
}

/**
 * Create a form action handler (React 19 Form Actions equivalent).
 *
 * @example
 * ```tsx
 * function CreateTodo() {
 *   const formAction = createFormAction({
 *     action: async (formData) => {
 *       const title = formData.get('title')
 *       return await api.createTodo(title)
 *     },
 *     resetOnSuccess: true,
 *     onSubmit: () => console.log('Todo created!')
 *   })
 *
 *   return (
 *     <form action={formAction.submit}>
 *       <input name="title" required />
 *       <button disabled={formAction.pending}>
 *         {formAction.pending ? 'Creating...' : 'Create'}
 *       </button>
 *       {formAction.error && <p>Error: {formAction.error.message}</p>}
 *     </form>
 *   )
 * }
 * ```
 */
export function createFormAction(options: FormActionOptions): FormActionResult {
  const pendingState = state(false)
  const dataState = state<any>(null)
  const errorState = state<Error | null>(null)
  let formElement: HTMLFormElement | null = null as HTMLFormElement | null

  const submit = async (formData: FormData): Promise<any> => {
    pendingState.set(true)
    errorState.set(null)

    try {
      // Pre-submit hook
      if (options.onBeforeSubmit) {
        await options.onBeforeSubmit(formData)
      }

      let result: any

      if (typeof options.action === 'string') {
        // URL-based action
        const response = await fetch(options.action, {
          method: options.method || 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Form submission failed: ${response.statusText}`)
        }

        result = await response.json()
      } else {
        // Function-based action
        result = await options.action(formData)
      }

      dataState.set(result)
      pendingState.set(false)

      // Reset form if requested
      if (options.resetOnSuccess && formElement) {
        formElement.reset()
      }

      // Success callback
      options.onSubmit?.(result)

      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      errorState.set(error)
      pendingState.set(false)
      options.onError?.(error)
      throw error
    }
  }

  const reset = () => {
    dataState.set(null)
    errorState.set(null)
    pendingState.set(false)
    if (formElement) {
      formElement.reset()
    }
  }

  return {
    get pending() { return pendingState() },
    get data() { return dataState() },
    get error() { return errorState() },
    submit,
    reset,
  }
}

// ─── Resource Preloading ────────────────────────────────────────

export interface ResourcePreloadOptions {
  /** CrossOrigin attribute */
  crossOrigin?: 'anonymous' | 'use-credentials'
  /** Integrity hash for SRI */
  integrity?: string
  /** Referrer policy */
  referrerPolicy?: string
  /** Fetch priority */
  fetchPriority?: 'high' | 'low' | 'auto'
  /** nonce for CSP */
  nonce?: string
}

export interface PrefetchDNSOptions {
  /** CrossOrigin attribute */
  crossOrigin?: 'anonymous' | 'use-credentials'
}

export interface PreconnectOptions {
  /** CrossOrigin attribute */
  crossOrigin?: 'anonymous' | 'use-credentials'
}

/**
 * Preload a resource (React 19 preinit/preload equivalent).
 * Adds a <link rel="preload"> tag to the document head.
 *
 * @example
 * ```ts
 * // Preload a font
 * preload('/fonts/inter.woff2', { as: 'font', type: 'font/woff2' })
 *
 * // Preload an image
 * preload('/hero.jpg', { as: 'image' })
 *
 * // Preload a script
 * preload('/app.js', { as: 'script' })
 * ```
 */
export function preload(
  href: string,
  options: {
    as?: string
    type?: string
    crossOrigin?: 'anonymous' | 'use-credentials'
    integrity?: string
    referrerPolicy?: string
    fetchPriority?: 'high' | 'low' | 'auto'
    nonce?: string
  } = {}
): void {
  // Check if already preloaded
  if (isPreloaded(href)) return

  if (typeof document === 'undefined') {
    // Server-side: store for later injection
    serverPreloads.push({ href, options })
    return
  }

  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href

  if (options.as) link.setAttribute('as', options.as)
  if (options.type) link.type = options.type
  if (options.crossOrigin) link.crossOrigin = options.crossOrigin
  if (options.integrity) link.integrity = options.integrity
  if (options.referrerPolicy) link.referrerPolicy = options.referrerPolicy
  if (options.fetchPriority) link.setAttribute('fetchpriority', options.fetchPriority)
  if (options.nonce) link.nonce = options.nonce

  document.head.appendChild(link)

  // Track preloaded resources
  preloadedResources.add(href)
}

/**
 * Preinitialize a resource (React 19 preinit equivalent).
 * Like preload but also fetches and processes the resource immediately.
 *
 * @example
 * ```ts
 * // Preinit a stylesheet
 * preinit('/styles.css', { as: 'style' })
 *
 * // Preinit a script
 * preinit('/analytics.js', { as: 'script', fetchPriority: 'low' })
 * ```
 */
export function preinit(
  href: string,
  options: {
    as?: string
    type?: string
    crossOrigin?: 'anonymous' | 'use-credentials'
    integrity?: string
    referrerPolicy?: string
    fetchPriority?: 'high' | 'low' | 'auto'
    nonce?: string
    /** Whether to execute the script immediately */
    blocking?: boolean
  } = {}
): void {
  // Check if already initialized
  if (isPreinited(href)) return

  if (typeof document === 'undefined') {
    serverPreinits.push({ href, options })
    return
  }

  const link = document.createElement('link')
  link.rel = options.as === 'style' ? 'stylesheet' : 'preload'
  link.href = href

  if (options.as) link.setAttribute('as', options.as)
  if (options.type) link.type = options.type
  if (options.crossOrigin) link.crossOrigin = options.crossOrigin
  if (options.integrity) link.integrity = options.integrity
  if (options.referrerPolicy) link.referrerPolicy = options.referrerPolicy
  if (options.fetchPriority) link.setAttribute('fetchpriority', options.fetchPriority)
  if (options.nonce) link.nonce = options.nonce

  // For stylesheets, use blocking attribute
  if (options.as === 'style' && options.blocking) {
    link.setAttribute('blocking', 'render')
  }

  document.head.appendChild(link)

  // Track preinited resources
  preinitedResources.add(href)
}

/**
 * Prefetch DNS for a domain (React 19 prefetchDNS equivalent).
 * Adds a <link rel="dns-prefetch"> tag.
 *
 * @example
 * ```ts
 * prefetchDNS('https://api.example.com')
 * prefetchDNS('https://cdn.example.com')
 * ```
 */
export function prefetchDNS(
  href: string,
  options: PrefetchDNSOptions = {}
): void {
  if (typeof document === 'undefined') {
    serverPrefetchDNSs.push({ href, options })
    return
  }

  // Check if already prefetched
  if (prefetchedDNS.has(href)) return

  const link = document.createElement('link')
  link.rel = 'dns-prefetch'
  link.href = href

  if (options.crossOrigin) {
    link.crossOrigin = options.crossOrigin
  }

  document.head.appendChild(link)
  prefetchedDNS.add(href)
}

/**
 * Preconnect to a server (React 19 preconnect equivalent).
 * Adds a <link rel="preconnect"> tag.
 *
 * @example
 * ```ts
 * preconnect('https://api.example.com')
 * preconnect('https://fonts.googleapis.com', { crossOrigin: 'anonymous' })
 * ```
 */
export function preconnect(
  href: string,
  options: PreconnectOptions = {}
): void {
  if (typeof document === 'undefined') {
    serverPreconnects.push({ href, options })
    return
  }

  // Check if already connected
  if (preconnected.has(href)) return

  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = href

  if (options.crossOrigin) {
    link.crossOrigin = options.crossOrigin
  }

  document.head.appendChild(link)
  preconnected.add(href)
}

// ─── Tracking Sets ──────────────────────────────────────────────

const preloadedResources = new Set<string>()
const preinitedResources = new Set<string>()
const prefetchedDNS = new Set<string>()
const preconnected = new Set<string>()

function isPreloaded(href: string): boolean {
  if (preloadedResources.has(href)) return true
  if (typeof document !== 'undefined') {
    return document.querySelector(`link[rel="preload"][href="${href}"]`) !== null
  }
  return false
}

function isPreinited(href: string): boolean {
  if (preinitedResources.has(href)) return true
  if (typeof document !== 'undefined') {
    return document.querySelector(`link[href="${href}"]`) !== null
  }
  return false
}

// ─── Server-Side Storage ────────────────────────────────────────

interface ServerResourceEntry {
  href: string
  options: Record<string, any>
}

const serverPreloads: ServerResourceEntry[] = []
const serverPreinits: ServerResourceEntry[] = []
const serverPrefetchDNSs: ServerResourceEntry[] = []
const serverPreconnects: ServerResourceEntry[] = []

/**
 * Get all preloaded resources for server-side rendering.
 */
export function getServerPreloads(): ServerResourceEntry[] {
  return [...serverPreloads]
}

/**
 * Get all preinited resources for server-side rendering.
 */
export function getServerPreinits(): ServerResourceEntry[] {
  return [...serverPreinits]
}

/**
 * Get all prefetchDNS entries for server-side rendering.
 */
export function getServerPrefetchDNSs(): ServerResourceEntry[] {
  return [...serverPrefetchDNSs]
}

/**
 * Get all preconnect entries for server-side rendering.
 */
export function getServerPreconnects(): ServerResourceEntry[] {
  return [...serverPreconnects]
}

/**
 * Generate HTML for all server-side resource hints.
 */
export function generateResourceHintsHTML(): string {
  const hints: string[] = []

  // DNS Prefetch
  for (const entry of serverPrefetchDNSs) {
    const crossOrigin = entry.options.crossOrigin
      ? ` crossorigin="${entry.options.crossOrigin}"`
      : ''
    hints.push(`<link rel="dns-prefetch" href="${entry.href}"${crossOrigin}>`)
  }

  // Preconnect
  for (const entry of serverPreconnects) {
    const crossOrigin = entry.options.crossOrigin
      ? ` crossorigin="${entry.options.crossOrigin}"`
      : ''
    hints.push(`<link rel="preconnect" href="${entry.href}"${crossOrigin}>`)
  }

  // Preload
  for (const entry of serverPreloads) {
    const attrs: string[] = []
    if (entry.options.as) attrs.push(`as="${entry.options.as}"`)
    if (entry.options.type) attrs.push(`type="${entry.options.type}"`)
    if (entry.options.crossOrigin) attrs.push(`crossorigin="${entry.options.crossOrigin}"`)
    if (entry.options.integrity) attrs.push(`integrity="${entry.options.integrity}"`)
    if (entry.options.referrerPolicy) attrs.push(`referrerpolicy="${entry.options.referrerPolicy}"`)
    if (entry.options.fetchPriority) attrs.push(`fetchpriority="${entry.options.fetchPriority}"`)
    if (entry.options.nonce) attrs.push(`nonce="${entry.options.nonce}"`)
    hints.push(`<link rel="preload" href="${entry.href}"${attrs.length ? ' ' + attrs.join(' ') : ''}>`)
  }

  // Preinit
  for (const entry of serverPreinits) {
    const attrs: string[] = []
    if (entry.options.as) attrs.push(`as="${entry.options.as}"`)
    if (entry.options.type) attrs.push(`type="${entry.options.type}"`)
    if (entry.options.crossOrigin) attrs.push(`crossorigin="${entry.options.crossOrigin}"`)
    if (entry.options.integrity) attrs.push(`integrity="${entry.options.integrity}"`)
    if (entry.options.nonce) attrs.push(`nonce="${entry.options.nonce}"`)
    if (entry.options.blocking) attrs.push(`blocking="render"`)
    const rel = entry.options.as === 'style' ? 'stylesheet' : 'preload'
    hints.push(`<link rel="${rel}" href="${entry.href}"${attrs.length ? ' ' + attrs.join(' ') : ''}>`)
  }

  return hints.join('\n')
}

/**
 * Clear server-side resource storage.
 */
export function clearServerResources(): void {
  serverPreloads.length = 0
  serverPreinits.length = 0
  serverPrefetchDNSs.length = 0
  serverPreconnects.length = 0
}

// ─── Resource Preloading Hooks ──────────────────────────────────

/**
 * Hook to preload a resource when component mounts.
 *
 * @example
 * ```tsx
 * function HeroImage() {
 *   usePreload('/hero.jpg', { as: 'image' })
 *   return <img src="/hero.jpg" />
 * }
 * ```
 */
export function usePreload(
  href: string,
  options?: {
    as?: string
    type?: string
    crossOrigin?: 'anonymous' | 'use-credentials'
    integrity?: string
  }
): void {
  // In a real implementation, this would be called during SSR
  // For now, we just call preload directly
  if (typeof document !== 'undefined') {
    preload(href, options)
  }
}

/**
 * Hook to prefetch DNS when component mounts.
 */
export function usePrefetchDNS(
  href: string,
  options?: { crossOrigin?: 'anonymous' | 'use-credentials' }
): void {
  if (typeof document !== 'undefined') {
    prefetchDNS(href, options)
  }
}

/**
 * Hook to preconnect when component mounts.
 */
export function usePreconnect(
  href: string,
  options?: { crossOrigin?: 'anonymous' | 'use-credentials' }
): void {
  if (typeof document !== 'undefined') {
    preconnect(href, options)
  }
}
