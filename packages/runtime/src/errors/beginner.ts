// Flint Runtime — Bilingual Error Messages v5
// English (default) + Indonesian, with language detection

// ─── Language Detection ──────────────────────────────────────────

type Language = 'en' | 'id'

let currentLang: Language = detectLanguage()

function detectLanguage(): Language {
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language || (navigator as any).userLanguage || ''
    if (lang.startsWith('id')) return 'id'
  }
  if (typeof process !== 'undefined' && process.env?.FLINT_LANG) {
    return process.env.FLINT_LANG as Language
  }
  return 'en'
}

export function setLanguage(lang: Language): void {
  currentLang = lang
}

export function getLanguage(): Language {
  return currentLang
}

// ─── Error Message Types ────────────────────────────────────────

export interface FlintErrorCode {
  code: string
  en: { message: string; suggestion?: string }
  id: { message: string; suggestion?: string }
}

export interface FlintErrorResolved {
  code: string
  message: string
  suggestion?: string
}

// ─── Error Codes (Bilingual) ───────────────────────────────────

export const ERROR_CODES: Record<string, FlintErrorCode> = {
  // Component Errors
  COMPONENT_NOT_FUNCTION: {
    code: 'FLINT_COMPONENT_NOT_FUNCTION',
    en: {
      message: 'Component must be a function that returns JSX.',
      suggestion: 'Make sure your component is a function returning JSX:\n\n// Wrong\nclass MyComponent extends Component {}\n\n// Right\nfunction MyComponent() {\n  return <div>Hello</div>\n}',
    },
    id: {
      message: 'Component harus berupa fungsi yang mengembalikan JSX.',
      suggestion: 'Pastikan component kamu adalah fungsi yang mengembalikan JSX:\n\n// Salah\nclass MyComponent extends Component {}\n\n// Benar\nfunction MyComponent() {\n  return <div>Halo</div>\n}',
    },
  },

  COMPONENT_MISSING_RETURN: {
    code: 'FLINT_COMPONENT_MISSING_RETURN',
    en: {
      message: 'Component must return something. Missing return statement?',
      suggestion: 'Add a return statement to your component:\n\nfunction MyComponent() {\n  return <div>Hello</div>\n}',
    },
    id: {
      message: 'Component harus mengembalikan sesuatu. Lupa pernyataan return?',
      suggestion: 'Tambahkan pernyataan return ke component kamu:\n\nfunction MyComponent() {\n  return <div>Halo</div>\n}',
    },
  },

  // Signal/State Errors
  SIGNAL_READ_ONLY: {
    code: 'FLINT_SIGNAL_READ_ONLY',
    en: {
      message: 'Cannot write to a read-only signal. Did you mean to use state() instead of computed()?',
      suggestion: 'Use state() for writable signals, computed() for read-only:\n\nconst count = state(0)  // Writable\nconst doubled = computed(() => count() * 2)  // Read-only\ncount.set(5)  // OK\ndoubled.set(10)  // Error!',
    },
    id: {
      message: 'Tidak bisa mengubah signal read-only. Mungkin maksud kamu pakai state() alih-alih computed()?',
      suggestion: 'Gunakan state() untuk signal yang bisa ditulis, computed() untuk read-only:\n\nconst count = state(0)  // Bisa ditulis\nconst doubled = computed(() => count() * 2)  // Read-only\ncount.set(5)  // OK\ndoubled.set(10)  // Error!',
    },
  },

  SIGNAL_OUTSIDE_EFFECT: {
    code: 'FLINT_SIGNAL_OUTSIDE_EFFECT',
    en: {
      message: 'Signal accessed outside effect/tracking context.',
      suggestion: 'Wrap signal reads in effect() or computed():\n\neffect(() => {\n  console.log(count())  // Tracked\n})\n\nOr in a component:\nfunction MyComponent() {\n  return <div>{count()}</div>  // Tracked during render\n}',
    },
    id: {
      message: 'Signal diakses di luar context effect/tracking.',
      suggestion: 'Jika kamu ingin melacak signal, gunakan effect() atau computed():\n\neffect(() => {\n  console.log(count())  // Dilacak\n})\n\nAtau di component:\nfunction MyComponent() {\n  return <div>{count()}</div>  // Dilacak saat render\n}',
    },
  },

  // Hook Errors
  HOOK_OUTSIDE_COMPONENT: {
    code: 'FLINT_HOOK_OUTSIDE_COMPONENT',
    en: {
      message: 'Hook called outside a component.',
      suggestion: 'Hooks can only be called inside component functions:\n\nfunction MyComponent() {\n  const name = state("hello")  // OK\n  return <div>{name()}</div>\n}\n\n// Wrong\nconst name = state("hello")  // Outside component',
    },
    id: {
      message: 'Hook dipanggil di luar component.',
      suggestion: 'Hook hanya bisa dipanggil di dalam fungsi component:\n\nfunction MyComponent() {\n  const name = state("halo")  // OK\n  return <div>{name()}</div>\n}\n\n// Salah\nconst name = state("halo")  // Di luar component',
    },
  },

  HOOK_ORDER_VIOLATION: {
    code: 'FLINT_HOOK_ORDER_VIOLATION',
    en: {
      message: 'Hooks must be called in the same order on every render.',
      suggestion: 'Do not call hooks inside conditions or loops:\n\n// Wrong\nif (condition) {\n  const name = state("")  // Different order!\n}\n\n// Right\nconst name = state("")  // Always called\nif (condition) {\n  // Use name here\n}',
    },
    id: {
      message: 'Hook harus dipanggil dalam urutan yang sama setiap render.',
      suggestion: 'Jangan panggil hook di dalam kondisi atau loop:\n\n// Salah\nif (kondisi) {\n  const name = state("")  // Urutan berbeda!\n}\n\n// Benar\nconst name = state("")  // Selalu dipanggil\nif (kondisi) {\n  // Gunakan name di sini\n}',
    },
  },

  // JSX Errors
  JSX_INVALID_CHILD: {
    code: 'FLINT_JSX_INVALID_CHILD',
    en: {
      message: 'Invalid JSX child. Children must be strings, numbers, elements, or arrays.',
      suggestion: 'Make sure your JSX children are valid:\n\n// Wrong\n<div>{undefined}</div>\n<div>{null}</div>\n\n// Right\n<div>{undefined ?? ""}</div>\n<div>{null ?? ""}</div>\n<div>{someValue()}</div>',
    },
    id: {
      message: 'Anak JSX tidak valid. Anak harus berupa string, number, element, atau array.',
      suggestion: 'Pastikan anak JSX kamu valid:\n\n// Salah\n<div>{undefined}</div>\n<div>{null}</div>\n\n// Benar\n<div>{undefined ?? ""}</div>\n<div>{null ?? ""}</div>\n<div>{someValue()}</div>',
    },
  },

  JSX_MISSING_KEY: {
    code: 'FLINT_JSX_MISSING_KEY',
    en: {
      message: 'Array elements need a unique "key" prop.',
      suggestion: 'Add a unique key to each element in the list:\n\n// Wrong\n{items.map(item => <div>{item.name}</div>)}\n\n// Right\n{items.map(item => <div key={item.id}>{item.name}</div>)}',
    },
    id: {
      message: 'Element array harus memiliki prop "key" yang unik.',
      suggestion: 'Tambahkan key unik ke setiap element dalam list:\n\n// Salah\n{items.map(item => <div>{item.name}</div>)}\n\n// Benar\n{items.map(item => <div key={item.id}>{item.name}</div>)}',
    },
  },

  // Form Errors
  FORM_MISSING_INITIAL_VALUES: {
    code: 'FLINT_FORM_MISSING_INITIAL_VALUES',
    en: {
      message: 'createForm requires an initialValues object.',
      suggestion: 'Provide initial values for your form:\n\nconst form = createForm({\n  initialValues: {\n    name: "",\n    email: ""\n  },\n  onSubmit: async (values) => {\n    console.log(values)\n  }\n})',
    },
    id: {
      message: 'createForm membutuhkan object initialValues.',
      suggestion: 'Berikan nilai awal untuk form kamu:\n\nconst form = createForm({\n  initialValues: {\n    name: "",\n    email: ""\n  },\n  onSubmit: async (values) => {\n    console.log(values)\n  }\n})',
    },
  },

  FORM_FIELD_NOT_FOUND: {
    code: 'FLINT_FORM_FIELD_NOT_FOUND',
    en: {
      message: 'Field not found in form. Check the field name spelling.',
      suggestion: 'Make sure the field name matches your initialValues:\n\nconst form = createForm({\n  initialValues: { email: "" }\n})\n\nform.field("email")  // Right\nform.field("emial")  // Wrong!',
    },
    id: {
      message: 'Field tidak ditemukan di form. Mungkin salah eja nama field?',
      suggestion: 'Pastikan nama field cocok dengan initialValues kamu:\n\nconst form = createForm({\n  initialValues: { email: "" }\n})\n\nform.field("email")  // Benar\nform.field("emial")  // Salah!',
    },
  },

  // Router Errors
  ROUTE_NOT_FOUND: {
    code: 'FLINT_ROUTE_NOT_FOUND',
    en: {
      message: 'Route not found. Did you forget to add this route?',
      suggestion: 'Add the route to your router config:\n\nconst router = createRouter({\n  routes: [\n    { path: "/", component: Home },\n    { path: "/about", component: About },\n  ]\n})',
    },
    id: {
      message: 'Route tidak ditemukan. Lupa menambahkan route ini?',
      suggestion: 'Tambahkan route ke konfigurasi router kamu:\n\nconst router = createRouter({\n  routes: [\n    { path: "/", component: Home },\n    { path: "/tentang", component: About },\n  ]\n})',
    },
  },

  // Store Errors
  STORE_MISSING_STATE: {
    code: 'FLINT_STORE_MISSING_STATE',
    en: {
      message: 'Store must have a state property.',
      suggestion: 'Add a state property to your store:\n\nconst useStore = createStore({\n  state: {\n    count: 0\n  },\n  actions: {\n    increment() {\n      this.count++\n    }\n  }\n})',
    },
    id: {
      message: 'Store harus memiliki property state.',
      suggestion: 'Tambahkan property state ke store kamu:\n\nconst useStore = createStore({\n  state: {\n    count: 0\n  },\n  actions: {\n    increment() {\n      this.count++\n    }\n  }\n})',
    },
  },

  STORE_MISSING_REDUCER: {
    code: 'FLINT_STORE_MISSING_REDUCER',
    en: {
      message: 'Store reducer must be a function.',
      suggestion: 'Make sure your reducer is a function:\n\nconst useStore = createStore({\n  state: { count: 0 },\n  reducers: {\n    increment: (state) => ({ count: state.count + 1 })  // Right\n  }\n})',
    },
    id: {
      message: 'Store reducer harus berupa fungsi.',
      suggestion: 'Pastikan reducer kamu adalah fungsi:\n\nconst useStore = createStore({\n  state: { count: 0 },\n  reducers: {\n    increment: (state) => ({ count: state.count + 1 })  // Benar\n  }\n})',
    },
  },

  // Context Errors
  CONTEXT_MISSING_PROVIDER: {
    code: 'FLINT_CONTEXT_MISSING_PROVIDER',
    en: {
      message: 'useContext() called without a provider. Forgot to wrap your app?',
      suggestion: 'Wrap your app with the context provider:\n\nconst ThemeContext = createContext("light")\n\nfunction App() {\n  return (\n    <ThemeContext.Provider value="dark">\n      <MyComponent />\n    </ThemeContext.Provider>\n  )\n}',
    },
    id: {
      message: 'useContext() dipanggil tanpa provider. Lupa membungkus app?',
      suggestion: 'Bungkus app kamu dengan context provider:\n\nconst ThemeContext = createContext("light")\n\nfunction App() {\n  return (\n    <ThemeContext.Provider value="dark">\n      <MyComponent />\n    </ThemeContext.Provider>\n  )\n}',
    },
  },

  // Prop Errors
  PROP_TYPE_MISMATCH: {
    code: 'FLINT_PROP_TYPE_MISMATCH',
    en: {
      message: 'Invalid prop type. Check the expected type for this prop.',
      suggestion: 'Make sure you pass the correct type:\n\n// Wrong\n<Input type={123} />\n\n// Right\n<Input type="text" />',
    },
    id: {
      message: 'Tipe prop tidak valid. Periksa tipe yang diharapkan untuk prop ini.',
      suggestion: 'Pastikan kamu memberikan tipe yang benar:\n\n// Salah\n<Input type={123} />\n\n// Benar\n<Input type="text" />',
    },
  },

  PROP_MISSING_REQUIRED: {
    code: 'FLINT_PROP_MISSING_REQUIRED',
    en: {
      message: 'Required prop is missing.',
      suggestion: 'Pass all required props:\n\n// Wrong\n<Input />\n\n// Right\n<Input name="email" value={email()} />',
    },
    id: {
      message: 'Prop yang diperlukan tidak ada.',
      suggestion: 'Berikan semua prop yang diperlukan:\n\n// Salah\n<Input />\n\n// Benar\n<Input name="email" value={email()} />',
    },
  },

  // General Errors
  NOT_IMPLEMENTED: {
    code: 'FLINT_NOT_IMPLEMENTED',
    en: {
      message: 'This feature is not yet implemented.',
      suggestion: 'Check the Flint roadmap or contribute this feature!\nhttps://github.com/salzcill-cmd/flint/issues',
    },
    id: {
      message: 'Fitur ini belum diimplementasikan.',
      suggestion: 'Cek roadmap Flint atau berkontribusi untuk fitur ini!\nhttps://github.com/salzcill-cmd/flint/issues',
    },
  },

  INVALID_CONFIGURATION: {
    code: 'FLINT_INVALID_CONFIGURATION',
    en: {
      message: 'Invalid configuration. Check your settings.',
      suggestion: 'Review the configuration options:\nhttps://github.com/salzcill-cmd/flint#readme',
    },
    id: {
      message: 'Konfigurasi tidak valid. Periksa pengaturan kamu.',
      suggestion: 'Tinjau opsi konfigurasi:\nhttps://github.com/salzcill-cmd/flint#readme',
    },
  },
}

