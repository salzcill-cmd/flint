// Flint Runtime — Simplified UI Components v4
// Ready-to-use components for maximum productivity

import { h } from '../renderer/index.js'
import type { Child } from '../renderer/index.js'
import { state, computed, effect, batch } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

type Renderable = Child | (() => Child)

// ─── Text — Simple Text Display ─────────────────────────────────

/**
 * Display text with optional formatting.
 *
 * @example
 * <Text size="lg" weight="bold" color="primary">Hello World</Text>
 * <Text muted>Secondary text</Text>
 */
export function Text(props: {
  children: Child
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  color?: string
  muted?: boolean
  align?: 'left' | 'center' | 'right'
  class?: string
  style?: Record<string, any>
}): Child {
  const sizeMap = {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
  }

  const weightMap = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }

  return h('span', {
    class: props.class,
    style: {
      fontSize: props.size ? sizeMap[props.size] : undefined,
      fontWeight: props.weight ? weightMap[props.weight] : undefined,
      color: props.muted ? '#6b7280' : props.color,
      textAlign: props.align,
      ...props.style,
    },
  }, props.children)
}

// ─── Input — Simplified Input ───────────────────────────────────

/**
 * Simplified input with two-way binding.
 *
 * @example
 * const name = state('')
 * <Input bind={name} placeholder="Enter name" />
 * <Input bind={name} type="email" label="Email" />
 * <Input bind={name} error="Required" />
 */
export function Input(props: {
  bind?: { (): any; set: (v: any) => void }
  type?: string
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  class?: string
  style?: Record<string, any>
  onInput?: (e: Event) => void
  onChange?: (e: Event) => void
  onBlur?: (e: Event) => void
}): Child {
  const input = h('input', {
    type: props.type ?? 'text',
    placeholder: props.placeholder,
    value: props.bind ? props.bind() : '',
    disabled: props.disabled,
    class: props.class,
    style: {
      padding: '0.5rem 0.75rem',
      border: `1px solid ${props.error ? '#ef4444' : '#d1d5db'}`,
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      width: '100%',
      ...props.style,
    },
    onInput: (e: Event) => {
      const target = e.target as HTMLInputElement
      if (props.bind) {
        props.bind.set(target.value)
      }
      props.onInput?.(e)
    },
    onChange: props.onChange,
    onBlur: props.onBlur,
  })

  if (props.label || props.error) {
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem' } },
      props.label ? h('label', { style: { fontSize: '0.875rem', fontWeight: '500' } }, props.label) : null,
      input,
      props.error ? h('span', { style: { fontSize: '0.75rem', color: '#ef4444' } }, props.error) : null
    )
  }

  return input
}

// ─── Button — Enhanced Button ───────────────────────────────────

/**
 * Enhanced button with loading state.
 *
 * @example
 * <Button onClick={save}>Save</Button>
 * <Button loading={isSaving()} variant="primary">Save</Button>
 * <Button danger onClick={deleteItem}>Delete</Button>
 */
export function Button(props: {
  children: Child
  onClick?: (e: Event) => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  class?: string
  style?: Record<string, any>
}): Child {
  const variantStyles: Record<string, Record<string, string>> = {
    primary: { background: '#3b82f6', color: 'white' },
    secondary: { background: '#6b7280', color: 'white' },
    danger: { background: '#ef4444', color: 'white' },
    ghost: { background: 'transparent', color: '#374151' },
  }

  const sizeStyles: Record<string, Record<string, string>> = {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.75rem' },
    md: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
    lg: { padding: '0.625rem 1.25rem', fontSize: '1rem' },
  }

  const variant = props.variant ?? 'primary'
  const size = props.size ?? 'md'

  return h('button', {
    disabled: props.disabled || props.loading,
    class: props.class,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      border: 'none',
      borderRadius: '0.375rem',
      cursor: props.disabled || props.loading ? 'not-allowed' : 'pointer',
      opacity: props.disabled || props.loading ? '0.5' : '1',
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...props.style,
    },
    onClick: props.onClick,
  }, props.loading ? 'Loading...' : props.children)
}

// ─── Card — Container Card ──────────────────────────────────────

/**
 * Simple card container.
 *
 * @example
 * <Card>
 *   <Text weight="bold">Title</Text>
 *   <Text muted>Content</Text>
 * </Card>
 */
export function Card(props: {
  children: Child
  padding?: string
  class?: string
  style?: Record<string, any>
}): Child {
  return h('div', {
    class: props.class,
    style: {
      padding: props.padding ?? '1.5rem',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb',
      background: 'white',
      ...props.style,
    },
  }, props.children)
}

// ─── Tabs — Tab Navigation ──────────────────────────────────────

