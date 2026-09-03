import { describe, it, expect } from 'vitest'
import {
  createFlintError,
  formatFlintError,
  formatFlintErrorTerminal,
  throwFlintError,
  fromNativeError,
  ErrorMessages,
  withErrorHandling,
  parseStackTrace,
} from '../src/errors/index.js'

describe('Flint Error System', () => {
  describe('createFlintError', () => {
    it('should create error with code and message', () => {
      const error = createFlintError('COMPONENT_NOT_FOUND', 'Component not found')
      expect(error.code).toBe('COMPONENT_NOT_FOUND')
      expect(error.message).toBe('Component not found')
    })

    it('should include file and line information', () => {
      const error = createFlintError('RENDER_ERROR', 'Render failed', {
        file: 'src/App.tsx',
        line: 42,
        column: 10,
      })
      expect(error.file).toBe('src/App.tsx')
      expect(error.line).toBe(42)
      expect(error.column).toBe(10)
    })

    it('should include suggestion', () => {
      const error = createFlintError('MISSING_IMPORT', 'Missing import', {
        suggestion: 'Add import statement',
      })
      expect(error.suggestion).toBe('Add import statement')
    })

    it('should extract source context from sourceCode', () => {
      const sourceCode = `
function App() {
  return <div>Hello</div>
}
`
      const error = createFlintError('RENDER_ERROR', 'Error', {
        sourceCode,
        line: 3,
      })
      expect(error.sourceLines).toBeDefined()
      expect(error.sourceLines!.length).toBeGreaterThan(0)
    })
  })

  describe('formatFlintError', () => {
    it('should format error with all information', () => {
      const error = createFlintError('COMPONENT_NOT_FOUND', 'Component "Nav" not found', {
        file: 'src/App.tsx',
        line: 10,
        suggestion: 'Check the import',
      })

      const formatted = formatFlintError(error)
      expect(formatted).toContain('COMPONENT_NOT_FOUND')
      expect(formatted).toContain('Component "Nav" not found')
      expect(formatted).toContain('src/App.tsx')
      expect(formatted).toContain('10')
      expect(formatted).toContain('Check the import')
    })

    it('should include component stack if provided', () => {
      const error = createFlintError('RENDER_ERROR', 'Error', {
        componentStack: ['App', 'Header', 'Logo'],
      })

      const formatted = formatFlintError(error)
      expect(formatted).toContain('Component Stack:')
      expect(formatted).toContain('in App')
      expect(formatted).toContain('in Header')
    })
  })

  describe('formatFlintErrorTerminal', () => {
    it('should format error with ANSI colors', () => {
      const error = createFlintError('BUILD_ERROR', 'Build failed')
      const formatted = formatFlintErrorTerminal(error)
      expect(formatted).toContain('\x1b[31m') // Red color
      expect(formatted).toContain('\x1b[0m') // Reset
    })
  })

  describe('throwFlintError', () => {
    it('should throw formatted error', () => {
      expect(() => {
        throwFlintError('SIGNAL_ERROR', 'Invalid signal')
      }).toThrow()
    })
  })

  describe('fromNativeError', () => {
    it('should convert TypeError', () => {
      const nativeError = new TypeError('Cannot read property')
      const flintError = fromNativeError(nativeError)
      expect(flintError.code).toBe('TYPE_ERROR')
      expect(flintError.message).toBe('Cannot read property')
    })

    it('should convert ReferenceError', () => {
      const nativeError = new ReferenceError('x is not defined')
      const flintError = fromNativeError(nativeError)
      expect(flintError.code).toBe('REFERENCE_ERROR')
    })

    it('should preserve stack trace', () => {
      const nativeError = new Error('Test error')
      const flintError = fromNativeError(nativeError)
      expect(flintError.stack).toBeDefined()
    })
  })

  describe('ErrorMessages', () => {
    it('should create COMPONENT_NOT_FOUND error', () => {
      const error = ErrorMessages.COMPONENT_NOT_FOUND('Button', 'src/App.tsx')
      expect(error.code).toBe('COMPONENT_NOT_FOUND')
      expect(error.message).toContain('Button')
      expect(error.file).toBe('src/App.tsx')
    })

    it('should create MISSING_IMPORT error', () => {
      const error = ErrorMessages.MISSING_IMPORT('useState')
      expect(error.code).toBe('MISSING_IMPORT')
      expect(error.message).toContain('useState')
    })

    it('should create TYPE_ERROR error', () => {
      const error = ErrorMessages.TYPE_ERROR('Expected string')
      expect(error.code).toBe('TYPE_ERROR')
    })

    it('should create REFERENCE_ERROR error', () => {
      const error = ErrorMessages.REFERENCE_ERROR('myVar')
      expect(error.code).toBe('REFERENCE_ERROR')
      expect(error.message).toContain('myVar')
    })
  })

  describe('withErrorHandling', () => {
    it('should catch and format errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = withErrorHandling(() => {
        throw new Error('Test error')
      })

      expect(result).toBeUndefined()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should call custom error handler', () => {
      const handler = vi.fn()
      const result = withErrorHandling(() => {
        throw new Error('Test error')
      }, handler)

      expect(result).toBeUndefined()
      expect(handler).toHaveBeenCalled()
      expect(handler.mock.calls[0][0].code).toBeDefined()
    })

    it('should return value if no error', () => {
      const result = withErrorHandling(() => 42)
      expect(result).toBe(42)
    })
  })

  describe('parseStackTrace', () => {
    it('should parse stack trace frames', () => {
      const stack = `Error: Test
    at App (src/App.tsx:10:5)
    at render (src/renderer.ts:20:10)
    at Object.<anonymous> (src/index.ts:5:1)`

      const frames = parseStackTrace(stack)
      expect(frames).toHaveLength(3)
      expect(frames[0].functionName).toBe('App')
      expect(frames[0].fileName).toBe('src/App.tsx')
      expect(frames[0].lineNumber).toBe(10)
    })

    it('should handle anonymous functions', () => {
      const stack = `Error: Test
    at src/utils.ts:15:3`

      const frames = parseStackTrace(stack)
      expect(frames).toHaveLength(1)
      expect(frames[0].fileName).toBe('src/utils.ts')
    })
  })
})
