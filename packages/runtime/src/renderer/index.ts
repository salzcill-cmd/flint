// Flint Runtime — DOM Renderer v2
// Fine-grained reactive DOM updates with signal tracking
// No Virtual DOM — direct surgical DOM mutations

import { effect, batch, type CleanupFn } from '@flint/reactivity'
import { mountComponent, type ComponentInstance } from '../component/index.js'

// ─── Types ──────────────────────────────────────────────────────

export type Component = (props: any) => any
export type Child = Node | string | number | boolean | null | undefined | Child[]
export type Props = Record<string, any> | null

export interface ReactiveNode {
  node: Node
  dispose: () => void
}

// ─── Internal State ─────────────────────────────────────────────

let currentOwner: Owner | null = null

interface Owner {
  disposables: CleanupFn[]
  parent: Owner | null
}

function createOwner(): Owner {
  const owner: Owner = { disposables: [], parent: currentOwner }
  currentOwner = owner
  return owner
}

function trackDisposable(disposable: CleanupFn): void {
  if (currentOwner) {
    currentOwner.disposables.push(disposable)
  }
}

function disposeOwner(owner: Owner): void {
  for (const disposable of owner.disposables) {
    try {
      disposable()
    } catch (e) {
      console.warn('[Flint] Disposable cleanup failed:', e)
    }
  }
  owner.disposables.length = 0
}

// ─── Reactive Wrappers ──────────────────────────────────────────

/**
 * Create a reactive text node that updates when signals change.
 * The compiler should wrap each {expression} in track() for fine-grained updates.
 *
 * @example
 * // Compiled from: <div>{count()}</div>
 * const text = track(() => count())
 * div.appendChild(text)
 */
export function track<T>(
  fn: () => T,
  options?: { equals?: boolean | ((prev: T, next: T) => boolean) }
): Text {
  const textNode = document.createTextNode('')

  const eff = effect(() => {
    const value = fn()
    const str = value == null ? '' : String(value)
    if (textNode.data !== str) {
      textNode.data = str
    }
  })

  trackDisposable(eff.dispose)
  return textNode
}

/**
 * Create a reactive attribute that updates when signals change.
 *
 * @example
 * // Compiled from: <div class={activeClass()} />
 * trackAttribute(div, 'class', () => activeClass())
 */
export function trackAttribute<T>(
  element: HTMLElement,
  attr: string,
  fn: () => T,
  options?: { equals?: boolean | ((prev: T, next: T) => boolean) }
): void {
  const eff = effect(() => {
    const value = fn()
    if (attr === 'class' || attr === 'className') {
      if (typeof value === 'string') {
        element.className = value
      } else if (Array.isArray(value)) {
        element.className = value.filter(Boolean).join(' ')
      }
    } else if (attr === 'style' && typeof value === 'object') {
      Object.assign(element.style, value)
    } else if (value === true) {
      element.setAttribute(attr, '')
    } else if (value === false || value == null) {
      element.removeAttribute(attr)
    } else {
      element.setAttribute(attr, String(value))
    }
  })

  trackDisposable(eff.dispose)
}

/**
 * Create a reactive event handler that updates when signals change.
 *
 * @example
 * // Compiled from: <button onClick={() => count.set(c => c + 1)}>+</button>
 * trackEvent(button, 'click', () => () => count.set(c => c + 1))
 */
export function trackEvent(
  element: HTMLElement,
  event: string,
  handlerFn: () => (e: Event) => void
): void {
  let currentHandler: ((e: Event) => void) | null = null

  const eff = effect(() => {
    // Remove old handler
    if (currentHandler) {
      element.removeEventListener(event, currentHandler)
    }
    // Get new handler
    currentHandler = handlerFn()
    // Add new handler
    if (currentHandler) {
      element.addEventListener(event, currentHandler)
    }
  })

  trackDisposable(() => {
    if (currentHandler) {
      element.removeEventListener(event, currentHandler)
    }
  })
  trackDisposable(eff.dispose)
}

/**
 * Create reactive children that update when signals change.
 *
 * @example
 * // Compiled from: <div>{items().map(item => <span>{item}</span>)}</div>
 * trackChildren(div, () => items().map(item => h('span', null, item)))
 */
