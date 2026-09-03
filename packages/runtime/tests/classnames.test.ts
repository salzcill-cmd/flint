import { describe, it, expect } from 'vitest'
import { cn, cnMerge, ifClass, createClassNameResolver } from '../src/utils/classnames'

describe('cn()', () => {
  it('should join string classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle numbers', () => {
    expect(cn('foo', 1, 'bar')).toBe('foo 1 bar')
  })

  it('should filter falsy values', () => {
    expect(cn('foo', false, null, undefined, 'bar')).toBe('foo bar')
  })

  it('should handle objects with boolean values', () => {
    expect(cn({ active: true, disabled: false, visible: true })).toBe('active visible')
  })

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
  })

  it('should handle nested arrays', () => {
    expect(cn([['a', 'b'], 'c'])).toBe('a b c')
  })

  it('should handle mixed types', () => {
    expect(cn('base', { active: true }, ['nested', { hidden: false }], 'end'))
      .toBe('base active nested end')
  })

  it('should handle empty input', () => {
    expect(cn()).toBe('')
  })

  it('should handle empty strings', () => {
    expect(cn('', '', '')).toBe('')
  })
})

describe('cnMerge()', () => {
  it('should join classes like cn', () => {
    expect(cnMerge('foo', 'bar')).toBe('foo bar')
  })

  it('should handle empty input', () => {
    expect(cnMerge()).toBe('')
  })
})

describe('ifClass()', () => {
  it('should return true classes when condition is true', () => {
    expect(ifClass(true, 'active')).toBe('active')
  })

  it('should return false classes when condition is false', () => {
    expect(ifClass(false, 'active', 'inactive')).toBe('inactive')
  })

  it('should return empty string when false and no falseClasses', () => {
    expect(ifClass(false, 'active')).toBe('')
  })

  it('should handle array classes', () => {
    expect(ifClass(true, ['foo', 'bar'])).toBe('foo bar')
  })

  it('should handle object classes', () => {
    expect(ifClass(true, { active: true, hidden: false })).toBe('active')
  })
})

describe('createClassNameResolver()', () => {
  it('should create a resolver that picks active variants', () => {
    const resolve = createClassNameResolver({
      primary: 'bg-blue-500 text-white',
      danger: 'bg-red-500 text-white',
      size_sm: 'text-sm',
      size_md: 'text-md',
    })

    expect(resolve({ primary: true, size_sm: true })).toBe('bg-blue-500 text-white text-sm')
  })

  it('should handle partial selections', () => {
    const resolve = createClassNameResolver({
      active: 'is-active',
      hidden: 'is-hidden',
    })

    expect(resolve({ active: true })).toBe('is-active')
    expect(resolve({})).toBe('')
  })

  it('should ignore false values', () => {
    const resolve = createClassNameResolver({
      active: 'is-active',
      hidden: 'is-hidden',
    })

    expect(resolve({ active: true, hidden: false })).toBe('is-active')
  })

  it('should handle multiple variants', () => {
    const resolve = createClassNameResolver({
      a: 'class-a',
      b: 'class-b',
      c: 'class-c',
    })

    expect(resolve({ a: true, b: true, c: true })).toBe('class-a class-b class-c')
  })
})
