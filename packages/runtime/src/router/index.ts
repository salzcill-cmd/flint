// Flint Runtime — Router v3
// Enhanced router with lazy loading, guards, middleware, and navigation events

import { state, computed, effect } from '@flint/reactivity'
import type { Signal, Computed } from '@flint/reactivity'
import { h } from '../renderer/index.js'
import type { Child } from '../renderer/index.js'

// ─── Types ──────────────────────────────────────────────────────

export interface Route {
  path: string
  component?: () => Child | Promise<Child>
  children?: Route[]
  guard?: RouteGuard
  name?: string
  meta?: Record<string, any>
  /** Lazy load component */
  lazy?: () => Promise<{ default: () => Child }>
}

export interface RouteParams {
  [key: string]: string
}

export interface QueryParams {
  [key: string]: string
}

export interface Location {
  pathname: string
  search: string
  hash: string
  query: QueryParams
  params: RouteParams
}

export interface NavigateOptions {
  replace?: boolean
  state?: any
  /** Scroll to top after navigation */
  scrollToTop?: boolean
  /** Custom scroll behavior */
  scrollBehavior?: ScrollBehavior
}

export type RouteGuard = (to: Location, from: Location | null) => boolean | Promise<boolean> | string | Promise<string>

export type NavigationMiddleware = {
  beforeEnter?: (to: Location, from: Location | null) => boolean | Promise<boolean> | void
  afterEnter?: (to: Location, from: Location | null) => void
  beforeLeave?: (to: Location, from: Location | null) => boolean | Promise<boolean> | void
  afterLeave?: (to: Location, from: Location | null) => void
}

export interface ScrollPosition {
  x: number
  y: number
}

export interface RouterOptions {
  /** Enable scroll restoration */
  scrollRestoration?: boolean
  /** Default scroll behavior */
  scrollBehavior?: ScrollBehavior
  /** Base path */
  basePath?: string
  /** Global navigation middleware */
  middleware?: NavigationMiddleware[]
  /** Not found route */
  notFound?: Route
}

export interface RouteMatch {
  route: Route
  params: RouteParams
  path: string
}

export interface NavigationEvent {
  type: 'beforeEnter' | 'afterEnter' | 'beforeLeave' | 'afterLeave'
  to: Location
  from: Location | null
  preventDefault?: () => void
}

// ─── Route Pattern Matching ─────────────────────────────────────

function extractParams(pattern: string, path: string): RouteParams | null {
  const paramNames: string[] = []
  const regexStr = pattern
    .replace(/\//g, '\\/')
    .replace(/:([a-zA-Z_]+)/g, (_, name) => {
      paramNames.push(name)
      return '([^/]+)'
    })
    .replace(/\*/g, '(.*)')

  const regex = new RegExp(`^${regexStr}$`)
  const match = path.match(regex)

  if (!match) return null

  const params: RouteParams = {}
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1]
  })

  return params
}

function matchRoute(path: string, routes: Route[]): RouteMatch | null {
  for (const route of routes) {
    const params = extractParams(route.path, path)
    if (params !== null) {
      return { route, params, path: route.path }
    }

    if (route.children) {
      for (const child of route.children) {
        const childPath = `${route.path}/${child.path}`.replace(/\/+/g, '/')
        const childParams = extractParams(childPath, path)
        if (childParams !== null) {
          return { route: child, params: childParams, path: childPath }
        }
      }
    }
  }

  return null
}

// ─── Query String Parsing ───────────────────────────────────────

function parseQuery(search: string): QueryParams {
  const params: QueryParams = {}
  if (!search) return params

  const queryString = search.startsWith('?') ? search.slice(1) : search
  const pairs = queryString.split('&')

  for (const pair of pairs) {
    const [key, value] = pair.split('=').map(decodeURIComponent)
    if (key) {
      params[key] = value ?? ''
    }
  }

  return params
}

// ─── Scroll Restoration ─────────────────────────────────────────

const scrollPositions = new Map<string, ScrollPosition>()

function saveScrollPosition(pathname: string): void {
  scrollPositions.set(pathname, {
    x: window.scrollX,
    y: window.scrollY,
  })
}

function restoreScrollPosition(pathname: string): ScrollPosition | null {
  return scrollPositions.get(pathname) ?? null
}

// ─── Router Singleton ───────────────────────────────────────────

let routerInstance: Router | null = null

// ─── Router Class ───────────────────────────────────────────────

export class Router {
  private routes: Route[] = []
  private _location!: ReturnType<typeof state<Location>>
  private _isNavigating!: ReturnType<typeof state<boolean>>
  private _popstateHandler: (() => void) | null = null
  private _scrollRestoration!: boolean
  private _scrollBehavior!: ScrollBehavior
  private _basePath!: string
  private _middleware: NavigationMiddleware[] = []
  private _listeners: Set<(event: NavigationEvent) => void> = new Set()
  private _notFoundRoute?: Route
  private _componentCache = new Map<string, Child>()

