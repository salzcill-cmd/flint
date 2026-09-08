// Flint Runtime — Advanced Router (v5)
// Production-ready routing with guards, middleware, and lazy loading

import { state, computed, effect } from '@flint/reactivity'
import type { Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export interface Route {
  path: string
  component?: () => Promise<{ default: any }> | { default: any }
  children?: Route[]
  meta?: Record<string, any>
  name?: string
  redirect?: string | { name: string }
  beforeEnter?: RouteGuard
  afterEnter?: RouteGuard
  alias?: string | string[]
  props?: boolean | Record<string, any> | ((route: RouteParams) => Record<string, any>)
  caseSensitive?: boolean
}

export interface RouteParams {
  [key: string]: string
}

export interface QueryParams {
  [key: string]: string | string[] | undefined
}

export interface Location {
  path: string
  name?: string
  params?: RouteParams
  query?: QueryParams
  hash?: string
  meta?: Record<string, any>
  matched?: RouteMatch[]
}

export interface RouteMatch {
  path: string
  params: RouteParams
  query: QueryParams
  meta: Record<string, any>
  name?: string
}

export type RouteGuard = (
  to: Location,
  from: Location | null,
  next: (to?: string | Location | false) => void
) => void | Promise<void>

export interface RouterOptions {
  routes: Route[]
  base?: string
  mode?: 'hash' | 'history' | 'memory'
  scrollBehavior?: (to: Location, from: Location) => { top?: number; left?: number; behavior?: 'smooth' | 'instant' | 'auto' }
  fallback?: boolean
}

export interface Router {
  current: () => Location
  push: (to: string | Location) => void
  replace: (to: string | Location) => void
  go: (delta: number) => void
  back: () => void
  forward: () => void
  beforeEach: (guard: RouteGuard) => () => void
  afterEach: (guard: (to: Location, from: Location) => void) => () => void
  addRoute: (route: Route) => () => void
  removeRoute: (name: string) => void
  getRoutes: () => Route[]
  resolve: (to: string | Location) => Location
  hasRoute: (name: string) => boolean
  destroy: () => void
}

// ─── Router Implementation ──────────────────────────────────────

let currentRouter: Router | null = null
const routerHistory: Location[] = []
let historyIndex = -1

/**
 * Create a production-ready router with advanced features.
 *
 * @example
 * const router = createAdvancedRouter({
 *   mode: 'history',
 *   routes: [
 *     {
 *       path: '/',
 *       component: () => import('./pages/Home'),
 *       meta: { title: 'Home' },
 *     },
 *     {
 *       path: '/dashboard',
 *       component: () => import('./pages/Dashboard'),
 *       meta: { requiresAuth: true, role: 'admin' },
 *       beforeEnter: (to, from, next) => {
 *         if (!isLoggedIn()) next('/login')
 *         else next()
 *       },
 *     },
 *     {
 *       path: '/users/:id',
 *       component: () => import('./pages/User'),
 *       props: true,
 *     },
 *   ],
 *   scrollBehavior: () => ({ top: 0 }),
 * })
 */
export function createAdvancedRouter(options: RouterOptions): Router {
  const {
    routes,
    base = '/',
    mode = 'history',
    scrollBehavior,
    fallback = true,
  } = options

  const current = state<Location>({
    path: '/',
    query: {},
    params: {},
    meta: {},
    matched: [],
  })

  const beforeEachGuards: RouteGuard[] = []
  const afterEachGuards: Array<(to: Location, from: Location) => void> = []
  const dynamicRoutes: Map<string, Route> = new Map()
  const resolvedComponents = new Map<string, any>()

  // Parse route path to regex
  function pathToRegex(path: string): RegExp {
    const pattern = path
      .replace(/\/:([^/]+)/g, '/(?<$1>[^/]+)')
      .replace(/\*/g, '.*')
    return new RegExp(`^${pattern}$`)
  }

  // Match route
  function matchRoute(route: Route, path: string): RouteParams | null {
    const regex = pathToRegex(route.path)
    const match = path.match(regex)
    if (!match?.groups) return null
    return match.groups
  }

  // Resolve route
  function resolveRoute(path: string): RouteMatch[] {
    const matches: RouteMatch[] = []

    function searchRoutes(routeList: Route[], parentPath: string = '') {
      for (const route of routeList) {
        const fullPath = `${parentPath}${route.path}`.replace(/\/+/g, '/')

        // Check alias
        if (route.alias) {
          const aliases = Array.isArray(route.alias) ? route.alias : [route.alias]
          for (const alias of aliases) {
            const aliasPath = `${parentPath}${alias}`.replace(/\/+/g, '/')
            const params = matchRoute({ ...route, path: aliasPath }, path)
            if (params) {
              matches.push({
                path: fullPath,
                params,
                query: parseQuery(),
                meta: route.meta || {},
                name: route.name,
              })
              return
            }
          }
        }

        const params = matchRoute(route, path)
        if (params) {
          matches.push({
            path: fullPath,
            params,
            query: parseQuery(),
            meta: route.meta || {},
            name: route.name,
          })

          // Search children
          if (route.children) {
            searchRoutes(route.children, fullPath)
          }
          return
        }

        // Search children with parent path
        if (route.children) {
          searchRoutes(route.children, fullPath)
        }
      }
    }

    searchRoutes(routes)
    return matches
  }

  // Parse query params
  function parseQuery(): QueryParams {
    if (typeof window === 'undefined') return {}

    const search = window.location.search
    if (!search) return {}

    const params: QueryParams = {}
    const searchParams = new URLSearchParams(search)

    for (const [key, value] of searchParams.entries()) {
      if (params[key]) {
        const existing = params[key]
        params[key] = Array.isArray(existing) ? [...existing, value] : [existing, value]
      } else {
        params[key] = value
      }
    }

    return params
  }

  // Navigate
  async function navigate(
    to: string | Location,
    replace: boolean = false
  ): Promise<void> {
    const location = typeof to === 'string' ? { path: to } : to
    const fullPath = resolvePath(location.path)
    const matched = resolveRoute(fullPath)

    if (matched.length === 0) {
      console.warn(`[Flint Router] No route matched: ${fullPath}`)
      return
    }

    const from = current()
    const target: Location = {
      ...location,
      path: fullPath,
      matched,
      params: { ...matched[0]?.params },
      query: location.query || matched[0]?.query || {},
      meta: { ...matched[0]?.meta, ...location.meta },
    }

    // Execute before guards
    for (const guard of beforeEachGuards) {
      await new Promise<void>((resolve) => {
        guard(target, from, (result) => {
          if (result === false) {
            resolve()
            return
          }
          if (typeof result === 'string' || (typeof result === 'object' && result.path)) {
            navigate(result, true)
            resolve()
            return
          }
          resolve()
        })
      })
    }

    // Load component
    if (matched[0]) {
      const route = findRoute(matched[0].path)
      if (route?.component) {
        const component = await loadComponent(route.component)
        resolvedComponents.set(fullPath, component)
      }
    }

    // Update URL
    const url = buildUrl(fullPath, target.query)
    if (replace) {
      window.history.replaceState({}, '', url)
    } else {
      window.history.pushState({}, '', url)
      routerHistory.push(from)
      historyIndex++
    }

    // Update current location
    current.set(target)

    // Scroll behavior
    if (scrollBehavior) {
      const scroll = scrollBehavior(target, from)
      if (scroll) {
        window.scrollTo({
          top: scroll.top ?? 0,
          left: scroll.left ?? 0,
          behavior: scroll.behavior ?? 'auto',
        })
      }
    }

    // Execute after guards
    afterEachGuards.forEach(guard => guard(target, from))
  }

  // Find route by path
  function findRoute(path: string): Route | undefined {
    for (const route of routes) {
      if (route.path === path) return route
      if (route.children) {
        const found = findRoute(path)
        if (found) return found
      }
    }
    return undefined
  }

  // Load component
  async function loadComponent(
    component: () => Promise<{ default: any }> | { default: any }
  ): Promise<any> {
    try {
      const result = await component()
      return result.default || result
    } catch (error) {
      console.error('[Flint Router] Failed to load component:', error)
      return null
    }
  }

  // Build URL
  function buildUrl(path: string, query?: QueryParams): string {
    let url = `${base}${path}`.replace(/\/+/g, '/')

    if (query && Object.keys(query).length > 0) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(query)) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v))
        } else if (value !== undefined) {
          params.set(key, value)
        }
      }
      url += `?${params.toString()}`
    }

    return url
  }

  // Resolve path
  function resolvePath(path: string): string {
    if (path.startsWith('/')) return path
    return `${current().path}/${path}`.replace(/\/+/g, '/')
  }

  // Handle popstate
  function handlePopState(): void {
    const path = window.location.pathname
    const query = parseQuery()
    navigate({ path, query }, true)
  }

  // Initialize
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', handlePopState)

    // Initial navigation
    const initialPath = window.location.pathname
    const initialQuery = parseQuery()
    navigate({ path: initialPath, query: initialQuery }, true)
  }

  // Create router object
  const router: Router = {
    current,
    push: (to) => navigate(to, false),
    replace: (to) => navigate(to, true),
    go: (delta) => window.history.go(delta),
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    beforeEach: (guard) => {
      beforeEachGuards.push(guard)
      return () => {
        const index = beforeEachGuards.indexOf(guard)
        if (index > -1) beforeEachGuards.splice(index, 1)
      }
    },
    afterEach: (guard) => {
      afterEachGuards.push(guard)
      return () => {
        const index = afterEachGuards.indexOf(guard)
        if (index > -1) afterEachGuards.splice(index, 1)
      }
    },
    addRoute: (route) => {
      routes.push(route)
      dynamicRoutes.set(route.name || route.path, route)
      return () => {
        const index = routes.indexOf(route)
        if (index > -1) routes.splice(index, 1)
        dynamicRoutes.delete(route.name || route.path)
      }
    },
    removeRoute: (name) => {
      const index = routes.findIndex(r => r.name === name)
      if (index > -1) routes.splice(index, 1)
      dynamicRoutes.delete(name)
    },
    getRoutes: () => [...routes],
    resolve: (to) => {
      const location = typeof to === 'string' ? { path: to } : to
      const fullPath = resolvePath(location.path)
      const matched = resolveRoute(fullPath)
      return {
        ...location,
        path: fullPath,
        matched,
        params: matched[0]?.params || {},
        query: location.query || matched[0]?.query || {},
        meta: { ...matched[0]?.meta, ...location.meta },
      }
    },
    hasRoute: (name) => routes.some(r => r.name === name) || dynamicRoutes.has(name),
    destroy: () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handlePopState)
      }
      beforeEachGuards.length = 0
      afterEachGuards.length = 0
      dynamicRoutes.clear()
      resolvedComponents.clear()
      if (currentRouter === router) {
        currentRouter = null
      }
    },
  }

  currentRouter = router
  return router
}

