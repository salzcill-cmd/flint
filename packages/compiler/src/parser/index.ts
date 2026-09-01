// Flint Compiler — JSX Parser using Acorn
// Parses JavaScript/JSX into AST

import * as acorn from 'acorn'
import jsx from 'acorn-jsx'

export interface ParseOptions {
  sourceType?: 'module' | 'script'
  ecmaVersion?: number
}

export interface ParseResult {
  ast: acorn.Node
  code: string
}

const flintParser = acorn.Parser.extend(jsx())

/**
 * Parse JSX/JavaScript source code into an AST.
 */
export function parse(code: string, options: ParseOptions = {}): ParseResult {
  const ast = flintParser.parse(code, {
    sourceType: options.sourceType ?? 'module',
    ecmaVersion: (options.ecmaVersion ?? 'latest') as any,
    locations: true,
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
  })

  return { ast, code }
}
