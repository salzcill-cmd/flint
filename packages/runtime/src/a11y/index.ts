// Flint Runtime — Accessibility (a11y) Primitives
// Focus management, keyboard navigation, aria-live, reduced-motion

import { state, computed, effect, type Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export interface FocusTrapOptions {
  /** Element to trap focus within */
  container: HTMLElement
  /** Initial element to focus */
  initialFocus?: HTMLElement
  /** Element to return focus to when trap is released */
  returnFocus?: HTMLElement
  /** Whether the trap is active */
  active?: boolean
  /** Callback when escape is pressed */
  onEscape?: () => void
}

export interface KeyboardOptions {
  /** Keys that trigger the callback */
  keys: string | string[]
  /** Modifier keys required */
  modifiers?: {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
  }
  /** Whether the listener is active */
  active?: boolean
}

export interface AriaLiveOptions {
  /** Aria-live politeness level */
  politeness?: 'polite' | 'assertive' | 'off'
  /** Whether to clear the announcement after a delay */
  clearAfter?: number
}

export interface ReducedMotionOptions {
  /** Default value if media query is not available */
  defaultReduced?: boolean
}

// ─── Focus Management ───────────────────────────────────────────

/**
 * Trap focus within a container element (for modals, dialogs).
 *
 * @example
 * const release = useFocusTrap({
 *   container: modalElement,
 *   onEscape: () => closeModal(),
 * })
 * // Later: release() to stop trapping
 */
export function useFocusTrap(options: FocusTrapOptions): () => void {
  const { container, initialFocus, returnFocus, active = true, onEscape } = options

  if (!active) return () => {}

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  function getFocusableElements(): HTMLElement[] {
    return Array.from(container.querySelectorAll(focusableSelector))
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && onEscape) {
      onEscape()
      return
    }

    if (e.key !== 'Tab') return

    const focusable = getFocusableElements()
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  // Focus initial element
  const target = initialFocus || container
  target.focus()

  // Add event listeners
  container.addEventListener('keydown', handleKeyDown)

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown)
    if (returnFocus && returnFocus.isConnected) {
      returnFocus.focus()
    }
  }
}

/**
 * Track focus visibility (for keyboard vs mouse navigation).
 *
 * @example
 * const isFocusVisible = useFocusVisible()
 * // Use in styles: style={{ outline: isFocusVisible() ? '2px solid blue' : 'none' }}
 */
export function useFocusVisible(): Signal<boolean> {
  const isFocusVisible = state(false)

  effect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Tab') {
        isFocusVisible.set(true)
      }
    }

    function handleMouseDown() {
      isFocusVisible.set(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  })

  return isFocusVisible
}

/**
 * Manage focus restoration when elements mount/unmount.
 *
 * @example
 * const { save, restore } = useFocusRestore()
 * save() // Save current focus
 * // ... do something that changes focus
 * restore() // Restore previously saved focus
 */
export function useFocusRestore(): { save: () => void; restore: () => void } {
  let savedElement: HTMLElement | null = null

  return {
    save() {
      savedElement = document.activeElement as HTMLElement
    },
    restore() {
      if (savedElement && savedElement.isConnected) {
        savedElement.focus()
      }
    },
  }
}

// ─── Keyboard Navigation ────────────────────────────────────────

/**
 * Listen for keyboard events with modifier support.
 *
 * @example
 * useKeyboard({
 *   keys: ['Escape'],
 *   modifiers: { shift: false },
 * }, () => closeModal())
 */
export function useKeyboard(
  options: KeyboardOptions,
  callback: (e: KeyboardEvent) => void
): () => void {
  const { keys, modifiers, active = true } = options

  if (!active) return () => {}

  const keySet = new Set(Array.isArray(keys) ? keys : [keys])

  function handler(e: KeyboardEvent) {
    if (!keySet.has(e.key)) return

    if (modifiers) {
      if (modifiers.ctrl && !e.ctrlKey) return
      if (modifiers.shift && !e.shiftKey) return
      if (modifiers.alt && !e.altKey) return
      if (modifiers.meta && !e.metaKey) return
    }

    callback(e)
  }

  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}

/**
 * Arrow key navigation within a list of elements.
 *
 * @example
 * useListNavigation({
 *   container: listElement,
 *   items: () => listElement.querySelectorAll('[role="option"]'),
 *   orientation: 'vertical',
 *   onActiveItem: (item) => setSelectedItem(item),
 * })
 */
