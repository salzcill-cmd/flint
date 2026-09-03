// Flint Runtime — Error System v2
// Error boundaries, error formatting, and error handling utilities

import { state, effect, type Signal } from '@flint/reactivity'
import { h } from '../renderer/index.js'
import type { Child } from '../renderer/index.js'

// ─── Error Types ────────────────────────────────────────────────

export interface FlintError extends Error {
  code: string
  file?: string
  line?: number
  column?: number
  suggestion?: string
  componentStack?: string
  sourceContext?: string
}

export type ErrorCode =
  | 'COMPONENT_NOT_FOUND'
  | 'MISSING_IMPORT'
  | 'TYPE_ERROR'
  | 'REFERENCE_ERROR'
  | 'RENDER_ERROR'
  | 'EFFECT_ERROR'
  | 'ASYNC_ERROR'
  | 'SSR_ERROR'
  | 'HYDRATION_ERROR'
  | 'ROUTE_NOT_FOUND'
  | 'STORE_ERROR'
  | 'QUERY_ERROR'
  | 'VALIDATION_ERROR'

// ─── Error Creation ─────────────────────────────────────────────

export function createFlintError(
  codeOrOptions: string | {
    code: string
    message: string
    file?: string
    line?: number
    column?: number
    suggestion?: string
    sourceCode?: string
    componentStack?: string | string[]
  },
  message?: string,
  options: Partial<{
    file: string
    line: number
    column: number
    suggestion: string
    sourceCode: string
    componentStack: string | string[]
  }> = {}
): FlintError {
  // Support both old and new API signatures
  let code: string
  let errorMessage: string
  let opts: typeof options

  if (typeof codeOrOptions === 'string') {
    code = codeOrOptions
    errorMessage = message || ''
    opts = options
  } else {
    code = codeOrOptions.code
    errorMessage = codeOrOptions.message
    opts = codeOrOptions
  }

  const error = new Error(errorMessage) as FlintError
  error.code = code
  error.file = opts.file
  error.line = opts.line
  error.column = opts.column
  error.suggestion = opts.suggestion
  error.componentStack = Array.isArray(opts.componentStack)
    ? opts.componentStack.join('\n')
    : opts.componentStack

  // Extract source context
  if (opts.sourceCode && opts.line) {
    const lines = opts.sourceCode.split('\n')
    const start = Math.max(0, opts.line - 3)
    const end = Math.min(lines.length, opts.line + 2)
    const sourceLines: string[] = []
    const contextLines = lines.slice(start, end).map((line, i) => {
      const lineNum = start + i + 1
      const marker = lineNum === opts.line ? '>' : ' '
      const lineStr = `${marker} ${lineNum} | ${line}`
      sourceLines.push(`${lineNum} | ${line}`)
      return lineStr
    })
    error.sourceContext = contextLines.join('\n')
    ;(error as any).sourceLines = sourceLines
  }

  // Include code in the error name for easy matching
  error.name = `FlintError [${code}]`

  // Format componentStack array to string with "in" prefix
  if (Array.isArray(opts.componentStack)) {
    error.componentStack = opts.componentStack.map(c => `in ${c}`).join('\n')
  }

  return error
}

// ─── Error Formatting ───────────────────────────────────────────

export function formatFlintError(error: FlintError): string {
  const parts: string[] = []

  parts.push(`\n${'─'.repeat(60)}`)
  parts.push(`❌ ${error.name}`)
  parts.push(`${'─'.repeat(60)}`)
  parts.push(`\n${error.message}`)

  if (error.file) {
    let location = `📄 ${error.file}`
    if (error.line) location += `:${error.column || 1}`
    parts.push(`\n${location}`)
    // Also add line number on its own line for easy matching
    if (error.line) {
      parts.push(`\nLine ${error.line}`)
    }
  }

  if (error.sourceContext) {
    parts.push(`\nSource:\n${error.sourceContext}`)
  }

  if (error.componentStack) {
    parts.push(`\nComponent Stack:\n${error.componentStack}`)
  }

  if (error.suggestion) {
    parts.push(`\n💡 Suggestion: ${error.suggestion}`)
  }

  parts.push(`\n${'─'.repeat(60)}\n`)

  return parts.join('\n')
}

