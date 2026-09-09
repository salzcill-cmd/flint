// @flint/auth — JWT Authentication + RBAC for Flint
// Ringan, cepat, TypeScript-first

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// ─── Types ──────────────────────────────────────────────────────

export interface AuthConfig {
  secret: string
  expiresIn?: string | number
  issuer?: string
  audience?: string
}

export interface User {
  id: string | number
  email: string
  roles?: string[]
  permissions?: string[]
  [key: string]: any
}

export interface TokenPayload {
  sub: string | number
  email: string
  roles?: string[]
  permissions?: string[]
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

// ─── RBAC Types ─────────────────────────────────────────────────

export interface Role {
  name: string
  permissions: string[]
  inherits?: string[]
}

export interface RBACConfig {
  roles?: Role[]
  defaultPermissions?: string[]
}

// ─── RBAC Manager ───────────────────────────────────────────────

export class RBACManager {
  private roles: Map<string, Role> = new Map()
  private defaultPermissions: string[]

  constructor(config: RBACConfig = {}) {
    this.defaultPermissions = config.defaultPermissions || []
    if (config.roles) {
      for (const role of config.roles) {
        this.roles.set(role.name, role)
      }
    }
  }

  addRole(role: Role): void {
    this.roles.set(role.name, role)
  }

  removeRole(name: string): void {
    this.roles.delete(name)
  }

  getRole(name: string): Role | undefined {
    return this.roles.get(name)
  }

  getPermissions(roleName: string): string[] {
    const role = this.roles.get(roleName)
    if (!role) return []
    const perms = new Set(role.permissions)
    if (role.inherits) {
      for (const inherited of role.inherits) {
        for (const p of this.getPermissions(inherited)) perms.add(p)
      }
    }
    return Array.from(perms)
  }

  getPermissionsForRoles(roleNames: string[]): string[] {
    const perms = new Set(this.defaultPermissions)
    for (const role of roleNames) {
      for (const p of this.getPermissions(role)) perms.add(p)
    }
    return Array.from(perms)
  }

  hasPermission(roleNames: string[], permission: string): boolean {
    const perms = this.getPermissionsForRoles(roleNames)
    return perms.includes(permission) || perms.includes('*')
  }

  hasAnyPermission(roleNames: string[], permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(roleNames, p))
  }

  hasAllPermissions(roleNames: string[], permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(roleNames, p))
  }
}

// ─── Predefined Roles ──────────────────────────────────────────

export const ROLES = {
  SUPER_ADMIN: { name: 'super-admin', permissions: ['*'], inherits: [] },
  ADMIN: { name: 'admin', permissions: ['users.*', 'roles.*', 'settings.*'], inherits: ['editor'] },
  EDITOR: { name: 'editor', permissions: ['posts.*', 'media.*'], inherits: ['viewer'] },
  VIEWER: { name: 'viewer', permissions: ['posts.read', 'media.read'], inherits: [] },
  USER: { name: 'user', permissions: ['profile.*'], inherits: [] },
} as const

// ─── Auth Class ─────────────────────────────────────────────────

export class FlintAuth {
  private config: AuthConfig
  private rbac: RBACManager

  constructor(config: AuthConfig, rbacConfig?: RBACConfig) {
    if (!config.secret) {
      throw new Error('[Flint Auth] Secret key is required')
    }
    this.config = { expiresIn: '7d', ...config }
    this.rbac = new RBACManager(rbacConfig)
  }

  getRBAC(): RBACManager {
    return this.rbac
  }

  signToken(payload: TokenPayload): string {
    const options: jwt.SignOptions = { expiresIn: this.config.expiresIn as any }
    if (this.config.issuer) options.issuer = this.config.issuer
    if (this.config.audience) options.audience = this.config.audience
    if (payload.roles && !payload.permissions) {
      payload.permissions = this.rbac.getPermissionsForRoles(payload.roles)
    }
    return jwt.sign(payload, this.config.secret, options)
  }

  verifyToken(token: string): TokenPayload {
    const options: jwt.VerifyOptions = {}
    if (this.config.issuer) options.issuer = this.config.issuer
    if (this.config.audience) options.audience = this.config.audience
    return jwt.verify(token, this.config.secret, options) as TokenPayload
  }

  decodeToken(token: string): TokenPayload | null {
    return jwt.decode(token) as TokenPayload | null
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  async register(user: User, password: string): Promise<AuthResult> {
    const hashedPassword = await this.hashPassword(password)
    const token = this.signToken({ sub: user.id, email: user.email, roles: user.roles })
    return { user: { ...user, password: hashedPassword }, token }
  }

  async login(user: User, password: string, hashedPassword: string): Promise<AuthResult> {
    const isValid = await this.comparePassword(password, hashedPassword)
    if (!isValid) throw new Error('[Flint Auth] Invalid password')
    const token = this.signToken({ sub: user.id, email: user.email, roles: user.roles })
    return { user, token }
  }

  // ─── Middleware ────────────────────────────────────────────────

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
        c.set('userId', payload.sub)
        c.set('roles', payload.roles || [])
        c.set('permissions', payload.permissions || [])
        await next()
      } catch {
        return c.json({ error: 'Invalid token' }, 401)
      }
    }
  }

  requireRole(...roleNames: string[]) {
    return async (c: any, next: () => Promise<void>) => {
      const roles: string[] = c.get('roles') || []
      const hasRole = roleNames.some(r => roles.includes(r) || roles.includes('super-admin'))
      if (!hasRole) {
        return c.json({ error: 'Forbidden', message: `Required role: ${roleNames.join(' or ')}` }, 403)
      }
      await next()
    }
  }

  requirePermission(...perms: string[]) {
    return async (c: any, next: () => Promise<void>) => {
      const userPerms: string[] = c.get('permissions') || []
      const hasPerm = perms.some(p => userPerms.includes(p) || userPerms.includes('*'))
      if (!hasPerm) {
        return c.json({ error: 'Forbidden', message: `Required permission: ${perms.join(' or ')}` }, 403)
      }
      await next()
    }
  }

  requireAllPermissions(...perms: string[]) {
    return async (c: any, next: () => Promise<void>) => {
      const userPerms: string[] = c.get('permissions') || []
      const hasAll = perms.every(p => userPerms.includes(p) || userPerms.includes('*'))
      if (!hasAll) {
        return c.json({ error: 'Forbidden', message: `Required permissions: ${perms.join(', ')}` }, 403)
      }
      await next()
    }
  }

  optional() {
    return async (c: any, next: () => Promise<void>) => {
      const authHeader = c.req.header('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const payload = this.verifyToken(authHeader.slice(7))
          c.set('user', payload)
          c.set('userId', payload.sub)
          c.set('roles', payload.roles || [])
          c.set('permissions', payload.permissions || [])
        } catch { /* continue without user */ }
      }
      await next()
    }
  }
}

// ─── Factory ────────────────────────────────────────────────────

export function createAuth(config: AuthConfig, rbacConfig?: RBACConfig): FlintAuth {
  return new FlintAuth(config, rbacConfig)
}

// ─── Utilities ──────────────────────────────────────────────────

export function extractTokenFromHeader(header: string | undefined): string | null {
  if (!header || !header.startsWith('Bearer ')) return null
  return header.slice(7)
}

export function createAuthHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}
