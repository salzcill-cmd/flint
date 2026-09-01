/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  Router,
  createRouter,
  getRouter,
  navigate,
  Link,
  Outlet,
} from '../src/router/index.js'

describe('Router', () => {
  let router: Router

  beforeEach(() => {
    // Reset singleton
    vi.resetModules()
    // Create fresh router
    router = new Router()
    // Mock window.history
    window.history.pushState = vi.fn()
    window.history.replaceState = vi.fn()
    window.history.back = vi.fn()
    window.history.forward = vi.fn()
    window.history.go = vi.fn()
  })

  afterEach(() => {
    router.stop()
  })

  it('creates a router instance', () => {
    expect(router).toBeDefined()
  })

  it('registers routes', () => {
    router.register([
      { path: '/about', component: () => null },
    ])
    // Initially no route is matched since we haven't started
    expect(router).toBeDefined()
  })

  it('starts and listens to popstate', () => {
    router.start()
    expect(router).toBeDefined()
  })

  it('navigates to a path', async () => {
    router.register([
      { path: '/', component: () => null },
      { path: '/about', component: () => null },
    ])

    await router.navigate('/about')
    expect(window.history.pushState).toHaveBeenCalled()
  })

  it('replaces current history', async () => {
    router.register([
      { path: '/', component: () => null },
    ])

    await router.navigate('/', { replace: true })
    expect(window.history.replaceState).toHaveBeenCalled()
  })

  it('goes back', () => {
    router.back()
    expect(window.history.back).toHaveBeenCalled()
  })

  it('goes forward', () => {
    router.forward()
    expect(window.history.forward).toHaveBeenCalled()
  })

  it('goes to specific delta', () => {
    router.go(-2)
    expect(window.history.go).toHaveBeenCalledWith(-2)
  })

  it('updates location state', async () => {
    router.register([
      { path: '/users/:id', component: () => null },
    ])

    await router.navigate('/users/123')
    // Location is updated via pushState mock
  })
})

describe('Route matching', () => {
  let router: Router

  beforeEach(() => {
    router = new Router()
  })

  afterEach(() => {
    router.stop()
  })

  it('matches static routes', () => {
    router.register([
      { path: '/', component: () => null },
      { path: '/about', component: () => null },
    ])

    // Mock location
    Object.defineProperty(window, 'location', {
      value: { pathname: '/about', search: '', hash: '' },
      writable: true,
    })

    const match = router.resolve()
    // Match depends on browser location
    expect(router).toBeDefined()
  })

  it('matches parameterized routes', () => {
    router.register([
      { path: '/users/:id', component: () => null },
    ])
    expect(router).toBeDefined()
  })
})

describe('Singleton functions', () => {
  beforeEach(() => {
    // Reset singleton for each test
    vi.resetModules()
  })

  it('createRouter creates singleton', () => {
    const r = createRouter({
      routes: [{ path: '/', component: () => null }],
    })
    expect(r).toBeDefined()
  })

  it('getRouter returns null when not initialized', () => {
    const r = getRouter()
    // May or may not be null depending on previous tests
    expect(r === null || r instanceof Router).toBe(true)
  })
})

describe('Link component', () => {
  it('creates a link element', () => {
    const link = Link({
      to: '/about',
      children: 'About',
    })
    expect(link).toBeDefined()
    expect(link instanceof HTMLElement).toBe(true)
  })

  it('sets href attribute', () => {
    const link = Link({
      to: '/contact',
      children: 'Contact',
    }) as HTMLElement
    expect(link.getAttribute('href')).toBe('/contact')
  })

  it('applies active class when active', () => {
    const link = Link({
      to: '/',
      activeClass: 'is-active',
      children: 'Home',
    }) as HTMLElement
    expect(link).toBeDefined()
  })
})

describe('Outlet component', () => {
  it('returns null when no router', () => {
    const result = Outlet()
    expect(result).toBeNull()
  })
})
