import { describe, it, expect, vi } from 'vitest'
import {
  escapeHtml,
  sanitizeInput,
  isSafeUrl,
  isValidUrl,
  generateCSP,
  generateCSRFToken,
  validateCSRFToken,
  validateInput,
  createRateLimiter,
  secureSet,
  secureGet,
  secureRemove,
} from '../src/security/index.js'

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    )
  })

  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe("it&#x27;s")
  })

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('')
  })
})

describe('sanitizeInput', () => {
  it('removes script tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('')
  })
  it('preserves safe content', () => {
    expect(sanitizeInput('Hello World')).toBe('Hello World')
  })
  it('removes javascript: URLs', () => {
    expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)')
  })
})

describe('isSafeUrl', () => {
  it('allows http/https URLs', () => {
    expect(isSafeUrl('https://example.com')).toBe(true)
    expect(isSafeUrl('http://example.com')).toBe(true)
  })

  it('rejects javascript: URLs', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects data: URLs', () => {
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('rejects vbscript: URLs', () => {
    expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false)
  })

  it('allows relative URLs', () => {
    expect(isSafeUrl('/path/to/page')).toBe(true)
    expect(isSafeUrl('./relative')).toBe(true)
  })
})

describe('isValidUrl', () => {
  it('validates valid URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('http://localhost:3000')).toBe(true)
  })

  it('rejects invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false)
    expect(isValidUrl('')).toBe(false)
  })
})

describe('generateCSP', () => {
  it('generates CSP from config', () => {
    const csp = generateCSP({
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
    })

    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("script-src 'self' 'unsafe-inline'")
    expect(csp).toContain("style-src 'self' https://fonts.googleapis.com")
    expect(csp).toContain("img-src 'self' data: https:")
  })
})

describe('CSRF tokens', () => {
  it('generates CSRF token', () => {
    const token = generateCSRFToken()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
  })

  it('validates matching tokens', () => {
    const token = generateCSRFToken()
    expect(validateCSRFToken(token, token)).toBe(true)
  })

  it('rejects non-matching tokens', () => {
    const token1 = generateCSRFToken()
    const token2 = generateCSRFToken()
    expect(validateCSRFToken(token1, token2)).toBe(false)
  })
})

describe('validateInput', () => {
  it('validates required fields', () => {
    const result = validateInput('', { required: true })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('validates min length', () => {
    const result = validateInput('ab', { minLength: 3 })
    expect(result.valid).toBe(false)
  })

  it('validates pattern', () => {
    const result = validateInput('invalid', { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })
    expect(result.valid).toBe(false)
  })

  it('passes valid input', () => {
    const result = validateInput('John', { required: true, minLength: 2 })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})

describe('createRateLimiter', () => {
  it('allows requests within limit', () => {
    const limiter = createRateLimiter({
      maxRequests: 5,
      windowMs: 1000,
    })

    expect(limiter.canProceed()).toBe(true)
    expect(limiter.canProceed()).toBe(true)
  })

  it('blocks requests over limit', () => {
    const limiter = createRateLimiter({
      maxRequests: 3,
      windowMs: 1000,
    })

    limiter.canProceed()
    limiter.canProceed()
    limiter.canProceed()
    expect(limiter.canProceed()).toBe(false)
  })

  it('provides getRemainingRequests', () => {
    const limiter = createRateLimiter({
      maxRequests: 5,
      windowMs: 1000,
    })

    expect(limiter.getRemainingRequests()).toBe(5)
    limiter.canProceed()
    expect(limiter.getRemainingRequests()).toBe(4)
  })

  it('can be reset', () => {
    const limiter = createRateLimiter({
      maxRequests: 2,
      windowMs: 1000,
    })

    limiter.canProceed()
    limiter.canProceed()
    expect(limiter.canProceed()).toBe(false)

    limiter.reset()
    expect(limiter.canProceed()).toBe(true)
  })
})
