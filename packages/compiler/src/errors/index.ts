// Flint Compiler — Error Messages
// Actionable, human-readable error messages with code frames
//
// Raw parser errors like "Unexpected token (12:4)" are useless to beginners.
// Flint renders the offending line with a caret, the file, and likely causes
// plus a fix — while keeping the raw detail available for advanced users.

const ANSI = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
}

function supportsColor(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.stdout?.isTTY === true &&
    process.env?.NO_COLOR === undefined
  )
}

function colorize(text: string, ...codes: string[]): string {
  if (!supportsColor()) return text
  return codes.join('') + text + ANSI.reset
}

export interface CompilerError {
  message: string
  file?: string
  line?: number
  column?: number
  suggestion?: string
  /** The source line(s) of code where the error occurred */
  sourceLine?: string
  /** Likely causes shown as a bullet list */
  causes?: string[]
  /** Raw technical detail (shown in verbose/advanced mode) */
  raw?: string
}

export function createCompilerError(
  message: string,
  options: { file?: string; line?: number; column?: number; suggestion?: string; raw?: string } = {}
): CompilerError {
  return {
    message,
    ...options,
  }
}

/**
 * Guess likely causes from a parse/transform error message.
 * Ordered by commonality in real-world JSX projects.
 */
export function guessCauses(message: string): string[] {
  const causes: string[] = []
  const msg = message.toLowerCase()

  if (msg.includes('unexpected token') || msg.includes('unexpected character')) {
    causes.push(
      'A tag, brace, or parenthesis is missing or mismatched',
      'JSX is used inside a .js file that the tooling does not treat as JSX',
      'An unclosed string or template literal earlier in the file',
    )
  } else if (msg.includes('unexpected end') || msg.includes('unterminated')) {
    causes.push(
      'A tag, brace, or parenthesis opened earlier was never closed',
      'A string or template literal is missing its closing quote/backtick',
    )
  } else if (msg.includes('jsx')) {
    causes.push(
      'The file contains JSX but may not be recognized as a JSX file',
      'Self-closing tags must be written as <Tag />, and every tag must be closed',
    )
  } else if (msg.includes('reserved') || msg.includes('keyword')) {
    causes.push('A reserved JavaScript keyword is used as a variable or prop name')
  }

  if (causes.length === 0) {
    causes.push('The syntax near this position is not valid JavaScript/JSX')
  }
  return causes
}

/**
 * Build a code frame: the offending source line with a caret at the column.
 */
export function codeFrame(
  source: string,
  line: number,
  column: number,
  context = 1
): string {
  const lines = source.split('\n')
  const start = Math.max(0, line - 1 - context)
  const end = Math.min(lines.length, line + context)
  const gutterWidth = String(end).length

  const frames: string[] = []
  for (let i = start; i < end; i++) {
    const num = i + 1
    const text = lines[i] ?? ''
    const isCaret = num === line
    const gutter = String(num).padStart(gutterWidth, ' ')
    const prefix = isCaret ? colorize('>', ANSI.red, ANSI.bold) : ' '
    frames.push(`${prefix} ${colorize(gutter + ' │', ANSI.gray)} ${text}`)
    if (isCaret && column >= 0) {
      const caretPad = ' '.repeat(Math.min(column, text.length))
      frames.push(`  ${colorize(gutter + ' │', ANSI.gray)} ${colorize(caretPad + '^', ANSI.red, ANSI.bold)}`)
    }
  }
  return frames.join('\n')
}

/**
 * Format a compiler error for display to humans.
 */
export function formatCompilerError(error: CompilerError): string {
  let output = `\n${colorize('❌ ' + error.message, ANSI.red, ANSI.bold)}`

  if (error.file || error.line !== undefined) {
    const where = [
      error.file,
      error.line !== undefined ? `${error.line}${error.column !== undefined ? ':' + error.column : ''}` : undefined,
    ]
      .filter(Boolean)
      .join(', ')
    output += `\n\n${colorize('📄 ' + where, ANSI.cyan)}`
  }

  if (error.sourceLine && error.line !== undefined) {
    output += `\n\n${codeFrame(error.sourceLine, error.line, error.column ?? 0)}`
  }

  if (error.causes && error.causes.length > 0) {
    output += `\n\n${colorize('Kemungkinan penyebab / Likely causes:', ANSI.bold)}`
    for (const cause of error.causes) {
      output += `\n  • ${cause}`
    }
  }

  if (error.suggestion) {
    output += `\n\n${colorize('💡 ' + error.suggestion, ANSI.yellow)}`
  }

  if (error.raw) {
    output += `\n\n${colorize('── technical detail ' + '─'.repeat(40), ANSI.gray)}\n${colorize(error.raw, ANSI.gray)}`
  }

  output += '\n'
  return output
}
