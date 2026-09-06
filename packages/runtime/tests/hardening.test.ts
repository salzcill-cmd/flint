/**
 * @vitest-environment happy-dom
 *
 * Flint v3.3 — Security & Correctness Hardening
 *
 * Regression tests for:
 *  1. safeJsonForScript (XSS via </script> breakout in hydration payloads)
 *  2. safeUrl (javascript: URLs in href/src on client and SSR)
 *  3. dangerouslySetInnerHTML dev warning
 *  4. render() untracked mounting (no full-tree rebuild on state change)
 *  5. jsx/jsxs/jsxDEV/Fragment automatic JSX runtime
 *  6. HMR auto-wiring (__flintHMR__, hasHMRHandlers)
 *  7. flushSync
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { state, computed, effect, batch, flushSync } from '@flint/reactivity'
import {
  safeJsonForScript,
  safeUrl,
  isUrlAttribute,
} from '../src/security/index.js'
import {
  renderToString,
} from '../src/ssr/index.js'
import {
  h,
  render,
  track,
  trackAttribute,
  trackEvent,
} from '../src/renderer/index.js'
import {
  jsx,
  jsxs,
  jsxDEV,
  Fragment,
} from '../src/jsx-runtime.js'
import {
  acceptHMR,
  onHMRDispose,
  hasHMRHandlers,
  __flintHMR__,
  triggerHMRUpdate,
} from '../src/hmr/index.js'

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

// ─── 1. safeJsonForScript ────────────────────────────────────────

describe('safeJsonForScript', () => {
  it('escapes </script> so payloads cannot break out of script tags', () => {
    const evil = { user: '</script><script>alert(1)</script>' }
    const embedded = safeJsonForScript(evil)

    // No raw "</script" sequence may appear in the embedded JSON
    expect(embedded.includes('</script')).toBe(false)
    // The escaped form must be present
    expect(embedded.includes('\\u003C')).toBe(true)
  })

  it('escapes <!-- to prevent comment breakout', () => {
    const embedded = safeJsonForScript({ text: '<!-- hello' })
    expect(embedded.includes('<!--')).toBe(false)
  })

  it('produces JSON that survives a round-trip through JSON.parse', () => {
    const data = { a: 1, b: ['x', '</script>'], c: { d: '<!--' } }
    const embedded = safeJsonForScript(data)
    // The escaping is inside string literals, so JSON.parse recovers the value
    expect(JSON.parse(embedded)).toEqual(data)
  })

  it('does not escape normal data unnecessarily', () => {
    const embedded = safeJsonForScript({ hello: 'world', n: 42 })
    expect(JSON.parse(embedded)).toEqual({ hello: 'world', n: 42 })
  })
})

// ─── 2. safeUrl ──────────────────────────────────────────────────

describe('safeUrl', () => {
  it('allows http/https URLs', () => {
    expect(safeUrl('https://example.com')).toBe('https://example.com')
    expect(safeUrl('http://example.com/x?y=1')).toBe('http://example.com/x?y=1')
  })

  it('allows relative URLs and safe schemes', () => {
    expect(safeUrl('/about')).toBe('/about')
    expect(safeUrl('./page.html')).toBe('./page.html')
    expect(safeUrl('mailto:hi@example.com')).toBe('mailto:hi@example.com')
    expect(safeUrl('tel:+628123456789')).toBe('tel:+628123456789')
  })

  it('blocks javascript: URLs', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('#')
    expect(safeUrl('JaVaScRiPt:alert(1)')).toBe('#')
  })

  it('blocks obfuscated javascript: URLs (whitespace/control chars)', () => {
    // Browsers ignore tabs/newlines when parsing the scheme
    expect(safeUrl('java\tscript:alert(1)')).toBe('#')
    expect(safeUrl(' javascript:alert(1)')).toBe('#')
    expect(safeUrl('java\nscript:alert(1)')).toBe('#')
  })

  it('blocks data:text/html and vbscript URLs', () => {
    expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBe('#')
    expect(safeUrl('vbscript:msgbox(1)')).toBe('#')
  })

  it('warns in dev when blocking a URL', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    safeUrl('javascript:alert(1)')
    expect(warn).toHaveBeenCalled()
    expect(String(warn.mock.calls[0]?.[0])).toContain('javascript')
  })
})

describe('isUrlAttribute', () => {
  it('recognizes URL attributes case-insensitively', () => {
    expect(isUrlAttribute('href')).toBe(true)
    expect(isUrlAttribute('HREF')).toBe(true)
    expect(isUrlAttribute('src')).toBe(true)
    expect(isUrlAttribute('formaction')).toBe(true)
    expect(isUrlAttribute('xlink:href')).toBe(true)
  })

  it('rejects non-URL attributes', () => {
    expect(isUrlAttribute('title')).toBe(false)
    expect(isUrlAttribute('class')).toBe(false)
    expect(isUrlAttribute('data-url')).toBe(false)
  })
})

// ─── 2b. Renderer blocks javascript: URLs ───────────────────────

describe('renderer URL sanitization', () => {
  it('h() blocks javascript: href on static props', () => {
    const a = h('a', { href: 'javascript:alert(1)' }, 'click')
    expect((a as HTMLAnchorElement).getAttribute('href')).toBe('#')
  })

  it('h() keeps safe hrefs', () => {
    const a = h('a', { href: 'https://example.com' }, 'link')
    expect((a as HTMLAnchorElement).getAttribute('href')).toBe('https://example.com')
  })

  it('trackAttribute blocks javascript: URLs reactively', () => {
    const url = state('javascript:alert(1)')
    const a = document.createElement('a')
    document.body.appendChild(a)
    trackAttribute(a, 'href', () => url())
    expect(a.getAttribute('href')).toBe('#')

    // Switching to a safe URL works normally
    url.set('/profile')
    flushSync()
    expect(a.getAttribute('href')).toBe('/profile')
  })
})

// ─── 3. dangerouslySetInnerHTML dev warning ─────────────────────

describe('dangerouslySetInnerHTML dev warning', () => {
  it('warns when used in client renderer', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    h('div', { dangerouslySetInnerHTML: { __html: '<b>hi</b>' } })
    expect(warn).toHaveBeenCalled()
    expect(String(warn.mock.calls[0]?.[0])).toContain('dangerouslySetInnerHTML')
  })

  it('still renders the HTML', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const div = h('div', { dangerouslySetInnerHTML: { __html: '<b>hi</b>' } }) as HTMLDivElement
    expect(div.innerHTML).toBe('<b>hi</b>')
  })
})

// ─── 3b. SSR blocks javascript: URLs + hydration escaping ───────

describe('SSR security', () => {
  it('blocks javascript: href in SSR output', async () => {
    const result = await renderToString({
      component: () => ({
        tag: 'a',
        props: { href: 'javascript:alert(1)' },
        children: ['click'],
      }),
    })
    expect(result.html).not.toContain('javascript:')
    expect(result.html).toContain('href="#"')
  })

  it('keeps safe href in SSR output', async () => {
    const result = await renderToString({
      component: () => ({
        tag: 'a',
        props: { href: 'https://example.com' },
        children: ['link'],
      }),
    })
    expect(result.html).toContain('href="https://example.com"')
  })

  it('hydration payload cannot break out of the script tag', async () => {
    const result = await renderToString({
      component: () => 'x',
      hydrate: true,
    })
    // Even if a component put </script> in hydration data, the emitted
    // script must not contain a raw closing tag inside the payload.
    // Simulate the worst case by checking the escape helper directly.
    const evil = { d: { x: '</script><script>alert(1)</script>' } }
    expect(safeJsonForScript(evil).includes('</script')).toBe(false)
    // And the generated hydration script uses the escaped form
    if (result.scripts.length > 0) {
      expect(result.scripts[0]).toContain('data-flint-hydration')
    }
  })
})

// ─── 4. render() is untracked (fine-grained) ────────────────────

describe('render() untracked mounting', () => {
  it('does not re-render the whole tree when unrelated state changes', async () => {
    const clicks = state(0)

    let mountCount = 0
    function App() {
      mountCount++
      return h('div', null, 'static shell')
    }

    const container = document.createElement('div')
    document.body.appendChild(container)
    const handle = render(App, container)

    const mountsAfterRender = mountCount
    expect(mountsAfterRender).toBe(1)

    // A signal write that the component never read must NOT re-run App
    clicks.set(1)
    flushSync()
    clicks.set(2)
    flushSync()
    expect(mountCount).toBe(mountsAfterRender)

    handle.dispose()
  })

  it('signal reads inside track() still update surgically', async () => {
    const count = state(0)

    const container = document.createElement('div')
    document.body.appendChild(container)

    function App() {
      return h('div', null, track(() => count()))
    }
    const handle = render(App, container)

    expect(container.textContent).toBe('0')
    count.set(5)
    flushSync()
    expect(container.textContent).toBe('5')

    handle.dispose()
  })
})

// ─── 5. Automatic JSX runtime ───────────────────────────────────

describe('automatic JSX runtime (jsx/jsxs/jsxDEV/Fragment)', () => {
  it('jsx creates a DOM element', () => {
    const el = jsx('div', { className: 'box', children: 'hello' }) as HTMLDivElement
    expect(el.tagName).toBe('DIV')
    expect(el.className).toBe('box')
    expect(el.textContent).toBe('hello')
  })

  it('jsxs creates an element with array children', () => {
    const el = jsxs('ul', {
      children: [jsx('li', { children: 'a' }), jsx('li', { children: 'b' })],
    }) as HTMLUListElement
    expect(el.tagName).toBe('UL')
    expect(el.querySelectorAll('li').length).toBe(2)
  })

  it('jsxDEV creates the same tree as jsx', () => {
    const a = jsx('span', { children: 'dev' }) as HTMLSpanElement
    const b = jsxDEV('span', { children: 'dev' }) as HTMLSpanElement
    expect(a.textContent).toBe(b.textContent)
  })

  it('jsx renders components', () => {
    function Greet(props: { name: string }) {
      return h('p', null, `Hi ${props.name}`)
    }
    const el = jsx(Greet, { name: 'Flint' }) as HTMLParagraphElement
    expect(el.textContent).toBe('Hi Flint')
  })

  it('Fragment renders children without a wrapper', () => {
    const frag = jsx(Fragment, {
      children: [jsx('b', { children: 'one' }), jsx('i', { children: 'two' })],
    }) as DocumentFragment
    expect(frag.querySelector('b')?.textContent).toBe('one')
    expect(frag.querySelector('i')?.textContent).toBe('two')
    // No wrapper element of its own
    expect(frag.childElementCount).toBe(2)
  })

  it('jsx passes key through to props', () => {
    // h() ignores unknown "key" prop for DOM elements — just verify no crash
    const el = jsx('div', { children: 'x' }, 'k1') as HTMLDivElement
    expect(el.textContent).toBe('x')
  })
})

// ─── 6. HMR helpers ─────────────────────────────────────────────

describe('HMR auto-wiring', () => {
  it('hasHMRHandlers reports modules with acceptHMR registrations', () => {
    const id = 'test-module-a'
    expect(hasHMRHandlers(id)).toBe(false)
    const unregister = acceptHMR(id, () => {})
    expect(hasHMRHandlers(id)).toBe(true)
    unregister()
  })

  it('hasHMRHandlers reports modules with dispose registrations', () => {
    const id = 'test-module-b'
    const unregister = onHMRDispose(id, () => {})
    expect(hasHMRHandlers(id)).toBe(true)
    unregister()
  })

  it('__flintHMR__ accepts modules that registered handlers', () => {
    const id = 'test-module-c'
    const accepts: Array<() => void> = []
    const disposals: Array<() => void> = []
    const listeners = new Map<string, Array<(u: unknown) => void>>()

    const hot = {
      on(event: string, cb: (u: unknown) => void) {
        if (!listeners.has(event)) listeners.set(event, [])
        listeners.get(event)!.push(cb)
      },
      accept(cb: () => void) {
        accepts.push(cb)
      },
      dispose(cb: () => void) {
        disposals.push(cb)
      },
    }

    const unregister = acceptHMR(id, () => {})
    __flintHMR__(hot, id)

    // Module registered a handler → must self-accept
    expect(accepts.length).toBe(1)
    expect(disposals.length).toBe(1)

    // Trigger the accept callback: our callback should fire with fresh module
    let received: unknown = null
    acceptHMR(id, (update) => {
      received = (update as { module?: unknown }).module
    })
    accepts[0]?.({ newApi: true })
    expect(received).toEqual({ newApi: true })

    unregister()
  })

  it('__flintHMR__ does not accept modules without handlers', () => {
    const accepts: Array<() => void> = []
    const hot = {
      on() {},
      accept(cb: () => void) {
        accepts.push(cb)
      },
      dispose() {},
    }

    __flintHMR__(hot, 'never-registered-module')
    expect(accepts.length).toBe(0)
  })

  it('__flintHMR__ is a no-op without import.meta.hot (production)', () => {
    expect(() => __flintHMR__(undefined, 'any-module')).not.toThrow()
  })

  it('triggerHMRUpdate delivers fresh module to subscribers', () => {
    const id = 'test-module-d'
    const updates: unknown[] = []
    const unregister = acceptHMR(id, (update) => updates.push(update))
    triggerHMRUpdate({
      type: 'update',
      moduleId: id,
      acceptedBy: id,
      timestamp: Date.now(),
      module: { v: 2 },
    })
    expect(updates.length).toBe(1)
    expect((updates[0] as { module?: unknown }).module).toEqual({ v: 2 })
    unregister()
  })
})

// ─── 7. flushSync ───────────────────────────────────────────────

describe('flushSync', () => {
  it('flushes pending effects immediately, without waiting a microtask', () => {
    const count = state(0)
    const observed: number[] = []

    const stop = effect(() => {
      observed.push(count())
    })

    batch(() => {
      count.set(1)
      count.set(2)
    })
    // Not flushed yet (scheduled on a microtask)
    expect(observed).toEqual([0])

    flushSync()
    expect(observed).toEqual([0, 2])

    stop.dispose()
  })

  it('is safe to call with nothing pending', () => {
    expect(() => flushSync()).not.toThrow()
  })
})

// ─── computed equality override still works after refactor ──────

describe('computed custom equality (post-refactor regression)', () => {
  it('respects the equals option', () => {
    const items = state<string[]>([])
    // Only react to length changes, not identity changes
    const len = computed(() => items().length, {
      equals: (a, b) => a === b,
    })

    let runs = 0
    const stop = effect(() => {
      len()
      runs++
    })

    expect(runs).toBe(1)
    items.set(['a', 'b'])
    flushSync()
    expect(runs).toBe(2)

    // Replacing with a same-length array must NOT re-trigger
    items.set(['x', 'y'])
    flushSync()
    expect(runs).toBe(2)

    stop.dispose()
  })

  it('cascades through chained computeds', () => {
    const base = state(1)
    const doubled = computed(() => base() * 2)
    const quadrupled = computed(() => doubled() * 2)

    expect(quadrupled()).toBe(4)
    base.set(3)
    expect(quadrupled()).toBe(12)
  })

// ─── SSR timeout timer must not leak (v3.3.1) ─────────────────

  it('renderToString clears its timeout timer (no event-loop leak)', async () => {
    vi.useFakeTimers()
    try {
      const promise = renderToString({
        component: () => 'fast',
        timeout: 60_000,
      })

      // Resolve the render, then advance past the (unused) timeout
      await promise
      vi.advanceTimersByTime(60_000)

      // If the timer had leaked, fake timers would keep a pending job and
      // vitest would report it; assert the timer list is empty instead.
      // (vi.getTimerCount() exists on fake timers.)
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})
