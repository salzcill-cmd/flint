// Flint Runtime — DOM Renderer
// h() function for JSX → DOM creation
// Direct DOM updates, no virtual DOM

import { effect } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export type Component = (props: any) => any
export type Child = Node | string | number | boolean | null | undefined | Child[]
export type Props = Record<string, any> | null

// ─── h() — JSX Factory ─────────────────────────────────────────

/**
 * Create a DOM element or component from JSX.
 * This is the core function that all compiled JSX calls.
 *
 * @example
 * // Compiled from: <div class="foo">Hello</div>
 * h("div", { class: "foo" }, "Hello")
 *
 * @example
 * // Compiled from: <Greeting name="World" />
 * h(Greeting, { name: "World" })
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

  // Call the component function
  const result = ComponentFn(componentProps)

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
}

// ─── Props Application ──────────────────────────────────────────

function applyProps(el: HTMLElement, props: Props): void {
  if (!props) return

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue

    if (key.startsWith('on') && typeof value === 'function') {
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

// ─── Reactive Rendering ─────────────────────────────────────────

/**
 * Render a Flint component tree into a DOM container.
 * Sets up reactive effects for automatic updates.
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

  let currentRoot: Node | null = null

  // Create effect that re-renders when component state changes
  const eff = effect(() => {
    // Remove old content
    if (currentRoot) {
      target.removeChild(currentRoot)
    }

    // Render new content
    const result = ComponentFn({})
    if (result instanceof Node) {
      currentRoot = result
    } else if (result != null) {
      currentRoot = document.createTextNode(String(result))
    } else {
      currentRoot = document.createDocumentFragment()
    }

    target.appendChild(currentRoot)
  })

  return {
    dispose() {
      eff.dispose()
      if (currentRoot && target.contains(currentRoot)) {
        target.removeChild(currentRoot)
      }
    },
  }
}
