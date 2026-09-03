// FlintKit — File-based Routing
// Scans routes directory and generates route config

import * as fs from 'fs'
import * as path from 'path'

export interface RouteConfig {
  path: string
  component: string
  loader?: string
  action?: string
  layout?: string
  meta?: Record<string, any>
}

export interface FileRoutesOptions {
  /** Base directory for routes */
  routesDir?: string
  /** File extensions to scan */
  extensions?: string[]
  /** Ignore patterns */
  ignore?: string[]
}

/**
 * Scan filesystem and generate route configurations
 * 
 * Convention:
 * - pages/index.tsx → /
 * - pages/about.tsx → /about
 * - pages/blog/[slug].tsx → /blog/:slug
 * - pages/blog/[...rest].tsx → /blog/* (catch-all)
 * - pages/_layout.tsx → root layout
 * - pages/_error.tsx → error boundary
 * 
 * Loaders (data fetching):
 * - pages/index.loader.ts → loader for /
 * 
 * Actions (form submissions):
 * - pages/index.action.ts → action for /
 */
export function fileRoutes(options: FileRoutesOptions = {}): RouteConfig[] {
  const routesDir = options.routesDir || 'pages'
  const extensions = options.extensions || ['.tsx', '.ts', '.jsx', '.js']
  const ignore = options.ignore || ['node_modules', '.git', 'dist']

  const routes: RouteConfig[] = []
  const resolvedDir = path.resolve(process.cwd(), routesDir)

  if (!fs.existsSync(resolvedDir)) {
    return routes
  }

  function scanDir(dir: string, prefix: string = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      if (ignore.includes(entry.name)) continue

      const fullPath = path.join(dir, entry.name)
      const relativePath = path.relative(resolvedDir, fullPath)

      if (entry.isDirectory()) {
        // Recurse into directories
        scanDir(fullPath, `${prefix}/${entry.name}`)
      } else if (entry.name.startsWith('_')) {
        // Skip special files (_layout, _error, etc.)
        continue
      } else {
        // Check if it's a route file
        const ext = path.extname(entry.name)
        if (!extensions.includes(ext)) continue

        const baseName = path.basename(entry.name, ext)
        const routePath = convertToRoutePath(`${prefix}/${baseName}`)

        const route: RouteConfig = {
          path: routePath,
          component: `./${relativePath}`,
        }

        // Check for loader
        const loaderPath = path.join(dir, `${baseName}.loader${ext}`)
        if (fs.existsSync(loaderPath)) {
          route.loader = `./${path.relative(resolvedDir, loaderPath)}`
        }

        // Check for action
        const actionPath = path.join(dir, `${baseName}.action${ext}`)
        if (fs.existsSync(actionPath)) {
          route.action = `./${path.relative(resolvedDir, actionPath)}`
        }

        routes.push(route)
      }
    }
  }

  scanDir(resolvedDir)
  return routes
}

/**
 * Convert file path to route path
 * - /index → /
 * - /about → /about
 * - /blog/[slug] → /blog/:slug
 * - /blog/[...rest] → /blog/*
 */
function convertToRoutePath(filePath: string): string {
  let routePath = filePath
    .replace(/\/index$/, '/')           // /index → /
    .replace(/\.(tsx?|jsx?|vue)$/, '') // Remove extension
    .replace(/\[(\.\.\.)?([^\]]+)\]/g, (_, catchAll, name) => {
      if (catchAll) {
        return '*' // Catch-all route
      }
      return `:${name}` // Dynamic segment
    })

  // Clean up double slashes
  routePath = routePath.replace(/\/+/g, '/')

  // Ensure it starts with /
  if (!routePath.startsWith('/')) {
    routePath = '/' + routePath
  }

  return routePath
}

/**
 * Generate route module code for Vite
 */
export function generateRouteModule(routes: RouteConfig[]): string {
  const imports: string[] = []
  const routesArray: string[] = []

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i]
    const componentName = `Route${i}`
    const loaderName = route.loader ? `Loader${i}` : null
    const actionName = route.action ? `Action${i}` : null

    // Import component
    imports.push(`import ${componentName} from '${route.component}'`)

    // Import loader if exists
    if (loaderName && route.loader) {
      imports.push(`import { loader as ${loaderName} } from '${route.loader}'`)
    }

    // Import action if exists
    if (actionName && route.action) {
      imports.push(`import { action as ${actionName} } from '${route.action}'`)
    }

    // Build route config
    const routeConfig: string[] = [
      `  {`,
      `    path: ${JSON.stringify(route.path)},`,
      `    component: ${componentName},`,
    ]

    if (loaderName) {
      routeConfig.push(`    loader: ${loaderName},`)
    }
    if (actionName) {
      routeConfig.push(`    action: ${actionName},`)
    }

    routeConfig.push(`  }`)
    routesArray.push(routeConfig.join('\n'))
  }

  return `${imports.join('\n')}

export const routes = [
${routesArray.join(',\n')}
]
`
}
