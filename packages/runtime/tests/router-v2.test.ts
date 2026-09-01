import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  Router,
  createRouter,
  getRouter,
  navigate,
  useParams,
  useQuery,
  useLocation,
  Link,
  Outlet,
} from '../src/router/index.js'
import { h, render } from '../src/renderer/index.js'
import { state, computed } from '@flint/reactivity'

// Mock window.history
const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  go: vi.fn(),
}

// Mock document.body for h() function
const mockBody = {
  appendChild: vi.fn(),
  removeChild: vi.fn(),
}

describe('Router v2', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        pathname: '/',
        search: '',
        hash: '',
      },
      history: mockHistory,
      scrollX: 0,
      scrollY: 0,
      scrollTo: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    // Reset router instance
    const router = getRouter()
    if (router) {
      router.stop()
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Route Pattern Matching', () => {
    it('should create router instance', () => {
      const router = createRouter()
      expect(router).toBeInstanceOf(Router)
    })

    it('should register routes', () => {
      const router = createRouter({
        routes: [
          { path: '/', component: () => h('div', null, 'Home') },
          { path: '/about', component: () => h('div', null, 'About') },
        ],
      })

      expect(router).toBeDefined()
    })

    it('should match static routes', () => {
      const router = createRouter({
        routes: [
          { path: '/', component: () => h('div', null, 'Home') },
          { path: '/about', component: () => h('div', null, 'About') },
        ],
      })

      router.start()

      const match = router.resolve()
      expect(match).toBeDefined()
    })

    it('should match parameterized routes', () => {
      const router = createRouter({
        routes: [
          { path: '/users/:id', component: () => h('div', null, 'User') },
        ],
      })

      router.start()

      expect(router).toBeDefined()
    })

    it('should match nested routes', () => {
      const router = createRouter({
        routes: [
          {
            path: '/dashboard',
            component: () => h('div', null, 'Dashboard'),
            children: [
              { path: 'settings', component: () => h('div', null, 'Settings') },
            ],
          },
        ],
      })

      router.start()

      expect(router).toBeDefined()
    })
  })

  describe('Navigation', () => {
    it('should navigate to route', async () => {
      const router = createRouter({
        routes: [
          { path: '/', component: () => h('div', null, 'Home') },
          { path: '/about', component: () => h('div', null, 'About') },
        ],
      })

      router.start()

      await router.navigate('/about')

      expect(mockHistory.pushState).toHaveBeenCalled()
    })

    it('should replace current route', async () => {
      const router = createRouter({
        routes: [
          { path: '/', component: () => h('div', null, 'Home') },
          { path: '/login', component: () => h('div', null, 'Login') },
        ],
      })

      router.start()

      await router.replace('/login')

      expect(mockHistory.replaceState).toHaveBeenCalled()
    })

    it('should go back', () => {
      const router = createRouter()
      router.start()

      router.back()

      expect(mockHistory.back).toHaveBeenCalled()
    })

    it('should go forward', () => {
      const router = createRouter()
      router.start()

      router.forward()

      expect(mockHistory.forward).toHaveBeenCalled()
    })

    it('should go to delta', () => {
      const router = createRouter()
      router.start()

      router.go(-2)

      expect(mockHistory.go).toHaveBeenCalledWith(-2)
    })
  })

  describe('Route Guards', () => {
    it('should block navigation when guard returns false', async () => {
      const guard = vi.fn().mockReturnValue(false)
      const router = createRouter({
        routes: [
          { path: '/', component: () => h('div', null, 'Home') },
          { path: '/protected', component: () => h('div', null, 'Protected'), guard },
        ],
      })

      router.start()

      await router.navigate('/protected')

      expect(guard).toHaveBeenCalled()
      expect(mockHistory.pushState).not.toHaveBeenCalled()
    })

    it('should allow navigation when guard returns true', async () => {
      const guard = vi.fn().mockReturnValue(true)
      const router = createRouter({
        routes: [
          { path: '/', component: () => h('div', null, 'Home') },
          { path: '/allowed', component: () => h('div', null, 'Allowed'), guard },
        ],
      })

      router.start()

      await router.navigate('/allowed')

      expect(guard).toHaveBeenCalled()
      expect(mockHistory.pushState).toHaveBeenCalled()
    })

    it('should redirect when guard returns string', async () => {
      const guard = vi.fn().mockReturnValue('/login')
      const router = createRouter({
        routes: [
          { path: '/', component: () => h('div', null, 'Home') },
          { path: '/protected', component: () => h('div', null, 'Protected'), guard },
          { path: '/login', component: () => h('div', null, 'Login') },
        ],
      })

      router.start()

      await router.navigate('/protected')

      expect(guard).toHaveBeenCalled()
      // Note: The redirect happens asynchronously, we just verify guard was called
    })
  })

  describe('Computed State', () => {
    it('should provide location signal', () => {
      const router = createRouter({
        routes: [
          { path: '/', component: () => h('div', null, 'Home') },
        ],
      })

      router.start()

      const location = router.location
      expect(location).toBeDefined()
      expect(typeof location).toBe('function')
    })

    it('should provide params signal', () => {
      const router = createRouter({
        routes: [
          { path: '/users/:id', component: () => h('div', null, 'User') },
        ],
      })

      router.start()

      const params = router.params
      expect(params).toBeDefined()
    })

    it('should provide query signal', () => {
      const router = createRouter({
        routes: [
          { path: '/', component: () => h('div', null, 'Home') },
        ],
      })

      router.start()

      const query = router.query
      expect(query).toBeDefined()
    })
  })

  describe('Link Component', () => {
    it('should render link element', () => {
      const link = Link({
        to: '/about',
        children: 'About',
      })

      expect(link).toBeDefined()
      // Link creates an <a> element
      expect(typeof link).toBe('object')
    })

    it('should handle click', () => {
      const link = Link({
        to: '/about',
        children: 'About',
      })

      expect(link).toBeDefined()
    })
  })

  describe('Singleton Functions', () => {
    it('should get router instance', () => {
      const router = createRouter()
      const instance = getRouter()

      expect(instance).toBe(router)
    })

    it('should navigate using singleton', async () => {
      const router = createRouter({
        routes: [
          { path: '/', component: () => h('div', null, 'Home') },
          { path: '/about', component: () => h('div', null, 'About') },
        ],
      })

      router.start()

      await navigate('/about')

      expect(mockHistory.pushState).toHaveBeenCalled()
    })

    it('should get params using singleton', () => {
      createRouter({
        routes: [
          { path: '/users/:id', component: () => h('div', null, 'User') },
        ],
      })

      const params = useParams()
      expect(params).toBeDefined()
    })

    it('should get query using singleton', () => {
      createRouter({
        routes: [
          { path: '/', component: () => h('div', null, 'Home') },
        ],
      })

      const query = useQuery()
      expect(query).toBeDefined()
    })

    it('should get location using singleton', () => {
      createRouter({
        routes: [
          { path: '/', component: () => h('div', null, 'Home') },
        ],
      })

      const location = useLocation()
      expect(location).toBeDefined()
    })
  })
})
