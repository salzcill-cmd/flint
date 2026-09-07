// Flint Runtime — Testing Utilities
// Helpers for testing Flint components

import { h, render } from '../renderer/index.js'
import type { Child } from '../renderer/index.js'
import { state, computed, effect } from '@flint/reactivity'
import type { Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export interface TestComponentResult {
  /** The rendered container */
  container: HTMLElement
  /** Query for elements */
  querySelector: (selector: string) => HTMLElement | null
  /** Query all elements */
  querySelectorAll: (selector: string) => HTMLElement[]
  /** Get text content */
  textContent: (selector?: string) => string
  /** Get element attributes */
  getAttribute: (selector: string, attr: string) => string | null
  /** Check if element exists */
  exists: (selector: string) => boolean
  /** Get element count */
  count: (selector: string) => number
  /** Simulate click event */
  click: (selector: string) => void
  /** Simulate input event */
  input: (selector: string, value: string) => void
  /** Simulate change event */
  change: (selector: string, value: string) => void
  /** Update component props */
  updateProps: (props: Record<string, any>) => void
  /** Unmount component */
  unmount: () => void
  /** Rerender component */
  rerender: () => void
  /** Get element */
  element: (selector?: string) => HTMLElement | null
  /** Wait for state update */
  waitFor: (fn: () => boolean, timeout?: number) => Promise<void>
  /** Get all rendered HTML */
  html: (selector?: string) => string
}

export interface MockSSROptions {
  /** Mock fetch response */
  fetch?: (url: string) => Promise<any>
  /** Mock window.location */
  location?: Partial<Location>
  /** Additional global mocks */
  globals?: Record<string, any>
}

export interface SpyFunction {
  (...args: any[]): any
  called: boolean
  callCount: number
  calls: any[][]
  lastCall: any[]
  reset: () => void
}

// ─── Test Render ────────────────────────────────────────────────

/**
 * Render a component for testing.
 *
 * @example
 * import { testRender } from 'flint/testing'
 *
 * const { querySelector, click, textContent } = testRender(
 *   () => <Button onClick={() => console.log('clicked')}>Click me</Button>
 * )
 *
 * expect(textContent()).toBe('Click me')
 * click('button')
 */
export function testRender(
  component: () => Child,
  options: { props?: Record<string, any>; container?: HTMLElement } = {}
): TestComponentResult {
  const container = options.container ?? document.createElement('div')
  document.body.appendChild(container)

  let currentComponent = component
  let dispose: { dispose: () => void } | null = null

  // Initial render
  const renderComponent = () => {
    if (dispose) {
      dispose.dispose()
    }
    dispose = render(currentComponent, container)
  }

  renderComponent()

  // Helper functions
  const querySelector = (selector: string) => container.querySelector(selector)
  const querySelectorAll = (selector: string) => Array.from(container.querySelectorAll(selector)) as HTMLElement[]

  return {
    container,
    querySelector: (selector) => querySelector(selector) as HTMLElement,
    querySelectorAll,
    textContent: (selector) => {
      const el = selector ? querySelector(selector) : container
      return el?.textContent ?? ''
    },
    getAttribute: (selector, attr) => {
      const el = querySelector(selector)
      return el?.getAttribute(attr) ?? null
    },
    exists: (selector) => querySelector(selector) !== null,
    count: (selector) => querySelectorAll(selector).length,
    click: (selector) => {
      const el = querySelector(selector)
      if (el) {
        el.dispatchEvent(new Event('click', { bubbles: true }))
      }
    },
    input: (selector, value) => {
      const el = querySelector(selector) as HTMLInputElement
      if (el) {
        el.value = value
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
    },
    change: (selector, value) => {
      const el = querySelector(selector) as HTMLInputElement
      if (el) {
        el.value = value
        el.dispatchEvent(new Event('change', { bubbles: true }))
      }
    },
    updateProps: (props) => {
      currentComponent = () => component()
      renderComponent()
    },
    unmount: () => {
      if (dispose) {
        dispose.dispose()
        dispose = null
      }
      container.remove()
    },
    rerender: () => {
      renderComponent()
    },
    element: (selector) => querySelector(selector ?? '') as HTMLElement,
    waitFor: async (fn, timeout = 1000) => {
      const start = Date.now()
      while (!fn()) {
        if (Date.now() - start > timeout) {
          throw new Error('[Flint Testing] waitFor timed out')
        }
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
    },
    html: (selector) => {
      const el = selector ? querySelector(selector) : container
      return el?.innerHTML ?? ''
    },
  }
}

// ─── Test App ───────────────────────────────────────────────────

export interface TestApp {
  /** The container element */
  container: HTMLElement
  /** Render a component */
  render: (component: () => Child) => void
  /** Get rendered HTML */
  html: () => string
  /** Query elements */
  query: (selector: string) => HTMLElement | null
  /** Click element */
  click: (selector: string) => void
  /** Cleanup */
  cleanup: () => void
}

/**
 * Create a test app for integration testing.
 *
 * @example
 * import { createTestApp } from 'flint/testing'
 *
 * const app = createTestApp()
 * app.render(() => <App />)
 * expect(app.html()).toContain('Hello')
 * app.cleanup()
 */
export function createTestApp(): TestApp {
  const container = document.createElement('div')
  document.body.appendChild(container)

  let dispose: { dispose: () => void } | null = null

  return {
    container,
    render: (component) => {
      if (dispose) {
        dispose.dispose()
      }
      dispose = render(component, container)
    },
    html: () => container.innerHTML,
    query: (selector) => container.querySelector(selector) as HTMLElement,
    click: (selector) => {
      const el = container.querySelector(selector)
      if (el) {
        el.dispatchEvent(new Event('click', { bubbles: true }))
      }
    },
    cleanup: () => {
      if (dispose) {
        dispose.dispose()
      }
      container.remove()
    },
  }
}

// ─── Mock Utilities ─────────────────────────────────────────────

/**
 * Create a mock fetch function.
 *
 * @example
 * const mockFetch = createMockFetch({
 *   '/api/users': [{ id: 1, name: 'John' }],
 *   '/api/posts': [{ id: 1, title: 'Hello' }],
 * })
 */
export function createMockFetch(
  responses: Record<string, any>
): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()

    // Find matching route
    for (const [pattern, response] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response('Not Found', { status: 404 })
  }
}

/**
 * Create a spy function for mocking.
 *
 * @example
 * const spy = createSpy()
 * component.onClick = spy
 * click('button')
 * expect(spy.called).toBe(true)
 * expect(spy.callCount).toBe(1)
 */
export function createSpy<T extends (...args: any[]) => any>(
  implementation?: T
): SpyFunction {
  const spy: SpyFunction = ((...args: any[]) => {
    spy.called = true
    spy.callCount++
    spy.calls.push(args)
    spy.lastCall = args
    return implementation?.(...args)
  }) as unknown as SpyFunction

  spy.called = false
  spy.callCount = 0
  spy.calls = []
  spy.lastCall = []
  spy.reset = () => {
    spy.called = false
    spy.callCount = 0
    spy.calls = []
    spy.lastCall = []
  }

  return spy
}

// ─── Assertion Helpers ──────────────────────────────────────────

/**
 * Wait for async state updates to complete.
 */
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Wait for effects to run.
 */
export async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 10))
}

