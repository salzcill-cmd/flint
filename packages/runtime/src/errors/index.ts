// Flint Error System
// Actionable, human-readable error messages

// ─── Error Types ────────────────────────────────────────────────

export type ErrorCode =
  | 'COMPONENT_NOT_FOUND'
  | 'INVALID_JSX'
  | 'MISSING_IMPORT'
  | 'RENDER_ERROR'
  | 'EFFECT_ERROR'
  | 'SIGNAL_ERROR'
  | 'STORE_ERROR'
  | 'HMR_ERROR'
  | 'BUILD_ERROR'
  | 'UNKNOWN'

export interface FlintError {
  code: ErrorCode
  message: string
  file?: string
  line?: number
  column?: number
  suggestion?: string
  stack?: string
}

// ─── Error Factory ──────────────────────────────────────────────

export function createFlintError(
  code: ErrorCode,
  message: string,
  options: {
    file?: string
    line?: number
    column?: number
    suggestion?: string
    stack?: string
  } = {}
): FlintError {
  return {
    code,
    message,
    ...options,
  }
}

// ─── Error Formatters ───────────────────────────────────────────

/**
 * Format a Flint error into a human-readable string.
 *
 * @example
 * const error = createFlintError('COMPONENT_NOT_FOUND', 'Component "Navbar" not found', {
 *   file: 'src/pages/Home.js',
 *   line: 12,
 *   suggestion: 'Check the import for Navbar component'
 * })
 * console.log(formatFlintError(error))
 * // ❌ Component "Navbar" not found
 * //
 * // 📄 File: src/pages/Home.js
 * // 📍 Line: 12
 * //
 * // 💡 Check the import for Navbar component
 */
export function formatFlintError(error: FlintError): string {
  let output = `\n❌ [${error.code}] ${error.message}`

  if (error.file) {
    output += `\n\n📄 File: ${error.file}`
  }

  if (error.line !== undefined) {
    output += `\n📍 Line: ${error.line}`
    if (error.column !== undefined) {
      output += `:${error.column}`
    }
  }

  if (error.suggestion) {
    output += `\n\n💡 ${error.suggestion}`
  }

  if (error.stack) {
    output += `\n\nStack trace:\n${error.stack}`
  }

  output += '\n'
  return output
}

/**
 * Create and throw a Flint error.
 */
export function throwFlintError(
  code: ErrorCode,
  message: string,
  options: Parameters<typeof createFlintError>[2] = {}
): never {
  const error = createFlintError(code, message, options)
  throw new Error(formatFlintError(error))
}

// ─── Common Error Messages ──────────────────────────────────────

export const ErrorMessages = {
  COMPONENT_NOT_FOUND: (name: string, file?: string) =>
    createFlintError('COMPONENT_NOT_FOUND', `Component "${name}" not found`, {
      file,
      suggestion: `Check if "${name}" is imported correctly and the file exists.`,
    }),

  INVALID_JSX: (file?: string, line?: number) =>
    createFlintError('INVALID_JSX', 'Invalid JSX syntax', {
      file,
      line,
      suggestion: 'Check for unclosed tags, missing attributes, or invalid expressions.',
    }),

  MISSING_IMPORT: (name: string, file?: string) =>
    createFlintError('MISSING_IMPORT', `"${name}" is not imported`, {
      file,
      suggestion: `Add an import statement for "${name}" at the top of your file.`,
    }),

  RENDER_ERROR: (componentName: string, file?: string, stack?: string) =>
    createFlintError('RENDER_ERROR', `Error rendering component "${componentName}"`, {
      file,
      suggestion: 'Check the component render function for errors.',
      stack,
    }),

  EFFECT_ERROR: (file?: string, stack?: string) =>
    createFlintError('EFFECT_ERROR', 'Error in effect execution', {
      file,
      suggestion: 'Check the effect function for errors.',
      stack,
    }),

  SIGNAL_ERROR: (message: string) =>
    createFlintError('SIGNAL_ERROR', message),

  STORE_ERROR: (message: string) =>
    createFlintError('STORE_ERROR', message),

  BUILD_ERROR: (message: string, file?: string, line?: number) =>
    createFlintError('BUILD_ERROR', message, {
      file,
      line,
    }),

  UNKNOWN: (message: string) =>
    createFlintError('UNKNOWN', message),
} as const

// ─── Error Boundary (for future use) ────────────────────────────

/**
 * Wrap a function with error handling.
 * Catches errors and formats them as FlintError.
 */
export function withErrorHandling<T>(
  fn: () => T,
  errorHandler?: (error: FlintError) => void
): T | undefined {
  try {
    return fn()
  } catch (err) {
    const flintError: FlintError = {
      code: 'UNKNOWN',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }

    if (errorHandler) {
      errorHandler(flintError)
    } else {
      console.error(formatFlintError(flintError))
    }

    return undefined
  }
}
