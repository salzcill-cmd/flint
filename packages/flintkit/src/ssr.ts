// FlintKit — SSR Handler
// Server-side rendering with streaming support

import { renderToString } from '@flint/runtime'
import type { RouteConfig } from './router'

export interface SSRHandlerOptions {
  /** Enable streaming SSR */
  streaming?: boolean
  /** Enable hydration */
  hydrate?: boolean
  /** Custom error handler */
  onError?: (error: Error, url: string) => string
  /** Custom 404 handler */
  onNotFound?: (url: string) => string
}

export interface SSRResult {
  html: string
  head: string
  scripts: string
  status: number
}

/**
 * Create SSR handler for handling requests
 */
export function createSSRHandler(
  routes: RouteConfig[],
  options: SSRHandlerOptions = {}
) {
  const {
    streaming = true,
    hydrate = true,
    onError,
    onNotFound,
  } = options

  return async (url: string): Promise<SSRResult> => {
    try {
      // Find matching route
      const route = matchRoute(routes, url)

      if (!route) {
        return {
          html: onNotFound ? onNotFound(url) : '<h1>404 Not Found</h1>',
          head: '',
          scripts: '',
          status: 404,
        }
      }

      // Import component
      const componentModule = await import(route.component)
      const Component = componentModule.default

      // Run loader if exists
      let loaderData = {}
      if (route.loader) {
        const loaderModule = await import(route.loader)
        loaderData = await loaderModule.loader({ url, params: route.params })
      }

      // Render component to string
      const result = await renderToString({
        // @ts-ignore - Component is a function
        component: Component,
        props: {
          ...loaderData,
          params: route.params,
        },
        url,
      })
      const html = result.html

      // Generate hydration script
      const hydrationScript = hydrate
        ? `<script>window.__FLINT_DATA__ = ${JSON.stringify({ loaderData, url, params: route.params })}</script>`
        : ''

      // Generate route prefetch
      const prefetchScript = streaming
        ? `<script>window.__FLINT_ROUTES__ = ${JSON.stringify(routes.map(r => r.path))}</script>`
        : ''

      return {
        html,
        head: `<link rel="preload" href="/@flint/runtime" as="script">`,
        scripts: hydrationScript + prefetchScript,
        status: 200,
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      if (onError) {
        return {
          html: onError(err, url),
          head: '',
          scripts: '',
          status: 500,
        }
      }

      return {
        html: `<h1>Internal Server Error</h1><pre>${err.message}</pre>`,
        head: '',
        scripts: '',
        status: 500,
      }
    }
  }
}

/**
 * Match a route pattern against a URL
 */
function matchRoute(
  routes: RouteConfig[],
  url: string
): (RouteConfig & { params: Record<string, string> }) | null {
  const urlPath = new URL(url, 'http://localhost').pathname

  for (const route of routes) {
    const params = matchParams(route.path, urlPath)
    if (params !== null) {
      return { ...route, params }
    }
  }

  return null
}

/**
 * Match route params
 */
function matchParams(
  pattern: string,
  path: string
): Record<string, string> | null {
  const patternParts = pattern.split('/')
  const pathParts = path.split('/')

  if (pattern === '*') {
    return { '*': path }
  }

  if (patternParts.length !== pathParts.length) {
    return null
  }

  const params: Record<string, string> = {}

  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i]

    if (part.startsWith(':')) {
      // Dynamic segment
      params[part.slice(1)] = pathParts[i]
    } else if (part === '*') {
      // Catch-all
      params['*'] = pathParts.slice(i).join('/')
      return params
    } else if (part !== pathParts[i]) {
      return null
    }
  }

  return params
}

/**
 * Generate full HTML page with SSR content
 */
export function generateHTML(
  result: SSRResult,
  options: {
    title?: string
    meta?: Record<string, string>
    styles?: string[]
    scripts?: string[]
  } = {}
): string {
  const metaTags = options.meta
    ? Object.entries(options.meta)
        .map(([key, value]) => `<meta name="${key}" content="${value}">`)
        .join('\n    ')
    : ''

  const styleTags = options.styles
    ? options.styles.map(s => `<link rel="stylesheet" href="${s}">`).join('\n    ')
    : ''

  const scriptTags = options.scripts
    ? options.scripts.map(s => `<script src="${s}"></script>`).join('\n    ')
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title || 'FlintKit App'}</title>
  ${metaTags}
  ${styleTags}
  ${result.head}
</head>
<body>
  <div id="app">${result.html}</div>
  ${result.scripts}
  ${scriptTags}
</body>
</html>`
}
