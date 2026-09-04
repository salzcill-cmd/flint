import { describe, it, expect } from 'vitest'
import * as Flint from '../src/index.js'

describe('Flint Package', () => {
  it('exports core rendering functions', () => {
    expect(typeof Flint.h).toBe('function')
    expect(typeof Flint.render).toBe('function')
  })

  it('exports component system', () => {
    expect(typeof Flint.component).toBe('function')
    expect(typeof Flint.onMount).toBe('function')
    expect(typeof Flint.onUpdate).toBe('function')
    expect(typeof Flint.onDestroy).toBe('function')
  })

  it('exports reactivity primitives', () => {
    expect(typeof Flint.state).toBe('function')
    expect(typeof Flint.computed).toBe('function')
    expect(typeof Flint.effect).toBe('function')
    expect(typeof Flint.batch).toBe('function')
  })

  it('exports hooks', () => {
    expect(typeof Flint.useRef).toBe('function')
    expect(typeof Flint.useCallback).toBe('function')
    expect(typeof Flint.useMemo).toBe('function')
    expect(typeof Flint.useEffect).toBe('function')
  })

  it('exports context', () => {
    expect(typeof Flint.createContext).toBe('function')
    expect(typeof Flint.useProvider).toBe('function')
  })

  it('exports store create function', () => {
    expect(typeof Flint.create).toBe('function')
  })

  it('exports error handling', () => {
    expect(typeof Flint.ErrorBoundary).toBe('function')
    expect(typeof Flint.formatFlintError).toBe('function')
  })

  it('exports rendering utilities', () => {
    expect(typeof Flint.track).toBe('function')
    expect(typeof Flint.trackAttribute).toBe('function')
    expect(typeof Flint.trackEvent).toBe('function')
    expect(typeof Flint.trackChildren).toBe('function')
  })
})
