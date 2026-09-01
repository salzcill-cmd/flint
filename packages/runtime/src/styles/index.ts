// Flint Runtime — Styling System
// CSS-in-JS with scoped styles, dynamic theming, and responsive utilities

// ─── Types ──────────────────────────────────────────────────────

export type CSSProperties = Record<string, string | number>
export type CSSRuleSet = Record<string, CSSProperties | string | number | (() => any)>
export type DynamicStyle = CSSProperties | (() => CSSProperties)
export type StyleValue = string | number | undefined | null

export interface StyleSheet {
  readonly id: string
  readonly classNames: Record<string, string>
  destroy(): void
}

export interface Theme {
  colors: Record<string, string>
  spacing: Record<string, string | number>
  fonts: Record<string, string>
  breakpoints: Record<string, string>
  [key: string]: any
}

// ─── Style ID Generator ─────────────────────────────────────────

let styleCounter = 0
function generateStyleId(): string {
  return `flint-${++styleCounter}`
}

// ─── CSS Injection ──────────────────────────────────────────────

const injectedStyles = new Map<string, HTMLStyleElement>()

function injectStyleSheet(id: string, css: string): HTMLStyleElement {
  if (injectedStyles.has(id)) {
    const existing = injectedStyles.get(id)!
    existing.textContent = css
    return existing
  }

  const style = document.createElement('style')
  style.setAttribute('data-flint-style', id)
  style.textContent = css
  document.head.appendChild(style)
  injectedStyles.set(id, style)
  return style
}

function removeStyleSheet(id: string): void {
  const style = injectedStyles.get(id)
  if (style) {
    style.remove()
    injectedStyles.delete(id)
  }
}

// ─── CSS Object to String ───────────────────────────────────────

function cssObjectToString(selector: string, styles: CSSProperties): string {
  const rules = Object.entries(styles)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      return `  ${kebabKey}: ${value};`
    })
    .join('\n')

  return `${selector} {\n${rules}\n}`
}

// ─── Scoped Class Names ─────────────────────────────────────────

function generateScopedClassName(baseName: string, styleId: string): string {
  const hash = styleId.replace('flint-', '')
  return `${baseName}_${hash}`
}

// ─── createStyles ───────────────────────────────────────────────

/**
 * Create scoped styles with unique class names.
 *
 * @example
 * const styles = createStyles({
 *   container: {
 *     padding: '16px',
 *     backgroundColor: '#fff',
 *   },
 *   title: {
 *     fontSize: '24px',
 *     fontWeight: 'bold',
 *   },
 * })
 *
 * // Usage:
 * <div className={styles.classNames.container}>
 *   <h1 className={styles.classNames.title}>Hello</h1>
 * </div>
 */
export function createStyles<T extends Record<string, CSSProperties>>(
  styles: T
): StyleSheet & { classNames: Record<keyof T, string> } {
  const id = generateStyleId()
  const classNames = {} as Record<keyof T, string>

  // Generate scoped class names and CSS
  const cssRules: string[] = []

  for (const [name, style] of Object.entries(styles)) {
    const scopedName = generateScopedClassName(name, id)
    classNames[name as keyof T] = scopedName
    cssRules.push(cssObjectToString(`.${scopedName}`, style as CSSProperties))
  }

  // Inject styles
  const css = cssRules.join('\n\n')
  injectStyleSheet(id, css)

  return {
    id,
    classNames,
    destroy() {
      removeStyleSheet(id)
    },
  }
}

// ─── createDynamicStyles ────────────────────────────────────────

/**
 * Create styles that can change dynamically based on props/state.
 *
 * @example
 * const styles = createDynamicStyles((props: { primary: boolean }) => ({
 *   button: {
 *     backgroundColor: props.primary ? '#007bff' : '#6c757d',
 *     color: 'white',
 *     padding: '8px 16px',
 *   },
 * }))
 *
 * // Usage:
 * const { classNames, update } = styles({ primary: true })
 * <button className={classNames.button}>Click</button>
 *
 * // Update when props change:
 * update({ primary: false })
 */
