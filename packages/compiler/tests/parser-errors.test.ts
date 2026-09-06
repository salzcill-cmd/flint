// Flint Compiler — Parser & Error UX Tests
// Regression tests for v3.3.1: deterministic TS detection and friendly errors
import { describe, it, expect } from 'vitest'
import { parse } from '../src/parser/index.js'
import {
  compile,
  guessCauses,
  codeFrame,
  formatCompilerError,
  createCompilerError,
} from '../src/index.js'

describe('parse — TypeScript detection', () => {
  it('parses plain JS with object literals without TS stripping', () => {
    // The old regex sniffing treated `{ id: 5, name: 'x' }` as TypeScript
    const code = `const user = { id: 5, name: 'x' }\nexport default user`
    const result = parse(code, { filename: 'src/data.js' })
    expect(result.code).toBe(code) // unchanged — no esbuild reprint
  })

  it('parses plain JS with != without TS stripping', () => {
    const code = `if (a != b) { done() }`
    const result = parse(code, { filename: 'src/compare.js' })
    expect(result.code).toBe(code)
  })

  it('parses plain JS with English "as" in strings without TS stripping', () => {
    const code = `const msg = \`This works as well\``
    const result = parse(code, { filename: 'src/msg.js' })
    expect(result.code).toBe(code)
  })

  it('parses plain JS even without a filename (no TS assumption)', () => {
    const code = `const el = <div class="box">Hello</div>`
    const result = parse(code)
    expect(result.code).toBe(code)
    expect(result.ast.type).toBe('Program')
  })

  it('strips TypeScript from .tsx files deterministically', () => {
    const code = `export function Greet({ name }: { name: string }) {\n  return <p>{name}</p>\n}`
    const result = parse(code, { filename: 'src/Greet.tsx' })
    expect(result.code).not.toContain(': { name: string }')
    expect(result.code).toContain('<p>')
  })

  it('strips TypeScript from .ts files', () => {
    const code = `interface User { id: number }\nconst u: User = { id: 1 }`
    const result = parse(code, { filename: 'src/user.ts' })
    expect(result.code).not.toContain('interface User')
  })

  it('falls back to TS stripping when plain parse fails (no filename)', () => {
    const code = `const x: number = 5\nexport default x`
    const result = parse(code) // no filename — must still succeed via fallback
    expect(result.code).not.toContain(': number')
  })

  it('throws the original error with positions when code is truly broken', () => {
    const code = `const el = <div><span></div>`
    expect(() => parse(code)).toThrow()
    try {
      parse(code)
    } catch (err: any) {
      // acorn-style position info must be preserved
      expect(/\(\d+:\d+\)/.test(err.message)).toBe(true)
    }
  })
})

describe('guessCauses', () => {
  it('suggests mismatched tags for unexpected tokens', () => {
    const causes = guessCauses('Unexpected token (3:2)')
    expect(causes.some((c) => c.toLowerCase().includes('missing') || c.toLowerCase().includes('mismatch'))).toBe(true)
  })

  it('suggests unclosed constructs for unexpected end', () => {
    const causes = guessCauses('Unexpected end of file')
    expect(causes.length).toBeGreaterThan(0)
    expect(causes.some((c) => c.toLowerCase().includes('closed') || c.toLowerCase().includes('quote'))).toBe(true)
  })

  it('always returns at least one cause', () => {
    expect(guessCauses('xyzzy nothing matches').length).toBeGreaterThan(0)
  })
})

describe('codeFrame', () => {
  const source = 'const a = 1\nconst b = 2\nconst c = <div>\nconst d = 4'

  it('renders the offending line with a caret at the column', () => {
    const frame = codeFrame(source, 3, 10)
    expect(frame).toContain('3 │')
    expect(frame).toContain('^')
    // Caret line must appear after the marked line
    const caretIndex = frame.indexOf('^')
    const lineIndex = frame.indexOf('const c')
    expect(caretIndex).toBeGreaterThan(lineIndex)
  })

  it('includes neighboring context lines', () => {
    const frame = codeFrame(source, 3, 0)
    expect(frame).toContain('const b = 2')
    expect(frame).toContain('const d = 4')
  })

  it('clamps at line boundaries without crashing', () => {
    expect(() => codeFrame('only line', 1, 0)).not.toThrow()
    expect(() => codeFrame('only line', 99, 0)).not.toThrow()
  })
})

describe('formatCompilerError', () => {
  it('renders file, position, causes, suggestion, and raw detail', () => {
    const error = createCompilerError('Could not compile this file', {
      file: 'src/App.jsx',
      line: 4,
      column: 7,
      suggestion: 'Fix the syntax at the marked position.',
      raw: 'SyntaxError: Unexpected token (4:7)',
    })
    ;(error as any).causes = ['A tag is unclosed']
    ;(error as any).sourceLine = 'const el = <div>'

    const output = formatCompilerError(error)
    expect(output).toContain('❌ Could not compile this file')
    expect(output).toContain('src/App.jsx')
    expect(output).toContain('4:7')
    expect(output).toContain('• A tag is unclosed')
    expect(output).toContain('💡 Fix the syntax')
    expect(output).toContain('SyntaxError: Unexpected token (4:7)')
  })
})

describe('compile — failure reporting', () => {
  it('returns original code plus a formatted error on syntax failure', () => {
    const broken = `const el = <div><span></div>`
    const result = compile(broken, { filename: 'src/App.jsx' })

    expect(result.code).toBe(broken)
    expect(result.error).toBeInstanceOf(Error)
    expect(result.formatted).toBeTruthy()
    expect(result.formatted!).toContain('src/App.jsx')
    expect(result.formatted!).toContain('^') // caret frame present
  })

  it('succeeds on valid JSX and produces runtime calls', () => {
    const result = compile(`const el = <div class="x">Hello {name()}</div>`, {
      filename: 'src/OK.jsx',
    })
    expect(result.error).toBeUndefined()
    expect(result.code).toContain('h(')
    expect(result.code).toContain('track(')
  })

  it('handles TypeScript files end-to-end', () => {
    const result = compile(
      `export function A({ n }: { n: number }) {\n  return <b>{n}</b>\n}`,
      { filename: 'src/A.tsx' }
    )
    expect(result.error).toBeUndefined()
    expect(result.code).toContain('<b>')
  })
})