// ─── Route Guards ───────────────────────────────────────────────

/**
 * Create an authentication guard.
 *
 * @example
 * router.beforeEach(createAuthGuard(isLoggedIn))
 */
export function createAuthGuard(
  isAuthenticated: () => boolean,
  loginPath: string = '/login'
): RouteGuard {
  return (to, from, next) => {
    if (to.meta?.requiresAuth && !isAuthenticated()) {
      next({ path: loginPath, query: { redirect: to.fullPath } })
    } else {
      next()
    }
  }
}

/**
 * Create a role-based guard.
 *
 * @example
 * router.beforeEach(createRoleGuard(getUserRole, { admin: ['/admin'], user: ['/dashboard'] }))
 */
export function createRoleGuard(
  getRole: () => string,
  roleRoutes: Record<string, string[]>
): RouteGuard {
  return (to, from, next) => {
    const role = getRole()
    const allowedRoutes = roleRoutes[role] || []

    if (allowedRoutes.some(route => to.path.startsWith(route))) {
      next()
    } else {
      next(false)
    }
  }
}

/**
 * Create a navigation log guard.
 *
 * @example
 * router.afterEach(createNavigationLogger())
 */
export function createNavigationLogger(): (to: Location, from: Location) => void {
  return (to, from) => {
    console.log(`[Router] ${from.path} → ${to.path}`)
  }
}

// ─── Route Helpers ──────────────────────────────────────────────

/**
 * Create a route with lazy loading.
 *
 * @example
 * const UserRoute = lazyRoute(() => import('./pages/User'))
 */
export function lazyRoute(
  loader: () => Promise<{ default: any }>,
  options?: Partial<Route>
): Route {
  return {
    path: '/',
    component: loader,
    ...options,
  }
}

/**
 * Create a nested route structure.
 *
 * @example
 * const routes = createNestedRoutes({
 *   path: '/dashboard',
 *   component: DashboardLayout,
 *   children: [
 *     { path: '', component: DashboardHome },
 *     { path: 'settings', component: Settings },
 *   ],
 * })
 */
export function createNestedRoutes(route: Route): Route {
  return route
}

// ─── Current Router Getter ──────────────────────────────────────

/**
 * Get the current router instance.
 */
export function getRouter(): Router | null {
  return currentRouter
}

/**
 * Navigate using the current router.
 */
export function navigate(to: string | Location): void {
  if (!currentRouter) {
    console.warn('[Flint Router] No router instance found')
    return
  }
  currentRouter.push(to)
}
