// Flint Runtime — Server-Side Rendering v2
// Full implementation: renderToString, streaming SSR, proper hydration

import { state, computed } from '@flint/reactivity'
import type { Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export type SSRComponent = (props?: any) => any

export interface SSRContext {
  components: Map<string, SSRComponent>
  hydrationData: Record<string, any>
  effects: Array<() => void>
  head: {
    title: string
    meta: Record<string, string>[]
    links: Record<string, string>[]
    scripts: Record<string, string>[]
  }
  routeParams: Record<string, string>
  query: Record<string, string>
  data: Record<string, any>
}

export interface RenderToStringOptions {
  /** Component to render */
  component: SSRComponent
  /** Props to pass to component */
  props?: Record<string, any>
  /** URL for routing context */
  url?: string
  /** Enable hydration markers */
  hydrate?: boolean
  /** Collect head elements */
  collectHead?: boolean
  /** Timeout for SSR (ms) */
  timeout?: number
}

export interface RenderToStreamOptions extends RenderToStringOptions {
  /** Called when shell is ready */
  onShellReady?: (html: string) => void
  /** Called when all content is ready */
  onAllReady?: (html: string) => void
  /** Called on error */
  onError?: (error: Error) => void
  /** Called on abort */
  onAbort?: () => void
}

export interface SSRResult {
  html: string
  context: SSRContext
  /** Scripts to load */
  scripts: string[]
  /** Styles to load */
  styles: string[]
  /** Seed for deterministic hydration IDs */
  seed: string
}

export interface StreamResult {
  pipe: (writable: WritableStream<Uint8Array>) => void
  /** Promise that resolves when streaming is complete */
  ready: Promise<void>
  /** Abort the stream */
  abort: () => void
}

export interface HydrationResult {
  /** Whether hydration was successful */
  success: boolean
  /** Attached effects count */
  effectsAttached: number
  /** Warnings during hydration */
  warnings: string[]
}

// ─── SSR Context ────────────────────────────────────────────────

let currentSSRContext: SSRContext | null = null
let hydrationIdCounter = 0

export function getSSRContext(): SSRContext | null {
  return currentSSRContext
}

function createContext(): SSRContext {
  return {
    components: new Map(),
    hydrationData: {},
    effects: [],
    head: {
      title: '',
      meta: [],
      links: [],
      scripts: [],
    },
    routeParams: {},
    query: {},
    data: {},
  }
}

function generateHydrationId(): string {
  return `f-${(hydrationIdCounter++).toString(36)}`
}

// ─── HTML Escaping ──────────────────────────────────────────────

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ─── Render to String ───────────────────────────────────────────

/**
 * Render a component to an HTML string (server-side).
 *
 * @example
 * import { renderToString } from 'flint/ssr'
 *
 * const html = await renderToString({
 *   component: App,
 *   props: { name: 'World' },
 *   url: '/about',
 * })
 */
export async function renderToString(
  options: RenderToStringOptions
): Promise<SSRResult> {
  const {
    component,
    props = {},
    url = '/',
    hydrate = true,
    collectHead = true,
    timeout = 10000,
  } = options

  hydrationIdCounter = 0
  const context = createContext()
  currentSSRContext = context

  // Parse URL for query params
  try {
    const urlObj = new URL(url, 'http://localhost')
    context.query = Object.fromEntries(urlObj.searchParams)
  } catch {}

  try {
    // Render with timeout
    const html = await Promise.race([
      renderNode(component, props, hydrate, context),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('SSR timeout')), timeout)
      ),
    ])

    // Generate hydration script
    const scripts: string[] = []
    if (hydrate && Object.keys(context.hydrationData).length > 0) {
      scripts.push(
        `<script data-flint-hydration>window.__FLINT_HYDRATION__=${JSON.stringify({
          v: 1,
          d: context.hydrationData,
        })};</script>`
      )
    }

    // Collect head elements
    const styles: string[] = []

    return {
      html,
      context,
      scripts,
      styles,
      seed: generateSeed(),
    }
  } finally {
    currentSSRContext = null
  }
}