/**
 * Assert element exists.
 */
export function expectElement(
  container: HTMLElement,
  selector: string
): HTMLElement {
  const el = container.querySelector(selector)
  if (!el) {
    throw new Error(`[Flint Testing] Element not found: ${selector}`)
  }
  return el as HTMLElement
}

/**
 * Assert element has text content.
 */
export function expectText(
  container: HTMLElement,
  selector: string,
  text: string
): void {
  const el = expectElement(container, selector)
  if (el.textContent !== text) {
    throw new Error(
      `[Flint Testing] Expected "${text}" but got "${el.textContent}"`
    )
  }
}

/**
 * Assert element has attribute.
 */
export function expectAttribute(
  container: HTMLElement,
  selector: string,
  attr: string,
  value: string
): void {
  const el = expectElement(container, selector)
  const actual = el.getAttribute(attr)
  if (actual !== value) {
    throw new Error(
      `[Flint Testing] Expected attribute ${attr}="${value}" but got "${actual}"`
    )
  }
}

// ─── SSR Mock ───────────────────────────────────────────────────

/**
 * Mock SSR context for testing.
 */
export function mockSSRContext(): {
  setHeader: (name: string, value: string) => void
  getHeaders: () => Record<string, string>
} {
  const headers: Record<string, string> = {}

  return {
    setHeader: (name, value) => {
      headers[name] = value
    },
    getHeaders: () => ({ ...headers }),
  }
}

/**
 * Mock window location for testing.
 */
export function mockLocation(
  url: string
): { restore: () => void } {
  const original = window.location

  // Create mock location
  const mockLocation = new URL(url)
  Object.defineProperty(window, 'location', {
    value: {
      ...original,
      href: mockLocation.href,
      pathname: mockLocation.pathname,
      search: mockLocation.search,
      hash: mockLocation.hash,
      origin: mockLocation.origin,
    },
    writable: true,
  })

  return {
    restore: () => {
      Object.defineProperty(window, 'location', {
        value: original,
        writable: true,
      })
    },
  }
}

// ─── Advanced Testing Utilities ─────────────────────────────────

/**
 * Create a mock signal for testing.
 *
 * @example
 * const count = mockSignal(0)
 * expect(count()).toBe(0)
 * count.set(5)
 * expect(count()).toBe(5)
 */
export function mockSignal<T>(initial: T): Signal<T> & { set: (value: T) => void } {
  const sig = state(initial)
  return Object.assign(sig, { set: sig.set })
}

/**
 * Wait for async operations to complete.
 *
 * @example
 * await waitForAsync()
 */