// ─── Resolve Error to Current Language ──────────────────────────

function resolveError(code: string): FlintErrorResolved {
  const entry = ERROR_CODES[code]
  if (!entry) return { code, message: `Unknown error: ${code}` }
  const lang = entry[currentLang] || entry.en
  return { code: entry.code, message: lang.message, suggestion: lang.suggestion }
}

// ─── Error Helper Functions ─────────────────────────────────────

/**
 * Create a helpful error with bilingual suggestion.
 *
 * @example
 * throw flintError('COMPONENT_NOT_FUNCTION')
 */
export function flintError(code: string, customMessage?: string): Error {
  const resolved = resolveError(code)
  const message = customMessage ?? resolved.message
  const fullMessage = resolved.suggestion
    ? `${message}\n\n💡 Suggestion:\n${resolved.suggestion}`
    : message

  const error = new Error(fullMessage)
  error.name = `FlintError: ${resolved.code}`
  return error
}

/**
 * Throw a helpful error with bilingual suggestion.
 */
export function throwFlintErrorBeginner(code: string, customMessage?: string): never {
  throw flintError(code, customMessage)
}

/**
 * Log a helpful warning with bilingual suggestion.
 */
export function flintWarning(code: string, customMessage?: string): void {
  const resolved = resolveError(code)
  const message = customMessage ?? resolved.message
  const fullMessage = resolved.suggestion
    ? `${message}\n\n💡 Suggestion:\n${resolved.suggestion}`
    : message

  console.warn(`[Flint] ${fullMessage}`)
}

