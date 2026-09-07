// Flint Vite Plugin v4 — Enhanced with auto-imports and better DX

import type { Plugin, ViteDevServer, HmrContext } from 'vite'
import { parse, transform } from '@flint/compiler'

export interface FlintPluginOptions {
  /** Enable dev mode with extra error info */
  dev?: boolean
  /** File extensions to transform */
  extensions?: string[]
  /** Auto-import flint symbols (default: true) */
  autoImport?: boolean
  /** Enable React-compatible mode (allows React imports) */
  reactCompat?: boolean
}

/**
 * Auto-import flint symbols without explicit import statements.
 * The compiler detects used symbols and adds imports automatically.
 */
const FLINT_AUTO_IMPORTS = {
  'flint': [
    'state', 'computed', 'effect', 'watch', 'batch', 'flushSync',
    'reactive', 'model', 'bind', 'createRef', 'shallowRef', 'derive',
    'signals', 'poll', 'watchDebounced', 'watchThrottled',
    'Show', 'When', 'For', 'ForEach', 'Index', 'Switch', 'Match',
    'Portal', 'Suspense', 'ErrorBoundary', 'Activity', 'KeepAlive',
    'memo', 'lazy', 'createMemo', 'createEffect',
    'ref', 'useSignal', 'cn', 'createStyles', 'cx',
    'onMount', 'onUpdate', 'onDestroy',
    'render', 'h', 'track', 'trackAttribute', 'trackEvent',
    'createRouter', 'navigate', 'Link', 'Outlet',
    'createForm', 'validators',
    'useTransition', 'useDeferredValue', 'useId',
    'useOptimistic', 'useOptimisticAction',
    'useEffectEvent', 'useEffectEventDebounced', 'useEffectEventThrottled',
    'useFocusTrap', 'useKeyboard', 'useAriaLive', 'useReducedMotion',
    'useSEO', 'useStructuredData',
    'preload', 'preinit', 'prefetchDNS', 'preconnect',
    'escapeHtml', 'sanitizeInput', 'safeUrl',
    'createServerAction', 'createServerComponent',
  ],
  'flint/store': [
    'create', 'createStore', 'logger', 'persist', 'devtools', 'immer',
    'createSelector', 'useStore',
  ],
}

export default function flint(options: FlintPluginOptions = {}): Plugin {
  const extensions = options.extensions ?? ['.jsx', '.tsx']
  const isDev = options.dev ?? process.env.NODE_ENV !== 'production'
  const autoImport = options.autoImport ?? true

  return {
    name: 'flint',

    enforce: 'pre',

    // Transform JSX files
    transform(code: string, id: string) {
      const cleanId = id.split('?')[0]
      const ext = '.' + cleanId.split('.').pop()?.toLowerCase()
      if (!extensions.includes(ext)) {
        return undefined
      }

      // Skip node_modules
      if (id.includes('node_modules')) {
        return undefined
      }

      try {
        const { ast } = parse(code, {
          sourceType: 'module',
          filename: cleanId,
        })

        const result = transform(ast, code, {
          filename: id,
          dev: isDev,
          autoImport,
        })

        let finalCode = result.code

        // Dev-only: auto-wire HMR
        if (isDev) {
          finalCode =
            `import { __flintHMR__ } from 'flint'\n` +
            `__flintHMR__(import.meta.hot, ${JSON.stringify(cleanId)})\n` +
            finalCode
        }

        return {
          code: finalCode,
          map: result.map ? {
            version: result.map.version ?? 3,
            file: result.map.file ?? id,
            sources: result.map.sources ?? [],
            sourcesContent: (result.map.sourcesContent ?? []).map(s => s ?? '') as string[],
            names: result.map.names ?? [],
            mappings: result.map.mappings ?? '',
          } : null,
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        this.error(
          `[Flint] Error transforming ${id}: ${message}\n` +
          `💡 Check the syntax near the reported position — every JSX tag must be closed, ` +
          `and braces/parentheses must balance.`
        )
      }
    },

    // Handle HMR updates
    handleHotUpdate(ctx: HmrContext) {
      const { file, server } = ctx
      const ext = '.' + file.split('.').pop()?.toLowerCase()

      if (!extensions.includes(ext)) {
        return undefined
      }

      // Send custom HMR event
      server.ws.send({
        type: 'custom',
        event: 'flint:update',
        data: {
          type: 'update',
          moduleId: file,
          acceptedBy: file,
          timestamp: Date.now(),
        },
      })

      return ctx.modules
    },

    // Configure dev server
    configureServer(server: ViteDevServer) {
      server.middlewares.use((_req, _res, next) => {
        next()
      })
    },

    // Resolve 'flint' imports
    resolveId(id) {
      if (id === 'flint') {
        return '\0flint:runtime'
      }
      if (id === 'flint/store') {
        return '\0flint:store'
      }
      if (id === 'flint/router') {
        return '\0flint:router'
      }
      if (id === 'flint/ssr') {
        return '\0flint:ssr'
      }
      if (id === 'flint/testing') {
        return '\0flint:testing'
      }
      if (id.startsWith('flint/')) {
        return '\0flint:' + id.slice(6)
      }
      return null
    },

    load(id) {
      if (id === '\0flint:runtime') {
        return 'export * from "@flint/runtime"'
      }
      if (id === '\0flint:store') {
        return 'export * from "@flint/store"'
      }
      if (id === '\0flint:router') {
        return 'export * from "@flint/runtime/router"'
      }
      if (id === '\0flint:ssr') {
        return 'export * from "@flint/runtime/ssr"'
      }
      if (id === '\0flint:testing') {
        return 'export * from "@flint/runtime/testing"'
      }
      if (id.startsWith('\0flint:')) {
        const moduleName = id.slice(8)
        return `export * from "@flint/runtime/${moduleName}"`
      }
      return null
    },
  }
}
