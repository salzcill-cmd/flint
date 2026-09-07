// Flint Runtime — Beginner-Friendly Error Messages v4
// Helpful error messages with suggestions and solutions

// ─── Error Message Types ────────────────────────────────────────

export interface FlintErrorCode {
  code: string
  message: string
  suggestion?: string
  docs?: string
}

// ─── Error Codes ────────────────────────────────────────────────

export const ERROR_CODES: Record<string, FlintErrorCode> = {
  // Component Errors
  COMPONENT_NOT_FUNCTION: {
    code: 'FLINT_COMPONENT_NOT_FUNCTION',
    message: 'Component must be a function that returns JSX.',
    suggestion: 'Make sure your component is a function that returns JSX:\n\n// Wrong\nclass MyComponent extends Component {}\n\n// Correct\nfunction MyComponent() {\n  return <div>Hello</div>\n}',
    docs: 'https://flint.dev/docs/components',
  },

  COMPONENT_MISSING_RETURN: {
    code: 'FLINT_COMPONENT_MISSING_RETURN',
    message: 'Component must return something. Did you forget a return statement?',
    suggestion: 'Add a return statement to your component:\n\nfunction MyComponent() {\n  return <div>Hello</div>\n}',
    docs: 'https://flint.dev/docs/components',
  },

  // Signal/State Errors
  SIGNAL_READ_ONLY: {
    code: 'FLINT_SIGNAL_READ_ONLY',
    message: 'Cannot set a read-only signal. Did you mean to use state() instead of computed()?',
    suggestion: 'Use state() for writable signals, computed() for read-only:\n\nconst count = state(0)  // Writable\nconst doubled = computed(() => count() * 2)  // Read-only\ncount.set(5)  // OK\ndoubled.set(10)  // Error!',
    docs: 'https://flint.dev/docs/reactivity',
  },

  SIGNAL_OUTSIDE_EFFECT: {
    code: 'FLINT_SIGNAL_OUTSIDE_EFFECT',
    message: 'Signal accessed outside of effect/tracking context.',
    suggestion: 'If you want to track a signal, use effect() or computed():\n\neffect(() => {\n  console.log(count())  // Tracked\n})\n\nOr in a component:\nfunction MyComponent() {\n  return <div>{count()}</div>  // Tracked in render\n}',
    docs: 'https://flint.dev/docs/reactivity',
  },

  // Hook Errors
  HOOK_OUTSIDE_COMPONENT: {
    code: 'FLINT_HOOK_OUTSIDE_COMPONENT',
    message: 'Hook called outside of a component.',
    suggestion: 'Hooks can only be called inside component functions:\n\nfunction MyComponent() {\n  const name = state("hello")  // OK\n  return <div>{name()}</div>\n}\n\n// Wrong\nconst name = state("hello")  // Outside component',
    docs: 'https://flint.dev/docs/hooks',
  },

  HOOK_ORDER_VIOLATION: {
    code: 'FLINT_HOOK_ORDER_VIOLATION',
    message: 'Hooks must be called in the same order on every render.',
    suggestion: 'Do not call hooks inside conditions or loops:\n\n// Wrong\nif (condition) {\n  const name = state("")  // Different order!\n}\n\n// Correct\nconst name = state("")  // Always called\nif (condition) {\n  // Use name here\n}',
    docs: 'https://flint.dev/docs/hooks',
  },

  // JSX Errors
  JSX_INVALID_CHILD: {
    code: 'FLINT_JSX_INVALID_CHILD',
    message: 'Invalid JSX child. Children must be strings, numbers, elements, or arrays.',
    suggestion: 'Make sure your JSX children are valid:\n\n// Wrong\n<div>{undefined}</div>\n<div>{null}</div>\n\n// Correct\n<div>{undefined ?? ""}</div>\n<div>{null ?? ""}</div>\n<div>{someValue()}</div>',
    docs: 'https://flint.dev/docs/jsx',
  },

  JSX_MISSING_KEY: {
    code: 'FLINT_JSX_MISSING_KEY',
    message: 'Array elements must have a unique "key" prop.',
    suggestion: 'Add a unique key to each element in a list:\n\n// Wrong\n{items.map(item => <div>{item.name}</div>)}\n\n// Correct\n{items.map(item => <div key={item.id}>{item.name}</div>)}',
    docs: 'https://flint.dev/docs/lists',
  },

  // Form Errors
  FORM_MISSING_INITIAL_VALUES: {
    code: 'FLINT_FORM_MISSING_INITIAL_VALUES',
    message: 'createForm requires an initialValues object.',
    suggestion: 'Provide initial values for your form:\n\nconst form = createForm({\n  initialValues: {\n    name: "",\n    email: ""\n  },\n  onSubmit: async (values) => {\n    console.log(values)\n  }\n})',
    docs: 'https://flint.dev/docs/forms',
  },

  FORM_FIELD_NOT_FOUND: {
    code: 'FLINT_FORM_FIELD_NOT_FOUND',
    message: 'Field not found in form. Did you misspell the field name?',
    suggestion: 'Make sure the field name matches your initialValues:\n\nconst form = createForm({\n  initialValues: { email: "" }\n})\n\nform.field("email")  // Correct\nform.field("emial")  // Wrong!',
    docs: 'https://flint.dev/docs/forms',
  },

  // Router Errors
  ROUTE_NOT_FOUND: {
    code: 'FLINT_ROUTE_NOT_FOUND',
    message: 'Route not found. Did you forget to add this route?',
    suggestion: 'Add the route to your router configuration:\n\nconst router = createRouter({\n  routes: [\n    { path: "/", component: Home },\n    { path: "/about", component: About },  // Add missing routes\n  ]\n})',
    docs: 'https://flint.dev/docs/router',
  },

  // Store Errors
  STORE_MISSING_STATE: {
    code: 'FLINT_STORE_MISSING_STATE',
    message: 'Store must have a state property.',
    suggestion: 'Add a state property to your store:\n\nconst useStore = createStore({\n  state: {\n    count: 0\n  },\n  actions: {\n    increment() {\n      this.count++\n    }\n  }\n})',
    docs: 'https://flint.dev/docs/store',
  },

  STORE_MISSING_REDUCER: {
    code: 'FLINT_STORE_MISSING_REDUCER',
    message: 'Store reducer must be a function.',
    suggestion: 'Make sure your reducer is a function:\n\nconst useStore = createStore({\n  state: { count: 0 },\n  reducers: {\n    increment: (state) => ({ count: state.count + 1 })  // Correct\n  }\n})',
    docs: 'https://flint.dev/docs/store',
  },

  // Context Errors
  CONTEXT_MISSING_PROVIDER: {
    code: 'FLINT_CONTEXT_MISSING_PROVIDER',
    message: 'useContext() called without a provider. Did you forget to wrap your app?',
    suggestion: 'Wrap your app with the context provider:\n\nconst ThemeContext = createContext("light")\n\nfunction App() {\n  return (\n    <ThemeContext.Provider value="dark">\n      <MyComponent />\n    </ThemeContext.Provider>\n  )\n}',
    docs: 'https://flint.dev/docs/context',
  },

  // Prop Errors
  PROP_TYPE_MISMATCH: {
    code: 'FLINT_PROP_TYPE_MISMATCH',
    message: 'Invalid prop type. Check the expected type for this prop.',
    suggestion: 'Make sure you pass the correct type:\n\n// Wrong\n<Input type={123} />\n\n// Correct\n<Input type="text" />',
    docs: 'https://flint.dev/docs/props',
  },

  PROP_MISSING_REQUIRED: {
    code: 'FLINT_PROP_MISSING_REQUIRED',
    message: 'Missing required prop.',
    suggestion: 'Pass all required props:\n\n// Wrong\n<Input />\n\n// Correct\n<Input name="email" value={email()} />',
    docs: 'https://flint.dev/docs/props',
  },

  // General Errors
  NOT_IMPLEMENTED: {
    code: 'FLINT_NOT_IMPLEMENTED',
    message: 'This feature is not implemented yet.',
    suggestion: 'Check the Flint roadmap or contribute this feature!\nhttps://flint.dev/roadmap',
    docs: 'https://flint.dev/docs',
  },

  INVALID_CONFIGURATION: {
    code: 'FLINT_INVALID_CONFIGURATION',
    message: 'Invalid configuration. Check your settings.',
    suggestion: 'Review the configuration options:\nhttps://flint.dev/docs/configuration',
    docs: 'https://flint.dev/docs/configuration',
  },
}

