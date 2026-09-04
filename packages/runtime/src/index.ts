// Flint Runtime — Main Entry Point
// Re-exports everything a Flint app needs

// Core rendering
export { h, render, track, trackAttribute, trackEvent, trackChildren, trackComponent } from './renderer/index.js'
export type { Child, Component, Props, ReactiveNode } from './renderer/index.js'

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

// React 19+ Utilities
export {
  createRef,
  assignRef,
  mergeRefs,
  reactive,
  shallowRef,
  readonly,
  shallowReadonly,
  toRef,
  toRefs,
  triggerRef,
  mergeProps,
  splitProps,
  bindable,
  twoWayBinding,
  useTransitionClasses,
  applyTransition,
} from './hooks/utilities.js'

// Built-in Components
export {
  Show,
  For,
  ForEach,
  Index,
  Switch,
  Match,
  Portal,
  Suspense,
  SuspenseBoundary,
  memo,
  cloneElement,
  createMemo,
  createEffect,
  trackPromise,
} from './components/index.js'

// Lazy Loading & Error Boundaries
export {
  ErrorBoundary,
  lazy,
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
  useQueryParams,
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
  UseAnimateReturn,
} from './animations/index.js'

// useTransition from hooks (not animations) — REMOVED: using optimistic.ts version
// export {
//   useTransition,
// } from './hooks/index.js'

// Code Splitting & Lazy Routes
export {
  createLazyRoute,
  RoutePreloader,
  getRoutePreloader,
  defineSplitPoint,
} from './router/code-splitting.js'
export type {
  LazyRouteConfig,
  LazyRouteLoader,
  PreloadOptions,
  SplitPoint,
} from './router/code-splitting.js'

// Middleware System
export {
  MiddlewareStack,
  MiddlewareManager,
  authMiddleware,
  logMiddleware,
  guardMiddleware,
  progressMiddleware,
  validateMiddleware,
  cacheMiddleware,
} from './router/middleware.js'
export type {
  MiddlewareContext,
  MiddlewareFunction,
  RouteWithMiddleware,
} from './router/middleware.js'

// File-based Routing
export {
  generateRoutesFromFiles,
  buildRouteTree,
  filePathToRoutePath,
  routePathToFilePath,
  isDynamicRoute,
  extractSegments,
  detectLayouts,
  createFileRoutes,
  ROUTE_PATTERNS,
} from './router/file-based.js'
export type {
  FileRouteConfig,
  FileRoute,
  FileRouterOptions,
  LayoutRoute,
} from './router/file-based.js'

// Internationalization (i18n)
export {
  I18n,
  createI18n,
  LOCALES,
  formatNumber,
  formatDate,
  formatRelativeTime,
} from './i18n/index.js'
export type {
  TranslationKeys,
  I18nOptions,
  I18nContext,
} from './i18n/index.js'

// Query/Data Fetching
export {
  QueryManager,
  MutationManager,
  createQueryManager,
  getQueryManager,
  useQuery,
  useMutation,
  invalidateQueries,
  getQueryData,
} from './query/index.js'
export type {
  QueryKey,
  QueryOptions,
  QueryResult,
  MutationOptions,
  MutationResult,
} from './query/index.js'

// SEO Utilities
export {
  MetaManager,
  useSEO,
  useStructuredData,
  createArticleSchema,
  createProductSchema,
  createBreadcrumbSchema,
} from './seo/index.js'
export type {
  MetaTag,
  SEOMeta,
  StructuredData,
} from './seo/index.js'

// PWA Support
export {
  ServiceWorkerManager,
  CacheManager,
  initPWA,
  getPWA,
  isOnline,
  onOnline,
  onOffline,
  injectManifest,
} from './pwa/index.js'
export type {
  ServiceWorkerConfig,
  CacheConfig,
  ManifestConfig,
} from './pwa/index.js'

// Image Component
export {
  Image,
  ResponsiveImage,
  preloadImage,
  preloadImages,
  createImageFallback,
} from './image/index.js'
export type {
  ImageOptions,
  ResponsiveImageOptions,
  ImageState,
} from './image/index.js'

// Errors
export {
  createFlintError,
  formatFlintError,
  formatFlintErrorTerminal,
  throwFlintError,
  fromNativeError,
  ErrorMessages,
  withErrorHandling,
  parseStackTrace,
  useErrorBoundary,
  onError,
  reportError,
  safeRender,
} from './errors/index.js'
export type {
  FlintError,
  ErrorCode,
  ErrorBoundaryState,
  ErrorInfo,
} from './errors/index.js'
export { initGlobalErrorHandlers, removeGlobalErrorHandlers } from './errors/global.js'