  constructor(options: RouterOptions = {}) {
    if (routerInstance) {
      return routerInstance
    }

    this._scrollRestoration = options.scrollRestoration ?? true
    this._scrollBehavior = options.scrollBehavior ?? 'smooth'
    this._basePath = options.basePath ?? ''
    this._middleware = options.middleware ?? []
    this._notFoundRoute = options.notFound

    const initialLocation = this.getLocationFromBrowser()
    this._location = state<Location>(initialLocation)
    this._isNavigating = state(false)

    routerInstance = this
  }

  // ─── Computed State ──────────────────────────────────────────

  get location(): Computed<Location> {
    return computed(() => this._location())
  }

  get params(): Computed<RouteParams> {
    return computed(() => this._location().params)
  }

  get query(): Computed<QueryParams> {
    return computed(() => this._location().query)
  }

  get pathname(): Computed<string> {
    return computed(() => this._location().pathname)
  }

  get isNavigating(): Computed<boolean> {
    return computed(() => this._isNavigating())
  }

  // ─── Setup ──────────────────────────────────────────────────

  register(routes: Route[]): this {
    this.routes = routes
    return this
  }

  addMiddleware(middleware: NavigationMiddleware): this {
    this._middleware.push(middleware)
    return this
  }

  removeMiddleware(middleware: NavigationMiddleware): this {
    const idx = this._middleware.indexOf(middleware)
    if (idx !== -1) this._middleware.splice(idx, 1)
    return this
  }

  on(listener: (event: NavigationEvent) => void): () => void {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }

  private emit(event: NavigationEvent): void {
    for (const listener of this._listeners) {
      try {
        listener(event)
      } catch (e) {
        console.error('[Flint Router] Navigation listener error:', e)
      }
    }
  }

  start(): void {
    if (this._popstateHandler) return

    this._popstateHandler = () => {
      // Save scroll position before navigating
      if (this._scrollRestoration) {
        saveScrollPosition(this._location().pathname)
      }

      const location = this.getLocationFromBrowser()
      this._location.set(location)

      // Restore scroll position
      if (this._scrollRestoration) {
        this.scrollToSavedPosition(location.pathname)
      }
    }

    window.addEventListener('popstate', this._popstateHandler)
    this.resolve()
  }

  stop(): void {
    if (this._popstateHandler) {
      window.removeEventListener('popstate', this._popstateHandler)
      this._popstateHandler = null
    }
  }

  // ─── Navigation ─────────────────────────────────────────────

  async navigate(path: string, options: NavigateOptions = {}): Promise<void> {
    const { replace = false, scrollToTop = true } = options

    const match = matchRoute(path, this.routes)
    const currentLocation = this._location()
    const toLocation = this.createLocation(path)

    // Handle 404
    if (!match) {
      if (this._notFoundRoute) {
        // Use not found route
        const notFoundMatch: RouteMatch = {
          route: this._notFoundRoute,
          params: {},
          path: this._notFoundRoute.path,
        }
        return this.performNavigation(notFoundMatch, currentLocation, toLocation, replace, scrollToTop)
      }
      console.warn(`[Flint Router] No route matched: ${path}`)
      return
    }

    return this.performNavigation(match, currentLocation, toLocation, replace, scrollToTop)
  }

  private async performNavigation(
    match: RouteMatch,
    fromLocation: Location,
    toLocation: Location,
    replace: boolean,
    scrollToTop: boolean
  ): Promise<void> {
    // Run global middleware beforeLeave
    for (const mw of this._middleware) {
      if (mw.beforeLeave) {
        const result = await mw.beforeLeave(toLocation, fromLocation)
        if (result === false) return
      }
    }

    // Run route guard
    if (match.route.guard) {
      this._isNavigating.set(true)
      try {
        const canProceed = await match.route.guard(toLocation, fromLocation)
        if (canProceed !== true) {
          if (typeof canProceed === 'string') {
            return this.navigate(canProceed)
          }
          return
        }
      } finally {
        this._isNavigating.set(false)
      }
    }

    // Run global middleware beforeEnter
    for (const mw of this._middleware) {
      if (mw.beforeEnter) {
        const result = await mw.beforeEnter(toLocation, fromLocation)
        if (result === false) return
      }
    }

    // Emit beforeLeave event
    this.emit({ type: 'beforeLeave', to: toLocation, from: fromLocation })

    // Save scroll position
    if (this._scrollRestoration) {
      saveScrollPosition(fromLocation.pathname)
    }

    // Update browser history
    if (replace) {
      window.history.replaceState(null, '', toLocation.pathname + toLocation.search)
    } else {
      window.history.pushState(null, '', toLocation.pathname + toLocation.search)
    }

    // Update state with matched params
    const locationWithParams: Location = {
      ...toLocation,
      params: match.params,
    }
    this._location.set(locationWithParams)

    // Run global middleware afterEnter
    for (const mw of this._middleware) {
      if (mw.afterEnter) {
        mw.afterEnter(toLocation, fromLocation)
      }
    }

    // Emit afterEnter event
    this.emit({ type: 'afterEnter', to: toLocation, from: fromLocation })

    // Scroll behavior
    if (scrollToTop) {
      this.scrollToTop()
    }
  }