export function trackChildren(
  parent: Node,
  childrenFn: () => Child,
  options?: { anchor?: Node }
): void {
  let currentNodes: Node[] = []
  const anchor = options?.anchor ?? null

  const eff = effect(() => {
    // Remove old nodes
    for (const node of currentNodes) {
      if (parent.contains(node)) {
        parent.removeChild(node)
      }
    }
    currentNodes = []

    // Get new children
    const children = childrenFn()
    const newNodes = flattenToNodes(children)

    // Insert new nodes
    for (const node of newNodes) {
      if (anchor && anchor.parentNode === parent) {
        parent.insertBefore(node, anchor)
      } else {
        parent.appendChild(node)
      }
    }
    currentNodes = newNodes
  })

  trackDisposable(() => {
    for (const node of currentNodes) {
      if (parent.contains(node)) {
        parent.removeChild(node)
      }
    }
  })
  trackDisposable(eff.dispose)
}

/**
 * Wrap a component render with tracking for fine-grained updates.
 * This replaces the old full re-render approach.
 */
export function trackComponent<P>(
  ComponentFn: (props: P) => Child,
  props: P
): { node: Node; update: (newProps: Partial<P>) => void; dispose: () => void } {
  const owner = createOwner()
  let currentResult: Node | null = null

  const eff = effect(() => {
    const result = ComponentFn(props)
    if (currentResult && currentResult.parentNode) {
      currentResult.parentNode.removeChild(currentResult)
    }
    currentResult = nodeify(result)
  })

  trackDisposable(eff.dispose)

  return {
    get node() { return currentResult ?? document.createDocumentFragment() },
    update(newProps: Partial<P>) {
      Object.assign(props as Record<string, any>, newProps)
    },
    dispose() {
      eff.dispose()
      disposeOwner(owner)
      if (currentResult?.parentNode) {
        currentResult.parentNode.removeChild(currentResult)
      }
    },
  }
}

// ─── h() — JSX Factory ─────────────────────────────────────────

/**
 * Create a DOM element or component from JSX.
 * This is the core function that all compiled JSX calls.
 *
 * For fine-grained updates, the compiler should generate calls to:
 * - track() for reactive text expressions
 * - trackAttribute() for reactive attribute expressions
 * - trackChildren() for reactive children expressions
 * - trackEvent() for reactive event handlers
 */
export function h(tag: string | Component | null, props: Props, ...children: Child[]): Node | DocumentFragment {
  // Fragment: <></>
  if (tag === null) {
    return createFragment(children)
  }

  // Component function
  if (typeof tag === 'function') {
    return createComponent(tag, props ?? {}, children)
  }

  // DOM element
  return createElement(tag, props ?? {}, children)
}

// ─── Element Creation ───────────────────────────────────────────

function createElement(tag: string, props: Props, children: Child[]): HTMLElement {
  const el = document.createElement(tag)
  applyProps(el, props)
  appendChildren(el, children)
  return el
}

function createFragment(children: Child[]): DocumentFragment {
  const fragment = document.createDocumentFragment()
  appendChildren(fragment, children)
  return fragment
}

