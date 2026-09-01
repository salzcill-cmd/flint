// Flint Vite Plugin — Enhanced with HMR
// Transforms JSX files and provides HMR support

import type { Plugin, ViteDevServer, HmrContext } from 'vite'
import { parse, transform } from '@flint/compiler'

export interface FlintPluginOptions {
  /** Enable dev mode with extra error info */
  dev?: boolean
  /** File extensions to transform */
  extensions?: string[]
}

export default function flint(options: FlintPluginOptions = {}): Plugin {
  const extensions = options.extensions ?? ['.jsx', '.tsx']
  const moduleGraph = new Map<string, { timestamp: number }>()

  return {
    name: 'flint',

    enforce: 'pre',

    // Transform JSX files
    transform(code: string, id: string) {
      const ext = '.' + id.split('.').pop()?.toLowerCase()
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
        })

        const result = transform(ast, code, {
          filename: id,
          dev: options.dev ?? process.env.NODE_ENV !== 'production',
        })

        // Track module for HMR
        moduleGraph.set(id, { timestamp: Date.now() })

        return {
          code: result.code,
          map: null,
        }
      } catch (err) {
        this.error(
          `[Flint] Error transforming ${id}: ${err instanceof Error ? err.message : String(err)}`
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

      // Return the modules to update
      return ctx.modules
    },

    // Configure dev server
    configureServer(server: ViteDevServer) {
      server.middlewares.use((_req, _res, next) => {
        next()
      })
    },

    // Resolve 'flint' imports to @flint/runtime
    resolveId(id) {
      if (id === 'flint' || id === 'flint/') {
        return '\0flint:runtime'
      }
      return undefined
    },

    load(id) {
      if (id === '\0flint:runtime') {
        return `export { h, render, state, computed, effect, watch, batch, component, ref, createStore, initHMR, onMount, onUpdate, onDestroy } from '@flint/runtime'`
      }
      return undefined
    },
  }
}