export function useListNavigation(options: {
  container: HTMLElement
  items: () => NodeListOf<HTMLElement> | HTMLElement[]
  orientation?: 'horizontal' | 'vertical' | 'both'
  loop?: boolean
  onActiveItem?: (item: HTMLElement, index: number) => void
}): () => void {
  const { container, items, orientation = 'vertical', loop = true, onActiveItem } = options

  function handleKeyDown(e: KeyboardEvent) {
    const itemList = Array.from(items())
    const currentIndex = itemList.indexOf(document.activeElement as HTMLElement)

    let nextIndex = currentIndex
    const isHorizontal = orientation === 'horizontal' || orientation === 'both'
    const isVertical = orientation === 'vertical' || orientation === 'both'

    switch (e.key) {
      case 'ArrowDown':
        if (!isVertical) return
        e.preventDefault()
        nextIndex = currentIndex + 1
        break
      case 'ArrowUp':
        if (!isVertical) return
        e.preventDefault()
        nextIndex = currentIndex - 1
        break
      case 'ArrowRight':
        if (!isHorizontal) return
        e.preventDefault()
        nextIndex = currentIndex + 1
        break
      case 'ArrowLeft':
        if (!isHorizontal) return
        e.preventDefault()
        nextIndex = currentIndex - 1
        break
      case 'Home':
        e.preventDefault()
        nextIndex = 0
        break
      case 'End':
        e.preventDefault()
        nextIndex = itemList.length - 1
        break
      default:
        return
    }

    // Handle looping
    if (loop) {
      if (nextIndex < 0) nextIndex = itemList.length - 1
      if (nextIndex >= itemList.length) nextIndex = 0
    } else {
      nextIndex = Math.max(0, Math.min(itemList.length - 1, nextIndex))
    }

    const nextItem = itemList[nextIndex]
    if (nextItem) {
      nextItem.focus()
      onActiveItem?.(nextItem, nextIndex)
    }
  }

  container.addEventListener('keydown', handleKeyDown)
  return () => container.removeEventListener('keydown', handleKeyDown)
}

// ─── Aria Live Regions ──────────────────────────────────────────

/**
 * Create an aria-live region for screen reader announcements.
 *
 * @example
 * const { announce, clear } = useAriaLive({ politeness: 'polite' })
 * announce('Item added to cart')
 * // Or with assertive for important messages
 * announce('Error: form submission failed', 'assertive')
 */
export function useAriaLive(options: AriaLiveOptions = {}): {
  announce: (message: string, politeness?: 'polite' | 'assertive') => void
  clear: () => void
  element: HTMLDivElement
} {
  const { politeness = 'polite', clearAfter = 1000 } = options

  // Create live region element
  const element = document.createElement('div')
  element.setAttribute('aria-live', politeness)
  element.setAttribute('aria-atomic', 'true')
  element.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);'
  document.body.appendChild(element)

  let clearTimer: ReturnType<typeof setTimeout> | null = null

  function announce(message: string, overridePoliteness?: 'polite' | 'assertive') {
    if (clearTimer !== null) {
      clearTimeout(clearTimer)
    }

    element.setAttribute('aria-live', overridePoliteness || politeness)
    element.textContent = message

    if (clearAfter > 0) {
      clearTimer = setTimeout(() => {
        element.textContent = ''
        clearTimer = null
      }, clearAfter)
    }
  }

  function clear() {
    if (clearTimer !== null) {
      clearTimeout(clearTimer)
      clearTimer = null
    }
    element.textContent = ''
  }

  return { announce, clear, element }
}

// ─── Reduced Motion ─────────────────────────────────────────────

/**
 * Detect if user prefers reduced motion.
 *
 * @example
 * const prefersReducedMotion = useReducedMotion()
 * if (prefersReducedMotion()) {
 *   // Skip animation
 * } else {
 *   // Play animation
 * }
 */
