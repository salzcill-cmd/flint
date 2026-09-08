// @flint/server — Tests

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createServer, FlintServer, RouteGroup } from '../src/index.js'

describe('FlintServer', () => {
  let server: FlintServer

  afterAll(async () => {
    if (server) {
      await server.close()
    }
  })

  it('should create server with createServer()', () => {
    server = createServer()
    expect(server).toBeInstanceOf(FlintServer)
    expect(server.hono).toBeDefined()
  })

  it('should create server with config', () => {
    const s = createServer({
      port: 4000,
      host: 'localhost',
      logger: false,
      cors: false,
      compress: false,
    })
    expect(s).toBeInstanceOf(FlintServer)
  })

  it('should have HTTP method helpers', () => {
    const s = createServer()
    
    const getHandler = (c: any) => c.text('GET')
    const postHandler = (c: any) => c.text('POST')
    const putHandler = (c: any) => c.text('PUT')
    const patchHandler = (c: any) => c.text('PATCH')
    const deleteHandler = (c: any) => c.text('DELETE')
    const allHandler = (c: any) => c.text('ALL')

    s.get('/test', getHandler)
    s.post('/test', postHandler)
    s.put('/test', putHandler)
    s.patch('/test', patchHandler)
    s.delete('/test', deleteHandler)
    s.all('/test', allHandler)

    expect(s).toBeInstanceOf(FlintServer)
  })

  it('should support route groups', () => {
    const s = createServer()
    const api = s.route('/api')

    api.get('/users', (c: any) => c.json([]))
    api.post('/users', (c: any) => c.json({}))
    api.put('/users/:id', (c: any) => c.json({}))
    api.delete('/users/:id', (c: any) => c.json({}))

    expect(api).toBeInstanceOf(RouteGroup)
  })

  it('should support middleware', () => {
    const s = createServer()
    const middleware = (c: any, next: any) => next()
    s.use(middleware)
    expect(s).toBeInstanceOf(FlintServer)
  })

  it('should support chaining', () => {
    const s = createServer()
    const result = s
      .get('/a', (c: any) => c.text('a'))
      .post('/b', (c: any) => c.text('b'))
      .put('/c', (c: any) => c.text('c'))

    expect(result).toBe(s)
  })

  it('should have hono instance', () => {
    const s = createServer()
    expect(s.hono).toBeDefined()
    expect(typeof s.hono.fetch).toBe('function')
  })
})

describe('RouteGroup', () => {
  it('should create route group', () => {
    const server = createServer()
    const group = server.route('/api')
    expect(group).toBeInstanceOf(RouteGroup)
  })

  it('should support chaining', () => {
    const server = createServer()
    const group = server.route('/api')
    
    const result = group
      .get('/users', (c: any) => c.json([]))
      .post('/users', (c: any) => c.json({}))

    expect(result).toBe(group)
  })
})

describe('Middleware', () => {
  it('should export cors', async () => {
    const { cors } = await import('../src/index.js')
    expect(typeof cors).toBe('function')
  })

  it('should export logger', async () => {
    const { logger } = await import('../src/index.js')
    expect(typeof logger).toBe('function')
  })

  it('should export compress', async () => {
    const { compress } = await import('../src/index.js')
    expect(typeof compress).toBe('function')
  })

  it('should export HTTPException', async () => {
    const { HTTPException } = await import('../src/index.js')
    expect(typeof HTTPException).toBe('function')
  })
})

describe('Factory', () => {
  it('should export createServer', async () => {
    const { createServer } = await import('../src/index.js')
    expect(typeof createServer).toBe('function')
  })

  it('should create server instance', async () => {
    const { createServer } = await import('../src/index.js')
    const server = createServer()
    expect(server).toBeInstanceOf(FlintServer)
  })
})
