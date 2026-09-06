// Flint Compiler — Main Entry Point

import { parse as doParse } from './parser/index.js'
import { transform as doTransform } from './transformer/index.js'
import {
  createCompilerError,
  formatCompilerError,
  guessCauses,
} from './errors/index.js'

export { parse } from './parser/index.js'
export { transform } from './transformer/index.js'
export {
  createCompilerError,
  formatCompilerError,
  guessCauses,
  codeFrame,
} from './errors/index.js'
export type { CompilerError } from './errors/index.js'
export type { ParseOptions, ParseResult } from './parser/index.js'
export type { TransformOptions, TransformResult } from './transformer/index.js'

/** Shape of the failure object returned by compile() on error. */
export interface CompileFailure {
  code: string
  error: Error
  /** Formatted, human-friendly report ready to print (code frame + causes) */
  formatted?: string
  line?: number
  column?: number
}

/**
 * Extract line/column from an acorn-style error message ("(12:4)") and
 * grab the offending source line for the code frame.
 */
function locateError(err: unknown, code: string): { line?: number; column?: number; sourceLine?: string } {
  const message = err instanceof Error ? err.message : String(err)
  const match = /\((\d+):(\d+)\)\s*$/.exec(message.trim())
  if (!match) return {}

  const line = parseInt(match[1], 10)
  const column = parseInt(match[2], 10)
  const lines = code.split('\n')
  const sourceLine = line >= 1 && line <= lines.length ? lines[line - 1] : undefined
  return { line, column, sourceLine }
}

/**
 * Compile JSX/JavaScript source code into Flint runtime calls.
 *
 * On failure, returns the original code plus a richly formatted error:
 * file, line:column, a caret code frame, likely causes, and a suggestion —
 * while the raw error stays available for tooling.
 */
export function compile(
  code: string,
  options: {
    filename?: string
    dev?: boolean
    sourceType?: 'module' | 'script'
  } = {}
): { code: string; error?: Error } {
  try {
    const { ast } = doParse(code, {
      sourceType: options.sourceType,
      filename: options.filename,
    })

    const result = doTransform(ast, code, {
      filename: options.filename,
      dev: options.dev,
    })

    return { code: result.code }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    const { line, column, sourceLine } = locateError(error, code)

    const compilerError = createCompilerError(
      'Could not compile this file',
      {
        file: options.filename,
        line,
        column,
        suggestion:
          'Fix the syntax at the marked position, then save the file again.',
        raw: `${error.name}: ${error.message}`,
      }
    )
    // Attach guessed causes and the code frame source
    ;(compilerError as any).causes = guessCauses(error.message)
    ;(compilerError as any).sourceLine = sourceLine

    return {
      code,
      error,
      formatted: formatCompilerError(compilerError),
    } as { code: string; error: Error; formatted?: string } & CompileFailure
  }
}
