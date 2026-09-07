// Flint Runtime — Styling Shortcuts v4
// sx(), css, and utility helpers for fast styling

// ─── sx() — Tailwind-Style Utility ──────────────────────────────

/**
 * Create style object from utility classes (like Tailwind but as style objects).
 *
 * @example
 * sx('flex items-center gap-2 p-4 bg-white rounded shadow')
 *
 * // Or with responsive/conditional:
 * sx({
 *   base: 'flex items-center',
 *   hover: 'bg-blue-500',
 *   active: 'bg-blue-700',
 * })
 */
export function sx(classes: string): Record<string, any> {
  const styles: Record<string, any> = {}
  const tokens = classes.split(/\s+/).filter(Boolean)

  for (const token of tokens) {
    Object.assign(styles, parseSxToken(token))
  }

  return styles
}

function parseSxToken(token: string): Record<string, any> {
  // Display
  if (token === 'flex') return { display: 'flex' }
  if (token === 'grid') return { display: 'grid' }
  if (token === 'block') return { display: 'block' }
  if (token === 'inline') return { display: 'inline' }
  if (token === 'hidden') return { display: 'none' }
  if (token === 'inline-flex') return { display: 'inline-flex' }

  // Direction
  if (token === 'flex-row') return { flexDirection: 'row' }
  if (token === 'flex-col') return { flexDirection: 'column' }
  if (token === 'flex-wrap') return { flexWrap: 'wrap' }

  // Align
  if (token === 'items-start') return { alignItems: 'flex-start' }
  if (token === 'items-center') return { alignItems: 'center' }
  if (token === 'items-end') return { alignItems: 'flex-end' }
  if (token === 'items-stretch') return { alignItems: 'stretch' }
  if (token === 'self-start') return { alignSelf: 'flex-start' }
  if (token === 'self-center') return { alignSelf: 'center' }
  if (token === 'self-end') return { alignSelf: 'flex-end' }

  // Justify
  if (token === 'justify-start') return { justifyContent: 'flex-start' }
  if (token === 'justify-center') return { justifyContent: 'center' }
  if (token === 'justify-end') return { justifyContent: 'flex-end' }
  if (token === 'justify-between') return { justifyContent: 'space-between' }
  if (token === 'justify-around') return { justifyContent: 'space-around' }
  if (token === 'justify-evenly') return { justifyContent: 'space-evenly' }

  // Gap
  if (token === 'gap-1') return { gap: '0.25rem' }
  if (token === 'gap-2') return { gap: '0.5rem' }
  if (token === 'gap-3') return { gap: '0.75rem' }
  if (token === 'gap-4') return { gap: '1rem' }
  if (token === 'gap-5') return { gap: '1.25rem' }
  if (token === 'gap-6') return { gap: '1.5rem' }
  if (token === 'gap-8') return { gap: '2rem' }

  // Padding
  if (token === 'p-0') return { padding: '0' }
  if (token === 'p-1') return { padding: '0.25rem' }
  if (token === 'p-2') return { padding: '0.5rem' }
  if (token === 'p-3') return { padding: '0.75rem' }
  if (token === 'p-4') return { padding: '1rem' }
  if (token === 'p-5') return { padding: '1.25rem' }
  if (token === 'p-6') return { padding: '1.5rem' }
  if (token === 'p-8') return { padding: '2rem' }
  if (token === 'px-4') return { paddingLeft: '1rem', paddingRight: '1rem' }
  if (token === 'py-4') return { paddingTop: '1rem', paddingBottom: '1rem' }
  if (token === 'px-6') return { paddingLeft: '1.5rem', paddingRight: '1.5rem' }
  if (token === 'py-6') return { paddingTop: '1.5rem', paddingBottom: '1.5rem' }

  // Margin
  if (token === 'm-0') return { margin: '0' }
  if (token === 'm-1') return { margin: '0.25rem' }
  if (token === 'm-2') return { margin: '0.5rem' }
  if (token === 'm-3') return { margin: '0.75rem' }
  if (token === 'm-4') return { margin: '1rem' }
  if (token === 'mx-auto') return { marginLeft: 'auto', marginRight: 'auto' }
  if (token === 'mt-4') return { marginTop: '1rem' }
  if (token === 'mb-4') return { marginBottom: '1rem' }

  // Width/Height
  if (token === 'w-full') return { width: '100%' }
  if (token === 'h-full') return { height: '100%' }
  if (token === 'min-h-screen') return { minHeight: '100vh' }
  if (token === 'max-w-md') return { maxWidth: '28rem' }
  if (token === 'max-w-lg') return { maxWidth: '32rem' }
  if (token === 'max-w-xl') return { maxWidth: '36rem' }
  if (token === 'max-w-2xl') return { maxWidth: '42rem' }

  // Text
  if (token === 'text-xs') return { fontSize: '0.75rem' }
  if (token === 'text-sm') return { fontSize: '0.875rem' }
  if (token === 'text-base') return { fontSize: '1rem' }
  if (token === 'text-lg') return { fontSize: '1.125rem' }
  if (token === 'text-xl') return { fontSize: '1.25rem' }
  if (token === 'text-2xl') return { fontSize: '1.5rem' }
  if (token === 'text-3xl') return { fontSize: '1.875rem' }
  if (token === 'font-normal') return { fontWeight: '400' }
  if (token === 'font-medium') return { fontWeight: '500' }
  if (token === 'font-semibold') return { fontWeight: '600' }
  if (token === 'font-bold') return { fontWeight: '700' }
  if (token === 'text-left') return { textAlign: 'left' }
  if (token === 'text-center') return { textAlign: 'center' }
  if (token === 'text-right') return { textAlign: 'right' }

  // Color (basic)
  if (token === 'text-white') return { color: 'white' }
  if (token === 'text-black') return { color: '#000' }
  if (token === 'text-gray-500') return { color: '#6b7280' }
  if (token === 'text-gray-700') return { color: '#374151' }
  if (token === 'text-blue-500') return { color: '#3b82f6' }
  if (token === 'text-blue-600') return { color: '#2563eb' }
  if (token === 'text-green-500') return { color: '#22c55e' }
  if (token === 'text-red-500') return { color: '#ef4444' }

  // Background
  if (token === 'bg-white') return { background: 'white' }
  if (token === 'bg-black') return { background: '#000' }
  if (token === 'bg-gray-50') return { background: '#f9fafb' }
  if (token === 'bg-gray-100') return { background: '#f3f4f6' }
  if (token === 'bg-gray-200') return { background: '#e5e7eb' }
  if (token === 'bg-blue-500') return { background: '#3b82f6' }
  if (token === 'bg-blue-600') return { background: '#2563eb' }
  if (token === 'bg-green-500') return { background: '#22c55e' }
  if (token === 'bg-red-500') return { background: '#ef4444' }
  if (token === 'bg-red-100') return { background: '#fee2e2' }
  if (token === 'bg-transparent') return { background: 'transparent' }

  // Border
  if (token === 'border') return { border: '1px solid #e5e7eb' }
  if (token === 'border-2') return { border: '2px solid #e5e7eb' }
  if (token === 'border-gray-200') return { borderColor: '#e5e7eb' }
  if (token === 'border-gray-300') return { borderColor: '#d1d5db' }
  if (token === 'border-blue-500') return { borderColor: '#3b82f6' }
  if (token === 'border-red-500') return { borderColor: '#ef4444' }
  if (token === 'border-none') return { border: 'none' }

  // Rounded
  if (token === 'rounded') return { borderRadius: '0.25rem' }
  if (token === 'rounded-md') return { borderRadius: '0.375rem' }
  if (token === 'rounded-lg') return { borderRadius: '0.5rem' }
  if (token === 'rounded-xl') return { borderRadius: '0.75rem' }
  if (token === 'rounded-2xl') return { borderRadius: '1rem' }
  if (token === 'rounded-full') return { borderRadius: '9999px' }

  // Shadow
  if (token === 'shadow-sm') return { boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }
  if (token === 'shadow') return { boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)' }
  if (token === 'shadow-md') return { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)' }
  if (token === 'shadow-lg') return { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)' }
  if (token === 'shadow-xl') return { boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }

  // Position
  if (token === 'relative') return { position: 'relative' }
  if (token === 'absolute') return { position: 'absolute' }
  if (token === 'fixed') return { position: 'fixed' }
  if (token === 'sticky') return { position: 'sticky' }

  // Overflow
  if (token === 'overflow-hidden') return { overflow: 'hidden' }
  if (token === 'overflow-auto') return { overflow: 'auto' }
  if (token === 'overflow-scroll') return { overflow: 'scroll' }

  // Cursor
  if (token === 'cursor-pointer') return { cursor: 'pointer' }
  if (token === 'cursor-not-allowed') return { cursor: 'not-allowed' }
  if (token === 'cursor-default') return { cursor: 'default' }

  // Opacity
  if (token === 'opacity-0') return { opacity: '0' }
  if (token === 'opacity-50') return { opacity: '0.5' }
  if (token === 'opacity-75') return { opacity: '0.75' }
  if (token === 'opacity-100') return { opacity: '1' }

  // Transition
  if (token === 'transition') return { transition: 'all 0.15s ease-in-out' }
  if (token === 'transition-colors') return { transition: 'color 0.15s, background-color 0.15s, border-color 0.15s' }
  if (token === 'transition-transform') return { transition: 'transform 0.15s ease-in-out' }

  // Z-index
  if (token === 'z-0') return { zIndex: '0' }
  if (token === 'z-10') return { zIndex: '10' }
  if (token === 'z-20') return { zIndex: '20' }
  if (token === 'z-30') return { zIndex: '30' }
  if (token === 'z-40') return { zIndex: '40' }
  if (token === 'z-50') return { zIndex: '50' }

  // Truncate
  if (token === 'truncate') return {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  // No wrap
  if (token === 'whitespace-nowrap') return { whiteSpace: 'nowrap' }
  if (token === 'whitespace-normal') return { whiteSpace: 'normal' }

  // Line height
  if (token === 'leading-tight') return { lineHeight: '1.25' }
  if (token === 'leading-normal') return { lineHeight: '1.5' }
  if (token === 'leading-loose') return { lineHeight: '2' }

  // Letter spacing
  if (token === 'tracking-tight') return { letterSpacing: '-0.05em' }
  if (token === 'tracking-normal') return { letterSpacing: '0' }
  if (token === 'tracking-wide') return { letterSpacing: '0.05em' }

  // User select
  if (token === 'select-none') return { userSelect: 'none' }
  if (token === 'select-all') return { userSelect: 'all' }

  // Pointer events
  if (token === 'pointer-events-none') return { pointerEvents: 'none' }
  if (token === 'pointer-events-auto') return { pointerEvents: 'auto' }

  // Inset (position helpers)
  if (token === 'inset-0') return { top: '0', right: '0', bottom: '0', left: '0' }
  if (token === 'top-0') return { top: '0' }
  if (token === 'right-0') return { right: '0' }
  if (token === 'bottom-0') return { bottom: '0' }
  if (token === 'left-0') return { left: '0' }

  // Unknown token — return empty
  return {}
}

// ─── mergeStyles() — Merge Multiple Style Objects ───────────────

/**
 * Merge multiple style objects into one.
 *
 * @example
 * mergeStyles(
 *   { padding: '1rem' },
 *   { background: 'white' },
 *   { borderRadius: '0.5rem' }
 * )
 */
export function mergeStyles(...styles: Array<Record<string, any> | undefined | null>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const style of styles) {
    if (style) {
      Object.assign(result, style)
    }
  }
  return result
}

