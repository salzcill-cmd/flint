// Flint Runtime — Global Error Handlers
// Catches unhandled promise rejections and errors in production

let initialized = false

export function initGlobalErrorHandlers(): void {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Flint] Unhandled promise rejection:', event.reason)
  })

  window.addEventListener('error', (event) => {
    console.error('[Flint] Uncaught error:', event.error)
  })
}

export function removeGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return
  window.removeEventListener('unhandledrejection', () => {})
  window.removeEventListener('error', () => {})
  initialized = false
}
