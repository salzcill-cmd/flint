// @flint/server — Environment Configuration
// Type-safe environment variables with validation

import { z } from 'zod'

// ─── Types ──────────────────────────────────────────────────────

export interface EnvConfig {
  /** Environment name (default: 'development') */
  env?: string
  /** Port number (default: 3000) */
  port?: number
  /** Host (default: '0.0.0.0') */
  host?: string
  /** Database URL */
  databaseUrl?: string
  /** JWT secret */
  jwtSecret?: string
  /** CORS origin */
  corsOrigin?: string
  /** Log level */
  logLevel?: string
  /** Custom variables */
  [key: string]: any
}

// ─── Environment Manager ────────────────────────────────────────

export class Environment {
  private static instance: Environment
  private config: EnvConfig
  private schema?: z.ZodType<any>

  private constructor(config: EnvConfig) {
    this.config = config
  }

  /** Get singleton instance */
  static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment({})
    }
    return Environment.instance
  }

  /** Initialize environment */
  static init(config: EnvConfig = {}): Environment {
    const instance = Environment.getInstance()
    instance.config = {
      env: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0',
      databaseUrl: process.env.DATABASE_URL,
      jwtSecret: process.env.JWT_SECRET,
      corsOrigin: process.env.CORS_ORIGIN,
      logLevel: process.env.LOG_LEVEL || 'info',
      ...config,
    }
    return instance
  }

  /** Get environment variable */
  get<T = string>(key: string, defaultValue?: T): T {
    const value = this.config[key] || process.env[key]
    if (value === undefined && defaultValue !== undefined) {
      return defaultValue
    }
    return value as T
  }

  /** Get required environment variable */
  getRequired(key: string): string {
    const value = this.config[key] || process.env[key]
    if (value === undefined) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
    return value as string
  }

  /** Check if environment is development */
  isDevelopment(): boolean {
    return this.get('env') === 'development'
  }

  /** Check if environment is production */
  isProduction(): boolean {
    return this.get('env') === 'production'
  }

  /** Check if environment is test */
  isTest(): boolean {
    return this.get('env') === 'test'
  }

  /** Get all config as object */
  getAll(): EnvConfig {
    return { ...this.config }
  }
}

// ─── Schema Validation ──────────────────────────────────────────

export function validateEnv<T>(schema: z.ZodType<T>): T {
  const env = process.env
  const result = schema.safeParse(env)
  
  if (!result.success) {
    console.error('[Flint] Environment validation failed:')
    for (const error of result.error.issues) {
      console.error(`  - ${error.path.join('.')}: ${error.message}`)
    }
    process.exit(1)
  }

  return result.data
}

// ─── Common Schemas ─────────────────────────────────────────────

/** Base environment schema */
export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
})

/** Database environment schema */
export const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
})

/** Auth environment schema */
export const authEnvSchema = z.object({
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
})

/** Production environment schema */
export const productionEnvSchema = baseEnvSchema.extend({
  NODE_ENV: z.literal('production'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().url(),
  LOG_LEVEL: z.enum(['info', 'warn', 'error']).default('info'),
})

// ─── Load Environment from File ─────────────────────────────────

export async function loadEnvFile(path: string = '.env'): Promise<void> {
  try {
    const { readFileSync } = await import('fs')
    const { resolve } = await import('path')
    
    const envPath = resolve(process.cwd(), path)
    const envContent = readFileSync(envPath, 'utf-8')
    
    const lines = envContent.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      
      const equalIndex = trimmed.indexOf('=')
      if (equalIndex === -1) continue
      
      const key = trimmed.substring(0, equalIndex).trim()
      let value = trimmed.substring(equalIndex + 1).trim()
      
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      
      // Set if not already set
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  } catch (error) {
    // .env file is optional
  }
}

// ─── Convenience Functions ──────────────────────────────────────

/** Get current environment */
export function getEnv(): string {
  return process.env.NODE_ENV || 'development'
}

/** Check if production */
export function isProduction(): boolean {
  return getEnv() === 'production'
}

/** Check if development */
export function isDevelopment(): boolean {
  return getEnv() === 'development'
}

/** Check if test */
export function isTest(): boolean {
  return getEnv() === 'test'
}
