// Flint Runtime — Built-in Components
// Show, For, Switch, Match, Portal, Suspense, Memo

import { h } from '../renderer/index.js'
import type { Child } from '../renderer/index.js'

// ─── Types ──────────────────────────────────────────────────────

type Renderable = Child | (() => Child)
type ListExpression<T> = T[] | (() => T[])

function toChildren(renderable: Renderable): Child {
  if (typeof renderable === 'function') {
    return renderable()
  }
  if (Array.isArray(renderable)) {
    return h(null, null, ...renderable)
  }
  return renderable ?? null
}

// ─── Show — Conditional Rendering ───────────────────────────────

export function Show(props: {
  when: boolean | (() => boolean)
  fallback?: Renderable
  children: Renderable
}): Child {
  const condition = typeof props.when === 'function' ? props.when() : props.when
  if (condition) {
    return toChildren(props.children)
  }
  if (props.fallback != null) {
    return toChildren(props.fallback)
  }
  return null
}

// ─── For — List Rendering ───────────────────────────────────────

export function For<T>(props: {
  each: ListExpression<T>
  children: (item: T, index: number) => Child
}): Child {
  const list = typeof props.each === 'function' ? props.each() : props.each

  if (!Array.isArray(list) || list.length === 0) {
    return h(null, null)
  }

  const fragment = document.createDocumentFragment()

  list.forEach((item, index) => {
    const child = props.children(item, index)
    if (child instanceof Node) {
      fragment.appendChild(child)
    } else if (child != null) {
      fragment.appendChild(document.createTextNode(String(child)))
    }
  })

  return fragment
}

// ─── Index — List with Index Tracking ───────────────────────────

export function Index<T>(props: {
  each: ListExpression<T>
  children: (item: T, index: number) => Child
}): Child {
  const list = typeof props.each === 'function' ? props.each() : props.each

  if (!Array.isArray(list) || list.length === 0) {
    return h(null, null)
  }

  return h(null, null, ...list.map((item, index) =>
    props.children(item, index)
  )) as any
}

// ─── Switch/Match — Pattern Matching ────────────────────────────

interface MatchResult {
  __flint_match: () => Child
}

export function Switch(props: {
  fallback?: Renderable
  children: Child | Child[]
}): Child {
  const children = Array.isArray(props.children) ? props.children : [props.children]

  for (const child of children) {
    if (child && typeof child === 'object' && '__flint_match' in child) {
      const matchContent = (child as unknown as MatchResult).__flint_match()
      if (matchContent != null) {
        return matchContent
      }
    }
  }

  if (props.fallback != null) {
    return toChildren(props.fallback)
  }

  return null
}

export function Match(props: {
  when: boolean | (() => boolean)
  children: Renderable
}): MatchResult {
  const condition = typeof props.when === 'function' ? props.when() : props.when

  return {
    __flint_match: () => {
      if (condition) {
        return toChildren(props.children)
      }
      return null
    },
  }
}

// ─── Portal — Render Elsewhere ──────────────────────────────────

export function Portal(props: {
  mount?: HTMLElement | string
  children: Renderable
}): Child {
  const target = props.mount
    ? (typeof props.mount === 'string'
      ? document.querySelector(props.mount)
      : props.mount)
    : document.body

  if (!target) {
    console.warn('[Flint] Portal target not found')
    return null
  }

  const fragment = document.createDocumentFragment()
  const content = toChildren(props.children)

  if (content instanceof Node) {
    fragment.appendChild(content)
  } else if (content != null) {
    fragment.appendChild(document.createTextNode(String(content)))
  }

  target.appendChild(fragment)
  return h(null, null)
}

// ─── Suspense — Async Loading ───────────────────────────────────

export function Suspense(props: {
  fallback?: Renderable
  children: Renderable
}): Child {
  return toChildren(props.children)
}

// ─── Memo — Optimized Rendering ─────────────────────────────────

export function memo<T extends (...args: any[]) => any>(
  ComponentFn: T,
  areEqual?: (prev: any, next: any) => boolean
): T {
  let lastProps: any = null
  let lastResult: Child = null
  let lastArgs: any[] = []

  const memoized = (...args: any[]) => {
    const props = args[0]

    if (lastProps && areEqual) {
      if (areEqual(lastProps, props)) {
        return lastResult
      }
    } else if (lastProps && lastArgs.length === args.length) {
      const keys = Object.keys(props)
      if (keys.length === Object.keys(lastProps).length) {
        const changed = keys.some(key => props[key] !== lastProps[key])
        if (!changed) {
          return lastResult
        }
      }
    }

    lastProps = props
    lastArgs = args
    lastResult = ComponentFn(...args)
    return lastResult
  }

  return memoized as T
}