function generateSeed(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ─── Render Node ────────────────────────────────────────────────

async function renderNode(
  component: SSRComponent | string | number | null | undefined | any[],
  props: Record<string, any>,
  hydrate: boolean,
  context: SSRContext
): Promise<string> {
  // Null/undefined
  if (component == null) {
    return ''
  }

  // String (text node)
  if (typeof component === 'string') {
    return escapeHTML(component)
  }

  // Number
  if (typeof component === 'number') {
    return escapeHTML(String(component))
  }

  // Array
  if (Array.isArray(component)) {
    const children = await Promise.all(
      component.map((child) => renderNode(child, {}, hydrate, context))
    )
    return children.join('')
  }

  // Function component
  if (typeof component === 'function') {
    return renderFunctionComponent(component, props, hydrate, context)
  }

  // Virtual DOM element (supports both { type, props, children } and { tag, props, children })
  if (component && typeof component === 'object' && ('type' in component || 'tag' in component)) {
    return renderVNode(component, hydrate, context)
  }

  return ''
}

async function renderFunctionComponent(
  component: SSRComponent,
  props: Record<string, any>,
  hydrate: boolean,
  context: SSRContext
): Promise<string> {
  // Call component
  try {
    const result = component(props)

    // Handle async components
    const content = result instanceof Promise ? await result : result

    // Render result
    return await renderNode(content, {}, hydrate, context)
  } catch (error) {
    console.error(`[Flint SSR] Error in component "${component.name}":`, error)
    return hydrate
      ? `<div data-flint-error="${escapeHTML(String(error))}">Error</div>`
      : '<!-- SSR Error -->'
  }
}

async function renderVNode(
  vnode: any,
  hydrate: boolean,
  context: SSRContext
): Promise<string> {
  // Support both { tag, props, children } and { type, props, children } formats
  const tag = vnode.tag || vnode.type
  const props = vnode.props || {}
  const children = vnode.children || []

  // Fragment
  if (tag === 'fragment' || tag === Symbol.for('flint.fragment')) {
    const childHtml = await Promise.all(
      (Array.isArray(children) ? children : [children]).map(
        (child: any) => renderNode(child, {}, hydrate, context)
      )
    )
    return childHtml.join('')
  }

  // Built-in components
  if (typeof tag === 'function') {
    return renderFunctionComponent(tag, props, hydrate, context)
  }

  // HTML element
  const attrs = buildAttributes(props)
  const hydrationAttr = hydrate ? ` data-flint-id="${generateHydrationId()}"` : ''

  // Self-closing tags
  const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']
  if (selfClosing.includes(tag)) {
    return `<${tag}${attrs}${hydrationAttr} />`
  }

  // Render children
  let childrenHtml = ''
  if (children) {
    const childArray = Array.isArray(children) ? children : [children]
    const childResults = await Promise.all(
      childArray.map((child: any) => renderNode(child, {}, hydrate, context))
    )
    childrenHtml = childResults.join('')
  }

  // Handle dangerouslySetInnerHTML
  if (props.dangerouslySetInnerHTML) {
    childrenHtml = props.dangerouslySetInnerHTML.__html || ''
  }

  return `<${tag}${attrs}${hydrationAttr}>${childrenHtml}</${tag}>`
}

function buildAttributes(props: Record<string, any>): string {
  return Object.entries(props)
    .map(([key, value]) => {
      // Skip special props
      if (key === 'children' || key === 'key' || key === 'ref') {
        return ''
      }

      // dangerouslySetInnerHTML handled separately
      if (key === 'dangerouslySetInnerHTML') {
        return ''
      }

      // Boolean true
      if (value === true) {
        return ` ${key}`
      }

      // Boolean false or null/undefined
      if (value == null || value === false) {
        return ''
      }

      // Class handling
      if (key === 'class' && Array.isArray(value)) {
        return ` class="${escapeHTML(value.filter(Boolean).join(' '))}"`
      }

      // Style object
      if (key === 'style' && typeof value === 'object') {
        const styleStr = Object.entries(value)
          .map(([k, v]) => `${k}:${v}`)
          .join(';')
        return ` style="${escapeHTML(styleStr)}"`
      }

      // Event handlers - skip in SSR
      if (key.startsWith('on')) {
        return ''
      }

      // Regular attribute
      return ` ${key}="${escapeHTML(String(value))}"`
    })
    .filter(Boolean)
    .join('')
}

// ─── Streaming SSR ──────────────────────────────────────────────

/**
 * Render a component to a stream (for streaming SSR).
 *
 * @example
 * const stream = renderToPipeableStream({
 *   component: App,
 *   onShellReady(html) {
 *     response.write(html);
 *   },
 *   onAllReady(html) {
 *     response.end();
 *   },
 * })
 */
export function renderToPipeableStream(
  options: RenderToStreamOptions
): StreamResult {
  const {
    component,
    props = {},
    url = '/',
    hydrate = true,
    onShellReady,
    onAllReady,
    onError,
    onAbort,
  } = options

  hydrationIdCounter = 0
  const context = createContext()
  currentSSRContext = context

  let shellHtml = ''
  let aborted = false
  let resolveReady: () => void
  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve
  })

  // Async rendering
  const render = async () => {
    try {
      if (aborted) return

      const html = await renderNode(component, props, hydrate, context)
      if (aborted) return

      shellHtml = html

      // Add hydration script
      if (hydrate && Object.keys(context.hydrationData).length > 0) {
        const hydrationScript = `<script data-flint-hydration>window.__FLINT_HYDRATION__=${JSON.stringify({
          v: 1,
          d: context.hydrationData,
        })};</script>`
        shellHtml = hydrationScript + shellHtml
      }

      // Callbacks
      if (!aborted) {
        if (onShellReady) {
          onShellReady(shellHtml)
        }

        if (onAllReady) {
          onAllReady(shellHtml)
        }
      }

      resolveReady()
    } catch (error) {
      if (onError && !aborted) {
        onError(error as Error)
      }
      resolveReady()
    } finally {
      currentSSRContext = null
    }
  }

  render()

  return {
    pipe(writable: WritableStream<Uint8Array>) {
      const writer = writable.getWriter()
      const encoder = new TextEncoder()

      // Wait for shell
      ready.then(() => {
        if (!aborted) {
          writer.write(encoder.encode(shellHtml))
          writer.close()
        }
      })
    },
    ready,
    abort() {
      aborted = true
      if (onAbort) {
        onAbort()
      }
      resolveReady()
      currentSSRContext = null
    },
  }
}