// Security Utilities
export {
  escapeHtml,
  sanitizeInput,
  isSafeUrl,
  isValidUrl,
  generateCSP,
  generateCSRFToken,
  validateCSRFToken,
  validateInput,
  createRateLimiter,
  secureSet,
  secureGet,
  secureRemove,
} from './security/index.js'
export type {
  SanitizeOptions,
  CSPConfig,
  ValidationRule,
  ValidationResult,
  RateLimiterConfig,
} from './security/index.js'

// Performance Monitoring
export {
  initPerformance,
  performanceStart,
  performanceEnd,
  recordMetric,
  getEntries,
  getEntriesByType,
  getAverageDuration,
  getSummary,
  clearEntries,
  trackRender,
  trackApi,
  trackEffect,
  trackNavigation,
  getResourceTimings,
  getWebVitals,
} from './performance/index.js'
export type {
  PerformanceEntry as PerfEntry,
  PerformanceConfig,
} from './performance/index.js'

// Accessibility (a11y)
export {
  useFocusTrap,
  useFocusVisible,
  useFocusRestore,
  useKeyboard,
  useListNavigation,
  useAriaLive,
  useReducedMotion,
  useAriaId,
  createAriaProps,
  useRovingTabindex,
} from './a11y/index.js'
export type {
  FocusTrapOptions,
  KeyboardOptions,
  AriaLiveOptions,
  ReducedMotionOptions,
} from './a11y/index.js'

// useDeferredValue, useId, useImperativeHandle, forwardRef
export {
  useId,
  useImperativeHandle,
  forwardRef,
} from './hooks/index.js'
export type {
  ImperativeHandle,
  ForwardRefRenderFunction,
} from './hooks/index.js'

// Class Name Utility
export { cn } from './utils/classnames.js'
export type { ClassValue } from './utils/classnames.js'

// Re-export reactivity
export {
  state,
  computed,
  effect,
  watch,
  batch,
  untrack,
  createSelector,
  createRoot,
  onCleanup,
} from '@flint/reactivity'
export type {
  Signal,
  Computed,
  Effect,
  CleanupFn,
  Selector,
  Scope,
} from '@flint/reactivity'

// Developer Experience
export {
  createDevError,
  devPerf,
  devAssert,
  devDeprecated,
  setDisplayName,
  getDisplayName,
  recordPerf,
  getPerfEntries,
  clearPerfEntries,
  getAvgPerf,
  formatMessage,
} from './devtools/devx.js'

// Server Components & Server Actions (RSC)
export {
  createServerAction,
  createServerComponent,
  createUniversalComponent,
  getServerActionRegistry,
  configureServerTransport,
  handleServerAction,
  createFormActionHandler,
  addServerActionMiddleware,
  setServerComponentContext,
  clearServerComponentContext,
  RedirectError,
  NotFoundError,
} from './ssr/server-components.js'
export type {
  ServerComponent,
  ServerActionOptions,
  ServerActionResult,
  ServerComponentMeta,
  ServerComponentContext,
  ServerActionRegistry,
  ServerActionHandler,
  ServerActionMiddleware,
} from './ssr/server-components.js'

// Optimistic Updates & use() API
export {
  useOptimistic,
  useOptimisticAction,
  useActionState,
  useFormStatus,
  use,
  createContext,
  useProvider,
  useDeferredValue,
  useTransition,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from './hooks/optimistic.js'
export type {
  OptimisticState,
  UseOptimisticOptions,
  ActionState,
  FormStatus,
  UseFormStatusOptions,
  Context,
} from './hooks/optimistic.js'

// Form Actions & Resource Preloading
export {
  createFormAction,
  preload,
  preinit,
  prefetchDNS,
  preconnect,
  usePreload,
  usePrefetchDNS,
  usePreconnect,
  getServerPreloads,
  getServerPreinits,
  getServerPrefetchDNSs,
  getServerPreconnects,
  generateResourceHintsHTML,
  clearServerResources,
} from './hooks/form-actions.js'
export type {
  FormActionOptions,
  FormActionResult,
  ResourcePreloadOptions,
  PrefetchDNSOptions,
  PreconnectOptions,
} from './hooks/form-actions.js'

// Activity / KeepAlive
export {
  Activity,
  KeepAlive,
  useActivity,
  clearActivityCache,
  getActivityCacheStats,
} from './components/activity.js'
export type {
  ActivityProps,
  KeepAliveProps,
  ActivityInstance,
} from './components/activity.js'

// useEffectEvent
export {
  useEffectEvent,
  useStableEvent,
  useEffectEventWithCleanup,
  useEffectEventDebounced,
  useEffectEventThrottled,
  useEffectAnimationFrame,
  useEffectEventIntersection,
} from './hooks/effect-event.js'
export type {
  EffectEventOptions,
  EffectEventReturn,
} from './hooks/effect-event.js'