export function useReducedMotion(options: ReducedMotionOptions = {}): Signal<boolean> {
  const { defaultReduced = false } = options

  if (typeof window === 'undefined') {
    const value = state(defaultReduced)
    return value
  }

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const reduced = state(mediaQuery.matches)

  effect(() => {
    function handler(e: MediaQueryListEvent) {
      reduced.set(e.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  })

  return reduced
}

// ─── ARIA Helpers ───────────────────────────────────────────────

/**
 * Generate unique IDs for aria relationships.
 *
 * @example
 * const { id: labelId, prop: labelProps } = useAriaId('label')
 * const { id: descId, prop: descProps } = useAriaId('description')
 * // <input aria-labelledby={labelId} aria-describedby={descId} />
 * // <span id={labelId}>Name</span>
 * // <span id={descId}>Your full name</span>
 */
export function useAriaId(prefix: string = 'flint'): {
  id: string
  prop: { id: string }
} {
  const id = `${prefix}-${Math.random().toString(36).slice(2, 9)}`
  return { id, prop: { id } }
}

/**
 * Create aria props for accessible components.
 *
 * @example
 * const ariaProps = createAriaProps({
 *   role: 'button',
 *   label: 'Close dialog',
 *   expanded: false,
 *   hasPopup: 'menu',
 * })
 * // { role: 'button', 'aria-label': 'Close dialog', 'aria-expanded': 'false', 'aria-haspopup': 'menu' }
 */
export function createAriaProps(config: {
  role?: string
  label?: string
  labelledBy?: string
  describedBy?: string
  expanded?: boolean
  selected?: boolean
  disabled?: boolean
  hidden?: boolean
  live?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: string
  hasPopup?: 'true' | 'menu' | 'listbox' | 'tree' | 'grid'
  controls?: string
  owns?: string
  current?: 'page' | 'step' | 'location' | 'date' | 'time'
  invalid?: boolean
  errormessage?: string
}): Record<string, string | boolean | undefined> {
  const props: Record<string, string | boolean | undefined> = {}

  if (config.role) props.role = config.role
  if (config.label) props['aria-label'] = config.label
  if (config.labelledBy) props['aria-labelledby'] = config.labelledBy
  if (config.describedBy) props['aria-describedby'] = config.describedBy
  if (config.expanded !== undefined) props['aria-expanded'] = String(config.expanded)
  if (config.selected !== undefined) props['aria-selected'] = String(config.selected)
  if (config.disabled !== undefined) props['aria-disabled'] = String(config.disabled)
  if (config.hidden !== undefined) props['aria-hidden'] = String(config.hidden)
  if (config.live) props['aria-live'] = config.live
  if (config.atomic !== undefined) props['aria-atomic'] = String(config.atomic)
  if (config.relevant) props['aria-relevant'] = config.relevant
  if (config.hasPopup) props['aria-haspopup'] = config.hasPopup
  if (config.controls) props['aria-controls'] = config.controls
  if (config.owns) props['aria-owns'] = config.owns
  if (config.current) props['aria-current'] = config.current
  if (config.invalid !== undefined) props['aria-invalid'] = String(config.invalid)
  if (config.errormessage) props['aria-errormessage'] = config.errormessage

  return props
}

// ─── Roving Tabindex ────────────────────────────────────────────

/**
 * Implement roving tabindex for composite widgets (tabs, toolbars, lists).
 *
 * @example
 * useRovingTabindex({
 *   container: tabList,
 *   items: () => tabList.querySelectorAll('[role="tab"]'),
 * })
 */
export function useRovingTabindex(options: {
  container: HTMLElement
  items: () => NodeListOf<HTMLElement> | HTMLElement[]
  orientation?: 'horizontal' | 'vertical'
}): () => void {
  const { container, items, orientation = 'horizontal' } = options

  function handleKeyDown(e: KeyboardEvent) {
    const itemList = Array.from(items())
    const currentIndex = itemList.indexOf(document.activeElement as HTMLElement)

    if (currentIndex === -1) return

    let nextIndex = currentIndex

    if (orientation === 'horizontal') {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        nextIndex = (currentIndex + 1) % itemList.length
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        nextIndex = (currentIndex - 1 + itemList.length) % itemList.length
      }
    } else {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        nextIndex = (currentIndex + 1) % itemList.length
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        nextIndex = (currentIndex - 1 + itemList.length) % itemList.length
      }
    }

    if (e.key === 'Home') {
      e.preventDefault()
      nextIndex = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      nextIndex = itemList.length - 1
    }

    // Update tabindex values
    itemList.forEach((item, i) => {
      item.setAttribute('tabindex', i === nextIndex ? '0' : '-1')
    })

    itemList[nextIndex]?.focus()
  }

  // Set initial tabindex
  const initialItems = Array.from(items())
  initialItems.forEach((item, i) => {
    item.setAttribute('tabindex', i === 0 ? '0' : '-1')
  })

  container.addEventListener('keydown', handleKeyDown)
  return () => container.removeEventListener('keydown', handleKeyDown)
}

// ─── ARIA Helpers ───────────────────────────────────────────────