function createComponent(ComponentFn: Component, props: Props, children: Child[]): Node | DocumentFragment {
  const componentProps = props ?? {}

  // Add children as a prop
  if (children.length > 0) {
    componentProps.children = children.length === 1 ? children[0] : children
  }

  // Create owner for cleanup tracking
  const owner = createOwner()

  try {
    // Call the component function
    const result = ComponentFn(componentProps)

    // For Flint components (wrapped by component()), schedule mountComponent
    const instance: ComponentInstance | undefined = (ComponentFn as any).__flint_instance
    if (instance && !instance.mounted) {
      queueMicrotask(() => {
        mountComponent(instance)
      })
    }

    // If result is null/undefined, return empty fragment
    if (result == null) {
      return document.createDocumentFragment()
    }

    // If result is already a DOM node, return it
    if (result instanceof Node) {
      return result
    }

    // If result is a string/number, create a text node
    if (typeof result === 'string' || typeof result === 'number') {
      return document.createTextNode(String(result))
    }

    // If result is an array, create a fragment
    if (Array.isArray(result)) {
      const fragment = document.createDocumentFragment()
      for (const item of result) {
        if (item instanceof Node) {
          fragment.appendChild(item)
        } else if (item != null) {
          fragment.appendChild(document.createTextNode(String(item)))
        }
      }
      return fragment
    }

    // Fallback: convert to string
    return document.createTextNode(String(result))
  } catch (error) {
    // No error boundary found in this simple renderer — log and render fallback
    console.error(`[Flint] Uncaught error in component ${(ComponentFn as any).displayName || ComponentFn.name || 'Unknown'}:`, error)
    const errorContainer = document.createElement('div')
    errorContainer.style.cssText = 'color: red; padding: 16px; border: 1px solid red; border-radius: 4px; background: #fee;'
    errorContainer.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`
    return errorContainer
  } finally {
    currentOwner = owner.parent
  }
}

// ─── Props Application ──────────────────────────────────────────

function applyProps(el: HTMLElement, props: Props): void {
  if (!props) return

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue

    if (/^on[A-Z]/.test(key) && typeof value === 'function') {
      // Event handler: onClick → click
      const eventName = key.slice(2).toLowerCase()
      el.addEventListener(eventName, value)
    } else if (key === 'class' || key === 'className') {
      // Class name
      if (typeof value === 'string') {
        el.className = value
      } else if (Array.isArray(value)) {
        el.className = value.filter(Boolean).join(' ')
      }
    } else if (key === 'style' && typeof value === 'object') {
      // Style object
      Object.assign(el.style, value)
    } else if (key === 'ref') {
      // Ref callback
      if (typeof value === 'function') {
        value(el)
      } else if (value && typeof value === 'object' && 'current' in value) {
        value.current = el
      }
    } else if (key === 'dangerouslySetInnerHTML') {
      // InnerHTML (use with caution!)
      el.innerHTML = value.__html || ''
    } else if (key.startsWith('__')) {
      // Skip internal props
      continue
    } else if (value === true) {
      el.setAttribute(key, '')
    } else if (value === false || value == null) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, String(value))
    }
  }
}

// ─── Children ───────────────────────────────────────────────────

function appendChildren(parent: Node, children: Child[]): void {
  for (const child of children) {
    appendChild(parent, child)
  }
}

function appendChild(parent: Node, child: Child): void {
  if (child == null || child === false || child === true) {
    return
  }

  if (child instanceof Node) {
    parent.appendChild(child)
  } else if (Array.isArray(child)) {
    appendChildren(parent, child)
  } else {
    parent.appendChild(document.createTextNode(String(child)))
  }
}

function nodeify(value: Child): Node {
  if (value instanceof Node) return value
  if (value == null) return document.createDocumentFragment()
  if (Array.isArray(value)) {
    const fragment = document.createDocumentFragment()
    for (const item of value) {
      appendChild(fragment, item)
    }
    return fragment
  }
  return document.createTextNode(String(value))
}

function flattenToNodes(value: Child): Node[] {
  if (value == null) return []
  if (value instanceof Node) return [value]
  if (Array.isArray(value)) {
    const nodes: Node[] = []
    for (const item of value) {
      nodes.push(...flattenToNodes(item as Child))
    }
    return nodes
  }
  return [document.createTextNode(String(value))]
}

// ─── Reactive Rendering ─────────────────────────────────────────

/**
 * Render a Flint component tree into a DOM container.
 * Uses fine-grained reactive updates — only changed DOM nodes are updated.
 *
 * @example
 * import { render } from 'flint'
 * import App from './App.jsx'
 *
 * render(App, document.getElementById('app'))
 */
export function render(
  ComponentFn: Component,
  container: HTMLElement | string
): { dispose: () => void } {
  const target = typeof container === 'string'
    ? document.querySelector(container)
    : container

  if (!target) {
    throw new Error(`[Flint] Container not found: ${container}`)
  }

  // Clear existing content
  target.innerHTML = ''

  const owner = createOwner()

  // Track for fine-grained updates: wrap in effect for backward compatibility
  let currentNode: Node | null = null
  const eff = effect(() => {
    // Remove old DOM if re-rendering
    if (currentNode && currentNode.parentNode) {
      currentNode.parentNode.removeChild(currentNode)
    }

    // Render the component
    const result = ComponentFn({})
    currentNode = nodeify(result)
    target.appendChild(currentNode)

    // For Flint components, schedule mountComponent after DOM insertion
    const instance: ComponentInstance | undefined = (ComponentFn as any).__flint_instance
    if (instance && !instance.mounted) {
      queueMicrotask(() => {
        mountComponent(instance)
      })
    }
  })

  // Also track the effect's lifecycle
  trackDisposable(eff.dispose)

  return {
    dispose() {
      eff.dispose()
      disposeOwner(owner)
      if (currentNode?.parentNode === target) {
        target.removeChild(currentNode)
      }
    },
  }
}

// ─── Utility Exports ────────────────────────────────────────────

export {
  batch,
}
