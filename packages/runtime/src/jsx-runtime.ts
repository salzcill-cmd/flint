// Flint Runtime — Automatic JSX Runtime
// Implements the import shape that TypeScript's `"jsx": "react-jsx"` and
// Babel's automatic runtime expect: jsx/jsxs/jsxDEV + Fragment.
//
// It delegates to the same h() runtime the Flint compiler targets, so code
// compiled with the automatic runtime and code compiled by the Flint
// compiler share one rendering path.

import { h } from './renderer/index.js'
import type { Child } from './renderer/index.js'
import type { Props } from './renderer/index.js'

export type { Child, Props }

/**
 * Fragment component for `<></>` — renders children without a wrapper element.
 */
export const Fragment = null as unknown as (props: { children?: Child }) => Child

/**
 * Shared implementation: extracts `children` from the automatic-runtime props
 * object and passes them to h() as variadic args (the shape h() expects),
 * while components still receive `props.children` via createComponent().
 */
function create(type: any, props: Record<string, any> | null, key?: string | number): any {
  const { children, ...rest } = props ?? {}
  const finalProps = addKey(rest, key)
  if (children === undefined || children === null) {
    return h(type, finalProps)
  }
  if (Array.isArray(children)) {
    return h(type, finalProps, ...children)
  }
  return h(type, finalProps, children)
}

/** Factory for elements with a single child (static). */
export function jsx(type: any, props: Record<string, any> | null, key?: string | number): any {
  return create(type, props, key)
}

/** Factory for elements with multiple static children. */
export function jsxs(type: any, props: Record<string, any> | null, key?: string | number): any {
  return create(type, props, key)
}

/**
 * Development factory. Behaves identically to jsx() — the dev-only value
 * adds (source locations) are compiler-level and do not change the tree.
 */
export function jsxDEV(type: any, props: Record<string, any> | null, key?: string | number): any {
  return create(type, props, key)
}

function addKey(props: Record<string, any> | null, key?: string | number): Record<string, any> | null {
  if (key == null) return props
  return { ...(props ?? {}), key }
}

/** Resolved Fragment export for runtimes that import { Fragment } from the module. */
export default { jsx, jsxs, jsxDEV, Fragment }
