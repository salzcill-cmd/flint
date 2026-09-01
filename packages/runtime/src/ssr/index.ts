// Flint Runtime — Server-Side Rendering
// Render components to HTML strings, streaming, and hydration

import { state, computed } from '@flint/reactivity'
import type { Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export type SSRComponent = (props?: any) => any

export interface SSRContext {
  components: Map<string, SSRComponent>
  hydrationData: Record<string, any>
  head: {
    title: string
    meta: Record<string, string>[]
    links: Record<string, string>[]
    scripts: Record<string, string>[]
  }
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
}

export interface RenderToStreamOptions extends RenderToStringOptions {
  /** Called when shell is ready */
  onShellReady?: (html: string) => void
  /** Called when all content is ready */
  onAllReady?: (html: string) => void
  /** Called on error */
  onError?: (error: Error) => void
}

export interface SSRResult {
  html: string
  context: SSRContext
  /** Scripts to load */
  scripts: string[]
  /** Styles to load */
  styles: string[]
}

export interface StreamResult {
  pipe: (writable: WritableStream<Uint8Array>) => void
  /** Promise that resolves when streaming is complete */
  ready: Promise<void>
}

// ─── SSR Context ────────────────────────────────────────────────

let currentSSRContext: SSRContext | null = null

export function getSSRContext(): SSRContext | null {
  return currentSSRContext
}

function createContext(): SSRContext {
  return {
    components: new Map(),
    hydrationData: {},
    head: {
      title: '',
      meta: [],
      links: [],
      scripts: [],
    },
  }
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
 * const html = renderToString({
 *   component: App,
 *   props: { name: 'World' },
 *   url: '/about',
 * })
 *
 * // Returns: { html: '<div>Hello World</div>', context: {...} }
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
  } = options

  const context = createContext()
  currentSSRContext = context

  try {
    // Render component
    const html = await renderNode(component, props, hydrate, context)

    // Generate hydration script
    const scripts: string[] = []
    if (hydrate) {
      scripts.push(
        `<script>window.__FLINT_HYDRATION__ = ${JSON.stringify(context.hydrationData)};</script>`
      )
    }

    // Collect head elements
    const styles: string[] = []
    if (collectHead && context.head.title) {
      scripts.unshift(`<title>${escapeHTML(context.head.title)}</title>`)
    }

    return {
      html,
      context,
      scripts,
      styles,
    }
  } finally {
    currentSSRContext = null
  }
}

/**
 * Render a component tree to HTML string.
 */
async function renderNode(
  component: SSRComponent | string,
  props: Record<string, any>,
  hydrate: boolean,
  context: SSRContext
): Promise<string> {
  // String component (text node)
  if (typeof component === 'string') {
    return escapeHTML(component)
  }

  // Function component
  if (typeof component === 'function') {
    // Generate hydration ID
    const hydrationId = hydrate ? `flint-${Math.random().toString(36).slice(2, 9)}` : undefined

    // Add to context
    if (hydrationId) {
      context.components.set(hydrationId, component)
      context.hydrationData[hydrationId] = props
    }

    // Call component
    const result = component(props)

    // Handle async components
    const content = result instanceof Promise ? await result : result

    // Render children
    if (content == null) {
      return ''
    }

    if (typeof content === 'string' || typeof content === 'number') {
      return escapeHTML(String(content))
    }

    if (Array.isArray(content)) {
      const children = await Promise.all(
        content.map((child) => renderNode(child, {}, hydrate, context))
      )
      return children.join('')
    }

    // Render element
    return renderElement(content, hydrate, context)
  }

  return ''
}

/**
 * Render a virtual DOM element to HTML string.
 */
async function renderElement(
  element: any,
  hydrate: boolean,
  context: SSRContext
): Promise<string> {
  if (!element || typeof element !== 'object') {
    return ''
  }

  const { tag, props, children } = element

  if (!tag) {
    return ''
  }

  // Build attributes
  const attrs = Object.entries(props || {})
    .map(([key, value]) => {
      if (key === 'children' || key === 'key' || key === 'ref') {
        return ''
      }
      if (value === true) {
        return key
      }
      if (value == null || value === false) {
        return ''
      }
      return `${key}="${escapeHTML(String(value))}"`
    })
    .filter(Boolean)
    .join(' ')

  // Render children
  let childrenHtml = ''
  if (children) {
    if (Array.isArray(children)) {
      const childResults = await Promise.all(
        children.map((child: any) => renderNode(child, {}, hydrate, context))
      )
      childrenHtml = childResults.join('')
    } else {
      childrenHtml = await renderNode(children, {}, hydrate, context)
    }
  }

  // Add hydration marker
  const hydrationAttr = hydrate ? ` data-flint-hydration` : ''

  // Self-closing tags
  const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link']
  if (selfClosing.includes(tag)) {
    return `<${tag} ${attrs}${hydrationAttr} />`
  }

  return `<${tag} ${attrs}${hydrationAttr}>${childrenHtml}</${tag}>`
}

// ─── renderToPipeableStream (Streaming SSR) ─────────────────────

/**
 * Render a component to a stream (for streaming SSR).
 *
 * @example
 * import { renderToPipeableStream } from 'flint/ssr'
 *
 * const stream = renderToPipeableStream({
 *   component: App,
 *   props: {},
 *   onShellReady(html) {
 *     // Send initial shell
 *     response.write(html)
 *   },
 *   onAllReady(html) {
 *     // Streaming complete
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
  } = options

  const context = createContext()
  currentSSRContext = context

  let shellHtml = ''
  let resolveReady: () => void
  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve
  })

  // Async rendering
  const render = async () => {
    try {
      const html = await renderNode(component, props, hydrate, context)
      shellHtml = html

      // Add hydration script
      const hydrationScript = hydrate
        ? `<script>window.__FLINT_HYDRATION__ = ${JSON.stringify(context.hydrationData)};</script>`
        : ''

      shellHtml = hydrationScript + shellHtml

      // Callbacks
      if (onShellReady) {
        onShellReady(shellHtml)
      }

      if (onAllReady) {
        onAllReady(shellHtml)
      }

      resolveReady()
    } catch (error) {
      if (onError) {
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
        writer.write(encoder.encode(shellHtml))
        writer.close()
      })
    },
    ready,
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
}

/**
 * Hydrate server-rendered HTML on the client.
 *
 * @example
 * import { hydrate } from 'flint/ssr'
 *
 * hydrate({
 *   root: document.getElementById('app')!,
 *   component: App,
 * })
 */
export async function hydrate(options: HydrationOptions): Promise<void> {
  const { root, component, props = {} } = options

  // Get hydration data
  const hydrationData = (window as any).__FLINT_HYDRATION__ || {}

  // Mark element as hydrated
  root.setAttribute('data-flint-hydrated', 'true')

  // Clean up hydration data
  delete (window as any).__FLINT_HYDRATION__

  // In a real implementation, we would:
  // 1. Walk the existing DOM
  // 2. Attach event listeners
  // 3. Set up reactive bindings
  // 4. Sync state from server

  console.log('[Flint] Hydrated component with data:', Object.keys(hydrationData))
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
  } = options

  const bodyAttrsStr = Object.entries(bodyAttrs)
    .map(([key, value]) => `${key}="${escapeHTML(value)}"`)
    .join(' ')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
 *
 * @example
 * import { dataLoader } from 'flint/ssr'
 *
 * dataLoader('user', async (ctx) => {
 *   const user = await fetchUser(ctx.params.id)
 *   return { user }
 * })
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
