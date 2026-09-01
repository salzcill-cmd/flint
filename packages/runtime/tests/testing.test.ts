/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  testRender,
  createTestApp,
  createMockFetch,
  createSpy,
  flushPromises,
  flushEffects,
  expectElement,
  expectText,
  expectAttribute,
  mockSSRContext,
  mockLocation,
} from '../src/testing/index.js'
import { h } from '../src/renderer/index.js'
import { state } from '@flint/reactivity'

describe('testRender', () => {
  let cleanup: (() => void) | null = null

  afterEach(() => {
    cleanup?.()
  })

  it('renders a component', () => {
    const result = testRender(() => 'Hello World')
    cleanup = result.unmount
    expect(result.textContent()).toBe('Hello World')
  })

  it('queries elements', () => {
    const result = testRender(() =>
      h('div', null, h('span', { class: 'test' }, 'Test'))
    )
    cleanup = result.unmount
    expect(result.querySelector('.test')).not.toBeNull()
  })

  it('checks element existence', () => {
    const result = testRender(() => h('div', null, 'Content'))
    cleanup = result.unmount
    expect(result.exists('div')).toBe(true)
    expect(result.exists('span')).toBe(false)
  })

  it('counts elements', () => {
    const result = testRender(() =>
      h('ul', null,
        h('li', null, 'Item 1'),
        h('li', null, 'Item 2'),
        h('li', null, 'Item 3')
      )
    )
    cleanup = result.unmount
    expect(result.count('li')).toBe(3)
  })

  it('simulates click', () => {
    let clicked = false
    const result = testRender(() =>
      h('button', { onClick: () => { clicked = true } }, 'Click')
    )
    cleanup = result.unmount
    result.click('button')
    expect(clicked).toBe(true)
  })

  it('gets HTML content', () => {
    const result = testRender(() =>
      h('div', null, h('p', null, 'Paragraph'))
    )
    cleanup = result.unmount
    expect(result.html()).toContain('<p>Paragraph</p>')
  })

  it('unmounts component', () => {
    const result = testRender(() => 'Content')
    result.unmount()
    expect(result.container.parentNode).toBeNull()
    cleanup = null
  })

  it('waits for condition', async () => {
    const result = testRender(() => 'Ready')
    cleanup = result.unmount
    await result.waitFor(() => result.textContent() === 'Ready')
  })
})

describe('createTestApp', () => {
  let app: ReturnType<typeof createTestApp> | null = null

  afterEach(() => {
    app?.cleanup()
  })

  it('creates a test app', () => {
    app = createTestApp()
    expect(app).toBeDefined()
  })

  it('renders components', () => {
    app = createTestApp()
    app.render(() => 'Hello')
    expect(app.html()).toBe('Hello')
  })

  it('queries elements', () => {
    app = createTestApp()
    app.render(() => h('div', { class: 'test' }, 'Content'))
    expect(app.query('.test')).not.toBeNull()
  })

  it('simulates clicks', () => {
    let clicked = false
    app = createTestApp()
    app.render(() =>
      h('button', { onClick: () => { clicked = true } }, 'Click')
    )
    app.click('button')
    expect(clicked).toBe(true)
  })
})

describe('createMockFetch', () => {
  it('creates a mock fetch', async () => {
    const mockFetch = createMockFetch({
      '/api/users': [{ id: 1, name: 'John' }],
    })

    const response = await mockFetch('/api/users')
    const data = await response.json()
    expect(data).toEqual([{ id: 1, name: 'John' }])
  })

  it('returns 404 for unknown routes', async () => {
    const mockFetch = createMockFetch({
      '/api/users': [],
    })

    const response = await mockFetch('/api/unknown')
    expect(response.status).toBe(404)
  })
})

describe('createSpy', () => {
  it('creates a spy function', () => {
    const spy = createSpy()
    expect(spy.called).toBe(false)
    expect(spy.callCount).toBe(0)
  })

  it('tracks calls', () => {
    const spy = createSpy()
    spy('arg1', 'arg2')
    expect(spy.called).toBe(true)
    expect(spy.callCount).toBe(1)
    expect(spy.calls[0]).toEqual(['arg1', 'arg2'])
    expect(spy.lastCall).toEqual(['arg1', 'arg2'])
  })

  it('calls implementation', () => {
    const spy = createSpy((x: number) => x * 2)
    const result = spy(5)
    expect(result).toBe(10)
  })

  it('resets', () => {
    const spy = createSpy()
    spy('test')
    spy.reset()
    expect(spy.called).toBe(false)
    expect(spy.callCount).toBe(0)
    expect(spy.calls).toEqual([])
  })
})

describe('flushPromises', () => {
  it('flushes pending promises', async () => {
    let resolved = false
    Promise.resolve().then(() => { resolved = true })
    await flushPromises()
    expect(resolved).toBe(true)
  })
})

describe('expectElement', () => {
  it('finds element', () => {
    const container = document.createElement('div')
    container.innerHTML = '<div class="test">Content</div>'
    const el = expectElement(container, '.test')
    expect(el).toBeDefined()
  })

  it('throws when not found', () => {
    const container = document.createElement('div')
    expect(() => expectElement(container, '.missing')).toThrow()
  })
})

describe('expectText', () => {
  it('matches text content', () => {
    const container = document.createElement('div')
    container.innerHTML = '<span>Hello</span>'
    expectText(container, 'span', 'Hello')
  })

  it('throws on mismatch', () => {
    const container = document.createElement('div')
    container.innerHTML = '<span>Hello</span>'
    expect(() => expectText(container, 'span', 'World')).toThrow()
  })
})

describe('expectAttribute', () => {
  it('matches attribute', () => {
    const container = document.createElement('div')
    container.innerHTML = '<a href="/link">Link</a>'
    expectAttribute(container, 'a', 'href', '/link')
  })

  it('throws on mismatch', () => {
    const container = document.createElement('div')
    container.innerHTML = '<a href="/link">Link</a>'
    expect(() => expectAttribute(container, 'a', 'href', '/other')).toThrow()
  })
})

describe('mockSSRContext', () => {
  it('creates mock context', () => {
    const ctx = mockSSRContext()
    expect(ctx.setHeader).toBeDefined()
    expect(ctx.getHeaders).toBeDefined()
  })

  it('tracks headers', () => {
    const ctx = mockSSRContext()
    ctx.setHeader('X-Test', 'value')
    expect(ctx.getHeaders()['X-Test']).toBe('value')
  })
})

describe('mockLocation', () => {
  it('mocks window location', () => {
    const original = window.location.href
    const { restore } = mockLocation('https://example.com/path?q=1')
    expect(window.location.pathname).toBe('/path')
    expect(window.location.search).toBe('?q=1')
    restore()
  })
})
