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
    message: 'Component harus berupa fungsi yang mengembalikan JSX.',
    suggestion: 'Pastikan component kamu adalah fungsi yang mengembalikan JSX:\n\n// Salah\nclass MyComponent extends Component {}\n\n// Benar\nfunction MyComponent() {\n  return <div>Halo</div>\n}',
    docs: 'https://flint.dev/docs/components',
  },

  COMPONENT_MISSING_RETURN: {
    code: 'FLINT_COMPONENT_MISSING_RETURN',
    message: 'Component harus mengembalikan sesuatu. Lupa pernyataan return?',
    suggestion: 'Tambahkan pernyataan return ke component kamu:\n\nfunction MyComponent() {\n  return <div>Halo</div>\n}',
    docs: 'https://flint.dev/docs/components',
  },

  // Signal/State Errors
  SIGNAL_READ_ONLY: {
    code: 'FLINT_SIGNAL_READ_ONLY',
    message: 'Tidak bisa mengubah signal read-only. Mungkin maksud kamu pakai state() alih-alih computed()?',
    suggestion: 'Gunakan state() untuk signal yang bisa ditulis, computed() untuk read-only:\n\nconst count = state(0)  // Bisa ditulis\nconst doubled = computed(() => count() * 2)  // Read-only\ncount.set(5)  // OK\ndoubled.set(10)  // Error!',
    docs: 'https://flint.dev/docs/reactivity',
  },

  SIGNAL_OUTSIDE_EFFECT: {
    code: 'FLINT_SIGNAL_OUTSIDE_EFFECT',
    message: 'Signal diakses di luar context effect/tracking.',
    suggestion: 'Jika kamu ingin melacak signal, gunakan effect() atau computed():\n\neffect(() => {\n  console.log(count())  // Dilacak\n})\n\nAtau di component:\nfunction MyComponent() {\n  return <div>{count()}</div>  // Dilacak saat render\n}',
    docs: 'https://flint.dev/docs/reactivity',
  },

  // Hook Errors
  HOOK_OUTSIDE_COMPONENT: {
    code: 'FLINT_HOOK_OUTSIDE_COMPONENT',
    message: 'Hook dipanggil di luar component.',
    suggestion: 'Hook hanya bisa dipanggil di dalam fungsi component:\n\nfunction MyComponent() {\n  const name = state("halo")  // OK\n  return <div>{name()}</div>\n}\n\n// Salah\nconst name = state("halo")  // Di luar component',
    docs: 'https://flint.dev/docs/hooks',
  },

  HOOK_ORDER_VIOLATION: {
    code: 'FLINT_HOOK_ORDER_VIOLATION',
    message: 'Hook harus dipanggil dalam urutan yang sama setiap render.',
    suggestion: 'Jangan panggil hook di dalam kondisi atau loop:\n\n// Salah\nif (kondisi) {\n  const name = state("")  // Urutan berbeda!\n}\n\n// Benar\nconst name = state("")  // Selalu dipanggil\nif (kondisi) {\n  // Gunakan name di sini\n}',
    docs: 'https://flint.dev/docs/hooks',
  },

  // JSX Errors
  JSX_INVALID_CHILD: {
    code: 'FLINT_JSX_INVALID_CHILD',
    message: 'Anak JSX tidak valid. Anak harus berupa string, number, element, atau array.',
    suggestion: 'Pastikan anak JSX kamu valid:\n\n// Salah\n<div>{undefined}</div>\n<div>{null}</div>\n\n// Benar\n<div>{undefined ?? ""}</div>\n<div>{null ?? ""}</div>\n<div>{someValue()}</div>',
    docs: 'https://flint.dev/docs/jsx',
  },

  JSX_MISSING_KEY: {
    code: 'FLINT_JSX_MISSING_KEY',
    message: 'Element array harus memiliki prop "key" yang unik.',
    suggestion: 'Tambahkan key unik ke setiap element dalam list:\n\n// Salah\n{items.map(item => <div>{item.name}</div>)}\n\n// Benar\n{items.map(item => <div key={item.id}>{item.name}</div>)}',
    docs: 'https://flint.dev/docs/lists',
  },

  // Form Errors
  FORM_MISSING_INITIAL_VALUES: {
    code: 'FLINT_FORM_MISSING_INITIAL_VALUES',
    message: 'createForm membutuhkan object initialValues.',
    suggestion: 'Berikan nilai awal untuk form kamu:\n\nconst form = createForm({\n  initialValues: {\n    name: "",\n    email: ""\n  },\n  onSubmit: async (values) => {\n    console.log(values)\n  }\n})',
    docs: 'https://flint.dev/docs/forms',
  },

  FORM_FIELD_NOT_FOUND: {
    code: 'FLINT_FORM_FIELD_NOT_FOUND',
    message: 'Field tidak ditemukan di form. Mungkin salah eja nama field?',
    suggestion: 'Pastikan nama field cocok dengan initialValues kamu:\n\nconst form = createForm({\n  initialValues: { email: "" }\n})\n\nform.field("email")  // Benar\nform.field("emial")  // Salah!',
    docs: 'https://flint.dev/docs/forms',
  },

  // Router Errors
  ROUTE_NOT_FOUND: {
    code: 'FLINT_ROUTE_NOT_FOUND',
    message: 'Route tidak ditemukan. Lupa menambahkan route ini?',
    suggestion: 'Tambahkan route ke konfigurasi router kamu:\n\nconst router = createRouter({\n  routes: [\n    { path: "/", component: Home },\n    { path: "/tentang", component: About },  // Tambahkan route yang missing\n  ]\n})',
    docs: 'https://flint.dev/docs/router',
  },

  // Store Errors
  STORE_MISSING_STATE: {
    code: 'FLINT_STORE_MISSING_STATE',
    message: 'Store harus memiliki property state.',
    suggestion: 'Tambahkan property state ke store kamu:\n\nconst useStore = createStore({\n  state: {\n    count: 0\n  },\n  actions: {\n    increment() {\n      this.count++\n    }\n  }\n})',
    docs: 'https://flint.dev/docs/store',
  },

  STORE_MISSING_REDUCER: {
    code: 'FLINT_STORE_MISSING_REDUCER',
    message: 'Store reducer harus berupa fungsi.',
    suggestion: 'Pastikan reducer kamu adalah fungsi:\n\nconst useStore = createStore({\n  state: { count: 0 },\n  reducers: {\n    increment: (state) => ({ count: state.count + 1 })  // Benar\n  }\n})',
    docs: 'https://flint.dev/docs/store',
  },

  // Context Errors
  CONTEXT_MISSING_PROVIDER: {
    code: 'FLINT_CONTEXT_MISSING_PROVIDER',
    message: 'useContext() dipanggil tanpa provider. Lupa membungkus app?',
    suggestion: 'Bungkus app kamu dengan context provider:\n\nconst ThemeContext = createContext("light")\n\nfunction App() {\n  return (\n    <ThemeContext.Provider value="dark">\n      <MyComponent />\n    </ThemeContext.Provider>\n  )\n}',
    docs: 'https://flint.dev/docs/context',
  },

  // Prop Errors
  PROP_TYPE_MISMATCH: {
    code: 'FLINT_PROP_TYPE_MISMATCH',
    message: 'Tipe prop tidak valid. Periksa tipe yang diharapkan untuk prop ini.',
    suggestion: 'Pastikan kamu memberikan tipe yang benar:\n\n// Salah\n<Input type={123} />\n\n// Benar\n<Input type="text" />',
    docs: 'https://flint.dev/docs/props',
  },

  PROP_MISSING_REQUIRED: {
    code: 'FLINT_PROP_MISSING_REQUIRED',
    message: 'Prop yang diperlukan tidak ada.',
    suggestion: 'Berikan semua prop yang diperlukan:\n\n// Salah\n<Input />\n\n// Benar\n<Input name="email" value={email()} />',
    docs: 'https://flint.dev/docs/props',
  },

  // General Errors
  NOT_IMPLEMENTED: {
    code: 'FLINT_NOT_IMPLEMENTED',
    message: 'Fitur ini belum diimplementasikan.',
    suggestion: 'Cek roadmap Flint atau berkontribusi untuk fitur ini!\nhttps://flint.dev/roadmap',
    docs: 'https://flint.dev/docs',
  },

  INVALID_CONFIGURATION: {
    code: 'FLINT_INVALID_CONFIGURATION',
    message: 'Konfigurasi tidak valid. Periksa pengaturan kamu.',
    suggestion: 'Tinjau opsi konfigurasi:\nhttps://flint.dev/docs/configuration',
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
    return <div>Halo</div>
  }