export function createDynamicStyles<T extends Record<string, CSSProperties>, P = {}>(
  styleFactory: (props: P) => T
): (props: P) => {
  classNames: Record<keyof T, string>
  update: (newProps: P) => void
  destroy: () => void
} {
  let currentId = generateStyleId()
  let currentClassNames = {} as Record<keyof T, string>

  return (props: P) => {
    const styles = styleFactory(props)
    const classNames = {} as Record<keyof T, string>
    const cssRules: string[] = []

    for (const [name, style] of Object.entries(styles)) {
      const scopedName = generateScopedClassName(name, currentId)
      classNames[name as keyof T] = scopedName
      cssRules.push(cssObjectToString(`.${scopedName}`, style as CSSProperties))
    }

    // Inject or update styles
    const css = cssRules.join('\n\n')
    injectStyleSheet(currentId, css)
    currentClassNames = classNames

    return {
      classNames,
      update(newProps: P) {
        const newStyles = styleFactory(newProps)
        const newCssRules: string[] = []

        for (const [name, style] of Object.entries(newStyles)) {
          const scopedName = generateScopedClassName(name, currentId)
          newCssRules.push(cssObjectToString(`.${scopedName}`, style as CSSProperties))
        }

        injectStyleSheet(currentId, newCssRules.join('\n\n'))
      },
      destroy() {
        removeStyleSheet(currentId)
      },
    }
  }
}

// ─── Theme Provider ─────────────────────────────────────────────

const defaultTheme: Theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    white: '#ffffff',
    black: '#000000',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  breakpoints: {
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1400px',
  },
}

let currentTheme: Theme = { ...defaultTheme }

/**
 * Get the current theme.
 */
export function getTheme(): Theme {
  return currentTheme
}

/**
 * Set the current theme (merges with defaults).
 */
export function setTheme(theme: Partial<Theme>): void {
  currentTheme = {
    ...defaultTheme,
    ...theme,
    colors: { ...defaultTheme.colors, ...theme.colors },
    spacing: { ...defaultTheme.spacing, ...theme.spacing },
    fonts: { ...defaultTheme.fonts, ...theme.fonts },
    breakpoints: { ...defaultTheme.breakpoints, ...theme.breakpoints },
  }
}

/**
 * Reset theme to defaults.
 */
export function resetTheme(): void {
  currentTheme = { ...defaultTheme }
}

// ─── CSS Variables ──────────────────────────────────────────────

/**
 * Generate CSS variables from theme.
 *
 * @example
 * const vars = cssVariablesFromTheme()
 * // Returns: { '--flint-color-primary': '#007bff', ... }
 */
export function cssVariablesFromTheme(theme?: Theme): Record<string, string> {
  const t = theme ?? currentTheme
  const vars: Record<string, string> = {}

  for (const [key, value] of Object.entries(t.colors)) {
    vars[`--flint-color-${key}`] = value
  }

  for (const [key, value] of Object.entries(t.spacing)) {
    vars[`--flint-spacing-${key}`] = String(value)
  }

  for (const [key, value] of Object.entries(t.fonts)) {
    vars[`--flint-font-${key}`] = value
  }

  for (const [key, value] of Object.entries(t.breakpoints)) {
    vars[`--flint-breakpoint-${key}`] = value
  }

  return vars
}

/**
 * Inject CSS variables into :root.
 */
export function injectCSSVariables(theme?: Theme): StyleSheet {
  const vars = cssVariablesFromTheme(theme)
  const css = `:root {\n${
    Object.entries(vars)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n')
  }\n}`

  const id = 'flint-css-variables'
  injectStyleSheet(id, css)
  return {
    id,
    classNames: {},
    destroy() {
      removeStyleSheet(id)
    },
  }
}

