// @flint/server — Security Middleware (Helmet)
// Security headers for production

export interface HelmetConfig {
  /** Content Security Policy */
  contentSecurityPolicy?: boolean | Record<string, string[]>
  /** Cross-Origin Embedder Policy */
  crossOriginEmbedderPolicy?: boolean
  /** Cross-Origin Opener Policy */
  crossOriginOpenerPolicy?: boolean
  /** Cross-Origin Resource Policy */
  crossOriginResourcePolicy?: boolean | string
  /** DNS Prefetch Control */
  dnsPrefetchControl?: boolean
  /** Expect-CT */
  expectCt?: boolean | { maxAge?: number; enforce?: boolean; reportUri?: string }
  /** X-Frame-Options */
  frameguard?: boolean | string
  /** Hide X-Powered-By */
  hidePoweredBy?: boolean
  /** HSTS */
  hsts?: boolean | { maxAge?: number; includeSubDomains?: boolean; preload?: boolean }
  /** IE No Open */
  ieNoOpen?: boolean
  /** No Sniff */
  noSniff?: boolean
  /** Referrer Policy */
  referrerPolicy?: boolean | string
  /** X-XSS-Protection */
  xssFilter?: boolean
}

// ─── Default Headers ────────────────────────────────────────────

const DEFAULT_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'X-DNS-Prefetch-Control': 'off',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

// ─── Helmet Middleware ──────────────────────────────────────────

export function helmet(config: HelmetConfig = {}) {
  return async (c: any, next: () => Promise<void>) => {
    // Apply default headers
    for (const [key, value] of Object.entries(DEFAULT_HEADERS)) {
      c.header(key, value)
    }

    // Hide X-Powered-By
    if (config.hidePoweredBy !== false) {
      c.header('X-Powered-By', '')
    }

    // Content Security Policy
    if (config.contentSecurityPolicy) {
      const csp = typeof config.contentSecurityPolicy === 'object'
        ? config.contentSecurityPolicy
        : {}
      
      const cspString = Object.entries(csp)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ')
      
      if (cspString) {
        c.header('Content-Security-Policy', cspString)
      }
    }

    // HSTS
    if (config.hsts !== false) {
      const hstsConfig = typeof config.hsts === 'object' ? config.hsts : {}
      const maxAge = hstsConfig.maxAge || 31536000
      const includeSubDomains = hstsConfig.includeSubDomains !== false
      const preload = hstsConfig.preload || false
      
      let hstsValue = `max-age=${maxAge}`
      if (includeSubDomains) hstsValue += '; includeSubDomains'
      if (preload) hstsValue += '; preload'
      
      c.header('Strict-Transport-Security', hstsValue)
    }

    // Referrer Policy
    if (config.referrerPolicy !== false) {
      const policy = typeof config.referrerPolicy === 'string'
        ? config.referrerPolicy
        : 'strict-origin-when-cross-origin'
      c.header('Referrer-Policy', policy)
    }

    // X-Frame-Options
    if (config.frameguard !== false) {
      const frameguard = typeof config.frameguard === 'string'
        ? config.frameguard
        : 'DENY'
      c.header('X-Frame-Options', frameguard)
    }

    return next()
  }
}

// ─── CORS Middleware ────────────────────────────────────────────

export interface CorsConfig {
  origin?: string | string[] | ((origin: string) => boolean)
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
  preflightContinue?: boolean
}

export function cors(config: CorsConfig = {}) {
  const {
    origin = '*',
    methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders = [],
    credentials = false,
    maxAge = 86400,
    preflightContinue = false,
  } = config

  return async (c: any, next: () => Promise<void>) => {
    const requestOrigin = c.req.header('Origin')

    // Set CORS headers
    if (typeof origin === 'string') {
      c.header('Access-Control-Allow-Origin', origin)
    } else if (Array.isArray(origin)) {
      if (requestOrigin && origin.includes(requestOrigin)) {
        c.header('Access-Control-Allow-Origin', requestOrigin)
      }
    } else if (typeof origin === 'function' && requestOrigin) {
      if (origin(requestOrigin)) {
        c.header('Access-Control-Allow-Origin', requestOrigin)
      }
    }

    // Set other CORS headers
    c.header('Access-Control-Allow-Methods', methods.join(', '))
    c.header('Access-Control-Allow-Headers', allowedHeaders.join(', '))
    
    if (exposedHeaders.length > 0) {
      c.header('Access-Control-Expose-Headers', exposedHeaders.join(', '))
    }
    
    if (credentials) {
      c.header('Access-Control-Allow-Credentials', 'true')
    }
    
    c.header('Access-Control-Max-Age', String(maxAge))

    // Handle preflight
    if (c.req.method === 'OPTIONS') {
      if (preflightContinue) {
        return next()
      }
      return c.text('', 204)
    }

    return next()
  }
}

// ─── CSRF Protection ────────────────────────────────────────────

export interface CsrfConfig {
  /** Cookie name (default: 'csrf-token') */
  cookieName?: string
  /** Header name (default: 'x-csrf-token') */
  headerName?: string
  /** Ignore methods (default: ['GET', 'HEAD', 'OPTIONS']) */
  ignoreMethods?: string[]
}

export function csrf(config: CsrfConfig = {}) {
  const {
    cookieName = 'csrf-token',
    headerName = 'x-csrf-token',
    ignoreMethods = ['GET', 'HEAD', 'OPTIONS'],
  } = config

  return async (c: any, next: () => Promise<void>) => {
    // Skip safe methods
    if (ignoreMethods.includes(c.req.method)) {
      return next()
    }

    // Get token from header
    const token = c.req.header(headerName)
    
    if (!token) {
      return c.json({ error: 'CSRF token missing' }, 403)
    }

    // Get token from cookie
    const cookieToken = c.req.header('Cookie')
      ?.split(';')
      .find((c: string) => c.trim().startsWith(`${cookieName}=`))
      ?.split('=')[1]

    // Compare tokens
    if (!cookieToken || token !== cookieToken) {
      return c.json({ error: 'Invalid CSRF token' }, 403)
    }

    return next()
  }
}

// ─── Generate CSRF Token ────────────────────────────────────────

export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// ─── Set CSRF Cookie ────────────────────────────────────────────

export function setCsrfCookie(c: any, token: string, options?: {
  maxAge?: number
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}): void {
  const {
    maxAge = 3600,
    httpOnly = false,
    secure = true,
    sameSite = 'strict',
  } = options || {}

  const cookie = `csrf-token=${token}; Max-Age=${maxAge}; Path=/; SameSite=${sameSite}${httpOnly ? '; HttpOnly' : ''}${secure ? '; Secure' : ''}`
  c.header('Set-Cookie', cookie)
}
