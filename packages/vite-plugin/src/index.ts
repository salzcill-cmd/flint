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
        })

        const result = transform(ast, code, {
          filename: id,
          dev: options.dev ?? process.env.NODE_ENV !== 'production',
        })

        return {
          code: result.code,
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
      // Generic fallback: flint/<module> → @flint/runtime/<module>
      if (id.startsWith('\0flint:')) {
        const moduleName = id.slice(8)
        return `export * from "@flint/runtime/${moduleName}"`
      }
      return null
    },
  }
}
