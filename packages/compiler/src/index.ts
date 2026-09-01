// Flint Compiler — Main Entry Point

import { parse as doParse } from './parser/index.js'
import { transform as doTransform } from './transformer/index.js'

export { parse } from './parser/index.js'
export { transform } from './transformer/index.js'
export { createCompilerError, formatCompilerError } from './errors/index.js'
export type { CompilerError } from './errors/index.js'
export type { ParseOptions, ParseResult } from './parser/index.js'
export type { TransformOptions, TransformResult } from './transformer/index.js'

/**
 * Compile JSX/JavaScript source code into Flint-compatible code.
 * This is the main entry point for the compiler.
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
    })

    const result = doTransform(ast, code, {
      filename: options.filename,
      dev: options.dev,
    })

    return { code: result.code }
  } catch (err) {
    return {
      code,
      error: err instanceof Error ? err : new Error(String(err)),
    }
  }
}