// ─── Error Helper Functions ─────────────────────────────────────

/**
 * Create a helpful error with suggestion.
 *
 * @example
 * throw flintError('COMPONENT_NOT_FUNCTION')
 */
export function flintError(code: string, customMessage?: string): Error {
  const errorInfo = ERROR_CODES[code]
  if (!errorInfo) {
    return new Error(`Unknown error: ${code}`)
  }

  const message = customMessage ?? errorInfo.message
  const fullMessage = errorInfo.suggestion
    ? `${message}\n\n💡 Suggestion:\n${errorInfo.suggestion}`
    : message

  const error = new Error(fullMessage)
  error.name = `FlintError: ${errorInfo.code}`
  return error
}

/**
 * Throw a helpful error with suggestion.
 */
export function throwFlintErrorBeginner(code: string, customMessage?: string): never {
  throw flintError(code, customMessage)
}

/**
 * Log a helpful warning with suggestion.
 */
export function flintWarning(code: string, customMessage?: string): void {
  const errorInfo = ERROR_CODES[code]
  if (!errorInfo) {
    console.warn(`[Flint] Unknown warning: ${code}`)
    return
  }

  const message = customMessage ?? errorInfo.message
  const fullMessage = errorInfo.suggestion
    ? `${message}\n\n💡 Suggestion:\n${errorInfo.suggestion}`
    : message

  console.warn(`[Flint] ${fullMessage}`)
}

