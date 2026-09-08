// @flint/server — Structured Logging Middleware
// JSON logs with request IDs, user IDs, and more

// ─── Types ──────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogConfig {
  /** Minimum log level (default: 'info') */
  level?: LogLevel
  /** Output format (default: 'json') */
  format?: 'json' | 'text' | 'pretty'
  /** Include timestamps (default: true) */
  timestamps?: boolean
  /** Include request ID (default: true) */
  requestId?: boolean
  /** Custom fields to include in all logs */
  defaultFields?: Record<string, any>
  /** Redact sensitive fields */
  redact?: string[]
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp?: string
  requestId?: string
  [key: string]: any
}

// ─── Log Levels ─────────────────────────────────────────────────

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
}

// ─── Logger Class ───────────────────────────────────────────────

export class FlintLogger {
  private config: LogConfig
  private minLevel: number

  constructor(config: LogConfig = {}) {
    this.config = {
      level: 'info',
      format: 'json',
      timestamps: true,
      requestId: true,
      redact: ['password', 'token', 'secret', 'authorization'],
      ...config,
    }
    this.minLevel = LOG_LEVELS[this.config.level || 'info']
  }

  // ─── Log Methods ──────────────────────────────────────────────

  debug(message: string, data?: Record<string, any>): void {
    this.log('debug', message, data)
  }

  info(message: string, data?: Record<string, any>): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: Record<string, any>): void {
    this.log('warn', message, data)
  }

  error(message: string, error?: Error | Record<string, any>): void {
    const data: Record<string, any> = {}
    
    if (error instanceof Error) {
      data.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    } else if (error) {
      Object.assign(data, error)
    }

    this.log('error', message, data)
  }

  fatal(message: string, error?: Error | Record<string, any>): void {
    const data: Record<string, any> = {}
    
    if (error instanceof Error) {
      data.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    } else if (error) {
      Object.assign(data, error)
    }

    this.log('fatal', message, data)
  }

  // ─── Core Log Method ──────────────────────────────────────────

  private log(level: LogLevel, message: string, data?: Record<string, any>): void {
    if (LOG_LEVELS[level] < this.minLevel) return

    const entry: LogEntry = {
      level,
      message,
      ...this.config.defaultFields,
      ...this.redactSensitive(data || {}),
    }

    // Add timestamp
    if (this.config.timestamps) {
      entry.timestamp = new Date().toISOString()
    }

    // Output
    const output = this.formatEntry(entry)
    console.log(output)
  }

  // ─── Formatting ───────────────────────────────────────────────

  private formatEntry(entry: LogEntry): string {
    switch (this.config.format) {
      case 'pretty':
        return this.formatPretty(entry)
      case 'text':
        return this.formatText(entry)
      case 'json':
      default:
        return JSON.stringify(entry)
    }
  }

  private formatPretty(entry: LogEntry): string {
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
      fatal: '\x1b[35m', // magenta
    }
    const reset = '\x1b[0m'
    const color = colors[entry.level]

    let line = `${color}[${entry.level.toUpperCase()}]${reset}`
    
    if (entry.timestamp) {
      line += ` ${entry.timestamp}`
    }
    
    if (entry.requestId) {
      line += ` [${entry.requestId}]`
    }

    line += ` ${entry.message}`

    const { level, message, timestamp, requestId, ...rest } = entry
    if (Object.keys(rest).length > 0) {
      line += '\n' + JSON.stringify(rest, null, 2)
    }

    return line
  }

  private formatText(entry: LogEntry): string {
    let line = `[${entry.level.toUpperCase()}]`
    
    if (entry.timestamp) {
      line += ` ${entry.timestamp}`
    }
    
    if (entry.requestId) {
      line += ` [${entry.requestId}]`
    }

    line += ` ${entry.message}`

    const { level, message, timestamp, requestId, ...rest } = entry
    if (Object.keys(rest).length > 0) {
      line += ' ' + JSON.stringify(rest)
    }

    return line
  }

  // ─── Redaction ────────────────────────────────────────────────

  private redactSensitive(data: Record<string, any>): Record<string, any> {
    if (!this.config.redact?.length) return data

    const redacted = { ...data }
    const redactKeys = this.config.redact

    for (const key of Object.keys(redacted)) {
      if (redactKeys.includes(key.toLowerCase())) {
        redacted[key] = '[REDACTED]'
      } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
        redacted[key] = this.redactSensitive(redacted[key])
      }
    }

    return redacted
  }
}

// ─── Request Logger Middleware ───────────────────────────────────

export function requestLogger(config?: LogConfig) {
  const logger = new FlintLogger(config)

  return async (c: any, next: () => Promise<void>) => {
    const start = Date.now()
    const requestId = generateRequestId()
    const method = c.req.method
    const url = c.req.url

    // Set request ID
    c.set('requestId', requestId)
    c.header('X-Request-ID', requestId)

    // Log request
    logger.info('Request started', {
      requestId,
      method,
      url,
      userAgent: c.req.header('user-agent'),
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
    })

    try {
      await next()
    } catch (error) {
      logger.error('Request failed', error as Error)
      throw error
    }

    // Log response
    const duration = Date.now() - start
    const status = c.res?.status || 200

    logger.info('Request completed', {
      requestId,
      method,
      url,
      status,
      duration: `${duration}ms`,
    })
  }
}

// ─── Helper Functions ───────────────────────────────────────────

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

/** Create a child logger with prefix */
export function createChildLogger(parent: FlintLogger, prefix: string): FlintLogger {
  return new FlintLogger({
    level: 'debug',
    defaultFields: { prefix },
  })
}

// ─── Export Logger Instance ─────────────────────────────────────

export const logger = new FlintLogger()
