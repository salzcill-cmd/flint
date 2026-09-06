// Flint Compiler — JSX Parser using Acorn
// Parses JavaScript/JSX (and TypeScript via pre-stripping) into AST
//
// TypeScript detection is DETERMINISTIC (by file extension) when a filename
// is provided. Without a filename we try plain JS first and only fall back
// to TS stripping if that fails — never the other way around. The old
// regex-based sniffing misfired on plain JS (e.g. `a != b`, object literals
// like `{ id: 5 }`, or even template literals containing English text like
// "as well"), silently re-printing files through esbuild for no reason.

import * as acorn from 'acorn'
import jsx from 'acorn-jsx'
import { transformSync } from 'esbuild'

export interface ParseOptions {
  sourceType?: 'module' | 'script'
  ecmaVersion?: number
  /** Filename (or virtual id) — used to detect TypeScript deterministically */
  filename?: string
}

export interface ParseResult {
  ast: acorn.Node
  code: string
}

const flintParser = acorn.Parser.extend(jsx())

const TS_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts']

/**
 * Detect whether a filename refers to a TypeScript file.
 */
function isTypeScriptFile(filename?: string): boolean {
  if (!filename) return false
  const clean = filename.split('?')[0].toLowerCase()
  return TS_EXTENSIONS.some((ext) => clean.endsWith(ext))
}

/**
 * Strip TypeScript syntax from source code using esbuild.
 * Converts TSX/TS to plain JSX/JS while keeping JSX intact
 * for the Flint transformer to handle.
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
 * Parse JSX/JavaScript source into an AST.
 */
function parseJSX(code: string, options: ParseOptions): acorn.Node {
  return flintParser.parse(code, {
    sourceType: options.sourceType ?? 'module',
    ecmaVersion: (options.ecmaVersion ?? 'latest') as any,
    locations: true,
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
  })
}

/**
 * Parse JSX/JavaScript/TypeScript source code into an AST.
 *
 * Strategy:
 *  1. `.ts/.tsx/.mts/.cts` filename → strip TypeScript, then parse.
 *  2. Otherwise parse as plain JS/JSX first (zero transformation cost,
 *     original offsets preserved).
 *  3. If plain parsing fails, retry once with TS stripping (handles
 *     JSX-in-JS files mislabeled as .js, or snippets without filenames).
 *  4. If that also fails, rethrow the ORIGINAL error — it points at the
 *     real problem, not at the stripped copy.
 */
export function parse(code: string, options: ParseOptions = {}): ParseResult {
  // Known TypeScript file: strip deterministically.
  if (isTypeScriptFile(options.filename)) {
    let parseCode = code
    try {
      parseCode = stripTypeScript(code)
    } catch {
      // Stripping failed — try parsing as-is before giving up.
    }
    return { ast: parseJSX(parseCode, options), code: parseCode }
  }

  // Plain JS/JSX (or unknown): parse directly first.
  try {
    return { ast: parseJSX(code, options), code }
  } catch (originalError) {
    // One fallback: maybe the "JS" file actually contains TypeScript.
    try {
      const stripped = stripTypeScript(code)
      return { ast: parseJSX(stripped, options), code: stripped }
    } catch {
      // Neither worked — surface the original error with real positions.
      throw originalError
    }
  }
}
