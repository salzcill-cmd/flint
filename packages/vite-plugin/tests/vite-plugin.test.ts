import { describe, it, expect } from 'vitest'
import flint from '../src/index.js'

describe('Flint Vite Plugin', () => {
  it('returns a valid plugin object', () => {
    const plugin = flint()
    expect(plugin.name).toBe('flint')
    expect(plugin.enforce).toBe('pre')
    expect(typeof plugin.transform).toBe('function')
  })

  it('resolves flint imports', () => {
    const plugin = flint() as any
    const result = plugin.resolveId('flint')
    expect(result).toBe('\0flint:runtime')
  })

  it('resolves flint/store imports', () => {
    const plugin = flint() as any
    const result = plugin.resolveId('flint/store')
    expect(result).toBe('\0flint:store')
  })

  it('resolves flint/router imports', () => {
    const plugin = flint() as any
    const result = plugin.resolveId('flint/router')
    expect(result).toBe('\0flint:router')
  })

  it('returns null for non-flint imports', () => {
    const plugin = flint() as any
    const result = plugin.resolveId('react')
    expect(result).toBeNull()
  })

  it('loads flint runtime module', () => {
    const plugin = flint() as any
    const result = plugin.load('\0flint:runtime')
    expect(result).toContain('@flint/runtime')
  })

  it('loads flint store module', () => {
    const plugin = flint() as any
    const result = plugin.load('\0flint:store')
    expect(result).toContain('@flint/store')
  })

  it('skips non-jsx files in transform', () => {
    const plugin = flint() as any
    const result = plugin.transform('const x = 1', '/path/to/file.ts')
    expect(result).toBeUndefined()
  })

  it('skips node_modules', () => {
    const plugin = flint() as any
    const result = plugin.transform('<div />', '/node_modules/pkg/file.jsx')
    expect(result).toBeUndefined()
  })

  it('strips query params for extension detection', () => {
    const plugin = flint() as any
    // This should not throw
    expect(() => {
      plugin.transform('<div />', '/path/to/file.jsx?t=12345')
    }).not.toThrow()
  })
})
