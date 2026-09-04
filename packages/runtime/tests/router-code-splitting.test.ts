import { describe, it, expect, vi } from 'vitest'
import {
  createLazyRoute,
  RoutePreloader,
  getRoutePreloader,
} from '../src/router/code-splitting.js'

describe('createLazyRoute', () => {
  it('should call loader when preload is invoked', async () => {
    const TestComp = { type: 'div', props: {}, children: ['Test'] }
    const loader = vi.fn().mockResolvedValue({ default: () => TestComp })

    const { preload } = createLazyRoute({
      path: '/test-preload',
      loader,
    })

    await preload()
    expect(loader).toHaveBeenCalled()
  })
})

describe('RoutePreloader', () => {
  it('should register and preload routes', async () => {
    const preloader = new RoutePreloader()
    const preloadFn = vi.fn().mockResolvedValue(undefined)

    preloader.register('/about', preloadFn)
    await preloader.preload('/about')

    expect(preloadFn).toHaveBeenCalled()
  })

  it('should handle unknown routes gracefully', async () => {
    const preloader = new RoutePreloader()

    // Should not throw
    await preloader.preload('/unknown')
  })

  it('should disconnect observer', () => {
    const preloader = new RoutePreloader({ onViewport: true })
    preloader.disconnect()
  })
})

describe('getRoutePreloader', () => {
  it('should return singleton instance', () => {
    const instance1 = getRoutePreloader()
    const instance2 = getRoutePreloader()

    expect(instance1).toBe(instance2)
  })
})