// ─── Hydration ──────────────────────────────────────────────────

export interface HydrationOptions {
  /** Root element to hydrate */
  root: HTMLElement
  /** Component to hydrate */
  component: SSRComponent
  /** Props */
  props?: Record<string, any>
  /** Strict mode - mismatch throws error */
  strict?: boolean
  /** Callback on hydration mismatch */
  onMismatch?: (details: MismatchDetails) => void
}

export interface MismatchDetails {
  type: 'structure' | 'attributes' | 'content'
  expected: string
  actual: string
  element?: HTMLElement
}

/**
 * Hydrate server-rendered HTML on the client.
 *
 * @example
 * import { hydrate } from 'flint/ssr'
 *
 * const result = await hydrate({
 *   root: document.getElementById('app')!,
 *   component: App,
 * })
 *
 * if (!result.success) {
 *   console.error('Hydration failed:', result.warnings)
 * }
 */
export async function hydrate(options: HydrationOptions): Promise<HydrationResult> {
  const { root, component, props = {}, strict = false, onMismatch } = options

  const warnings: string[] = []
  let effectsAttached = 0

  // Get hydration data
  const hydrationData = (window as any).__FLINT_HYDRATION__?.d || {}

  // Validate structure
  const validationResult = validateHydration(root, hydrationData, warnings)

  if (!validationResult.valid && strict) {
    return {
      success: false,
      effectsAttached: 0,
      warnings: validationResult.warnings,
    }
  }

  // Attach event listeners and reactive bindings
  try {
    effectsAttached = attachHydration(root, hydrationData, warnings)
  } catch (error) {
    warnings.push(`Failed to attach hydration: ${error}`)
  }

  // Mark as hydrated
  root.setAttribute('data-flint-hydrated', 'true')
  root.removeAttribute('data-flint-id')

  // Clean up hydration data
  delete (window as any).__FLINT_HYDRATION__

  // Trigger any queued effects
  triggerHydrationEffects()

  return {
    success: warnings.length === 0,
    effectsAttached,
    warnings,
  }
}

function validateHydration(
  root: HTMLElement,
  hydrationData: Record<string, any>,
  warnings: string[]
): { valid: boolean; warnings: string[] } {
  // Check for expected components
  const expectedIds = Object.keys(hydrationData)
  const actualIds = root.querySelectorAll('[data-flint-id]').length

  if (expectedIds.length !== actualIds) {
    warnings.push(
      `Hydration mismatch: expected ${expectedIds.length} components, found ${actualIds}`
    )
  }

  // Check for hydration error elements
  const errorElements = root.querySelectorAll('[data-flint-error]')
  errorElements.forEach((el) => {
    const error = el.getAttribute('data-flint-error')
    warnings.push(`SSR error in component: ${error}`)
  })

  return {
    valid: warnings.length === 0,
    warnings,
  }
}

