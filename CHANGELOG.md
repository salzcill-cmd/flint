# Changelog

All notable changes to the Flint framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.3.1] - 2026-09-06

### Fixed
- **Compiler TypeScript detection** — replaced regex sniffing with deterministic extension-based detection (`filename` option). The old heuristics misfired on plain JS (`a != b`, `{ id: 5 }` object literals, English text inside template literals) and silently reprinted files through esbuild. Plain JS now parses directly with zero transformation cost; TS stripping is one deterministic step for `.ts/.tsx` and a single fallback when JS parsing fails.
- **SSR timeout timer leak** — the `setTimeout` used by `renderToString`'s `Promise.race` was never cleared and kept the Node.js event loop alive for the full timeout after every render. The timer is now cleared when the race settles.
- **Vite plugin error output** — transform failures now include an actionable hint instead of a bare message.

### Added
- **Compiler error UX** — `compile()` failures return `formatted` output: file, line:column, caret code frame, likely causes, and a suggestion; raw error preserved for tooling. New exports: `guessCauses()`, `codeFrame()`, richer `formatCompilerError()`.

### Documentation
- Replaced the "Compiler Auto-Memoization" section with an accurate "What the Compiler Does" description (Flint needs no `useMemo`/`React.memo` — computed caching plus per-expression tracking replaces re-render memoization). Experimental optimizer passes are documented as such.

## [3.3.0] - 2026-09-06

### Security
- **Hydration payload escaping (SSR)** — `safeJsonForScript()` escapes `</script>`, `<!--`, and line separators when embedding hydration data, closing an XSS vector where server data could break out of the hydration `<script>` tag. Applied to both `renderToString` and `renderToPipeableStream`.
- **Safe URL enforcement** — `javascript:`, `data:text/html`, `vbscript:` (and other non-allowlisted schemes) in `href`/`src`/`action`/`formaction`/`poster`/`xlink:href` are now replaced with `#` in both the client renderer and SSR, including obfuscation attempts like `java\tscript:`. Dev builds log a warning naming the blocked scheme.
- **`dangerouslySetInnerHTML` dev warning** — client renderer and SSR now warn in development that inserted HTML is verbatim and should be sanitized (`sanitizeInput()`).

### Performance
- **Untracked mounting** — `render()` no longer registers every signal read inside the component tree as a root-effect dependency (which caused full-tree rebuilds on any state change). Components now render once; updates flow exclusively through the compiler's `track()`/`trackAttribute()`/`trackEvent()` effects. A dev warning fires for components that read signals bare in their body, pointing at the correct pattern.
- **Equality-aware effect scheduling** — effects depending on a computed whose custom `equals` filter says "unchanged" are now skipped entirely (`changeVersion` staleness tracking with pull-based computed refresh). Previously they re-ran with identical values.
- **`flushSync()`** — new API to flush pending effects immediately instead of waiting for the microtask queue (useful for tests and DOM measurement).

### Fixed
- **Automatic JSX runtime** — `jsx()`/`jsxs()`/`jsxDEV()` now extract `children` from props and pass them to `h()` correctly; `Fragment` is a real fragment renderer. Previously, `"jsx": "react-jsx"` (the config the README and the shipped ts-presets recommend) produced elements with no children and a `Fragment` export that broke rendering.
- **TS presets import source** — `jsxImportSource` pointed at the non-existent `@flint/jsx-runtime`; it now resolves to `flint`.
- **Reactivity internals** — deduplicated computed update logic (custom `equals` handling moved into the core update path instead of a per-instance patch); `onCleanup()` inside effects no longer replaces previously-registered cleanups.