export function formatFlintErrorTerminal(error: FlintError): string {
  const RED = '\x1b[31m'
  const YELLOW = '\x1b[33m'
  const CYAN = '\x1b[36m'
  const GRAY = '\x1b[90m'
  const RESET = '\x1b[0m'
  const BOLD = '\x1b[1m'

  const parts: string[] = []

  parts.push(`\n${'─'.repeat(60)}`)
  parts.push(`${RED}${BOLD}❌ ${error.name}${RESET}`)
  parts.push(`${'─'.repeat(60)}`)
  parts.push(`\n${RED}${error.message}${RESET}`)

  if (error.file) {
    let location = `${CYAN}📄 ${error.file}${RESET}`
    if (error.line) location += `${YELLOW}:${error.column || 1}${RESET}`
    parts.push(`\n${location}`)
  }

  if (error.sourceContext) {
    parts.push(`\n${GRAY}Source:${RESET}`)
    const lines = error.sourceContext.split('\n')
    for (const line of lines) {
      if (line.startsWith('>')) {
        parts.push(`${RED}${line}${RESET}`)
      } else {
        parts.push(`${GRAY}${line}${RESET}`)
      }
    }
  }

  if (error.componentStack) {
    parts.push(`\n${GRAY}Component Stack:${RESET}`)
    parts.push(`${GRAY}${error.componentStack}${RESET}`)
  }

  if (error.suggestion) {
    parts.push(`\n${YELLOW}💡 Suggestion: ${error.suggestion}${RESET}`)
  }

  parts.push(`\n${'─'.repeat(60)}\n`)

  return parts.join('')
}

export function throwFlintError(
  codeOrOptions: string | {
    code: string
    message: string
    file?: string
    line?: number
    column?: number
    suggestion?: string
    sourceCode?: string
  },
  message?: string,
  options?: Partial<{
    file: string
    line: number
    column: number
    suggestion: string
    sourceCode: string
  }>
): never {
  if (typeof codeOrOptions === 'string') {
    throw createFlintError(codeOrOptions, message || '', options)
  }
  throw createFlintError(codeOrOptions)
}

// ─── Error Conversion ───────────────────────────────────────────

export function fromNativeError(error: Error, options: Partial<{ code: string; suggestion: string }> = {}): FlintError {
  let code = options.code || 'UNKNOWN_ERROR'

  // Detect error type
  if (error instanceof TypeError) {
    code = options.code || 'TYPE_ERROR'
  } else if (error instanceof ReferenceError) {
    code = options.code || 'REFERENCE_ERROR'
  }

  const flintError = createFlintError({
    code,
    message: error.message,
    suggestion: options.suggestion,
  })

  flintError.stack = error.stack
  return flintError
}

// ─── Error Messages ─────────────────────────────────────────────

export const ErrorMessages = {
  COMPONENT_NOT_FOUND: (name: string, file?: string, line?: number) =>
    createFlintError('COMPONENT_NOT_FOUND', `Component "${name}" not found`, {
      file,
      line,
      suggestion: `Make sure the component "${name}" is imported and registered correctly.`,
    }),

  MISSING_IMPORT: (module: string, file?: string, line?: number) =>
    createFlintError('MISSING_IMPORT', `Missing import: "${module}"`, {
      file,
      line,
      suggestion: `Add the import for "${module}" at the top of your file.`,
    }),

  TYPE_ERROR: (message: string, file?: string, line?: number) =>
    createFlintError('TYPE_ERROR', `Type error: ${message}`, { file, line }),

  REFERENCE_ERROR: (name: string, file?: string, line?: number) =>
    createFlintError('REFERENCE_ERROR', `Reference error: "${name}" is not defined`, {
      file,
      line,
      suggestion: `Check if the variable "${name}" is properly declared and in scope.`,
    }),

  INVALID_JSX: (file: string, line: number) =>
    createFlintError('RENDER_ERROR', `Invalid JSX syntax`, { file, line }),
}

// ─── Error Handling Wrapper ─────────────────────────────────────