export function waitForAsync(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Wait for a condition to be true.
 *
 * @example
 * await waitFor(() => isLoading() === false)
 */
export async function waitFor(
  condition: () => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 1000, interval = 10 } = options
  const start = Date.now()

  return new Promise((resolve, reject) => {
    const check = () => {
      if (condition()) {
        resolve()
        return
      }
      if (Date.now() - start > timeout) {
        reject(new Error('Timeout waiting for condition'))
        return
      }
      setTimeout(check, interval)
    }
    check()
  })
}

/**
 * Create a mock event.
 *
 * @example
 * const clickEvent = createMockEvent('click')
 * element.dispatchEvent(clickEvent)
 */
export function createMockEvent(type: string, options: any = {}): Event {
  return new Event(type, { bubbles: true, cancelable: true, ...options })
}

/**
 * Create a mock keyboard event.
 *
 * @example
 * const enterEvent = createMockKeyboardEvent('keydown', { key: 'Enter' })
 */
export function createMockKeyboardEvent(
  type: string,
  options: { key?: string; code?: string } = {}
): KeyboardEvent {
  return new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    key: options.key ?? '',
    code: options.code ?? '',
  })
}

/**
 * Create a mock input event.
 *
 * @example
 * const inputEvent = createMockInputEvent('hello')
 */
export function createMockInputEvent(value: string): Event {
  const event = new Event('input', { bubbles: true })
  Object.defineProperty(event, 'target', {
    value: { value },
    writable: false,
  })
  return event
}

/**
 * Assert that a signal has a specific value.
 *
 * @example
 * assertSignalValue(count, 5)
 */
export function assertSignalValue<T>(signal: Signal<T>, expected: T): void {
  const actual = signal()
  if (actual !== expected) {
    throw new Error(`Expected signal to be ${expected}, but got ${actual}`)
  }
}

/**
 * Assert that a signal has changed.
 *
 * @example
 * count.set(5)
 * assertSignalChanged(count, 5)
 */
export function assertSignalChanged<T>(signal: Signal<T>, expected: T): void {
  assertSignalValue(signal, expected)
}

/**
 * Create a test wrapper for a component.
 *
 * @example
 * const wrapper = createTestWrapper(MyComponent)
 * const { querySelector } = wrapper.render({ name: 'John' })
 */
export function createTestWrapper<T extends Record<string, any>>(
  component: (props: T) => Child
) {
  return {
    render: (props: T) => testRender(() => component(props)),
  }
}

/**
 * Create a mock fetch for API testing (with restore function).
 *
 * @example
 * const mock = createMockFetchWithRestore({
 *   '/api/users': { users: [{ id: 1, name: 'John' }] },
 * })
 *
 * // After test
 * mock.restore()
 */
export function createMockFetchWithRestore(responses: Record<string, any>): { restore: () => void } {
  const originalFetch = globalThis.fetch

  globalThis.fetch = async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url
    const response = responses[urlStr]

    if (response === undefined) {
      return new Response('Not Found', { status: 404 })
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return {
    restore: () => {
      globalThis.fetch = originalFetch
    },
  }
}

/**
 * Create a mock timer for testing.
 *
 * @example
 * const timer = createMockTimer()
 *
 * // Use in test
 * setTimeout(() => { ... }, 1000)
 * timer.advance(1000) // Fast forward 1 second
 *
 * timer.restore()
 */
export function createMockTimer(): {
  advance: (ms: number) => void
  restore: () => void
} {
  const originalSetTimeout = globalThis.setTimeout
  const originalSetInterval = globalThis.setInterval
  const originalClearTimeout = globalThis.clearTimeout
  const originalClearInterval = globalThis.clearInterval

  let timeouts: Array<{ id: number; fn: Function; delay: number }> = []
  let intervals: Array<{ id: number; fn: Function; delay: number }> = []
  let nextId = 1

  globalThis.setTimeout = ((fn: Function, delay: number) => {
    const id = nextId++
    timeouts.push({ id, fn, delay })
    return id as any
  }) as any

  globalThis.setInterval = ((fn: Function, delay: number) => {
    const id = nextId++
    intervals.push({ id, fn, delay })
    return id as any
  }) as any

  globalThis.clearTimeout = ((id: number) => {
    timeouts = timeouts.filter((t) => t.id !== id)
  }) as any

  globalThis.clearInterval = ((id: number) => {
    intervals = intervals.filter((i) => i.id !== id)
  }) as any

  return {
    advance: (ms: number) => {
      // Run pending timeouts
      const pendingTimeouts = timeouts.filter((t) => t.delay <= ms)
      timeouts = timeouts.filter((t) => t.delay > ms)
      for (const t of pendingTimeouts) {
        t.fn()
      }

      // Run intervals
      for (const i of intervals) {
        i.fn()
      }
    },
    restore: () => {
      globalThis.setTimeout = originalSetTimeout
      globalThis.setInterval = originalSetInterval
      globalThis.clearTimeout = originalClearTimeout
      globalThis.clearInterval = originalClearInterval
      timeouts = []
      intervals = []
    },
  }
}