### Added
- **`flushSync()`** — immediate effect flushing (`@flint/reactivity`, re-exported from `flint`).
- **`captureScope()`** — internal-grade utility to detect signal reads in a function without subscribing (powers the renderer's bare-read warning).
- **`safeJsonForScript()`, `safeUrl()`, `isUrlAttribute()`** — public security helpers in `@flint/runtime/security`.
- **HMR auto-wiring** — `__flintHMR__(import.meta.hot, moduleId)` is injected automatically by `@flint/vite-plugin` in dev. Modules using `acceptHMR()`/`onHMRDispose()` now self-accept; everything else bubbles to Vite's full-reload fallback. Manual `initHMR()` calls are no longer required.
- **CLI project validation** — `flint dev` and `flint build` pre-flight check `package.json`, `index.html`, and the module entry script, printing actionable fixes instead of raw Vite errors.
- **CLI build report** — per-file gzip size estimates and a performance-budget warning when the largest JS chunk exceeds 50 KB gzipped; `--no-minify`/`--no-sourcemap` now actually disable those options.

### Tests
- 38 new regression tests covering XSS escaping, URL scheme blocking (client + SSR), `dangerouslySetInnerHTML` warnings, untracked rendering, automatic JSX runtime, HMR auto-wiring, `flushSync`, and equality-aware scheduling. Suite: 846 tests passing.

## [3.1.0] - 2026-09-03

### Added
- **Provide/Inject tree-scoped lookup** — traverses component tree like Vue/React
- **Fine-grained ForEach reconciliation** — individual DOM node moves (Solid.js-level performance)
- **ref as prop support** — `createRef()`, `assignRef()`, `mergeRefs()`
- **reactive() deep reactive objects** — Vue-style Proxy-based deep reactivity
- **shallowRef()** — reference-change-only tracking
- **readonly() / shallowReadonly()** — immutable proxies
- **toRef() / toRefs() / triggerRef()** — Vue-style utilities
- **mergeProps() / splitProps()** — Solid-style props utilities
- **bindable() / twoWayBinding()** — Svelte 5 $bindable equivalent
- **CSS class-based transitions** — `useTransitionClasses()`, `applyTransition()`
- **@flint/store dedicated tests** — 45 tests covering `create`, `logger`, `persist`, `devtools`, `immer`, `createSelector`, `useStore`
- **LICENSE file** — MIT License
- **CHANGELOG.md** — This file

### Fixed
- **Function updater now merges** — `(prev) => ({ count: prev.count + 1 })` no longer loses other state properties
- **Store destroy behavior** — `getState()` and `setState()` now throw after `destroy()`

## [3.0.0] - 2026-09-03

### Added
- **Signals-based reactivity** — `state()`, `computed()`, `effect()`, `watch()`, `batch()`, `untrack()`, `createSelector()`, `createRoot()`, `onCleanup()`
- **Debug system** — `DebugManager`, signal/computed tracking, performance summaries
- **JSX compiler** — Acorn-based parser, AST transformer, source map support
- **Compiler optimizer** — Dead code elimination, constant folding, auto-memoization, CSS scoping
- **Component system** — `component()`, lifecycle hooks (`onMount`, `onUpdate`, `onDestroy`)
- **Built-in components** — `Show`, `For`, `ForEach`, `Index`, `Switch`, `Match`, `Portal`, `Suspense`, `ErrorBoundary`, `memo`, `cloneElement`, `Activity`, `KeepAlive`
- **Hooks** — `useTransition`, `useDeferredValue`, `useId`, `useImperativeHandle`, `forwardRef`, `useRef`
- **React 19+ features** — `useOptimistic`, `useActionState`, `useFormStatus`, `use()`, `useEffectEvent` (debounced, throttled, animation frame, intersection)
- **Form Actions** — `createFormAction`, resource preloading (`preload`, `preinit`, `prefetchDNS`, `preconnect`)
- **SSR** — `renderToString`, `renderToPipeableStream`, `hydrate`, `generateHTML`, data loaders
- **Server Components & Actions** — RSC support with middleware chain
- **Router** — File-based routing, code splitting, middleware (auth, log, guard, progress, validate, cache)
- **Styling** — `createStyles`, `createDynamicStyles`, theming, CSS variables, responsive utilities
- **Animations** — `AnimationEngine`, `Transition`, `TransitionGroup`, easing functions
- **i18n** — `createI18n`, number/date/relative time formatting
- **Data Fetching** — `QueryManager`, `MutationManager`, `useQuery`, `useMutation`
- **SEO** — `MetaManager`, structured data (Article, Product, Breadcrumb)
- **PWA** — `ServiceWorkerManager`, `CacheManager`, manifest injection
- **Image optimization** — `Image`, `ResponsiveImage`, preloading
- **Security** — `escapeHtml`, `sanitizeInput`, `generateCSP`, `generateCSRFToken`, rate limiting
- **Performance monitoring** — Web Vitals, render/API/effect tracking
- **Accessibility** — `useFocusTrap`, `useKeyboard`, `useListNavigation`, `useAriaLive`, `useReducedMotion`
- **Error handling** — `createFlintError`, error boundaries, stack trace parsing
- **DevTools** — Signal/component tracking, time-travel debugging, performance analyzer
- **HMR** — Hot module replacement support
- **Testing utilities** — `testRender`, `createMockFetch`, `flushEffects`
- **@flint/store** — Zustand-compatible API with logger, persist, devtools, immer middleware
- **@flint/flintkit** — Metaframework with file-based routing, SSR handler, project scaffolding
- **@flint/devtools** — Client-side DevTools instrumentation
- **@flint/eslint-plugin** — 6 signal-specific linting rules
- **@flint/playwright-utils** — E2E testing helpers with signal assertions
- **@flint/cli** — Project creation, dev server, build, preview, linting, testing

## [2.0.0] - 2026-09-02

### Added
- Complete JavaScript framework rewrite
- Signals-based reactivity system
- JSX compiler
- Component system with lifecycle hooks
- SSR support
- Router with file-based routing
- Store with middleware support

## [1.0.0] - 2026-09-01

### Added
- Initial release
- Basic reactivity system
- Simple component model