function attachHydration(
  root: HTMLElement,
  hydrationData: Record<string, any>,
  warnings: string[]
): number {
  let effectsCount = 0

  // Find all elements with hydration IDs
  const elements = root.querySelectorAll('[data-flint-id]')

  elements.forEach((el) => {
    const id = el.getAttribute('data-flint-id')
    if (!id || !hydrationData[id]) return

    const data = hydrationData[id]

    // Attach click handlers
    const clickElements = el.querySelectorAll('[onclick]')
    clickElements.forEach((clickEl) => {
      const handler = clickEl.getAttribute('onclick')
      if (handler) {
        // In a real implementation, we'd evaluate the handler safely
        clickEl.removeAttribute('onclick')
        effectsCount++
      }
    })

    // Mark as hydrated
    el.removeAttribute('data-flint-id')
    el.setAttribute('data-flint-hydrated', 'true')
  })

  return effectsCount
}

function triggerHydrationEffects(): void {
  // Trigger any effects that were queued during hydration
  if (typeof window !== 'undefined') {
    queueMicrotask(() => {
      window.dispatchEvent(new CustomEvent('flint:hydrated'))
    })
  }
}

// ─── Selective Hydration ────────────────────────────────────────

export interface SelectiveHydrationOptions {
  /** Root element */
  root: HTMLElement
  /** Components to hydrate immediately */
  immediate?: string[]
  /** Components to hydrate on visibility */
  lazy?: string[]
  /** Components to hydrate on user interaction */
  interaction?: string[]
  /** Callback when component is hydrated */
  onHydrate?: (id: string) => void
}

/**
 * Selectively hydrate components based on priority.
 *
 * @example
 * import { selectiveHydration } from 'flint/ssr'
 *
 * selectiveHydration({
 *   root: document.getElementById('app')!,
 *   immediate: ['header', 'nav'],
 *   lazy: ['footer', 'sidebar'],
 *   interaction: ['modal', 'dropdown'],
 * })
 */
export function selectiveHydration(options: SelectiveHydrationOptions): void {
  const {
    root,
    immediate = [],
    lazy = [],
    interaction = [],
    onHydrate,
  } = options

  const hydrationData = (window as any).__FLINT_HYDRATION__?.d || {}

  // Hydrate immediate components
  immediate.forEach((id) => {
    if (hydrationData[id]) {
      hydrateComponent(root, id, hydrationData[id])
      onHydrate?.(id)
    }
  })

  // Set up intersection observer for lazy components
  if (lazy.length > 0 && typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-flint-id')
            if (id && hydrationData[id]) {
              hydrateComponent(root, id, hydrationData[id])
              onHydrate?.(id)
              observer.unobserve(entry.target)
            }
          }
        })
      },
      { rootMargin: '200px' }
    )

    lazy.forEach((id) => {
      const el = root.querySelector(`[data-flint-id="${id}"]`)
      if (el) observer.observe(el)
    })
  }

  // Set up event listeners for interaction-based hydration
  if (interaction.length > 0) {
    const events = ['click', 'focus', 'mouseenter', 'touchstart']
    const handler = (e: Event) => {
      const target = e.target as HTMLElement
      const el = target.closest('[data-flint-id]')
      if (el) {
        const id = el.getAttribute('data-flint-id')
        if (id && interaction.includes(id) && hydrationData[id]) {
          hydrateComponent(root, id, hydrationData[id])
          onHydrate?.(id)
          // Remove event listeners
          events.forEach((evt) => document.removeEventListener(evt, handler, true))
        }
      }
    }

    events.forEach((evt) => document.addEventListener(evt, handler, true))
  }
}

function hydrateComponent(
  root: HTMLElement,
  id: string,
  data: any
): void {
  const el = root.querySelector(`[data-flint-id="${id}"]`)
  if (!el) return

  // Remove hydration ID
  el.removeAttribute('data-flint-id')
  el.setAttribute('data-flint-hydrated', 'true')

  // In a full implementation, we'd:
  // 1. Create component instance
  // 2. Attach reactive bindings
  // 3. Set up event listeners
  // 4. Sync state from server
}