/**
 * Generate unique IDs for aria relationships.
 *
 * @example
 * const ids = useAriaIds()
 * <label id={ids.label}>Email</label>
 * <input aria-labelledby={ids.label} aria-describedby={ids.description} />
 * <span id={ids.description}>Enter your email</span>
 */
export function useAriaIds(...prefixes: string[]): Record<string, string> {
  const baseId = `flint-${Math.random().toString(36).slice(2, 9)}`
  const ids: Record<string, string> = {}

  if (prefixes.length === 0) {
    prefixes = ['label', 'description']
  }

  for (const prefix of prefixes) {
    ids[prefix] = `${baseId}-${prefix}`
  }

  return ids
}

/**
 * Create aria props for accessible components.
 *
 * @example
 * const aria = useAriaProps({ label: 'Close menu', expanded: isOpen() })
 * <button {...aria}>×</button>
 */
export function useAriaProps(options: {
  label?: string
  labelledBy?: string
  describedBy?: string
  expanded?: boolean
  hasPopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  controls?: string
  current?: boolean | 'page' | 'step' | 'location' | 'date' | 'time'
  disabled?: boolean
  live?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: string
  busy?: boolean
  hidden?: boolean
}): Record<string, any> {
  const props: Record<string, any> = {}

  if (options.label) props['aria-label'] = options.label
  if (options.labelledBy) props['aria-labelledby'] = options.labelledBy
  if (options.describedBy) props['aria-describedby'] = options.describedBy
  if (options.expanded !== undefined) props['aria-expanded'] = options.expanded
  if (options.hasPopup !== undefined) props['aria-haspopup'] = options.hasPopup
  if (options.controls) props['aria-controls'] = options.controls
  if (options.current !== undefined) props['aria-current'] = options.current
  if (options.disabled !== undefined) props['aria-disabled'] = options.disabled
  if (options.live) props['aria-live'] = options.live
  if (options.atomic !== undefined) props['aria-atomic'] = options.atomic
  if (options.relevant) props['aria-relevant'] = options.relevant
  if (options.hidden !== undefined) props['aria-hidden'] = options.hidden

  return props
}

/**
 * Create role props for common patterns.
 *
 * @example
 * const role = useRole('button')
 * <div {...role}>Click me</div>
 */
export function useRole(
  role: string,
  options?: {
    label?: string
    description?: string
    level?: number
    orientation?: 'horizontal' | 'vertical'
    multiline?: boolean
    required?: boolean
    selected?: boolean
    checked?: boolean | 'mixed'
    pressed?: boolean | 'mixed'
    expanded?: boolean
  }
): Record<string, any> {
  const props: Record<string, any> = { role }

  if (options?.label) props['aria-label'] = options.label
  if (options?.description) props['aria-description'] = options.description
  if (options?.level) props['aria-level'] = options.level
  if (options?.orientation) props['aria-orientation'] = options.orientation
  if (options?.multiline !== undefined) props['aria-multiline'] = options.multiline
  if (options?.required !== undefined) props['aria-required'] = options.required
  if (options?.selected !== undefined) props['aria-selected'] = options.selected
  if (options?.checked !== undefined) props['aria-checked'] = options.checked
  if (options?.pressed !== undefined) props['aria-pressed'] = options.pressed
  if (options?.expanded !== undefined) props['aria-expanded'] = options.expanded

  return props
}

// ─── Screen Reader Announcements ────────────────────────────────

/**
 * Announce a message to screen readers.
 *
 * @example
 * announce('Item deleted', 'assertive')
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const el = document.createElement('div')
  el.setAttribute('role', 'status')
  el.setAttribute('aria-live', priority)
  el.setAttribute('aria-atomic', 'true')
  el.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)'
  document.body.appendChild(el)

  setTimeout(() => {
    el.textContent = message
  }, 100)

  setTimeout(() => {
    document.body.removeChild(el)
  }, 1000)
}

/**
 * Announce a polite message to screen readers.
 */
export function announcePolite(message: string): void {
  announce(message, 'polite')
}

/**
 * Announce an assertive message to screen readers.
 */
export function announceAssertive(message: string): void {
  announce(message, 'assertive')
}

// ─── Keyboard Shortcuts ─────────────────────────────────────────

