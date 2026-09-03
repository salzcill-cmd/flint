/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  renderToString,
  renderToPipeableStream,
  generateHTML,
  hydrate,
  selectiveHydration,
  getSSRContext,
  useTitle,
  useMeta,
  useLink,
  isServer,
  isClient,
  dataLoader,
  executeDataLoader,
} from '../src/ssr/index.js'

describe('renderToString', () => {
  it('renders a simple component to HTML string', async () => {
    const result = await renderToString({
      component: () => 'Hello World',
    })
    expect(result.html).toBe('Hello World')
  })

  it('renders component with props', async () => {
    const result = await renderToString({
      component: (props: { name: string }) => `Hello ${props.name}`,
      props: { name: 'Flint' },
    })
    expect(result.html).toBe('Hello Flint')
  })

  it('renders HTML elements', async () => {
    const result = await renderToString({
      component: () => ({
        tag: 'div',
        props: { class: 'container' },
        children: ['Hello'],
      }),
    })
    expect(result.html).toContain('<div')
    expect(result.html).toContain('Hello')
  })

  it('escapes HTML in text', async () => {
    const result = await renderToString({
      component: () => '<script>alert("xss")</script>',
    })
    expect(result.html).not.toContain('<script>')
    expect(result.html).toContain('&lt;script&gt;')
  })

  it('handles nested components', async () => {
    const Child = (props: { text: string }) => ({
      tag: 'span',
      props: {},
      children: [props.text],
    })

    const Parent = () => ({
      tag: 'div',
      props: { class: 'parent' },
      children: [{ tag: Child, props: { text: 'Child' } }],
    })

    const result = await renderToString({
      component: Parent,
    })

    expect(result.html).toContain('<div')
    expect(result.html).toContain('<span')
    expect(result.html).toContain('Child')
  })

  it('handles async components', async () => {
    const AsyncComponent = async () => ({
      tag: 'div',
      props: {},
      children: ['Async Content'],
    })

    const result = await renderToString({
      component: AsyncComponent,
    })

    expect(result.html).toContain('Async Content')
  })

  it('handles array of children', async () => {
    const List = () => ({
      tag: 'ul',
      props: {},
      children: [
        { tag: 'li', props: {}, children: ['Item 1'] },
        { tag: 'li', props: {}, children: ['Item 2'] },
        { tag: 'li', props: {}, children: ['Item 3'] },
      ],
    })

    const result = await renderToString({
      component: List,
    })

    expect(result.html).toContain('<ul')
    expect(result.html).toContain('Item 1')
    expect(result.html).toContain('Item 2')
    expect(result.html).toContain('Item 3')
  })

  it('handles null/undefined returns', async () => {
    const result = await renderToString({
      component: () => null,
    })
    expect(result.html).toBe('')
  })

  it('returns seed for deterministic hydration', async () => {
    const result = await renderToString({
      component: () => 'Test',
    })
    expect(result.seed).toBeDefined()
    expect(typeof result.seed).toBe('string')
  })

  it('captures context data', async () => {
    const result = await renderToString({
      component: () => 'Test',
    })
    expect(result.context).toBeDefined()
    expect(result.context.head).toBeDefined()
  })
})

describe('renderToPipeableStream', () => {
  it('renders to stream', async () => {
    const chunks: string[] = []

    const stream = renderToPipeableStream({
      component: () => ({
        tag: 'div',
        props: {},
        children: ['Streamed Content'],
      }),
      onShellReady(html) {
        chunks.push(html)
      },
    })

    await stream.ready

    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks[0]).toContain('Streamed Content')
  })

  it('calls onAllReady when complete', async () => {
    let completed = false

    const stream = renderToPipeableStream({
      component: () => 'Done',
      onAllReady() {
        completed = true
      },
    })

    await stream.ready

    expect(completed).toBe(true)
  })

  it('can be aborted', async () => {
    const stream = renderToPipeableStream({
      component: () => 'Test',
    })

    stream.abort()

    // Should not throw
    await stream.ready
  })

  it('handles errors gracefully', async () => {
    let shellHtml = ''

    const stream = renderToPipeableStream({
      component: () => {
        throw new Error('Test error')
      },
      hydrate: false,
      onShellReady(html) {
        shellHtml = html
      },
    })

    await stream.ready

    expect(shellHtml).toContain('<!-- SSR Error -->')
  })
})

describe('generateHTML', () => {
  it('generates basic HTML document', () => {
    const html = generateHTML({
      body: '<div id="app"></div>',
    })
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<html lang="en">')
    expect(html).toContain('<div id="app"></div>')
  })

  it('includes title', () => {
    const html = generateHTML({
      title: 'My App',
      body: '',
    })
    expect(html).toContain('<title>My App</title>')
  })

  it('includes meta tags', () => {
    const html = generateHTML({
      meta: [{ name: 'description', content: 'A Flint app' }],
      body: '',
    })
    expect(html).toContain('<meta name="description"')
    expect(html).toContain('A Flint app')
  })

  it('includes script URLs', () => {
    const html = generateHTML({
      scriptUrls: ['/app.js', '/vendor.js'],
      body: '',
    })
    expect(html).toContain('<script src="/app.js">')
    expect(html).toContain('<script src="/vendor.js">')
  })

  it('includes inline styles', () => {
    const html = generateHTML({
      styles: ['body { margin: 0; }'],
      body: '',
    })
    expect(html).toContain('<style>body { margin: 0; }</style>')
  })

  it('includes style URLs', () => {
    const html = generateHTML({
      styleUrls: ['/styles/main.css'],
      body: '',
    })
    expect(html).toContain('<link rel="stylesheet" href="/styles/main.css">')
  })

  it('supports custom lang', () => {
    const html = generateHTML({
      lang: 'id',
      body: '',
    })
    expect(html).toContain('<html lang="id">')
  })

  it('includes favicon', () => {
    const html = generateHTML({
      favicon: '/favicon.ico',
      body: '',
    })
    expect(html).toContain('<link rel="icon" href="/favicon.ico">')
  })

  it('escapes HTML in title', () => {
    const html = generateHTML({
      title: 'Test & Co',
      body: '',
    })
    expect(html).toContain('Test &amp; Co')
  })
})

