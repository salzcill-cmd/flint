// @flint/auth — Tests

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { createAuth, FlintAuth, extractTokenFromHeader, createAuthHeader } from '../src/index.js'

const TEST_SECRET = 'test-secret-key-123'

describe('FlintAuth', () => {
  let auth: FlintAuth

  beforeAll(() => {
    auth = createAuth({ secret: TEST_SECRET })
  })

  it('should create auth with createAuth()', () => {
    expect(auth).toBeInstanceOf(FlintAuth)
  })

  it('should require secret key', () => {
    expect(() => createAuth({ secret: '' })).toThrow('[Flint Auth] Secret key is required')
  })

  it('should sign JWT token', () => {
    const token = auth.signToken({
      sub: 1,
      email: 'test@example.com',
    })
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('should verify JWT token', () => {
    const payload = { sub: 1, email: 'test@example.com' }
    const token = auth.signToken(payload)
    const verified = auth.verifyToken(token)
    expect(verified.sub).toBe(1)
    expect(verified.email).toBe('test@example.com')
  })

  it('should decode JWT token', () => {
    const payload = { sub: 1, email: 'test@example.com' }
    const token = auth.signToken(payload)
    const decoded = auth.decodeToken(token)
    expect(decoded).toBeDefined()
    expect(decoded?.sub).toBe(1)
  })

  it('should hash password', async () => {
    const password = 'mysecurepassword'
    const hash = await auth.hashPassword(password)
    expect(typeof hash).toBe('string')
    expect(hash).not.toBe(password)
    expect(hash.length).toBeGreaterThan(0)
  })

  it('should compare password', async () => {
    const password = 'mysecurepassword'
    const hash = await auth.hashPassword(password)
    
    const isValid = await auth.comparePassword(password, hash)
    expect(isValid).toBe(true)

    const isInvalid = await auth.comparePassword('wrongpassword', hash)
    expect(isInvalid).toBe(false)
  })

  it('should register user', async () => {
    const user = { id: 1, email: 'test@example.com' }
    const password = 'mypassword'
    
    const result = await auth.register(user, password)
    expect(result.user).toBeDefined()
    expect(result.token).toBeDefined()
    expect(result.user.email).toBe('test@example.com')
  })

  it('should login user', async () => {
    const user = { id: 1, email: 'test@example.com' }
    const password = 'mypassword'
    const hash = await auth.hashPassword(password)
    
    const result = await auth.login(user, password, hash)
    expect(result.user).toBeDefined()
    expect(result.token).toBeDefined()
    expect(result.user.email).toBe('test@example.com')
  })

  it('should reject invalid password on login', async () => {
    const user = { id: 1, email: 'test@example.com' }
    const password = 'mypassword'
    const hash = await auth.hashPassword(password)
    
    await expect(
      auth.login(user, 'wrongpassword', hash)
    ).rejects.toThrow('[Flint Auth] Invalid password')
  })

  it('should create auth middleware', () => {
    const middleware = auth.protect()
    expect(typeof middleware).toBe('function')
  })
})

describe('Utility Functions', () => {
  it('should extract token from header', () => {
    const token = extractTokenFromHeader('Bearer abc123')
    expect(token).toBe('abc123')
  })

  it('should return null for invalid header', () => {
    expect(extractTokenFromHeader(undefined)).toBeNull()
    expect(extractTokenFromHeader('')).toBeNull()
    expect(extractTokenFromHeader('Basic abc123')).toBeNull()
  })

  it('should create auth header', () => {
    const header = createAuthHeader('abc123')
    expect(header).toEqual({ Authorization: 'Bearer abc123' })
  })
})

describe('Token Expiration', () => {
  it('should support custom expiration', () => {
    const auth = createAuth({
      secret: TEST_SECRET,
      expiresIn: '1h',
    })
    const token = auth.signToken({ sub: 1, email: 'test@example.com' })
    expect(typeof token).toBe('string')
  })

  it('should support numeric expiration', () => {
    const auth = createAuth({
      secret: TEST_SECRET,
      expiresIn: 3600,
    })
    const token = auth.signToken({ sub: 1, email: 'test@example.com' })
    expect(typeof token).toBe('string')
  })
})

describe('Token Options', () => {
  it('should support issuer', () => {
    const auth = createAuth({
      secret: TEST_SECRET,
      issuer: 'flint-app',
    })
    const token = auth.signToken({ sub: 1, email: 'test@example.com' })
    expect(typeof token).toBe('string')
  })

  it('should support audience', () => {
    const auth = createAuth({
      secret: TEST_SECRET,
      audience: 'flint-users',
    })
    const token = auth.signToken({ sub: 1, email: 'test@example.com' })
    expect(typeof token).toBe('string')
  })
})
