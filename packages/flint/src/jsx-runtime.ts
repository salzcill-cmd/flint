// Flint JSX Runtime
// Used by the compiler for automatic JSX transform

import { h } from '@flint/runtime'

export { h as jsx }
export { h as jsxs }
export { h as Fragment }

// For development mode
export function jsxDEV(type: any, props: any, key?: string): any {
  return h(type, props, ...(props.children ? [props.children] : []))
}
