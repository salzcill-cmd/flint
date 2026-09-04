// Flint Runtime — Security Utilities
// Input sanitization, CSP helpers, and secure coding patterns

// ─── HTML Sanitization ──────────────────────────────────────────

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
}

/**
 * Escape HTML special characters to prevent XSS.
 *
 * @example
 * const safe = escapeHtml('<script>alert("xss")</script>')
 * // &lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`/]/g, (char) => HTML_ESCAPE_MAP[char] || char)
}

/**
 * Sanitize user input by removing potentially dangerous content.
 *
 * @example
 * const clean = sanitizeInput(userInput, {
 *   stripScripts: true,
 *   stripStyles: true,
 *   allowedTags: ['b', 'i', 'em', 'strong'],
 * })
 */
export interface SanitizeOptions {
  /** Remove <script> tags */
  stripScripts?: boolean
  /** Remove <style> tags */
  stripStyles?: boolean
  /** Remove event handlers (onclick, etc.) */
  stripEventHandlers?: boolean
  /** Allowed HTML tags (empty = strip all HTML) */
  allowedTags?: string[]
  /** Maximum length */
  maxLength?: number
}

export function sanitizeInput(input: string, options: SanitizeOptions = {}): string {
  const {
    stripScripts = true,
    stripStyles = true,
    stripEventHandlers = true,
    allowedTags,
    maxLength,
  } = options

  let result = input

  // Enforce max length
  if (maxLength && result.length > maxLength) {
    result = result.slice(0, maxLength)
  }

  // Remove script tags
  if (stripScripts) {
    result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    result = result.replace(/javascript:/gi, '')
    result = result.replace(/on\w+\s*=/gi, '')
  }

  // Remove style tags
  if (stripStyles) {
    result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    result = result.replace(/expression\s*\(/gi, '')
  }

  // Remove event handlers
  if (stripEventHandlers) {
    result = result.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    result = result.replace(/\bon\w+\s*=\s*[^\s>]*/gi, '')
  }

  // Filter by allowed tags
  if (allowedTags && allowedTags.length > 0) {
    result = result.replace(/<[^>]+>/g, (tag) => {
      const match = tag.match(/^<\/?([a-zA-Z]+)/)
      if (match) {
        const tagName = match[1].toLowerCase()
        if (allowedTags.includes(tagName)) {
          return tag
        }
      }
      return ''
    })
  }

  return result
}

// ─── URL Validation ─────────────────────────────────────────────

/**
 * Check if a URL is safe (not javascript: or data: URI).
 *
 * @example
 * if (isSafeUrl(userInput)) {
 *   window.location.href = userInput
 * }
 */
export function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase()
  return !trimmed.startsWith('javascript:') &&
         !trimmed.startsWith('data:text/html') &&
         !trimmed.startsWith('vbscript:')
}

/**
 * Validate a URL format.
 *
 * @example
 * if (isValidUrl('https://example.com')) { ... }
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// ─── Content Security Policy ────────────────────────────────────

export interface CSPConfig {
  defaultSrc?: string[]
  scriptSrc?: string[]
  styleSrc?: string[]
  imgSrc?: string[]
  connectSrc?: string[]
  fontSrc?: string[]
  objectSrc?: string[]
  mediaSrc?: string[]
  frameSrc?: string[]
  reportUri?: string
}

/**
 * Generate a Content Security Policy header string.
 *
 * @example
 * const csp = generateCSP({
 *   defaultSrc: ["'self'"],
 *   scriptSrc: ["'self'", "'unsafe-inline'"],
 *   styleSrc: ["'self'", "'unsafe-inline'"],
 *   imgSrc: ["'self'", 'data:', 'https:'],
 * })
 * // "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."
 */
export function generateCSP(config: CSPConfig): string {
  const directives: string[] = []

  for (const [key, values] of Object.entries(config)) {
    if (values && Array.isArray(values) && values.length > 0) {
      const directiveName = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      directives.push(`${directiveName} ${values.join(' ')}`)
    } else if (typeof values === 'string') {
      const directiveName = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      directives.push(`${directiveName} ${values}`)
    }
  }

  return directives.join('; ')
}

// ─── CSRF Protection ────────────────────────────────────────────

