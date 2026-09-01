// Flint Runtime — Main Entry Point
// Re-exports everything a Flint app needs

// Core rendering
export { h, render } from './renderer/index.js'
export type { Child, Component, Props } from './renderer/index.js'

// Component system
export {
  component,
  onMount,
  onUpdate,
  onDestroy,
  getCurrentInstance,
} from './component/index.js'
export type { ComponentFunction, ComponentContext, ComponentInstance } from './component/index.js'

// Slots
export { renderSlot, createSlot, mergeSlots } from './slots/index.js'
export type { SlotContent, NamedSlots } from './slots/index.js'

// Provide/Inject
export {
  provide,
  inject,
  hasInjection,
  createInjectionKey,
  clearInjectionContext,
} from './inject/index.js'
export type { InjectionKey, InjectionContext } from './inject/index.js'

// Built-in Components
export {
  Show,
  For,
  Index,
  Switch,
  Match,
  Portal,
  Suspense,
  memo,
} from './components/index.js'

// Lazy Loading & Error Boundaries
export {
  ErrorBoundary,
  lazy,
  Suspense as SuspenseBoundary,
  createResource,
  createAsyncComponent,
  catchError,
} from './components/lazy.js'
export type {
  ErrorBoundaryFallback,
  LazyComponent,
  ErrorBoundaryProps,
  LazyOptions,
  SuspenseProps,
  Resource,
} from './components/lazy.js'

// Refs
export { ref, useSignal } from './ref/index.js'
export type { Ref } from './ref/index.js'

// Store
export { createStore } from './store/index.js'
export type { Store, StoreOptions, StoreMiddleware } from './store/index.js'

// Styling
export {
  createStyles,
  createDynamicStyles,
  getTheme,
  setTheme,
  resetTheme,
  cssVariablesFromTheme,
  injectCSSVariables,
  mediaQuery,
  responsive,
  createKeyframes,
  mergeStyles,
  cx,
  styleToString,
} from './styles/index.js'
export type {
  CSSProperties,
  CSSRuleSet,
  StyleSheet,
  Theme,
} from './styles/index.js'

// Forms & Validation
export {
  createForm,
  validators,
} from './forms/index.js'
export type {
  Validator,
  Validators,
  FormErrors,
  FormTouched,
  FormDirty,
  FieldState,
  FormState,
  FieldBinding,
  FormOptions,
  FormHelpers,
} from './forms/index.js'

// Router v2
export {
  Router,
  createRouter,
  getRouter,
  navigate,
  useParams,
  useQuery,
  useLocation,
  Link,
  Outlet,
} from './router/index.js'
export type {
  Route,
  RouteParams,
  QueryParams,
  Location,
  NavigateOptions,
  RouteGuard,
  ScrollPosition,
  RouterOptions,
  LinkProps,
  OutletProps,
  RouteMatch,
} from './router/index.js'

// Server-Side Rendering
export {
  renderToString,
  renderToPipeableStream,
  hydrate,
  generateHTML,
  getSSRContext,
  dataLoader,
  executeDataLoader,
  useTitle,
  useMeta,
  useLink,
} from './ssr/index.js'
export type {
  SSRComponent,
  SSRContext,
  RenderToStringOptions,
  RenderToStreamOptions,
  SSRResult,
  StreamResult,
  HTMLTemplateOptions,
  DataLoader,
  HydrationOptions,
} from './ssr/index.js'

// DevTools
export {
  DevTools,
  createDevTools,
  getDevTools,
  destroyDevTools,
  devWarning,
  devError,
  showErrorOverlay,
  hideErrorOverlay,
  logComponentTree,
  logSignals,
  logStores,
  startTrace,
  isDevelopment,
  // Advanced DevTools v2
  AdvancedDevTools,
  TimeTravelDebugger,
  PerformanceAnalyzer,
  StateInspector,
  createAdvancedDevTools,
  getAdvancedDevTools,
  recordState,
  undo,
  redo,
  calculateStateDiff,
  formatStateDiff,
} from './devtools/index.js'
export type {
  DevToolsComponent,
  DevToolsSignal,
  DevToolsStore,
  PerformanceMetric,
  DevToolsOptions,
  DevToolsEvent,
  // Advanced DevTools v2
  StateDiff,
  TimeTravelEntry,
  PerformanceInsight,
  StateSnapshot,
} from './devtools/index.js'

// Testing Utilities
export {
  testRender,
  createTestApp,
  createMockFetch,
  createSpy,
  flushPromises,
  flushEffects,
  expectElement,
  expectText,
  expectAttribute,
  mockSSRContext,
  mockLocation,
} from './testing/index.js'
export type {
  TestComponentResult,
  TestApp,
  MockSSROptions,
  SpyFunction,
} from './testing/index.js'

// HMR
export { initHMR, acceptHMR, onHMRDispose, isHMR } from './hmr/index.js'

// Animations & Transitions v2
export {
  AnimationEngine,
  Transition,
  TransitionGroup,
  useTransition,
  useAnimate,
  easings,
  presets,
  animate,
  getAnimationEngine,
} from './animations/index.js'
export type {
  AnimationOptions,
  TransitionOptions,
  TransitionProps,
  TransitionGroupProps,
  Keyframe,
  Animation,
  EasingFunction,
  UseTransitionReturn,
  UseAnimateReturn,
} from './animations/index.js'

// Errors
export {
  createFlintError,
  formatFlintError,
  throwFlintError,
  ErrorMessages,
  withErrorHandling,
} from './errors/index.js'
export type { FlintError, ErrorCode } from './errors/index.js'

// Re-export reactivity
export {
  state,
  computed,
  effect,
  watch,
  batch,
} from '@flint/reactivity'
export type {
  Signal,
  Computed,
  Effect,
  CleanupFn,
} from '@flint/reactivity'
