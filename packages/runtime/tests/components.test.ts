/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest'
import { h, render } from '../src/renderer/index.js'
import {
  Show,
  For,
  Index,
  Switch,
  Match,
  Suspense,
  memo,
} from '../src/components/index.js'
import {
  provide,
  inject,
  hasInjection,
  createInjectionKey,
  clearInjectionContext,
} from '../src/inject/index.js'
import { state, computed } from '@flint/reactivity'

describe('Show', () => {
  it('renders children when condition is true', () => {
    const result = Show({
      when: true,
      children: 'Hello',
    })
    expect(result).not.toBeNull()
  })

  it('returns null when condition is false and no fallback', () => {
    const result = Show({
      when: false,
      children: 'Hello',
    })
    expect(result).toBeNull()
  })

  it('renders fallback when condition is false', () => {
    const result = Show({
      when: false,
      fallback: 'Fallback',
      children: 'Hello',
    })
    expect(result).not.toBeNull()
  })

  it('handles function children', () => {
    const result = Show({
      when: true,
      children: () => 'Dynamic',
    })
    expect(result).not.toBeNull()
  })

  it('handles function condition', () => {
    const result = Show({
      when: () => true,
      children: 'Hello',
    })
    expect(result).not.toBeNull()
  })
})

describe('For', () => {
  it('renders list items', () => {
    const result = For({
      each: [1, 2, 3],
      children: (item) => h('li', null, String(item)),
    })
    expect(result).toBeInstanceOf(DocumentFragment)
    expect(result.childNodes.length).toBe(3)
  })

  it('handles empty list', () => {
    const result = For({
      each: [],
      children: (item: number) => h('li', null, String(item)),
    })
    expect(result).toBeInstanceOf(DocumentFragment)
    expect(result.childNodes.length).toBe(0)
  })

  it('provides index to children', () => {
    const items = ['a', 'b', 'c']
    const result = For({
      each: items,
      children: (item, index) => h('span', null, `${index}:${item}`),
    })
    expect(result).toBeInstanceOf(DocumentFragment)
  })

  it('handles function each', () => {
    const items = [1, 2, 3]
    const result = For({
      each: () => items,
      children: (item) => h('li', null, String(item)),
    })
    expect(result).toBeInstanceOf(DocumentFragment)
    expect(result.childNodes.length).toBe(3)
  })
})

describe('Switch', () => {
  it('renders matching case', () => {
    const result = Switch({
      children: [
        Match({ when: false, children: 'No' }),
        Match({ when: true, children: 'Yes' }),
      ],
    })
    expect(result).not.toBeNull()
  })

  it('renders fallback when no match', () => {
    const result = Switch({
      fallback: 'Default',
      children: [
        Match({ when: false, children: 'No' }),
      ],
    })
    expect(result).not.toBeNull()
  })

  it('returns null when no match and no fallback', () => {
    const result = Switch({
      children: [
        Match({ when: false, children: 'No' }),
      ],
    })
    expect(result).toBeNull()
  })
})

describe('Suspense', () => {
  it('renders children directly', () => {
    const result = Suspense({
      children: 'Content',
    })
    expect(result).not.toBeNull()
  })

  it('handles function children', () => {
    const result = Suspense({
      children: () => 'Dynamic',
    })
    expect(result).not.toBeNull()
  })
})

describe('memo()', () => {
  it('creates a memoized component', () => {
    let renderCount = 0
    const Counter = (props: { count: number }) => {
      renderCount++
      return h('div', null, String(props.count))
    }
    const MemoCounter = memo(Counter)

    MemoCounter({ count: 1 })
    MemoCounter({ count: 1 })
    MemoCounter({ count: 2 })

    // Should only render twice (once for initial, once for different props)
    expect(renderCount).toBe(2)
  })

  it('uses custom areEqual function', () => {
    let renderCount = 0
    const Item = (props: { id: number; name: string }) => {
      renderCount++
      return h('div', null, props.name)
    }
    const MemoItem = memo(Item, (prev, next) => prev.id === next.id)

    MemoItem({ id: 1, name: 'A' })
    MemoItem({ id: 1, name: 'B' }) // Same id, different name
    MemoItem({ id: 2, name: 'C' }) // Different id

    // Should render twice: once for initial, once for id=2
    expect(renderCount).toBe(2)
  })
})

describe('provide/inject', () => {
  beforeEach(() => {
    clearInjectionContext()
  })

  it('provides and injects values', () => {
    const ThemeKey = createInjectionKey<{ color: string }>()

    provide(ThemeKey, { color: 'blue' })
    const theme = inject(ThemeKey)

    expect(theme.color).toBe('blue')
  })

  it('injects default value when not provided', () => {
    const ThemeKey = createInjectionKey<{ color: string }>()

    const theme = inject(ThemeKey, { color: 'red' })
    expect(theme.color).toBe('red')
  })

  it('hasInjection checks if value is provided', () => {
    const Key = createInjectionKey<string>()

    expect(hasInjection(Key)).toBe(false)

    provide(Key, 'hello')
    expect(hasInjection(Key)).toBe(true)
  })

  it('works with string keys', () => {
    provide('theme', { color: 'green' })
    const theme = inject('theme', {} as any)
    expect(theme.color).toBe('green')
  })

  it('creates injection key with default', () => {
    const Key = createInjectionKey({ color: 'purple' })
    const value = inject(Key)
    expect(value.color).toBe('purple')
  })
})