// ─── css() — CSS String to Object ───────────────────────────────

/**
 * Parse CSS string to style object.
 *
 * @example
 * css('padding: 1rem; background: white; border-radius: 0.5rem;')
 */
export function css(cssString: string): Record<string, any> {
  const styles: Record<string, any> = {}
  const declarations = cssString.split(';').filter(Boolean)

  for (const decl of declarations) {
    const colonIndex = decl.indexOf(':')
    if (colonIndex === -1) continue

    const prop = decl.slice(0, colonIndex).trim()
    const value = decl.slice(colonIndex + 1).trim()

    // Convert kebab-case to camelCase
    const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    styles[camelProp] = value
  }

  return styles
}

// ─── clsx() — Conditional Class Names ───────────────────────────

/**
 * Conditional class name builder (like clsx).
 *
 * @example
 * clsx('btn', isActive() && 'btn-active', isDisabled && 'btn-disabled')
 */
export function clsx(...args: Array<string | boolean | undefined | null | Record<string, boolean>>): string {
  const classes: string[] = []

  for (const arg of args) {
    if (!arg) continue

    if (typeof arg === 'string') {
      classes.push(arg)
    } else if (typeof arg === 'object') {
      for (const [key, value] of Object.entries(arg)) {
        if (value) {
          classes.push(key)
        }
      }
    }
  }

  return classes.join(' ')
}

// ─── tw() — Tailwind Template Literal ───────────────────────────

/**
 * Template literal version of sx().
 *
 * @example
 * tw`flex items-center gap-2 p-4 bg-white rounded shadow`
 */
export function tw(strings: TemplateStringsArray, ...values: any[]): Record<string, any> {
  let result = ''
  for (let i = 0; i < strings.length; i++) {
    result += strings[i]
    if (i < values.length) {
      result += values[i]
    }
  }
  return sx(result)
}