/**
 * Tab navigation component.
 *
 * @example
 * const active = state('tab1')
 * <Tabs
 *   value={active()}
 *   onChange={active.set}
 *   items={[
 *     { key: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
 *     { key: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
 *   ]}
 * />
 */
export function Tabs(props: {
  value: string
  onChange: (key: string) => void
  items: Array<{ key: string; label: string; content: Child }>
  class?: string
  style?: Record<string, any>
}): Child {
  const activeItem = computed(() => props.items.find(i => i.key === props.value) ?? props.items[0])

  return h('div', {
    class: props.class,
    style: { ...props.style },
  },
    h('div', {
      style: { display: 'flex', gap: '0', borderBottom: '1px solid #e5e7eb' },
    },
      ...props.items.map(item =>
        h('button', {
          style: {
            padding: '0.5rem 1rem',
            border: 'none',
            borderBottom: `2px solid ${item.key === props.value ? '#3b82f6' : 'transparent'}`,
            background: 'transparent',
            cursor: 'pointer',
            color: item.key === props.value ? '#3b82f6' : '#6b7280',
            fontWeight: item.key === props.value ? '500' : '400',
          },
          onClick: () => props.onChange(item.key),
        }, item.label)
      )
    ),
    h('div', { style: { padding: '1rem 0' } }, activeItem().content)
  )
}

// ─── Modal — Dialog Modal ───────────────────────────────────────

/**
 * Modal dialog component.
 *
 * @example
 * const showModal = state(false)
 * <Modal open={showModal()} onClose={() => showModal.set(false)}>
 *   <Text weight="bold">Modal Title</Text>
 *   <Text>Content here</Text>
 * </Modal>
 */
export function Modal(props: {
  open: boolean
  onClose: () => void
  children: Child
  title?: string
  class?: string
  style?: Record<string, any>
}): Child {
  if (!props.open) return null

  return h('div', {
    style: {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '1000',
    },
    onClick: (e: Event) => {
      if ((e.target as HTMLElement).style.position === 'fixed') {
        props.onClose()
      }
    },
  },
    h('div', {
      class: props.class,
      style: {
        background: 'white',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        minWidth: '300px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        ...props.style,
      },
    },
      props.title ? h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' } },
        h('h2', { style: { margin: '0', fontSize: '1.25rem', fontWeight: '600' } }, props.title),
        h('button', {
          style: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' },
          onClick: props.onClose,
        }, '×')
      ) : null,
      props.children
    )
  )
}

// ─── Accordion — Expandable Section ─────────────────────────────

/**
 * Accordion component for expandable content.
 *
 * @example
 * <Accordion items={[
 *   { title: 'Section 1', content: <div>Content 1</div> },
 *   { title: 'Section 2', content: <div>Content 2</div> },
 * ]} />
 */
export function Accordion(props: {
  items: Array<{ title: string; content: Child }>
  class?: string
  style?: Record<string, any>
}): Child {
  const expanded = state<number | null>(null)

  return h('div', {
    class: props.class,
    style: { ...props.style },
  },
    ...props.items.map((item, index) =>
      h('div', {
        style: { borderBottom: '1px solid #e5e7eb' },
      },
        h('button', {
          style: {
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            padding: '1rem',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            fontWeight: '500',
          },
          onClick: () => expanded.set(expanded() === index ? null : index),
        },
          item.title,
          h('span', { style: { transition: 'transform 0.2s', transform: expanded() === index ? 'rotate(180deg)' : 'rotate(0)' } }, '▼')
        ),
        expanded() === index ? h('div', { style: { padding: '0 1rem 1rem' } }, item.content) : null
      )
    )
  )
}

// ─── Alert — Notification Alert ─────────────────────────────────

/**
 * Alert notification component.
 *
 * @example
 * <Alert type="success" title="Saved!">Your changes have been saved.</Alert>
 * <Alert type="error">Something went wrong.</Alert>
 */
export function Alert(props: {
  children: Child
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  class?: string
  style?: Record<string, any>
}): Child {
  const typeStyles: Record<string, Record<string, string>> = {
    info: { background: '#eff6ff', border: '#3b82f6', color: '#1e40af' },
    success: { background: '#f0fdf4', border: '#22c55e', color: '#166534' },
    warning: { background: '#fffbeb', border: '#f59e0b', color: '#92400e' },
    error: { background: '#fef2f2', border: '#ef4444', color: '#991b1b' },
  }

  const type = props.type ?? 'info'
  const styles = typeStyles[type]

  return h('div', {
    class: props.class,
    style: {
      padding: '1rem',
      borderRadius: '0.5rem',
      borderLeft: `4px solid ${styles.border}`,
      background: styles.background,
      color: styles.color,
      ...props.style,
    },
  },
    props.title ? h('div', { style: { fontWeight: '600', marginBottom: '0.25rem' } }, props.title) : null,
    h('div', {}, props.children)
  )
}