  async replace(path: string): Promise<void> {
    return this.navigate(path, { replace: true })
  }

  back(): void {
    window.history.back()
  }

  forward(): void {
    window.history.forward()
  }

  go(delta: number): void {
    window.history.go(delta)
  }

  // ─── Scroll Management ─────────────────────────────────────

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: this._scrollBehavior,
    })
  }

  scrollTo(position: ScrollPosition): void {
    window.scrollTo({
      top: position.y,
      left: position.x,
      behavior: this._scrollBehavior,
    })
  }

  private scrollToSavedPosition(pathname: string): void {
    const position = restoreScrollPosition(pathname)
    if (position) {
      setTimeout(() => {
        this.scrollTo(position)
      }, 0)
    }
  }

  // ─── Route Resolution ───────────────────────────────────────

  resolve(): RouteMatch | null {
    const location = this._location()
    return matchRoute(location.pathname, this.routes)
  }

  getCurrentRoute(): Route | null {
    const match = this.resolve()
    return match?.route ?? null
  }

  // ─── Lazy Loading ─────────────────────────────────────────

  async loadComponent(route: Route): Promise<Child> {
    const cacheKey = route.path
    if (this._componentCache.has(cacheKey)) {
      return this._componentCache.get(cacheKey)!
    }

    let component: Child | undefined

    if (route.lazy) {
      const module = await route.lazy()
      component = module.default()
    } else if (route.component) {
      const result = route.component()
      component = result instanceof Promise ? await result : result
    }

    if (component !== undefined) {
      this._componentCache.set(cacheKey, component)
    }

    return component ?? null
  }

  clearCache(): void {
    this._componentCache.clear()
  }

  // ─── Helpers ────────────────────────────────────────────────

  private getLocationFromBrowser(): Location {
    const { pathname, search, hash } = window.location
    return {
      pathname,
      search,
      hash,
      query: parseQuery(search),
      params: {},
    }
  }

  private createLocation(path: string): Location {
    const [pathname, search] = path.split('?')
    return {
      pathname: pathname || '/',
      search: search ? `?${search}` : '',
      hash: '',
      query: parseQuery(search || ''),
      params: {},
    }
  }
}

// ─── Singleton Functions ────────────────────────────────────────

export function createRouter(options?: { routes?: Route[] } & RouterOptions): Router {
  if (!routerInstance) {
    routerInstance = new Router(options)
  }
  if (options?.routes) {
    routerInstance.register(options.routes)
  }
  return routerInstance
}

export function getRouter(): Router | null {
  return routerInstance
}

export async function navigate(path: string, options?: NavigateOptions): Promise<void> {
  if (!routerInstance) {
    throw new Error('[Flint] Router not initialized. Call createRouter() first.')
  }
  return routerInstance.navigate(path, options)
}

export function useParams(): Computed<RouteParams> {
  if (!routerInstance) {
    throw new Error('[Flint] Router not initialized.')
  }
  return routerInstance.params
}

export function useQueryParams(): Computed<QueryParams> {
  if (!routerInstance) {
    throw new Error('[Flint] Router not initialized.')
  }
  return routerInstance.query
}

export function useLocation(): Computed<Location> {
  if (!routerInstance) {
    throw new Error('[Flint] Router not initialized.')
  }
  return routerInstance.location
}

// ─── Link Component ─────────────────────────────────────────────

export interface LinkProps {
  to: string
  replace?: boolean
  activeClass?: string
  exact?: boolean
  children: Child | Child[]
  [key: string]: any
}

export function Link(props: LinkProps): Child {
  const { to, replace = false, activeClass = 'active', exact = false, children, ...rest } = props

  const currentPath = routerInstance?.pathname ?? computed(() => window.location.pathname)

  const isActive = computed(() => {
    const path = currentPath()
    return exact ? path === to : path.startsWith(to)
  })

  const handleClick = (e: Event) => {
    e.preventDefault()
    if (routerInstance) {
      routerInstance.navigate(to, { replace })
    }
  }

  const className = computed(() => {
    const base = rest.className || ''
    return isActive() ? `${base} ${activeClass}`.trim() : base
  })

  return h(
    'a',
    { ...rest, href: to, className: className(), onClick: handleClick },
    ...(Array.isArray(children) ? children : [children])
  )
}

// ─── Outlet Component ───────────────────────────────────────────

export interface OutletProps {
  [key: string]: any
}

export function Outlet(props?: OutletProps): Child {
  const router = routerInstance
  if (!router) return null

  const match = router.resolve()
  if (!match?.route.component) return null

  const result = match.route.component()
  if (result instanceof Promise) {
    return null
  }
  return result as Child
}
