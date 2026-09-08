// @flint/server — Session Management
// Cookie-based sessions for authentication

import { createHash, randomBytes } from 'crypto'

// ─── Types ──────────────────────────────────────────────────────

export interface SessionConfig {
  /** Session secret key (required) */
  secret: string
  /** Cookie name (default: 'flint-session') */
  name?: string
  /** Session duration in ms (default: 24 hours) */
  maxAge?: number
  /** Cookie domain */
  domain?: string
  /** Cookie path (default: '/') */
  path?: string
  /** Secure cookies (default: true in production) */
  secure?: boolean
  /** HttpOnly cookies (default: true) */
  httpOnly?: boolean
  /** SameSite policy (default: 'lax') */
  sameSite?: 'strict' | 'lax' | 'none'
  /** Use rolling sessions (refresh on each request) */
  rolling?: boolean
  /** Session store */
  store?: SessionStore
}

export interface Session {
  /** Session ID */
  id: string
  /** Session data */
  data: Record<string, any>
  /** Creation time */
  createdAt: number
  /** Last access time */
  updatedAt: number
}

export interface SessionStore {
  get(id: string): Promise<Session | null>
  set(session: Session): Promise<void>
  destroy(id: string): Promise<void>
}

// ─── Memory Store ───────────────────────────────────────────────

export class MemoryStore implements SessionStore {
  private sessions: Map<string, Session> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(private maxAge: number = 86400000) {
    // Cleanup expired sessions every hour
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [id, session] of this.sessions.entries()) {
        if (now - session.updatedAt > this.maxAge) {
          this.sessions.delete(id)
        }
      }
    }, 3600000)

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  async get(id: string): Promise<Session | null> {
    const session = this.sessions.get(id)
    if (!session) return null
    
    // Check if expired
    if (Date.now() - session.updatedAt > this.maxAge) {
      this.sessions.delete(id)
      return null
    }

    return session
  }

  async set(session: Session): Promise<void> {
    this.sessions.set(session.id, session)
  }

  async destroy(id: string): Promise<void> {
    this.sessions.delete(id)
  }
}

// ─── Session Manager ────────────────────────────────────────────

export class SessionManager {
  private config: Required<SessionConfig>
  private store: SessionStore

  constructor(config: SessionConfig) {
    if (!config.secret) {
      throw new Error('[Flint Session] Secret key is required')
    }

    this.config = {
      name: 'flint-session',
      maxAge: 86400000, // 24 hours
      domain: '',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      rolling: true,
      store: new MemoryStore(config.maxAge || 86400000),
      ...config,
    }

    this.store = this.config.store
  }

  // ─── Session Operations ──────────────────────────────────────

  /** Get session from request */
  async getSession(c: any): Promise<Session | null> {
    const cookie = c.req.header('Cookie')
    if (!cookie) return null

    const sessionId = this.extractSessionId(cookie)
    if (!sessionId) return null

    return this.store.get(sessionId)
  }

  /** Create new session */
  async createSession(c: any, data: Record<string, any> = {}): Promise<Session> {
    const sessionId = this.generateSessionId()
    const now = Date.now()

    const session: Session = {
      id: sessionId,
      data,
      createdAt: now,
      updatedAt: now,
    }

    await this.store.set(session)
    this.setSessionCookie(c, sessionId)

    return session
  }

  /** Update existing session */
  async updateSession(c: any, data: Record<string, any>): Promise<Session | null> {
    const session = await this.getSession(c)
    if (!session) return null

    session.data = { ...session.data, ...data }
    session.updatedAt = Date.now()

    await this.store.set(session)
    return session
  }

  /** Destroy session */
  async destroySession(c: any): Promise<void> {
    const cookie = c.req.header('Cookie')
    if (!cookie) return

    const sessionId = this.extractSessionId(cookie)
    if (sessionId) {
      await this.store.destroy(sessionId)
    }

    this.clearSessionCookie(c)
  }

  // ─── Cookie Helpers ──────────────────────────────────────────

  private setSessionCookie(c: any, sessionId: string): void {
    const maxAge = Math.floor(this.config.maxAge / 1000)
    let cookie = `${this.config.name}=${sessionId}; Max-Age=${maxAge}; Path=${this.config.path}`
    
    if (this.config.domain) {
      cookie += `; Domain=${this.config.domain}`
    }
    if (this.config.secure) {
      cookie += '; Secure'
    }
    if (this.config.httpOnly) {
      cookie += '; HttpOnly'
    }
    cookie += `; SameSite=${this.config.sameSite}`

    c.header('Set-Cookie', cookie)
  }

  private clearSessionCookie(c: any): void {
    const cookie = `${this.config.name}=; Max-Age=0; Path=${this.config.path}`
    c.header('Set-Cookie', cookie)
  }

  private extractSessionId(cookie: string): string | null {
    const match = cookie.match(new RegExp(`${this.config.name}=([^;]+)`))
    return match ? match[1] : null
  }

  private generateSessionId(): string {
    return randomBytes(32).toString('hex')
  }
}

// ─── Session Middleware ──────────────────────────────────────────

export function session(config: SessionConfig) {
  const manager = new SessionManager(config)

  return async (c: any, next: () => Promise<void>) => {
    // Attach session manager to context
    c.set('sessionManager', manager)

    // Get or create session
    let session = await manager.getSession(c)
    
    if (!session) {
      session = await manager.createSession(c)
    } else if (config.rolling) {
      // Refresh session on each request
      session.updatedAt = Date.now()
      await manager.getSession(c) // This will update the store
    }

    // Attach session to context
    c.set('session', session)

    return next()
  }
}

// ─── Factory Function ───────────────────────────────────────────

export function createSessionManager(config: SessionConfig): SessionManager {
  return new SessionManager(config)
}

// ─── Convenience Functions ──────────────────────────────────────

/** Get session from context */
export function getSession(c: any): Session | null {
  return c.get('session') || null
}

/** Set session data */
export async function setSessionData(c: any, key: string, value: any): Promise<void> {
  const manager = c.get('sessionManager') as SessionManager
  if (manager) {
    await manager.updateSession(c, { [key]: value })
  }
}

/** Get session data */
export function getSessionData(c: any, key: string): any {
  const session = getSession(c)
  return session?.data?.[key]
}