/**
 * Generate a CSRF token.
 *
 * @example
 * const token = generateCSRFToken()
 * // Store in session, include in forms
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate a CSRF token.
 *
 * @example
 * if (validateCSRFToken(token, storedToken)) {
 *   // Process form submission
 * }
 */
export function validateCSRFToken(token: string, expected: string): boolean {
  if (token.length !== expected.length) return false
  // Constant-time comparison to prevent timing attacks
  let result = 0
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return result === 0
}

// ─── Input Validation ───────────────────────────────────────────

export interface ValidationRule {
  /** Required field */
  required?: boolean
  /** Minimum length */
  minLength?: number
  /** Maximum length */
  maxLength?: number
  /** Pattern regex */
  pattern?: RegExp
  /** Custom validator */
  validate?: (value: string) => boolean | string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate input against rules.
 *
 * @example
 * const result = validateInput(email, {
 *   required: true,
 *   pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
 *   validate: (v) => v.includes('.') || 'Invalid email format',
 * })
 *
 * if (!result.valid) {
 *   console.error(result.errors)
 * }
 */
export function validateInput(
  value: string,
  rules: ValidationRule
): ValidationResult {
  const errors: string[] = []

  if (rules.required && !value.trim()) {
    errors.push('This field is required')
  }

  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`Minimum length is ${rules.minLength} characters`)
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`Maximum length is ${rules.maxLength} characters`)
  }

  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push('Invalid format')
  }

  if (rules.validate) {
    const result = rules.validate(value)
    if (result !== true) {
      errors.push(typeof result === 'string' ? result : 'Invalid value')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ─── Rate Limiting ──────────────────────────────────────────────

export interface RateLimiterConfig {
  /** Maximum requests per window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
  /** Key function to identify the caller */
  keyFn?: () => string
}

/**
 * Create a rate limiter.
 *
 * @example
 * const limiter = createRateLimiter({
 *   maxRequests: 5,
 *   windowMs: 60000, // 1 minute
 * })
 *
 * if (limiter.canProceed()) {
 *   await apiCall()
 * } else {
 *   console.error('Rate limit exceeded')
 * }
 */
export function createRateLimiter(config: RateLimiterConfig) {
  const { maxRequests, windowMs, keyFn } = config
  const requests = new Map<string, number[]>()

  function getKey(): string {
    return keyFn ? keyFn() : 'default'
  }

  function cleanOldEntries(key: string): void {
    const entries = requests.get(key) || []
    const now = Date.now()
    const valid = entries.filter((t) => now - t < windowMs)
    requests.set(key, valid)
  }

  return {
    canProceed(): boolean {
      const key = getKey()
      cleanOldEntries(key)
      const entries = requests.get(key) || []

      if (entries.length >= maxRequests) {
        return false
      }

      entries.push(Date.now())
      requests.set(key, entries)
      return true
    },

    getRemainingRequests(): number {
      const key = getKey()
      cleanOldEntries(key)
      const entries = requests.get(key) || []
      return Math.max(0, maxRequests - entries.length)
    },

    reset(): void {
      requests.clear()
    },
  }
}

// ─── Secure Storage ─────────────────────────────────────────────

/**
 * Securely store sensitive data in sessionStorage with expiration.
 *
 * @example
 * secureSet('auth-token', token, { expiresIn: 3600000 }) // 1 hour
 * const token = secureGet('auth-token')
 */
export function secureSet(
  key: string,
  value: string,
  options: { expiresIn?: number } = {}
): void {
  const entry = {
    value,
    expires: options.expiresIn ? Date.now() + options.expiresIn : null,
  }
  try {
    sessionStorage.setItem(`flint:${key}`, JSON.stringify(entry))
  } catch (e) {
    console.warn('[Flint] secureSet failed:', e)
  }
}

export function secureGet(key: string): string | null {
  try {
    const raw = sessionStorage.getItem(`flint:${key}`)
    if (!raw) return null

    const entry = JSON.parse(raw)
    if (entry.expires && Date.now() > entry.expires) {
      sessionStorage.removeItem(`flint:${key}`)
      return null
    }

    return entry.value
  } catch {
    return null
  }
}

export function secureRemove(key: string): void {
  try {
    sessionStorage.removeItem(`flint:${key}`)
  } catch (e) {
    console.warn('[Flint] secureRemove failed:', e)
  }
}
