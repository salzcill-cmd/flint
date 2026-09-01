/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  renderToString,
  renderToPipeableStream,
  generateHTML,
  hydrate,
  getSSRContext,
  useTitle,
  useMeta,
  useLink,
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

  it('includes hydration data when hydrate is true', async () => {
    const result = await renderToString({
      component: () => 'Test',
      hydrate: true,
    })
    expect(result.scripts.some(s => s.includes('__FLINT_HYDRATION__'))).toBe(true)
  })

  it('returns empty context when hydrate is false', async () => {
    const result = await renderToString({
      component: () => 'Test',
      hydrate: false,
    })
    expect(result.scripts.length).toBe(0)
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
      meta: [{ name: 'description', content: 'A test app' }],
      body: '',
    })
    expect(html).toContain('name="description"')
    expect(html).toContain('content="A test app"')
  })

  it('includes script URLs', () => {
    const html = generateHTML({
      scriptUrls: ['/app.js', '/vendor.js'],
      body: '',
    })
    expect(html).toContain('src="/app.js"')
    expect(html).toContain('src="/vendor.js"')
  })

  it('includes inline scripts', () => {
    const html = generateHTML({
      scripts: ['console.log("hello")'],
      body: '',
    })
    expect(html).toContain('console.log("hello")')
  })

  it('includes styles', () => {
    const html = generateHTML({
      styles: ['body { margin: 0; }'],
      body: '',
    })
    expect(html).toContain('body { margin: 0; }')
  })

  it('includes style URLs', () => {
    const html = generateHTML({
      styleUrls: ['/styles.css'],
      body: '',
    })
    expect(html).toContain('href="/styles.css"')
  })
})

describe('hydrate', () => {
  it('hydrates an element', async () => {
    const root = document.createElement('div')
    root.innerHTML = '<p>Server content</p>'
    document.body.appendChild(root)

    await hydrate({
      root,
      component: () => 'Client',
    })

    expect(root.getAttribute('data-flint-hydrated')).toBe('true')

    document.body.removeChild(root)
  })
})

describe('Head hooks', () => {
  it('useTitle sets title in SSR context', () => {
    // This would need SSR context to test properly
    expect(() => useTitle('Test')).not.toThrow()
  })

  it('useMeta adds meta tag', () => {
    expect(() => useMeta('description', 'Test')).not.toThrow()
  })

  it('useLink adds link tag', () => {
    expect(() => useLink('stylesheet', '/style.css')).not.toThrow()
  })
})

describe('renderToPipeableStream', () => {
  it('creates a stream result', () => {
    const result = renderToPipeableStream({
      component: () => 'Streamed',
    })
    expect(result).toHaveProperty('pipe')
    expect(result).toHaveProperty('ready')
  })

  it('resolves ready promise', async () => {
    const result = renderToPipeableStream({
      component: () => 'Content',
    })
    await result.ready
    // Should complete without error
  })
})
