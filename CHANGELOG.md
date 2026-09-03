# Changelog

All notable changes to the Flint framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
