import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  initPerformance,
  performanceStart,
  performanceEnd,
  recordMetric,
  getEntries,
  getEntriesByType,
  getAverageDuration,
  getSummary,
  clearEntries,
  trackRender,
  trackEffect,
} from '../src/performance/index'

describe('Performance', () => {
  beforeEach(() => {
    clearEntries()
    initPerformance({ enabled: true })
  })

  describe('initPerformance()', () => {
    it('should initialize without error', () => {
      expect(() => initPerformance({ enabled: true })).not.toThrow()
    })
  })

  describe('performanceStart() / performanceEnd()', () => {
    it('should measure duration', () => {
      performanceStart('test-metric')
      const result = performanceEnd('test-metric')

      expect(result).not.toBeNull()
      expect(result!.name).toBe('test-metric')
      expect(result!.duration).toBeGreaterThanOrEqual(0)
    })

    it('should return null if no matching start', () => {
      const result = performanceEnd('non-existent')
      expect(result).toBeNull()
    })

    it('should include metadata in result', () => {
      performanceStart('with-meta')
      const result = performanceEnd('with-meta', { component: 'App' })

      expect(result).not.toBeNull()
      expect(result!.metadata).toEqual({ component: 'App' })
    })
  })

  describe('recordMetric()', () => {
    it('should record a metric directly', () => {
      recordMetric('direct-metric', 100, 'api', { source: 'test' })

      const entries = getEntries()
      expect(entries.length).toBe(1)
      expect(entries[0].name).toBe('direct-metric')
      expect(entries[0].duration).toBe(100)
      expect(entries[0].type).toBe('api')
    })

    it('should record multiple metrics', () => {
      recordMetric('metric-1', 50)
      recordMetric('metric-2', 100)
      recordMetric('metric-3', 150)

      expect(getEntries().length).toBe(3)
    })
  })

  describe('getEntries() / getEntriesByType()', () => {
    it('should return all entries', () => {
      recordMetric('a', 10)
      recordMetric('b', 20)

      expect(getEntries().length).toBe(2)
    })

    it('should filter by type', () => {
      recordMetric('render-1', 10, 'component')
      recordMetric('api-1', 20, 'api')
      recordMetric('render-2', 30, 'component')

      expect(getEntriesByType('component').length).toBe(2)
      expect(getEntriesByType('api').length).toBe(1)
      expect(getEntriesByType('effect').length).toBe(0)
    })
  })

  describe('getAverageDuration()', () => {
    it('should calculate average', () => {
      recordMetric('avg-test', 100)
      recordMetric('avg-test', 200)
      recordMetric('avg-test', 300)

      expect(getAverageDuration('avg-test')).toBe(200)
    })

    it('should return 0 for non-existent metric', () => {
      expect(getAverageDuration('non-existent')).toBe(0)
    })
  })

  describe('getSummary()', () => {
    it('should summarize metrics by name', () => {
      recordMetric('summary-a', 100)
      recordMetric('summary-a', 200)
      recordMetric('summary-b', 50)

      const summary = getSummary()
      expect(summary['summary-a']).toEqual({
        count: 2,
        avgDuration: 150,
        totalDuration: 300,
      })
      expect(summary['summary-b']).toEqual({
        count: 1,
        avgDuration: 50,
        totalDuration: 50,
      })
    })
  })

  describe('clearEntries()', () => {
    it('should clear all entries', () => {
      recordMetric('to-clear', 100)
      expect(getEntries().length).toBe(1)

      clearEntries()
      expect(getEntries().length).toBe(0)
    })
  })

  describe('trackRender()', () => {
    it('should return a wrapped function', () => {
      const wrapped = trackRender('TestComponent', () => {
        return 'rendered'
      })

      expect(typeof wrapped).toBe('function')
    })

    it('should track render execution when called', () => {
      const wrapped = trackRender('TestComponent', () => {
        return 'rendered'
      })

      const result = wrapped()
      expect(result).toBe('rendered')

      const entries = getEntriesByType('component')
      expect(entries.length).toBe(1)
      expect(entries[0].name).toContain('TestComponent')
    })

    it('should track render errors', () => {
      const wrapped = trackRender('FailingComponent', () => {
        throw new Error('render error')
      })

      expect(() => wrapped()).toThrow('render error')
    })
  })

  describe('trackEffect()', () => {
    it('should track effect execution', () => {
      trackEffect('test-effect', () => {
        // effect work
      })

      const entries = getEntriesByType('effect')
      expect(entries.length).toBe(1)
      expect(entries[0].name).toContain('test-effect')
    })
  })
})
