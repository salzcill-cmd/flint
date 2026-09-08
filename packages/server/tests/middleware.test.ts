// @flint/server — Middleware Tests

import { describe, it, expect } from 'vitest'
import { 
  rateLimit, 
  strictRateLimit, 
  standardRateLimit, 
  lenientRateLimit,
  apiRateLimit,
  authRateLimit,
  resetRateLimit,
  getRateLimitInfo,
  clearAllRateLimits,
} from '../src/middleware/rate-limit.js'

import {
  validate,
  createSchema,
  validateData,
  emailSchema,
  passwordSchema,
  phoneSchema,
  z,
} from '../src/middleware/validation.js'

import {
  getFileExtension,
  getMimeType,
  isImage,
  isDocument,
} from '../src/middleware/upload.js'

import {
  FlintLogger,
  createChildLogger,
} from '../src/middleware/logger.js'

describe('Rate Limiting', () => {
  beforeEach(() => {
    clearAllRateLimits()
  })

  it('should create rate limit middleware', () => {
    const middleware = rateLimit()
    expect(typeof middleware).toBe('function')
  })

  it('should create strict rate limit', () => {
    const middleware = strictRateLimit()
    expect(typeof middleware).toBe('function')
  })

  it('should create standard rate limit', () => {
    const middleware = standardRateLimit()
    expect(typeof middleware).toBe('function')
  })

  it('should create lenient rate limit', () => {
    const middleware = lenientRateLimit()
    expect(typeof middleware).toBe('function')
  })

  it('should create API rate limit', () => {
    const middleware = apiRateLimit()
    expect(typeof middleware).toBe('function')
  })

  it('should create auth rate limit', () => {
    const middleware = authRateLimit()
    expect(typeof middleware).toBe('function')
  })

  it('should reset rate limit', () => {
    resetRateLimit('test-key')
    expect(getRateLimitInfo('test-key')).toBeNull()
  })

  it('should clear all rate limits', () => {
    clearAllRateLimits()
    expect(getRateLimitInfo('any-key')).toBeNull()
  })

  it('should get rate limit info', () => {
    const info = getRateLimitInfo('non-existent-key')
    expect(info).toBeNull()
  })
})

describe('Validation', () => {
  it('should create validation middleware', () => {
    const middleware = validate({
      body: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    })
    expect(typeof middleware).toBe('function')
  })

  it('should create schema', () => {
    const schema = createSchema({
      body: z.object({
        name: z.string(),
      }),
    })
    expect(schema).toBeDefined()
    expect(schema.body).toBeDefined()
  })

  it('should validate data successfully', () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    })
    const result = validateData({ name: 'John', email: 'john@example.com' }, schema)
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ name: 'John', email: 'john@example.com' })
  })

  it('should validate data with errors', () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    })
    const result = validateData({ name: 'John', email: 'invalid' }, schema)
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors!.length).toBeGreaterThan(0)
  })

  it('should have email schema', () => {
    expect(emailSchema).toBeDefined()
  })

  it('should have password schema', () => {
    expect(passwordSchema).toBeDefined()
  })

  it('should have phone schema', () => {
    expect(phoneSchema).toBeDefined()
  })
})

describe('File Upload Utilities', () => {
  it('should get file extension', () => {
    expect(getFileExtension('test.jpg')).toBe('.jpg')
    expect(getFileExtension('test.png')).toBe('.png')
    expect(getFileExtension('test.pdf')).toBe('.pdf')
    expect(getFileExtension('test')).toBe('')
  })

  it('should get MIME type', () => {
    expect(getMimeType('test.jpg')).toBe('image/jpeg')
    expect(getMimeType('test.png')).toBe('image/png')
    expect(getMimeType('test.pdf')).toBe('application/pdf')
    expect(getMimeType('test.unknown')).toBe('application/octet-stream')
  })

  it('should check if file is image', () => {
    expect(isImage('image/jpeg')).toBe(true)
    expect(isImage('image/png')).toBe(true)
    expect(isImage('application/pdf')).toBe(false)
  })

  it('should check if file is document', () => {
    expect(isDocument('application/pdf')).toBe(true)
    expect(isDocument('application/msword')).toBe(true)
    expect(isDocument('image/jpeg')).toBe(false)
  })
})

describe('Logger', () => {
  it('should create logger', () => {
    const logger = new FlintLogger()
    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.debug).toBe('function')
  })

  it('should create logger with config', () => {
    const logger = new FlintLogger({
      level: 'debug',
      format: 'pretty',
      timestamps: true,
    })
    expect(logger).toBeDefined()
  })

  it('should create child logger', () => {
    const parent = new FlintLogger()
    const child = createChildLogger(parent, 'test')
    expect(child).toBeDefined()
  })

  it('should log messages', () => {
    const logger = new FlintLogger({ format: 'json' })
    // Should not throw
    logger.info('Test message', { key: 'value' })
    logger.debug('Debug message')
    logger.warn('Warning message')
    logger.error('Error message')
  })
})
