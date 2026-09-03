import { describe, it, expect } from 'vitest'
import { state } from '@flint/reactivity'
import { h, render } from '../src/renderer/index.js'
import {
  Show, For, ForEach, Index, Switch, Match, Portal, Suspense,
  memo, createResource, createMemo, createEffect,
} from '../src/components/index.js'

function createContainer() {
  return document.createElement('div')
}

describe('Show', () => {
  it('renders children when condition is true', () => {
    expect(Show({ when: true, children: 'Visible' })).toBe('Visible')
  })
  it('renders fallback when false', () => {
    expect(Show({ when: false, fallback: 'Hidden', children: 'Visible' })).toBe('Hidden')
  })
  it('returns null when false and no fallback', () => {
    expect(Show({ when: false, children: 'Visible' })).toBeNull()
  })
  it('handles function condition', () => {
    const count = state(0)
    expect(Show({ when: () => count() > 0, children: 'Positive' })).toBeNull()
    count.set(1)
    expect(Show({ when: () => count() > 0, children: 'Positive' })).toBe('Positive')
  })
})

describe('For', () => {
  it('renders list items', () => {
    const container = createContainer()
    const result = For({ each: ['a', 'b', 'c'], children: (item, i) => h('div', null, `${i}: ${item}`) })
    container.appendChild(result)
    expect(container.children.length).toBe(3)
    expect(container.children[0].textContent).toBe('0: a')
  })
  it('renders empty for empty list', () => {
    expect(For({ each: [], children: (item: any) => h('div', null, item) })).toBeDefined()
  })
})

describe('ForEach', () => {
  it('shows fallback when list is empty', () => {
    const container = createContainer()
    const items = state<string[]>([])
    render(() => ForEach({ each: () => items(), children: (item) => h('div', null, item), fallback: () => 'No items' }), container)
    expect(container.textContent).toBe('No items')
  })
})

describe('Index', () => {
  it('renders with index', () => {
    const container = createContainer()
    const result = Index({ each: ['a', 'b', 'c'], children: (item, i) => h('div', null, `${i}: ${item}`) })
    container.appendChild(result)
    expect(container.children.length).toBe(3)
    expect(container.children[1].textContent).toBe('1: b')
  })
})

describe('Switch/Match', () => {
  it('renders first matching case', () => {
    const result = Switch({ children: [Match({ when: false, children: 'A' }), Match({ when: true, children: 'B' })] })
    expect(result).toBe('B')
  })
  it('renders fallback when no match', () => {
    const result = Switch({ fallback: 'Default', children: [Match({ when: false, children: 'A' })] })
    expect(result).toBe('Default')
  })
})

describe('Portal', () => {
  it('renders to target element', () => {
    const target = document.createElement('div')
    document.body.appendChild(target)
    Portal({ mount: target, children: 'Portaled' })
    expect(target.textContent).toBe('Portaled')
    document.body.removeChild(target)
  })
})

describe('Suspense', () => {
  it('renders children synchronously', () => {
    expect(Suspense({ fallback: 'Loading...', children: 'Content' })).toBe('Content')
  })
  it('shows fallback for pending promise', () => {
    const p = new Promise(() => {})
    expect(Suspense({ fallback: 'Loading...', children: p })).toBe('Loading...')
  })
})

describe('memo', () => {
  it('caches result for same props', () => {
    let count = 0
    const C = memo((p: { v: number }) => { count++; return p.v })
    C({ v: 1 }); C({ v: 1 })
    expect(count).toBe(1)
  })
  it('re-renders when props change', () => {
    let count = 0
    const C = memo((p: { v: number }) => { count++; return p.v })
    C({ v: 1 }); C({ v: 2 })
    expect(count).toBe(2)
  })
  it('uses custom equality', () => {
    let count = 0
    const C = memo((p: { d: { v: number } }) => { count++; return p.d.v }, (a, b) => a.d.v === b.d.v)
    C({ d: { v: 1 } }); C({ d: { v: 1 } })
    expect(count).toBe(1)
  })
})

describe('createMemo', () => {
  it('creates memoized computed', () => {
    const c = state(0)
    const d = createMemo(() => c() * 2)
    expect(d()).toBe(0)
    c.set(5)
    expect(d()).toBe(10)
  })
})

describe('createEffect', () => {
  it('runs effect', () => {
    const c = state(0)
    let ran = false
    createEffect(() => { c(); ran = true })
    expect(ran).toBe(true)
  })
})

describe('createResource', () => {
  it('resolves to success state', async () => {
    const r = createResource(async () => 'data', { onError: () => {} })
    await new Promise(res => setTimeout(res, 10))
    expect(r.state).toBe('success')
    expect(r.data).toBe('data')
  })
  it('handles errors', async () => {
    const r = createResource(async () => { throw new Error('fail') }, { onError: () => {} })
    await new Promise(res => setTimeout(res, 10))
    expect(r.state).toBe('error')
  })
  it('mutate updates data', async () => {
    const r = createResource(async () => 'init', { onError: () => {} })
    await new Promise(res => setTimeout(res, 10))
    r.mutate('updated')
    expect(r.data).toBe('updated')
  })
})
