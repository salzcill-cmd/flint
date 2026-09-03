import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useFocusVisible,
  useFocusRestore,
  useKeyboard,
  useReducedMotion,
  useAriaId,
  createAriaProps,
} from '../src/a11y/index'

describe('Accessibility (a11y)', () => {
  describe('useFocusVisible()', () => {
    it('should return a signal', () => {
      const result = useFocusVisible()
      expect(typeof result).toBe('function')
    })

    it('should return false by default', () => {
      const result = useFocusVisible()
      expect(result()).toBe(false)
    })
  })

  describe('useFocusRestore()', () => {
    it('should return save and restore functions', () => {
      const result = useFocusRestore()
      expect(typeof result.save).toBe('function')
      expect(typeof result.restore).toBe('function')
    })

    it('should not throw when save is called', () => {
      const result = useFocusRestore()
      expect(() => result.save()).not.toThrow()
    })

    it('should not throw when restore is called without save', () => {
      const result = useFocusRestore()
      expect(() => result.restore()).not.toThrow()
    })
  })

  describe('useKeyboard()', () => {
    it('should return a cleanup function', () => {
      const cleanup = useKeyboard({ Enter: () => {} })
      expect(typeof cleanup).toBe('function')
    })

    it('should not throw when called', () => {
      expect(() => useKeyboard({ Enter: () => {}, Escape: () => {} })).not.toThrow()
    })

    it('should return unsubscribe function', () => {
      const cleanup = useKeyboard({ Enter: () => {} })
      expect(() => cleanup()).not.toThrow()
    })
  })

  describe('useReducedMotion()', () => {
    it('should return a signal', () => {
      const result = useReducedMotion()
      expect(typeof result).toBe('function')
    })

    it('should return a boolean', () => {
      const result = useReducedMotion()
      expect(typeof result()).toBe('boolean')
    })
  })

  describe('useAriaId()', () => {
    it('should return id and prop', () => {
      const result = useAriaId()
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('prop')
      expect(result.prop).toHaveProperty('id')
    })

    it('should generate unique ids', () => {
      const r1 = useAriaId()
      const r2 = useAriaId()
      expect(r1.id).not.toBe(r2.id)
    })

    it('should use custom prefix', () => {
      const result = useAriaId('my-component')
      expect(result.id).toContain('my-component')
    })
  })

  describe('createAriaProps()', () => {
    it('should create aria-label', () => {
      const props = createAriaProps({ label: 'Close dialog' })
      expect(props['aria-label']).toBe('Close dialog')
    })

    it('should create aria-hidden', () => {
      const props = createAriaProps({ hidden: true })
      expect(props['aria-hidden']).toBe('true')
    })

    it('should create aria-live', () => {
      const props = createAriaProps({ live: 'polite' })
      expect(props['aria-live']).toBe('polite')
    })

    it('should create aria-expanded', () => {
      const props = createAriaProps({ expanded: false })
      expect(props['aria-expanded']).toBe('false')
    })

    it('should create role', () => {
      const props = createAriaProps({ role: 'button' })
      expect(props.role).toBe('button')
    })

    it('should handle empty config', () => {
      const props = createAriaProps({})
      expect(props).toEqual({})
    })

    it('should combine multiple aria attributes', () => {
      const props = createAriaProps({
        label: 'Menu',
        expanded: true,
        hasPopup: 'menu',
      })
      expect(props['aria-label']).toBe('Menu')
      expect(props['aria-expanded']).toBe('true')
      expect(props['aria-haspopup']).toBe('menu')
    })
  })
})