/**
 * Create a keyboard shortcut handler.
 *
 * @example
 * const shortcuts = useKeyboardShortcuts({
 *   'ctrl+s': () => save(),
 *   'escape': () => closeModal(),
 *   'ctrl+z': () => undo(),
 * })
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, (e: KeyboardEvent) => void>
): () => void {
  function handleKeyDown(e: KeyboardEvent) {
    const parts = Object.keys(shortcuts).find((shortcut) => {
      const keys = shortcut.split('+').map((k) => k.trim().toLowerCase())
      const key = e.key.toLowerCase()

      // Check if key matches
      if (!keys.includes(key)) return false

      // Check modifiers
      const needsCtrl = keys.includes('ctrl')
      const needsShift = keys.includes('shift')
      const needsAlt = keys.includes('alt')
      const needsMeta = keys.includes('meta')

      if (needsCtrl && !e.ctrlKey) return false
      if (needsShift && !e.shiftKey) return false
      if (needsAlt && !e.altKey) return false
      if (needsMeta && !e.metaKey) return false

      // If no modifiers needed, but user pressed one, don't match
      if (!needsCtrl && e.ctrlKey) return false
      if (!needsShift && e.shiftKey && key !== 'tab') return false
      if (!needsAlt && e.altKey) return false
      if (!needsMeta && e.metaKey) return false

      return true
    })

    if (parts) {
      e.preventDefault()
      shortcuts[parts](e)
    }
  }

  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}

// ─── Color Contrast ─────────────────────────────────────────────

/**
 * Calculate relative luminance of a color.
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors.
 *
 * @example
 * const ratio = getContrastRatio('#ffffff', '#000000')
 * // ratio === 21 (highest contrast)
 */
export function getContrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const l1 = getLuminance(color1.r, color1.g, color1.b)
  const l2 = getLuminance(color2.r, color2.g, color2.b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if color combination meets WCAG contrast requirements.
 *
 * @example
 * const isAccessible = hasGoodContrast('#ffffff', '#000000', 'AAA')
 */
export function hasGoodContrast(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = getContrastRatio(color1, color2)
  return level === 'AAA' ? ratio >= 7 : ratio >= 4.5
}

// ─── Skip Link ──────────────────────────────────────────────────

/**
 * Create a skip link for keyboard navigation.
 *
 * @example
 * const skipLink = createSkipLink('main-content')
 * document.body.insertBefore(skipLink, document.body.firstChild)
 */
export function createSkipLink(targetId: string, text = 'Skip to main content'): HTMLElement {
  const link = document.createElement('a')
  link.href = `#${targetId}`
  link.textContent = text
  link.className = 'flint-skip-link'
  link.style.cssText = `
    position: absolute;
    left: -9999px;
    z-index: 999;
    padding: 8px 16px;
    background: #000;
    color: #fff;
    text-decoration: none;
    font-size: 14px;
  `
  link.addEventListener('focus', () => {
    link.style.left = '0'
  })
  link.addEventListener('blur', () => {
    link.style.left = '-9999px'
  })
  return link
}

/**
 * Focus an element and announce it.
 *
 * @example
 * focusAndAnnounce(inputElement, 'Email input focused')
 */
export function focusAndAnnounce(element: HTMLElement, message?: string): void {
  element.focus()
  if (message) {
    announce(message)
  }
}

/**
 * Move focus to the next focusable element.
 */
export function focusNext(container: HTMLElement = document.body): void {
  const focusable = container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  const current = document.activeElement
  const index = Array.from(focusable).indexOf(current as Element)
  const next = focusable[(index + 1) % focusable.length] as HTMLElement
  next?.focus()
}

/**
 * Move focus to the previous focusable element.
 */
export function focusPrevious(container: HTMLElement = document.body): void {
  const focusable = container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  const current = document.activeElement
  const index = Array.from(focusable).indexOf(current as Element)
  const prev = focusable[(index - 1 + focusable.length) % focusable.length] as HTMLElement
  prev?.focus()
}

/**
 * Check if an element is visible to screen readers.
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  if (element.hasAttribute('aria-hidden') && element.getAttribute('aria-hidden') === 'true') {
    return false
  }
  if (element.hidden) {
    return false
  }
  if (element.getAttribute('role') === 'presentation') {
    return false
  }
  return true
}

/**
 * Get accessible name for an element.
 */
export function getAccessibleName(element: HTMLElement): string {
  // Check aria-label
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel

  // Check aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    const ids = labelledBy.split(' ')
    const names = ids.map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
    if (names.length > 0) return names.join(' ')
  }

  // Check label element
  const id = element.id
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`)
    if (label) return label.textContent?.trim() ?? ''
  }

  // Check placeholder
  const placeholder = element.getAttribute('placeholder')
  if (placeholder) return placeholder

  // Check title
  const title = element.getAttribute('title')
  if (title) return title

  // Fallback to text content
  return element.textContent?.trim() ?? ''
}
