/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest'
import { h, render } from '../src/renderer/index.js'
import { state, computed, effect } from '@flint/reactivity'

describe('h() — JSX Factory', () => {
  it('creates a DOM element', () => {
    const el = h('div', null, 'Hello') as HTMLElement
    expect(el).toBeInstanceOf(HTMLDivElement)
    expect(el.textContent).toBe('Hello')
  })

  it('creates element with attributes', () => {
    const el = h('div', { class: 'foo', id: 'bar' }, 'Content') as HTMLElement
    expect(el.className).toBe('foo')
    expect(el.id).toBe('bar')
    expect(el.textContent).toBe('Content')
  })

  it('creates element with event handler', () => {
    let clicked = false
    const el = h('button', { onClick: () => { clicked = true } }, 'Click') as HTMLElement
    el.click()
    expect(clicked).toBe(true)
  })

  it('creates element with boolean attribute', () => {
    const el = h('input', { disabled: true }) as HTMLInputElement
    expect(el.disabled).toBe(true)
  })

  it('creates element with style object', () => {
    const el = h('div', { style: { color: 'red', fontSize: '16px' } }) as HTMLElement
    expect(el.style.color).toBe('red')
    expect(el.style.fontSize).toBe('16px')
  })

  it('creates element with children', () => {
    const child1 = h('span', null, 'A')
    const child2 = h('span', null, 'B')
    const el = h('div', null, child1, child2) as HTMLElement
    expect(el.children.length).toBe(2)
    expect(el.children[0].textContent).toBe('A')
    expect(el.children[1].textContent).toBe('B')
  })

  it('creates element with nested children', () => {
    const inner = h('span', null, 'Inner')
    const el = h('div', null, inner) as HTMLElement
    expect(el.children.length).toBe(1)
    expect(el.children[0]).toBeInstanceOf(HTMLSpanElement)
  })

  it('handles null children', () => {
    const el = h('div', null, null, 'Text', null) as HTMLElement
    expect(el.textContent).toBe('Text')
  })

  it('handles array children', () => {
    const children = [h('li', null, '1'), h('li', null, '2')]
    const el = h('ul', null, children) as HTMLElement
    expect(el.children.length).toBe(2)
  })

  it('creates fragment', () => {
    const fragment = h(null, null, h('div', null, 'A'), h('div', null, 'B'))
    expect(fragment).toBeInstanceOf(DocumentFragment)
    expect(fragment.childNodes.length).toBe(2)
  })

  it('calls component function', () => {
    const Greeting = (props: { name: string }) => {
      return h('div', null, `Hello, ${props.name}!`)
    }
    const el = h(Greeting, { name: 'World' }) as HTMLElement
    expect(el.textContent).toBe('Hello, World!')
  })

  it('handles component with null result', () => {
    const Empty = () => null
    const result = h(Empty, {})
    expect(result).toBeInstanceOf(DocumentFragment)
  })

  it('handles component with string result', () => {
    const Text = () => 'Hello World'
    const result = h(Text, {})
    expect(result.textContent).toBe('Hello World')
  })
})

describe('render()', () => {
  it('renders a component into container', () => {
    const container = document.createElement('div')
    const App = () => h('h1', null, 'Hello Flint!')

    render(App, container)
    expect(container.innerHTML).toContain('Hello Flint!')
  })

  it('renders using query selector', () => {
    document.body.innerHTML = '<div id="app"></div>'
    const App = () => h('p', null, 'Test')

    render(App, '#app')
    const app = document.getElementById('app')!
    expect(app.innerHTML).toContain('Test')
  })

  it('returns dispose function', () => {
    const container = document.createElement('div')
    const App = () => h('div', null, 'Content')

    const { dispose } = render(App, container)
    expect(container.innerHTML).toContain('Content')

    dispose()
    expect(container.innerHTML).toBe('')
  })
})

describe('Reactive Rendering', () => {
  it('updates when state changes', async () => {
    const container = document.createElement('div')
    const count = state(0)

    const App = () => {
      return h('div', null, `Count: ${count()}`)
    }

    render(App, container)
    expect(container.textContent).toContain('Count: 0')

    count.set(5)
    await new Promise(r => setTimeout(r, 0))
    expect(container.textContent).toContain('Count: 5')
  })
})