// ─── Spinner — Loading Indicator ────────────────────────────────

/**
 * Loading spinner component.
 *
 * @example
 * <Spinner />
 * <Spinner size="lg" />
 */
export function Spinner(props: {
  size?: 'sm' | 'md' | 'lg'
  class?: string
  style?: Record<string, any>
}): Child {
  const sizeMap = { sm: '16px', md: '24px', lg: '32px' }
  const size = props.size ?? 'md'

  return h('div', {
    class: props.class,
    style: {
      display: 'inline-block',
      width: sizeMap[size],
      height: sizeMap[size],
      border: '2px solid #e5e7eb',
      borderTopColor: '#3b82f6',
      borderRadius: '50%',
      animation: 'flint-spin 0.6s linear infinite',
      ...props.style,
    },
  })
}

// ─── Badge — Status Badge ───────────────────────────────────────

/**
 * Badge/tag component for status display.
 *
 * @example
 * <Badge color="green">Active</Badge>
 * <Badge color="red">Error</Badge>
 */
export function Badge(props: {
  children: Child
  color?: string
  class?: string
  style?: Record<string, any>
}): Child {
  const color = props.color ?? '#6b7280'

  return h('span', {
    class: props.class,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.125rem 0.5rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '500',
      background: color,
      color: 'white',
      ...props.style,
    },
  }, props.children)
}

// ─── Divider — Separator Line ───────────────────────────────────

/**
 * Horizontal divider/separator.
 *
 * @example
 * <Divider />
 * <Divider spacing="md" />
 */
export function Divider(props: {
  spacing?: 'sm' | 'md' | 'lg'
  class?: string
  style?: Record<string, any>
}): Child {
  const spacingMap = { sm: '0.5rem', md: '1rem', lg: '1.5rem' }
  const spacing = props.spacing ?? 'md'

  return h('hr', {
    class: props.class,
    style: {
      border: 'none',
      borderTop: '1px solid #e5e7eb',
      margin: `${spacing} 0`,
      ...props.style,
    },
  })
}

// ─── Stack — Flex Container ─────────────────────────────────────

/**
 * Flex stack container.
 *
 * @example
 * <Stack direction="column" gap="1rem">
 *   <Text>Item 1</Text>
 *   <Text>Item 2</Text>
 * </Stack>
 */
export function Stack(props: {
  children: Child
  direction?: 'row' | 'column'
  gap?: string
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  class?: string
  style?: Record<string, any>
}): Child {
  const justifyMap: Record<string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
  }

  return h('div', {
    class: props.class,
    style: {
      display: 'flex',
      flexDirection: props.direction ?? 'row',
      gap: props.gap ?? '0',
      alignItems: props.align ?? 'stretch',
      justifyContent: justifyMap[props.justify ?? 'start'],
      ...props.style,
    },
  }, props.children)
}

// ─── Grid — Grid Container ──────────────────────────────────────

/**
 * Grid layout container.
 *
 * @example
 * <Grid cols={3} gap="1rem">
 *   <div>Cell 1</div>
 *   <div>Cell 2</div>
 *   <div>Cell 3</div>
 * </Grid>
 */
export function Grid(props: {
  children: Child
  cols?: number
  gap?: string
  class?: string
  style?: Record<string, any>
}): Child {
  return h('div', {
    class: props.class,
    style: {
      display: 'grid',
      gridTemplateColumns: `repeat(${props.cols ?? 3}, 1fr)`,
      gap: props.gap ?? '1rem',
      ...props.style,
    },
  }, props.children)
}

// ─── Empty State ────────────────────────────────────────────────

/**
 * Empty state placeholder.
 *
 * @example
 * <EmptyState icon="📦" title="No items" description="Create your first item" />
 */
export function EmptyState(props: {
  icon?: string
  title: string
  description?: string
  action?: Child
  class?: string
  style?: Record<string, any>
}): Child {
  return h('div', {
    class: props.class,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem',
      textAlign: 'center',
      color: '#6b7280',
      ...props.style,
    },
  },
    props.icon ? h('div', { style: { fontSize: '3rem', marginBottom: '1rem' } }, props.icon) : null,
    h('div', { style: { fontSize: '1.125rem', fontWeight: '500', color: '#111827', marginBottom: '0.5rem' } }, props.title),
    props.description ? h('div', { style: { marginBottom: '1rem' } }, props.description) : null,
    props.action ?? null
  )
}
