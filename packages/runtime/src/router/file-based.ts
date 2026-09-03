// Flint Router v3 — File-based Routing
// Auto-generate routes from file system structure

import type { Route, RouteGuard } from './index.js'

// ─── Types ──────────────────────────────────────────────────────

export interface FileRouteConfig {
  /** Base directory for routes */
  baseDir?: string
  /** File extension to look for */
  extensions?: string[]
  /** Ignore patterns */
  ignore?: string[]
  /** Layout file name */
  layoutFile?: string
  /** Error file name */
  errorFile?: string
  /** Loading file name */
  loadingFile?: string
}

export interface FileRoute {
  /** Route path */
  path: string
  /** File path */
  filePath: string
  /** Route name */
  name: string
  /** Is dynamic route */
  isDynamic: boolean
  /** Is catch-all route */
  isCatchAll: boolean
  /** Dynamic segments */
  segments: string[]
}

// ─── File Route Generator ───────────────────────────────────────

export function generateRoutesFromFiles(
  files: string[],
  config: FileRouteConfig = {}
): FileRoute[] {
  const {
    baseDir = 'src/routes',
    extensions = ['.tsx', '.jsx', '.ts', '.js'],
    ignore = ['_', '.'],
  } = config

  const routes: FileRoute[] = []

  for (const file of files) {
    // Skip non-route files
    if (!extensions.some((ext) => file.endsWith(ext))) continue
    if (ignore.some((pattern) => file.includes(pattern))) continue

    // Extract route path from file path
    let routePath = file
      .replace(baseDir, '')
      .replace(/\.(tsx|jsx|ts|js)$/, '')
      .replace(/index$/, '')
      .replace(/\[/g, ':')
      .replace(/\]/g, '')

    // Handle dynamic routes
    const isDynamic = routePath.includes(':')
    const isCatchAll = routePath.includes('...')

    if (isCatchAll) {
      routePath = routePath.replace('/[...', '/*')
    }

    // Ensure leading slash
    if (!routePath.startsWith('/')) {
      routePath = '/' + routePath
    }

    // Generate route name
    const name = routePath
      .replace(/^\//, '')
      .replace(/\//g, '-')
      .replace(/:/g, '')
      || 'index'

    // Extract segments
    const segments = routePath
      .split('/')
      .filter(Boolean)
      .map((s) => s.replace(':', ''))

    routes.push({
      path: routePath,
      filePath: file,
      name,
      isDynamic,
      isCatchAll,
      segments,
    })
  }

  return routes
}

// ─── Route Tree Builder ─────────────────────────────────────────

export function buildRouteTree(fileRoutes: FileRoute[]): Route[] {
  const routes: Route[] = []
  const routeMap = new Map<string, Route>()

  // Sort routes by specificity
  const sorted = [...fileRoutes].sort((a, b) => {
    // Static routes first
    if (a.isDynamic !== b.isDynamic) return a.isDynamic ? 1 : -1
    // Less segments first
    return a.segments.length - b.segments.length
  })

  for (const fileRoute of sorted) {
    const route: Route = {
      path: fileRoute.path,
      name: fileRoute.name,
      meta: {
        filePath: fileRoute.filePath,
        isDynamic: fileRoute.isDynamic,
        isCatchAll: fileRoute.isCatchAll,
      },
    }

    routeMap.set(fileRoute.path, route)
    routes.push(route)
  }

  return routes
}

// ─── Route Path Patterns ────────────────────────────────────────

export const ROUTE_PATTERNS = {
  /** Static route: /about */
  static: /^\/[a-z0-9-]+$/i,

  /** Dynamic route: /users/:id */
  dynamic: /^\/:[a-z0-9-]+$/i,

  /** Catch-all: /files/* */
  catchAll: /^\/\*$/,

  /** Optional param: /users/:id? */
  optional: /^\/:[a-z0-9-]+\?$/i,
}

// ─── Path Utilities ─────────────────────────────────────────────

/**
 * Convert file path to route path
 */
export function filePathToRoutePath(filePath: string): string {
  return filePath
    .replace(/\.(tsx|jsx|ts|js)$/, '')
    .replace(/\/index$/, '/')
    .replace(/\[/g, ':')
    .replace(/\]/g, '')
}

/**
 * Convert route path to file path
 */
export function routePathToFilePath(routePath: string, extension = '.tsx'): string {
  return routePath
    .replace(/:([a-z0-9-]+)/gi, '[$1]')
    .replace(/\*$/, '[...]')
    .replace(/\/$/, '/index')
    + extension
}

/**
 * Check if route is dynamic
 */
export function isDynamicRoute(path: string): boolean {
  return path.includes(':') || path.includes('*')
}

/**
 * Extract dynamic segments from route
 */
export function extractSegments(path: string): string[] {
  return path
    .split('/')
    .filter(Boolean)
    .filter((s) => s.startsWith(':') || s === '*')
    .map((s) => s.replace(':', '').replace('*', '...'))
}

// ─── Layout Detection ───────────────────────────────────────────

export interface LayoutRoute {
  path: string
  component: () => any
  children: Route[]
}

export function detectLayouts(
  fileRoutes: FileRoute[],
  layouts: Map<string, () => any>
): LayoutRoute[] {
  const layoutRoutes: LayoutRoute[] = []
  const layoutMap = new Map<string, FileRoute[]>()

  // Group routes by layout
  for (const route of fileRoutes) {
    const layoutPath = getLayoutPath(route.path)
    if (!layoutMap.has(layoutPath)) {
      layoutMap.set(layoutPath, [])
    }
    layoutMap.get(layoutPath)!.push(route)
  }

  // Create layout routes
  for (const [layoutPath, routes] of layoutMap) {
    const component = layouts.get(layoutPath)
    if (component) {
      layoutRoutes.push({
        path: layoutPath,
        component,
        children: routes.map((r) => ({
          path: r.path,
          name: r.name,
        })),
      })
    }
  }

  return layoutRoutes
}

function getLayoutPath(routePath: string): string {
  const parts = routePath.split('/').filter(Boolean)
  parts.pop()
  return '/' + parts.join('/')
}

// ─── File-based Router Config ───────────────────────────────────

export interface FileRouterOptions extends FileRouteConfig {
  /** Import function for route files */
  importFn?: (filePath: string) => Promise<{ default: () => any }>
  /** Custom route generation */
  generateRoutes?: (files: string[]) => Route[]
}

/**
 * Create routes from file system
 */
export async function createFileRoutes(
  files: string[],
  options: FileRouterOptions = {}
): Promise<Route[]> {
  const fileRoutes = generateRoutesFromFiles(files, options)

  if (options.generateRoutes) {
    return options.generateRoutes(files)
  }

  return buildRouteTree(fileRoutes)
}
