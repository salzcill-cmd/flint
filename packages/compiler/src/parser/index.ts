// Flint Compiler — JSX Parser using Acorn
// Parses JavaScript/JSX (and TypeScript via pre-stripping) into AST

import * as acorn from 'acorn'
import jsx from 'acorn-jsx'
import { transformSync } from 'esbuild'

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
 * Detect if source code contains TypeScript syntax.
 */
function hasTypeScriptSyntax(code: string): boolean {
  // Quick check for common TS patterns
  return (
    /:\s*(string|number|boolean|any|void|never|unknown|object)\b/.test(code) ||
    /:\s*\w+(\[\])*\s*[=;,)]/.test(code) ||
    /<(T|K|V|P|E|R|N|S|U|A|B|C|D|F|L|M|O|W|X|Y|Z)\s*[>,]/.test(code) ||
    /^\s*(interface|type|enum|abstract|declare|readonly)\s+/m.test(code) ||
    /\bas\s+\w+/.test(code) ||
    /!\s*[=.(]/.test(code) // non-null assertion
  )
}

/**
 * Strip TypeScript syntax from source code using esbuild.
 * Converts TSX/TS to plain JSX/JS.
 */
function stripTypeScript(code: string): string {
  const result = transformSync(code, {
    loader: 'tsx',
    format: 'esm',
    target: 'esnext',
    jsx: 'preserve',
    // Keep JSX as-is for Flint compiler to handle
    treeShaking: false,
    minify: false,
  })
  return result.code
}

/**
 * Parse JSX/JavaScript/TypeScript source code into an AST.
 * Automatically strips TypeScript syntax before parsing if detected.
 */
export function parse(code: string, options: ParseOptions = {}): ParseResult {
  let parseCode = code

  // Strip TypeScript if syntax is detected
  if (hasTypeScriptSyntax(code)) {
    try {
      parseCode = stripTypeScript(code)
    } catch {
      // If TS stripping fails, try parsing as-is (might be JS)
      parseCode = code
    }
  }

  const ast = flintParser.parse(parseCode, {
    sourceType: options.sourceType ?? 'module',
    ecmaVersion: (options.ecmaVersion ?? 'latest') as any,
    locations: true,
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
  })

  return { ast, code: parseCode }
}
