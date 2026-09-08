// @flint/auth — JWT Authentication for Flint
// Ringan, cepat, TypeScript-first

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// ─── Types ──────────────────────────────────────────────────────

export interface AuthConfig {
  /** JWT secret key (required) */
  secret: string
  /** Token expiration (default: '7d') */
  expiresIn?: string | number
  /** Token issuer */
  issuer?: string
  /** Token audience */
  audience?: string
}

export interface User {
  id: string | number
  email: string
  [key: string]: any
}

export interface TokenPayload {
  sub: string | number
  email: string
  iat?: number
  exp?: number
  iss?: string
  aud?: string
  [key: string]: any
}

export interface AuthResult {
  user: User
  token: string
}

// ─── Auth Class ─────────────────────────────────────────────────

export class FlintAuth {
  private config: AuthConfig

  constructor(config: AuthConfig) {
    if (!config.secret) {
      throw new Error('[Flint Auth] Secret key is required')
    }
    this.config = {
      expiresIn: '7d',
      ...config,
    }
  }

  // ─── Token Operations ─────────────────────────────────────────

  /**
   * Generate JWT token
   */
  signToken(payload: TokenPayload): string {
    const options: jwt.SignOptions = {
      expiresIn: this.config.expiresIn as any,
    }
    if (this.config.issuer) options.issuer = this.config.issuer
    if (this.config.audience) options.audience = this.config.audience

    return jwt.sign(payload, this.config.secret, options)
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): TokenPayload {
    const options: jwt.VerifyOptions = {}
    if (this.config.issuer) options.issuer = this.config.issuer
    if (this.config.audience) options.audience = this.config.audience

    return jwt.verify(token, this.config.secret, options) as TokenPayload
  }

  /**
   * Decode token without verification
   */
  decodeToken(token: string): TokenPayload | null {
    return jwt.decode(token) as TokenPayload | null
  }

  // ─── Password Operations ──────────────────────────────────────

  /**
   * Hash password with bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  // ─── User Operations ──────────────────────────────────────────

  /**
   * Register new user (generates token)
   */
  async register(user: User, password: string): Promise<AuthResult> {
    const hashedPassword = await this.hashPassword(password)
    const token = this.signToken({
      sub: user.id,
      email: user.email,
    })

    return {
      user: { ...user, password: hashedPassword },
      token,
    }
  }

  /**
   * Login user (verifies password and generates token)
   */
  async login(user: User, password: string, hashedPassword: string): Promise<AuthResult> {
    const isValid = await this.comparePassword(password, hashedPassword)
    if (!isValid) {
      throw new Error('[Flint Auth] Invalid password')
    }

    const token = this.signToken({
      sub: user.id,
      email: user.email,
    })

    return {
      user,
      token,
    }
  }

  // ─── Middleware ────────────────────────────────────────────────

  /**
   * Create auth middleware for Flint Server
   */
  protect() {
    return async (c: any, next: () => Promise<void>) => {
      const authHeader = c.req.header('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const token = authHeader.slice(7)
      try {
        const payload = this.verifyToken(token)
        c.set('user', payload)
        await next()
      } catch (error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
    }
  }
}

// ─── Factory Function ───────────────────────────────────────────

export function createAuth(config: AuthConfig): FlintAuth {
  return new FlintAuth(config)
}

// ─── Utility Functions ──────────────────────────────────────────

export function extractTokenFromHeader(header: string | undefined): string | null {
  if (!header || !header.startsWith('Bearer ')) {
    return null
  }
  return header.slice(7)
}

export function createAuthHeader(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  }
}
