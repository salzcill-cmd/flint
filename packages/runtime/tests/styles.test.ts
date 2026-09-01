/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createStyles,
  createDynamicStyles,
  getTheme,
  setTheme,
  resetTheme,
  cssVariablesFromTheme,
  injectCSSVariables,
  mediaQuery,
  responsive,
  createKeyframes,
  mergeStyles,
  cx,
  styleToString,
} from '../src/styles/index.js'

describe('createStyles', () => {
  let styleSheet: ReturnType<typeof createStyles> | null = null

  afterEach(() => {
    styleSheet?.destroy()
  })

  it('creates a stylesheet with unique ID', () => {
    styleSheet = createStyles({
      container: { padding: '16px' },
    })
    expect(styleSheet.id).toMatch(/^flint-/)
  })

  it('generates scoped class names', () => {
    styleSheet = createStyles({
      container: { padding: '16px' },
      title: { fontSize: '24px' },
    })
    expect(styleSheet.classNames.container).toMatch(/^container_/)
    expect(styleSheet.classNames.title).toMatch(/^title_/)
  })

  it('injects style element into document head', () => {
    styleSheet = createStyles({
      box: { display: 'flex' },
    })
    const styleEl = document.querySelector(`[data-flint-style="${styleSheet.id}"]`)
    expect(styleEl).not.toBeNull()
    expect(styleEl?.textContent).toContain('.box_')
  })

  it('destroys stylesheet', () => {
    styleSheet = createStyles({
      temp: { color: 'red' },
    })
    const id = styleSheet.id
    styleSheet.destroy()
    const styleEl = document.querySelector(`[data-flint-style="${id}"]`)
    expect(styleEl).toBeNull()
    styleSheet = null
  })
})

describe('createDynamicStyles', () => {
  it('creates dynamic styles based on props', () => {
    const factory = createDynamicStyles((props: { primary: boolean }) => ({
      button: {
        backgroundColor: props.primary ? '#007bff' : '#6c757d',
        color: 'white',
      },
    }))

    const result = factory({ primary: true })
    expect(result.classNames.button).toBeDefined()

    // Update with different props
    result.update({ primary: false })

    result.destroy()
  })
})

describe('Theme', () => {
  beforeEach(() => {
    resetTheme()
  })

  it('returns default theme', () => {
    const theme = getTheme()
    expect(theme.colors.primary).toBe('#007bff')
    expect(theme.spacing.md).toBe('16px')
  })

  it('merges custom theme with defaults', () => {
    setTheme({
      colors: {
        primary: '#ff0000',
      },
    })
    const theme = getTheme()
    expect(theme.colors.primary).toBe('#ff0000')
    expect(theme.colors.secondary).toBe('#6c757d') // Default preserved
  })

  it('resets theme to defaults', () => {
    setTheme({ colors: { primary: '#000' } })
    resetTheme()
    const theme = getTheme()
    expect(theme.colors.primary).toBe('#007bff')
  })
})

describe('CSS Variables', () => {
  it('generates CSS variables from theme', () => {
    const vars = cssVariablesFromTheme()
    expect(vars['--flint-color-primary']).toBe('#007bff')
    expect(vars['--flint-spacing-md']).toBe('16px')
  })

  it('injects CSS variables into document', () => {
    const sheet = injectCSSVariables()
    const styleEl = document.querySelector(`[data-flint-style="${sheet.id}"]`)
    expect(styleEl).not.toBeNull()
    expect(styleEl?.textContent).toContain('--flint-color-primary')
    sheet.destroy()
  })
})

describe('mediaQuery', () => {
  it('returns media query marker', () => {
    const result = mediaQuery('md', { padding: '24px' })
    expect(result).toHaveProperty('@media (min-width: 768px)')
  })
})

describe('responsive', () => {
  it('generates responsive styles', () => {
    const result = responsive({
      base: { padding: '8px' },
      md: { padding: '24px' },
      lg: { padding: '32px' },
    })
    expect(result.padding).toBe('8px')
    expect(result['@media (min-width: 768px)']).toBeDefined()
    expect(result['@media (min-width: 992px)']).toBeDefined()
  })
})

describe('createKeyframes', () => {
  it('creates keyframes animation', () => {
    const animName = createKeyframes('fadeIn', {
      from: { opacity: '0' },
      to: { opacity: '1' },
    })
    expect(animName).toMatch(/^flint-fadeIn-/)
    
    const styleEl = document.querySelector(`[data-flint-style="flint-keyframes-${animName}"]`)
    expect(styleEl).not.toBeNull()
  })
})

describe('mergeStyles', () => {
  it('merges multiple style objects', () => {
    const result = mergeStyles(
      { color: 'red' },
      { backgroundColor: 'blue' },
      { padding: '8px' }
    )
    expect(result).toEqual({
      color: 'red',
      backgroundColor: 'blue',
      padding: '8px',
    })
  })

  it('handles undefined/null styles', () => {
    const result = mergeStyles(
      { color: 'red' },
      undefined,
      null,
      { padding: '8px' }
    )
    expect(result).toEqual({ color: 'red', padding: '8px' })
  })
})

describe('cx', () => {
  it('merges style objects', () => {
    const result = cx(
      { color: 'red' },
      { padding: '8px' }
    )
    expect(result).toEqual({ color: 'red', padding: '8px' })
  })

  it('handles class name strings', () => {
    const result = cx('foo', 'bar')
    expect(result.className).toBe('foo bar')
  })

  it('filters falsy values', () => {
    const result = cx(
      { color: 'red' },
      false,
      null,
      undefined,
      { padding: '8px' }
    )
    expect(result).toEqual({ color: 'red', padding: '8px' })
  })
})

describe('styleToString', () => {
  it('converts style object to string', () => {
    const result = styleToString({
      color: 'red',
      fontSize: '16px',
    })
    expect(result).toBe('color: red; font-size: 16px')
  })
})