// ─── Responsive Utilities ───────────────────────────────────────

/**
 * Generate media query CSS.
 *
 * @example
 * const styles = createStyles({
 *   container: {
 *     padding: '16px',
 *     ...mediaQuery('md', { padding: '24px' }),
 *   },
 * })
 */
export function mediaQuery(
  breakpoint: keyof Theme['breakpoints'],
  styles: CSSProperties
): CSSProperties {
  const bp = currentTheme.breakpoints[breakpoint]
  if (!bp) {
    console.warn(`[Flint] Unknown breakpoint: ${breakpoint}`)
    return {}
  }

  // This returns a marker that will be processed during CSS generation
  return {
    [`@media (min-width: ${bp})`]: JSON.stringify(styles),
  } as any
}

/**
 * Generate responsive styles for multiple breakpoints.
 *
 * @example
 * const styles = createStyles({
 *   container: responsive({
 *     base: { padding: '8px' },
 *     sm: { padding: '16px' },
 *     md: { padding: '24px' },
 *     lg: { padding: '32px' },
 *   }),
 * })
 */
export function responsive(styles: {
  base?: CSSProperties
  sm?: CSSProperties
  md?: CSSProperties
  lg?: CSSProperties
  xl?: CSSProperties
  xxl?: CSSProperties
}): CSSProperties {
  const result: CSSProperties = { ...styles.base }

  for (const [breakpoint, bpStyles] of Object.entries(styles)) {
    if (breakpoint === 'base') continue

    const bp = currentTheme.breakpoints[breakpoint]
    if (bp && bpStyles) {
      result[`@media (min-width: ${bp})`] = JSON.stringify(bpStyles) as any
    }
  }

  return result
}

// ─── Keyframes ──────────────────────────────────────────────────

/**
 * Create CSS keyframes animation.
 *
 * @example
 * const fadeIn = createKeyframes({
 *   from: { opacity: '0' },
 *   to: { opacity: '1' },
 * })
 *
 * const styles = createStyles({
 *   box: {
 *     animation: `${fadeIn} 0.3s ease-in`,
 *   },
 * })
 */
export function createKeyframes(
  name: string,
  frames: Record<string, CSSProperties>
): string {
  const id = generateStyleId()
  const animationName = `flint-${name}-${id.replace('flint-', '')}`

  const frameRules = Object.entries(frames)
    .map(([key, styles]) => {
      const css = Object.entries(styles)
        .map(([prop, value]) => {
          const kebabProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase()
          return `    ${kebabProp}: ${value};`
        })
        .join('\n')
      return `  ${key} {\n${css}\n  }`
    })
    .join('\n')

  const css = `@keyframes ${animationName} {\n${frameRules}\n}`
  injectStyleSheet(`flint-keyframes-${animationName}`, css)

  return animationName
}

// ─── Utility Functions ──────────────────────────────────────────

/**
 * Merge multiple style objects.
 */
export function mergeStyles(...styles: (CSSProperties | undefined | null)[]): CSSProperties {
  return Object.assign({}, ...styles.filter(Boolean))
}

/**
 * Conditionally apply styles.
 *
 * @example
 * <div style={cx(styles.base, isActive && styles.active, isDisabled && styles.disabled)}>
 */
export function cx(
  ...styles: (CSSProperties | string | undefined | null | false)[]
): CSSProperties {
  const result: CSSProperties = {}

  for (const style of styles) {
    if (!style) continue

    if (typeof style === 'string') {
      // Class name string - convert to className
      result.className = result.className
        ? `${result.className} ${style}`
        : style
    } else {
      Object.assign(result, style)
    }
  }

  return result
}

/**
 * Convert style object to inline style string.
 */
export function styleToString(styles: CSSProperties): string {
  return Object.entries(styles)
    .map(([key, value]) => {
      const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      return `${kebabKey}: ${value}`
    })
    .join('; ')
}