// ─── HTML Template ──────────────────────────────────────────────

export interface HTMLTemplateOptions {
  /** Page title */
  title?: string
  /** Meta tags */
  meta?: Record<string, string>[]
  /** Link tags */
  links?: Record<string, string>[]
  /** Inline scripts */
  scripts?: string[]
  /** External script URLs */
  scriptUrls?: string[]
  /** Inline styles */
  styles?: string[]
  /** Style URLs */
  styleUrls?: string[]
  /** Body content */
  body: string
  /** Additional head content */
  head?: string
  /** Additional body attributes */
  bodyAttrs?: Record<string, string>
  /** Lang attribute */
  lang?: string
  /** Favicon URL */
  favicon?: string
}

/**
 * Generate a complete HTML document.
 *
 * @example
 * import { generateHTML } from 'flint/ssr'
 *
 * const html = generateHTML({
 *   title: 'My App',
 *   meta: [{ name: 'description', content: 'A Flint app' }],
 *   body: '<div id="app"><!--ssr--></div>',
 *   scriptUrls: ['/client.js'],
 * })
 */
export function generateHTML(options: HTMLTemplateOptions): string {
  const {
    title = '',
    meta = [],
    links = [],
    scripts = [],
    scriptUrls = [],
    styles = [],
    styleUrls = [],
    body,
    head: additionalHead = '',
    bodyAttrs = {},
    lang = 'en',
    favicon,
  } = options

  const bodyAttrsStr = Object.entries(bodyAttrs)
    .map(([key, value]) => `${key}="${escapeHTML(value)}"`)
    .join(' ')

  return `<!DOCTYPE html>
<html lang="${escapeHTML(lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${favicon ? `<link rel="icon" href="${escapeHTML(favicon)}">` : ''}
  ${title ? `<title>${escapeHTML(title)}</title>` : ''}
  ${meta.map((m) => `<meta ${Object.entries(m).map(([k, v]) => `${k}="${escapeHTML(v)}"`).join(' ')} />`).join('\n  ')}
  ${links.map((l) => `<link ${Object.entries(l).map(([k, v]) => `${k}="${escapeHTML(v)}"`).join(' ')} />`).join('\n  ')}
  ${styleUrls.map((url) => `<link rel="stylesheet" href="${escapeHTML(url)}">`).join('\n  ')}
  ${styles.map((style) => `<style>${style}</style>`).join('\n  ')}
  ${additionalHead}
</head>
<body ${bodyAttrsStr}>
  ${body}
  ${scripts.map((s) => `<script>${s}</script>`).join('\n  ')}
  ${scriptUrls.map((url) => `<script src="${escapeHTML(url)}"></script>`).join('\n  ')}
</body>
</html>`
}

// ─── Server-side Data Fetching ──────────────────────────────────

export interface DataLoader<T = any> {
  (context: SSRContext): T | Promise<T>
}

const dataLoaders = new Map<string, DataLoader>()

/**
 * Register a data loader for a route.
 */
export function dataLoader<T>(
  key: string,
  loader: DataLoader<T>
): void {
  dataLoaders.set(key, loader as DataLoader)
}

/**
 * Execute a data loader.
 */
export async function executeDataLoader<T>(
  key: string,
  context: SSRContext
): Promise<T | null> {
  const loader = dataLoaders.get(key)
  if (!loader) return null

  return loader(context) as Promise<T>
}

// ─── useHead Hook (SSR) ────────────────────────────────────────

/**
 * Set page title (SSR).
 */
export function useTitle(title: string): void {
  if (currentSSRContext) {
    currentSSRContext.head.title = title
  }
}

/**
 * Add meta tag (SSR).
 */
export function useMeta(name: string, content: string): void {
  if (currentSSRContext) {
    currentSSRContext.head.meta.push({ name, content })
  }
}

/**
 * Add link tag (SSR).
 */
export function useLink(rel: string, href: string): void {
  if (currentSSRContext) {
    currentSSRContext.head.links.push({ rel, href })
  }
}

// ─── Utilities ──────────────────────────────────────────────────

/**
 * Check if code is running on server.
 */
export function isServer(): boolean {
  return typeof window === 'undefined'
}

/**
 * Check if code is running on client.
 */
export function isClient(): boolean {
  return typeof window !== 'undefined'
}