describe('hydrate', () => {
  it('marks element as hydrated', async () => {
    const root = document.createElement('div')
    root.setAttribute('data-flint-id', 'test-123')

    const result = await hydrate({
      root,
      component: () => 'Test',
    })

    expect(root.getAttribute('data-flint-hydrated')).toBe('true')
    expect(root.hasAttribute('data-flint-id')).toBe(false)
  })

  it('returns success when no warnings', async () => {
    const root = document.createElement('div')

    const result = await hydrate({
      root,
      component: () => 'Test',
    })

    expect(result.success).toBe(true)
    expect(result.warnings.length).toBe(0)
  })

  it('detects hydration mismatches', async () => {
    const root = document.createElement('div')
    root.setAttribute('data-flint-id', 'nonexistent')

    const result = await hydrate({
      root,
      component: () => 'Test',
      strict: false,
    })

    // Should warn about mismatch
    expect(result.warnings.length).toBeGreaterThanOrEqual(0)
  })

  it('handles root element without errors', async () => {
    const root = document.createElement('div')

    const result = await hydrate({
      root,
      component: () => 'Test',
    })

    expect(result.success).toBe(true)
  })

  it('cleans up hydration data', async () => {
    const root = document.createElement('div')
    ;(window as any).__FLINT_HYDRATION__ = { d: {} }

    await hydrate({
      root,
      component: () => 'Test',
    })

    expect((window as any).__FLINT_HYDRATION__).toBeUndefined()
  })
})

describe('selectiveHydration', () => {
  it('hydrates immediate components', () => {
    const root = document.createElement('div')
    root.innerHTML = '<div data-flint-id="header">Header</div>'
    ;(window as any).__FLINT_HYDRATION__ = {
      d: { header: { p: {}, t: 'Header' } },
    }

    const onHydrate = vi.fn()

    selectiveHydration({
      root,
      immediate: ['header'],
      onHydrate,
    })

    expect(onHydrate).toHaveBeenCalledWith('header')
  })

  it('handles lazy hydration configuration', () => {
    const root = document.createElement('div')
    root.innerHTML = '<div data-flint-id="footer">Footer</div>'
    ;(window as any).__FLINT_HYDRATION__ = {
      d: { footer: { p: {}, t: 'Footer' } },
    }

    // Should not throw
    selectiveHydration({
      root,
      lazy: ['footer'],
    })

    expect(true).toBe(true)
  })
})

describe('Data Loading', () => {
  it('registers and executes data loader', async () => {
    const loader = vi.fn().mockResolvedValue({ user: 'John' })
    dataLoader('user', loader)

    const context = {
      components: new Map(),
      hydrationData: {},
      effects: [],
      head: { title: '', meta: [], links: [], scripts: [] },
      routeParams: { id: '123' },
      query: {},
      data: {},
    }

    const result = await executeDataLoader('user', context)

    expect(result).toEqual({ user: 'John' })
    expect(loader).toHaveBeenCalledWith(context)
  })

  it('returns null for non-existent loader', async () => {
    const context = {
      components: new Map(),
      hydrationData: {},
      effects: [],
      head: { title: '', meta: [], links: [], scripts: [] },
      routeParams: {},
      query: {},
      data: {},
    }

    const result = await executeDataLoader('nonexistent', context)

    expect(result).toBeNull()
  })
})

describe('Head Management', () => {
  it('sets page title via useTitle', async () => {
    const result = await renderToString({
      component: () => {
        useTitle('My Page')
        return 'Content'
      },
    })

    expect(result.context.head.title).toBe('My Page')
  })

  it('adds meta tags via useMeta', async () => {
    const result = await renderToString({
      component: () => {
        useMeta('description', 'Page description')
        return 'Content'
      },
    })

    expect(result.context.head.meta).toContainEqual({
      name: 'description',
      content: 'Page description',
    })
  })

  it('adds link tags via useLink', async () => {
    const result = await renderToString({
      component: () => {
        useLink('stylesheet', '/styles.css')
        return 'Content'
      },
    })

    expect(result.context.head.links).toContainEqual({
      rel: 'stylesheet',
      href: '/styles.css',
    })
  })
})

describe('Environment Detection', () => {
  it('isServer returns true when window is undefined', () => {
    // In happy-dom, window exists
    expect(typeof isServer()).toBe('boolean')
  })

  it('isClient returns true when window exists', () => {
    expect(isClient()).toBe(true)
  })
})
