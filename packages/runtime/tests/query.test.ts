import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { QueryManager, MutationManager, createQueryManager, getQueryManager, useQuery, useMutation, invalidateQueries, getQueryData } from '../src/query/index.js'
import { state } from '@flint/reactivity'

describe('Query Manager', () => {
  let queryManager: QueryManager

  beforeEach(() => {
    queryManager = createQueryManager()
  })

  describe('useQuery', () => {
    it('should fetch data successfully', async () => {
      const mockData = { id: 1, name: 'Test' }
      const queryFn = vi.fn().mockResolvedValue(mockData)

      const result = useQuery({
        queryKey: ['test'],
        queryFn,
      })

      expect(result.isLoading()).toBe(true)
      
      await vi.waitFor(() => {
        expect(result.isLoading()).toBe(false)
      })

      expect(result.data()).toEqual(mockData)
      expect(result.isSuccess()).toBe(true)
      expect(result.isError()).toBe(false)
    })

    it('should handle errors', async () => {
      const error = new Error('Fetch failed')
      const queryFn = vi.fn().mockRejectedValue(error)

      const result = useQuery({
        queryKey: ['error-test'],
        queryFn,
      })

      await vi.waitFor(() => {
        expect(result.isError()).toBe(true)
      })

      expect(result.error()).toEqual(error)
      expect(result.isSuccess()).toBe(false)
    })

    it('should disable query when enabled is false', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' })

      const result = useQuery({
        queryKey: ['disabled-test'],
        queryFn,
        enabled: false,
      })

      // Should not fetch
      expect(queryFn).not.toHaveBeenCalled()
      expect(result.isLoading()).toBe(false)
    })

    it('should refetch data', async () => {
      let callCount = 0
      const queryFn = vi.fn().mockImplementation(() => {
        callCount++
        return Promise.resolve({ count: callCount })
      })

      const result = useQuery({
        queryKey: ['refetch-test'],
        queryFn,
      })

      await result.refetch()
      await result.refetch()

      // queryFn should be called multiple times
      expect(queryFn).toHaveBeenCalledTimes(3) // initial + 2 refetches
    })
  })

  describe('useMutation', () => {
    it('should execute mutation', async () => {
      const mutationFn = vi.fn().mockResolvedValue({ id: 1 })

      const result = useMutation({
        mutationFn,
      })

      await result.mutate({ name: 'Test' } as any)

      expect(result.data()).toEqual({ id: 1 })
      expect(result.isSuccess()).toBe(true)
    })

    it('should handle mutation error', async () => {
      const error = new Error('Mutation failed')
      const mutationFn = vi.fn().mockRejectedValue(error)

      const result = useMutation({
        mutationFn,
      })

      await result.mutate({ name: 'Test' } as any)

      expect(result.error()).toEqual(error)
      expect(result.isError()).toBe(true)
    })

    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn()
      const mutationFn = vi.fn().mockResolvedValue({ id: 1 })

      const result = useMutation({
        mutationFn,
        onSuccess,
      })

      await result.mutate({ name: 'Test' } as any)

      expect(onSuccess).toHaveBeenCalledWith({ id: 1 }, { name: 'Test' })
    })

    it('should reset state', async () => {
      const mutationFn = vi.fn().mockResolvedValue({ id: 1 })

      const result = useMutation({
        mutationFn,
      })

      await result.mutate({ name: 'Test' } as any)
      result.reset()

      expect(result.data()).toBeUndefined()
      expect(result.isSuccess()).toBe(false)
    })
  })

  describe('Cache Management', () => {
    it('should invalidate queries', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' })

      useQuery({
        queryKey: ['invalidate-test'],
        queryFn,
      })

      // Wait for initial fetch
      await vi.waitFor(() => {
        expect(queryFn).toHaveBeenCalled()
      })

      invalidateQueries(['invalidate-test'])

      // Create new query instance to check if it refetches
      const queryFn2 = vi.fn().mockResolvedValue({ data: 'test2' })
      useQuery({
        queryKey: ['invalidate-test'],
        queryFn: queryFn2,
      })

      await vi.waitFor(() => {
        expect(queryFn2).toHaveBeenCalled()
      })
    })
  })
})

describe('Query Manager Singleton', () => {
  it('should create singleton query manager', () => {
    const manager1 = createQueryManager()
    const manager2 = getQueryManager()
    expect(manager1).toBe(manager2)
  })
})
