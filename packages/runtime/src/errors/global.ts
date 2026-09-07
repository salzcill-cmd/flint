// Flint Runtime — Global Error Handlers
// Catches unhandled promise rejections and errors in production

let initialized = false
let unhandledRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null
let errorHandler: ((event: ErrorEvent) => void) | null = null

export function initGlobalErrorHandlers(): void {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
    console.error('[Flint] Unhandled promise rejection:', event.reason)
  }

  errorHandler = (event: ErrorEvent) => {
    console.error('[Flint] Uncaught error:', event.error)
  }

  window.addEventListener('unhandledrejection', unhandledRejectionHandler)
  window.addEventListener('error', errorHandler)
}

export function removeGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return

  if (unhandledRejectionHandler) {
    window.removeEventListener('unhandledrejection', unhandledRejectionHandler)
    unhandledRejectionHandler = null
  }

  if (errorHandler) {
    window.removeEventListener('error', errorHandler)
    errorHandler = null
  }

  initialized = false
}