/**
 * Check if a value is a valid Flint component.
 */
export function isValidComponent(value: any): boolean {
  if (typeof value === 'function') {
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

export function warnComponentNaming(name: string): void {
  if (typeof name !== 'string') return
  if (name[0] !== name[0].toUpperCase()) {
    console.warn(
      `[Flint] Component "${name}" should start with an uppercase letter.\n` +
      `This helps distinguish components from regular functions.\n\n` +
      `💡 Suggestion: Rename to "${name.charAt(0).toUpperCase() + name.slice(1)}"`
    )
  }
}

export function warnHookConditional(): void {
  console.warn(
    '[Flint] Hook called conditionally.\n\n' +
    'Hooks must be called in the same order on every render.\n' +
    'Do not use hooks inside if statements, loops, or early returns.\n\n' +
    '💡 Suggestion: Move the hook to the top of the component.'
  )
}

export function warnUnknownProp(componentName: string, propName: string): void {
  console.warn(
    `[Flint] Unknown prop "${propName}" on component "${componentName}".\n\n` +
    'Check if the prop name is correct or if you meant to use a different prop.'
  )
}

export function warnInvalidChild(child: any): void {
  if (child === undefined || child === null || child === false) return
  if (typeof child === 'object' && !(child as any).__flint_element) {
    console.warn(
      '[Flint] Invalid JSX child. Children must be strings, numbers, elements, or arrays.\n\n' +
      '💡 Suggestion: Wrap the object in a string or use a component.'
    )
  }
}

// ─── Quick Help Messages (Bilingual) ────────────────────────────

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
  <div class={cn("btn", { active })}>

🚀 Quick DX:
  $ref()       // Template ref
  $store()     // Quick store
  $if()        // Conditional
  $map()       // List render
  $await()     // Async render
  $log()       // Debug log

📝 Form:
  const form = $form({ email: '' }, {
    email: (v) => v.includes('@') ? null : 'Invalid email'
  }, async (v) => { await login(v) })

🌐 Load:
  const users = $load('/api/users')
  users.data()          // Data
  users.loading()       // Loading state

🪟 Modal:
  const modal = $modal()
  modal.open / modal.close

🔔 Toast:
  toast.success('Done!')

💾 Storage:
  const theme = $storage('theme', 'light')

⏱️ Time:
  $time.format(date)    // '2 min ago'

🎨 UI Components:
  <Toggle bind={enabled} label="Active" />
  <Checkbox bind={agreed} label="I agree" />
  <Progress value={75} />
  <Skeleton width="200px" />
  <Avatar name="John" />
  <Badge status="success">Active</Badge>
  <Alert type="info" title="Info">Message</Alert>

🔧 Debug:
  debug.inspector()
  debug.monitor()
  debug.tree()
`

// ─── Dev Mode Helpers ───────────────────────────────────────────

function getCallerLocation(): string {
  const err = new Error()
  const stack = err.stack ?? ''
  const lines = stack.split('\n')
  for (const line of lines) {
    if (line.includes('beginner.ts') || line.includes('errors/')) continue
    if (line.includes('at ') && (line.includes('.ts:') || line.includes('.js:'))) {
      const match = line.match(/at\s+(.+):(\d+):(\d+)/)
      if (match) {
        const file = match[1].split('/').pop()
        return `${file}:${match[2]}`
      }
    }
  }
  return ''
}

export function devWarn(message: string, ...args: any[]): void {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return
  const location = getCallerLocation()
  const prefix = location ? `[Flint @ ${location}]` : '[Flint]'
  console.warn(`${prefix} ${message}`, ...args)
}

export function devError(message: string, ...args: any[]): void {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return
  const location = getCallerLocation()
  const prefix = location ? `[Flint @ ${location}]` : '[Flint]'
  console.error(`${prefix} ${message}`, ...args)
}

export function devLog(message: string, ...args: any[]): void {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return
  const location = getCallerLocation()
  const prefix = location ? `[Flint @ ${location}]` : '[Flint]'
  console.log(`${prefix} ${message}`, ...args)
}

export function devDeprecated(oldApi: string, newApi: string): void {
  devWarn(`"${oldApi}" is deprecated. Use "${newApi}" instead.`)
}

export function devPerfWarning(message: string): void {
  devWarn(`[Performance] ${message}`)
}

export function devAssert(condition: boolean, message: string): void {
  if (!condition) {
    devError(`Assertion failed: ${message}`)
  }
}

export function devRenderWarning(componentName: string, count: number, threshold = 10): void {
  if (count > threshold) {
    devWarn(
      `Component "${componentName}" has rendered ${count} times. ` +
      `This may indicate an infinite loop or unnecessary re-renders.`
    )
  }
}

export function devMemoryWarning(message: string): void {
  devWarn(`[Memory] ${message}`)
}

export function devLifecycle(componentName: string, event: string): void {
  devLog(`[${componentName}] ${event}`)
}

let debugMode = false

export function enableDebugMode(): void {
  debugMode = true
  devLog('Debug mode enabled')
}

export function disableDebugMode(): void {
  debugMode = false
  devLog('Debug mode disabled')
}

export function isDebugMode(): boolean {
  return debugMode
}

export function debugLog(message: string, ...args: any[]): void {
  if (!debugMode) return
  devLog(message, ...args)
}
