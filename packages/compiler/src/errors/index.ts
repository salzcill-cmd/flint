// Flint Compiler — Error Messages
// Actionable, human-readable error messages

export interface CompilerError {
  message: string
  file?: string
  line?: number
  column?: number
  suggestion?: string
}

export function createCompilerError(
  message: string,
  options: { file?: string; line?: number; column?: number; suggestion?: string } = {}
): CompilerError {
  return {
    message,
    ...options,
  }
}

export function formatCompilerError(error: CompilerError): string {
  let output = `\n❌ ${error.message}`

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

  output += '\n'
  return output
}