📊 State:
  const count = state(0)
  count()      // Baca
  count.set(1) // Tulis

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

🚀 Quick DX:
  $ref()       // Template ref
  $store()     // Quick store
  $if()        // Conditional
  $map()       // List render
  $await()     // Async render
  $log()       // Debug log

📝 Form:
  const form = $form({ email: '' }, {
    email: (v) => v.includes('@') ? null : 'Email tidak valid'
  }, async (v) => { await login(v) })
  form.values.email     // Baca value
  form.set('email')     // Set value
  form.submit           // Submit handler

🌐 Load:
  const users = $load('/api/users')
  users.data()          // Data
  users.loading()       // Loading state
  users.error()         // Error
  users.refetch()       // Refetch

🪟 Modal:
  const modal = $modal()
  modal.open            // Buka
  modal.close           // Tutup
  modal.toggle          // Toggle
  modal.isOpen()        // Cek state

🔔 Toast:
  const toast = $toast()
  toast.success('Berhasil!')
  toast.error('Gagal!')

💾 Storage:
  const theme = $storage('theme', 'light')
  theme()               // Baca
  theme.set('dark')     // Tulis + simpan

⏱️ Time:
  $time.format(date)    // '2 menit yang lalu'
  $time.now()           // '14:30:00'

🎨 UI Components:
  <Toggle bind={enabled} label="Aktif" />
  <Checkbox bind={agreed} label="Saya setuju" />
  <Radio group={selected} value="a" label="Pilihan A" />
  <Select bind={color} options={['merah', 'hijau']} />
  <Progress value={75} />
  <Skeleton width="200px" />
  <Avatar name="John Doe" />
  <Tooltip content="Tips">
    <button>Hover saya</button>
  </Tooltip>
  <Badge status="success">Aktif</Badge>
  <Alert type="info" title="Info">Pesan</Alert>