/**
 * Check if a value is a valid Flint component.
 */
export function isValidComponent(value: any): boolean {
  if (typeof value === 'function') {
    // Check if it's a class component (starts with uppercase, has prototype)
    if (value.prototype && value.prototype.render) {
      return false
    }
    return true
  }
  return false
}

/**
 * Check if a value is a valid JSX element.
 */
export function isValidElement(value: any): boolean {
  return value && typeof value === 'object' && value.__flint_element === true
}

/**
 * Check if a value is a valid Flint signal.
 */
export function isSignal(value: any): boolean {
  return value && typeof value === 'function' && value.__flint_signal === true
}

/**
 * Check if a value is a valid Flint computed.
 */
export function isComputed(value: any): boolean {
  return value && typeof value === 'function' && value.__flint_computed === true
}

// ─── Development Mode Helpers ───────────────────────────────────

/**
 * Warn if component doesn't follow conventions.
 */
export function warnComponentNaming(name: string): void {
  if (typeof name !== 'string') return

  // Check if component starts with uppercase
  if (name[0] !== name[0].toUpperCase()) {
    console.warn(
      `[Flint] Component "${name}" should start with an uppercase letter.\n` +
      `This helps distinguish components from regular functions.\n\n` +
      `💡 Suggestion: Rename to "${name.charAt(0).toUpperCase() + name.slice(1)}"`
    )
  }
}

/**
 * Warn if hook is called conditionally.
 */
export function warnHookConditional(): void {
  console.warn(
    '[Flint] Hook called conditionally.\n\n' +
    'Hooks must be called in the same order on every render.\n' +
    'Do not use hooks inside if statements, loops, or early returns.\n\n' +
    '💡 Suggestion: Move the hook to the top of the component.'
  )
}

/**
 * Warn if prop is not recognized.
 */
export function warnUnknownProp(componentName: string, propName: string): void {
  console.warn(
    `[Flint] Unknown prop "${propName}" on component "${componentName}".\n\n` +
    'Check if the prop name is correct or if you meant to use a different prop.'
  )
}

/**
 * Warn if child is not valid.
 */
export function warnInvalidChild(child: any): void {
  if (child === undefined || child === null || child === false) {
    // These are valid, no warning
    return
  }

  if (typeof child === 'object' && !(child as any).__flint_element) {
    console.warn(
      '[Flint] Invalid JSX child. Children must be strings, numbers, elements, or arrays.\n\n' +
      '💡 Suggestion: Wrap the object in a string or use a component.'
    )
  }
}

// ─── Quick Help Messages ────────────────────────────────────────

export const QUICK_HELP = `
🔥 Flint Quick Help
━━━━━━━━━━━━━━━━━━━

📦 Component:
  function MyComponent() {
    return <div>Hello</div>
  }

📊 State:
  const count = state(0)
  count()      // Read
  count.set(1) // Write

⚡ Computed:
  const doubled = computed(() => count() * 2)

🔄 Effect:
  effect(() => {
    console.log(count())
  })

📋 List:
  {items.map(item =>
    <div key={item.id}>{item.name}</div>
  )}

🎨 Styling:
  <div sx="flex items-center gap-2">
  <div class={clsx("btn", { active })}>
  <div style={sx("p-4 bg-white rounded")}>
`