export function withErrorHandling<T>(
  fn: () => T,
  errorHandler?: (error: FlintError) => void
): T | undefined {
  try {
    return fn()
  } catch (error) {
    const flintError = error instanceof Error && 'code' in error
      ? error as FlintError
      : fromNativeError(error instanceof Error ? error : new Error(String(error)))

    if (errorHandler) {
      errorHandler(flintError)
      return undefined
    }

    console.error(formatFlintErrorTerminal(flintError))
    return undefined
  }
}

// ─── Stack Trace Parsing ────────────────────────────────────────

interface StackFrame {
  functionName?: string
  fileName?: string
  lineNumber?: number
  columnNumber?: number
}

export function parseStackTrace(stack?: string): StackFrame[] {
  if (!stack) return []

  const frames: StackFrame[] = []
  const lines = stack.split('\n')

  for (const line of lines) {
    const match = line.match(/at\s+(?:(\S+)\s+\()?([^:]+):(\d+):(\d+)\)?/)
    if (match) {
      frames.push({
        functionName: match[1],
        fileName: match[2],
        lineNumber: parseInt(match[3], 10),
        columnNumber: parseInt(match[4], 10),
      })
    }
  }

  return frames
}

// ─── Error Boundary Component ───────────────────────────────────

export interface ErrorBoundaryProps {
  fallback?: Child | ((error: Error, reset: () => void) => Child)
  children: () => Child
  onError?: (error: Error, errorInfo?: ErrorInfo) => void
  onRecover?: () => void
  maxRetries?: number
}

export interface ErrorInfo {
  componentStack?: string
  boundaryName?: string
}

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  retryCount: number
}

export function ErrorBoundary(props: ErrorBoundaryProps): Child {
  const { children, fallback, onError, onRecover, maxRetries = 3 } = props

  const errorState = state<ErrorBoundaryState>({
    hasError: false,
    error: null,
    retryCount: 0,
  })

  const reset = () => {
    const current = errorState()
    errorState.set({
      hasError: false,
      error: null,
      retryCount: current.retryCount,
    })
    onRecover?.()
  }

  const render = () => {
    const state_ = errorState()

    if (state_.hasError && state_.error) {
      if (typeof fallback === 'function') {
        return fallback(state_.error, reset)
      }
      if (fallback !== undefined) {
        return fallback
      }
      return h('div', { style: 'color: red; padding: 1rem;' },
        h('h3', null, 'Something went wrong'),
        h('pre', { style: 'white-space: pre-wrap;' }, state_.error.message),
        h('button', { onClick: reset }, 'Try again')
      )
    }

    try {
      return children()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      if (state_.retryCount < maxRetries) {
        errorState.set({
          hasError: true,
          error: err,
          retryCount: state_.retryCount + 1,
        })
        onError?.(err)
        return null
      }

      onError?.(err)
      throw err
    }
  }

  return render()
}

// ─── useErrorBoundary Hook ──────────────────────────────────────

export function useErrorBoundary(): {
  error: Signal<Error | null>
  hasError: Signal<boolean>
  catchError: (err: Error | unknown) => void
  resetError: () => void
} {
  const error = state<Error | null>(null)
  const hasError = state(false)

  const catchError = (err: Error | unknown) => {
    const error_ = err instanceof Error ? err : new Error(String(err))
    error.set(error_)
    hasError.set(true)
    console.error('[Flint ErrorBoundary]', error_)
  }

  const resetError = () => {
    error.set(null)
    hasError.set(false)
  }

  return { error, hasError, catchError, resetError }
}

// ─── Global Error Handler ───────────────────────────────────────

type ErrorHandler = (error: Error, info?: ErrorInfo) => void

const errorHandlers = new Set<ErrorHandler>()

export function onError(handler: ErrorHandler): () => void {
  errorHandlers.add(handler)
  return () => errorHandlers.delete(handler)
}

export function reportError(error: Error, info?: ErrorInfo): void {
  for (const handler of errorHandlers) {
    try {
      handler(error, info)
    } catch (e) {
      console.error('[Flint] Error in error handler:', e)
    }
  }
}

// ─── Safe Rendering ─────────────────────────────────────────────

export function safeRender(
  renderFn: () => Child,
  fallback?: Child
): () => Child {
  return () => {
    try {
      return renderFn()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      reportError(err)
      if (typeof fallback === 'function') {
        return (fallback as Function)()
      }
      return fallback ?? null
    }
  }
}
