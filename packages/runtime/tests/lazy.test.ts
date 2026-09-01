import { describe, it, expect, vi } from 'vitest'
import {
  lazy,
  createResource,
  createAsyncComponent,
} from '../src/components/lazy.js'
import { h } from '../src/renderer/index.js'

describe('Lazy Loading', () => {
  it('should create lazy component', async () => {
    const LazyComp = lazy(async () => ({
      default: () => h('div', null, 'Lazy content'),
    }))

    expect(LazyComp).toBeDefined()
    expect(typeof LazyComp).toBe('function')
  })

  it('should create lazy component with options', async () => {
    const LazyComp = lazy(
      async () => ({
        default: (props: { text: string }) => h('div', null, props.text),
      }),
      {
        loading: h('div', null, 'Loading...'),
        error: h('div', null, 'Error'),
        delay: 200,
        timeout: 5000,
      }
    )

    expect(LazyComp).toBeDefined()
  })
})

describe('createResource', () => {
  it('should create resource with initial state', () => {
    const resource = createResource(async () => 'data')

    expect(resource.data).toBeDefined()
    expect(resource.loading).toBeDefined()
    expect(resource.error).toBeDefined()
    expect(typeof resource.refetch).toBe('function')
  })

  it('should fetch data', async () => {
    const fetcher = vi.fn().mockResolvedValue('test data')
    const resource = createResource(fetcher)

    // Wait for fetch to complete
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(fetcher).toHaveBeenCalled()
    expect(resource.data()).toBe('test data')
    expect(resource.loading()).toBe(false)
  })

  it('should handle fetch errors', async () => {
    const error = new Error('Fetch failed')
    const fetcher = vi.fn().mockRejectedValue(error)
    const resource = createResource(fetcher)

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(resource.error()).toBeDefined()
    expect(resource.error()?.message).toBe('Fetch failed')
  })

  it('should refetch data', async () => {
    let callCount = 0
    const fetcher = vi.fn().mockImplementation(async () => {
      callCount++
      return `data ${callCount}`
    })

    const resource = createResource(fetcher)
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(resource.data()).toBe('data 1')

    await resource.refetch()
    expect(resource.data()).toBe('data 2')
  })

  it('should not fetch if immediate is false', async () => {
    const fetcher = vi.fn().mockResolvedValue('data')
    const resource = createResource(fetcher, { immediate: false })

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(fetcher).not.toHaveBeenCalled()
    expect(resource.data()).toBeUndefined()
  })
})

describe('createAsyncComponent', () => {
  it('should create async component', async () => {
    const AsyncComp = createAsyncComponent(
      async (props: { name: string }) => h('div', null, `Hello ${props.name}`),
      { fallback: h('div', null, 'Loading...') }
    )

    expect(AsyncComp).toBeDefined()
    expect(typeof AsyncComp).toBe('function')
  })

  it('should create async component with error handler', async () => {
    const AsyncComp = createAsyncComponent(
      async (props: { name: string }) => h('div', null, `Hello ${props.name}`),
      {
        fallback: h('div', null, 'Loading...'),
        error: (err: Error) => h('div', null, err.message),
      }
    )

    expect(AsyncComp).toBeDefined()
  })

  it('should create async component with static error', async () => {
    const AsyncComp = createAsyncComponent(
      async (props: { name: string }) => h('div', null, `Hello ${props.name}`),
      {
        fallback: h('div', null, 'Loading...'),
        error: h('div', null, 'Something went wrong'),
      }
    )

    expect(AsyncComp).toBeDefined()
  })
})
