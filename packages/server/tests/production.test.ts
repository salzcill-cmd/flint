// @flint/server — Production Middleware Tests

import { describe, it, expect } from 'vitest'
import {
  helmet,
  cors,
  csrf,
  generateCsrfToken,
} from '../src/middleware/security.js'

import {
  healthCheck,
  registerHealthCheck,
  unregisterHealthCheck,
  createMemoryCheck,
} from '../src/middleware/health.js'

import {
  GracefulShutdown,
  createShutdownManager,
} from '../src/middleware/shutdown.js'

import {
  Environment,
  validateEnv,
  loadEnvFile,
  getEnv,
  isProduction,
  isDevelopment,
  baseEnvSchema,
} from '../src/middleware/env.js'

import {
  SessionManager,
  MemoryStore,
  session,
  createSessionManager,
} from '../src/middleware/session.js'

import {
  JobQueue,
  createJobQueue,
} from '../src/queue.js'

describe('Security Middleware', () => {
  it('should create helmet middleware', () => {
    const middleware = helmet()
    expect(typeof middleware).toBe('function')
  })

  it('should create helmet with config', () => {
    const middleware = helmet({
      contentSecurityPolicy: true,
      hsts: { maxAge: 31536000 },
    })
    expect(typeof middleware).toBe('function')
  })

  it('should create cors middleware', () => {
    const middleware = cors()
    expect(typeof middleware).toBe('function')
  })

  it('should create cors with config', () => {
    const middleware = cors({
      origin: ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    })
    expect(typeof middleware).toBe('function')
  })

  it('should create csrf middleware', () => {
    const middleware = csrf()
    expect(typeof middleware).toBe('function')
  })

  it('should generate csrf token', () => {
    const token = generateCsrfToken()
    expect(typeof token).toBe('string')
    expect(token.length).toBe(64)
  })
})

describe('Health Check', () => {
  it('should create health check middleware', () => {
    const middleware = healthCheck()
    expect(typeof middleware).toBe('function')
  })

  it('should create health check with config', () => {
    const middleware = healthCheck({
      path: '/health',
      readinessPath: '/ready',
      livenessPath: '/live',
    })
    expect(typeof middleware).toBe('function')
  })

  it('should register health check', () => {
    registerHealthCheck('test', () => ({ status: 'pass' }))
    // Should not throw
    unregisterHealthCheck('test')
  })

  it('should create memory check', () => {
    const check = createMemoryCheck(500)
    expect(typeof check).toBe('function')
    
    const result = check()
    expect(result.status).toBe('pass')
    expect(result.message).toContain('Memory usage')
  })
})

describe('Graceful Shutdown', () => {
  it('should create shutdown manager', () => {
    const manager = createShutdownManager()
    expect(manager).toBeInstanceOf(GracefulShutdown)
  })

  it('should create shutdown manager with config', () => {
    const manager = createShutdownManager({
      timeout: 10000,
      signals: ['SIGTERM'],
    })
    expect(manager).toBeInstanceOf(GracefulShutdown)
  })

  it('should register cleanup function', () => {
    const manager = createShutdownManager()
    manager.onShutdown(() => {
      // Cleanup
    })
    // Should not throw
  })
})

describe('Environment', () => {
  it('should get environment instance', () => {
    const env = Environment.getInstance()
    expect(env).toBeInstanceOf(Environment)
  })

  it('should initialize environment', () => {
    const env = Environment.init({ port: 4000 })
    expect(env).toBeInstanceOf(Environment)
  })

  it('should get environment variable', () => {
    const env = Environment.init({ testVar: 'testValue' })
    expect(env.get('testVar')).toBe('testValue')
  })

  it('should get default value', () => {
    const env = Environment.init()
    expect(env.get('nonexistent', 'default')).toBe('default')
  })

  it('should check environment', () => {
    expect(typeof isProduction()).toBe('boolean')
    expect(typeof isDevelopment()).toBe('boolean')
  })

  it('should load env file', async () => {
    // Should not throw even if file doesn't exist
    await loadEnvFile('.env.test')
  })

  it('should validate env', () => {
    const schema = baseEnvSchema
    // Should not throw with valid env
    process.env.NODE_ENV = 'development'
    process.env.PORT = '3000'
    const result = validateEnv(schema)
    expect(result).toBeDefined()
  })
})

describe('Session', () => {
  it('should create session manager', () => {
    const manager = createSessionManager({ secret: 'test-secret-key' })
    expect(manager).toBeInstanceOf(SessionManager)
  })

  it('should require secret', () => {
    expect(() => createSessionManager({ secret: '' })).toThrow()
  })

  it('should create memory store', () => {
    const store = new MemoryStore()
    expect(store).toBeInstanceOf(MemoryStore)
  })

  it('should create session middleware', () => {
    const middleware = session({ secret: 'test-secret-key' })
    expect(typeof middleware).toBe('function')
  })
})

describe('Job Queue', () => {
  it('should create job queue', () => {
    const queue = createJobQueue()
    expect(queue).toBeInstanceOf(JobQueue)
  })

  it('should create job queue with config', () => {
    const queue = createJobQueue({
      concurrency: 10,
      timeout: 60000,
      retries: 5,
    })
    expect(queue).toBeInstanceOf(JobQueue)
  })

  it('should register job handler', () => {
    const queue = createJobQueue()
    queue.on('test-job', async (data) => {
      return data
    })
    // Should not throw
  })

  it('should add job to queue', async () => {
    const queue = createJobQueue()
    queue.on('test-job', async (data) => {
      return data
    })
    
    const job = await queue.add('test-job', { foo: 'bar' })
    expect(job).toBeDefined()
    expect(job.name).toBe('test-job')
    expect(job.status).toBe('pending')
  })

  it('should get queue stats', () => {
    const queue = createJobQueue()
    const stats = queue.getStats()
    expect(stats.pending).toBe(0)
    expect(stats.active).toBe(0)
    expect(stats.completed).toBe(0)
    expect(stats.failed).toBe(0)
  })

  it('should clear completed jobs', () => {
    const queue = createJobQueue()
    queue.clearCompleted()
    // Should not throw
  })

  it('should pause and resume', () => {
    const queue = createJobQueue()
    queue.pause()
    queue.resume()
    // Should not throw
  })
})
