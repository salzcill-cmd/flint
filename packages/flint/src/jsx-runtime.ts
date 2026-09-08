// Flint JSX Runtime — Automatic Runtime Entry Point
// Re-exports the canonical implementation from @flint/runtime so that
// `"jsx": "react-jsx"` with `jsxImportSource: "flint"` (or @flint/runtime)
// resolves to a correct, single implementation.
//
// Also exports the classic factories for `"jsx": "react"` configs:
//   pragma: h, pragmaFrag: Fragment

export {
  jsx,
  jsxs,
  jsxDEV,
  Fragment,
} from 'flint-runtime/jsx-runtime'

// Classic runtime aliases (jsx: "react" + jsxFactory: "h")
export { h } from 'flint-runtime'
export { Fragment as default } from 'flint-runtime/jsx-runtime'