🔧 Debug Tools:
  debug.inspector()    // Toggle signal inspector
  debug.monitor()      // Tampilkan performance monitor
  debug.tree()         // Tampilkan component tree
  debug.borders()      // Tampilkan debug borders
  debug.help()         // Bantuan
`

// ─── Dev Mode Helpers ───────────────────────────────────────────

/**
 * Get caller location from stack trace.
 */
function getCallerLocation(): string {
  const err = new Error()
  const stack = err.stack ?? ''
  const lines = stack.split('\n')

  // Find the first line that's not from this file
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

/**
 * Dev warning with location info.
 */
export function devWarn(message: string, ...args: any[]): void {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return

  const location = getCallerLocation()
  const prefix = location ? `[Flint @ ${location}]` : '[Flint]'
  console.warn(`${prefix} ${message}`, ...args)
}

/**
 * Dev error with location info.
 */
export function devError(message: string, ...args: any[]): void {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return

  const location = getCallerLocation()
  const prefix = location ? `[Flint @ ${location}]` : '[Flint]'
  console.error(`${prefix} ${message}`, ...args)
}

/**
 * Dev log with location info.
 */
export function devLog(message: string, ...args: any[]): void {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return

  const location = getCallerLocation()
  const prefix = location ? `[Flint @ ${location}]` : '[Flint]'
  console.log(`${prefix} ${message}`, ...args)
}

/**
 * Warn about deprecated API usage.
 */
export function devDeprecated(oldApi: string, newApi: string): void {
  devWarn(`"${oldApi}" is deprecated. Use "${newApi}" instead.`)
}

/**
 * Warn about performance issues.
 */
export function devPerfWarning(message: string): void {
  devWarn(`[Performance] ${message}`)
}

/**
 * Assert a condition in dev mode.
 */
export function devAssert(condition: boolean, message: string): void {
  if (!condition) {
    devError(`Assertion failed: ${message}`)
  }
}

/**
 * Warn if component renders too many times.
 */
export function devRenderWarning(componentName: string, count: number, threshold = 10): void {
  if (count > threshold) {
    devWarn(
      `Component "${componentName}" has rendered ${count} times. ` +
      `This may indicate an infinite loop or unnecessary re-renders.`
    )
  }
}

/**
 * Warn about memory leaks.
 */
export function devMemoryWarning(message: string): void {
  devWarn(`[Memory] ${message}`)
}

/**
 * Log component lifecycle events.
 */
export function devLifecycle(componentName: string, event: string): void {
  devLog(`[${componentName}] ${event}`)
}

/**
 * Debug mode flag
 */
let debugMode = false

/**
 * Enable debug mode.
 */
export function enableDebugMode(): void {
  debugMode = true
  devLog('Debug mode enabled')
}

/**
 * Disable debug mode.
 */
export function disableDebugMode(): void {
  debugMode = false
  devLog('Debug mode disabled')
}

/**
 * Check if debug mode is enabled.
 */
export function isDebugMode(): boolean {
  return debugMode
}

/**
 * Debug log that only shows in debug mode.
 */
export function debugLog(message: string, ...args: any[]): void {
  if (!debugMode) return
  devLog(message, ...args)
}
