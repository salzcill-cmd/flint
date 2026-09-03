import { describe, it, expect } from 'vitest'
import { renderSlot, createSlot, mergeSlots } from '../src/slots/index'

describe('Slots', () => {
  describe('renderSlot()', () => {
    it('should render slot content', () => {
      const slot = () => ['Hello']
      expect(renderSlot(slot)).toEqual(['Hello'])
    })

    it('should render fallback when slot is undefined', () => {
      const fallback = ['Default']
      expect(renderSlot(undefined, fallback)).toEqual(['Default'])
    })

    it('should render empty array when no slot and no fallback', () => {
      expect(renderSlot(undefined)).toEqual([])
    })

    it('should handle slot returning multiple children', () => {
      const slot = () => ['A', 'B', 'C']
      expect(renderSlot(slot)).toEqual(['A', 'B', 'C'])
    })

    it('should handle slot returning empty array', () => {
      const slot = () => []
      expect(renderSlot(slot)).toEqual([])
    })
  })

  describe('createSlot()', () => {
    it('should wrap single child into slot', () => {
      const slot = createSlot('Hello')
      expect(slot()).toEqual(['Hello'])
    })

    it('should wrap array of children into slot', () => {
      const slot = createSlot(['A', 'B'])
      expect(slot()).toEqual(['A', 'B'])
    })

    it('should handle undefined content', () => {
      const slot = createSlot(undefined)
      expect(slot()).toEqual([])
    })

    it('should create a new function each time', () => {
      const slot1 = createSlot('A')
      const slot2 = createSlot('B')
      expect(slot1()).toEqual(['A'])
      expect(slot2()).toEqual(['B'])
    })
  })

  describe('mergeSlots()', () => {
    it('should merge multiple slots', () => {
      const slot1 = () => ['A']
      const slot2 = () => ['B']
      const merged = mergeSlots(slot1, slot2)

      expect(merged()).toEqual(['A', 'B'])
    })

    it('should handle undefined slots', () => {
      const slot1 = () => ['A']
      const merged = mergeSlots(slot1, undefined)

      expect(merged()).toEqual(['A'])
    })

    it('should handle empty slots array', () => {
      const merged = mergeSlots()
      expect(merged()).toEqual([])
    })

    it('should merge multiple children from each slot', () => {
      const slot1 = () => ['A', 'B']
      const slot2 = () => ['C', 'D']
      const slot3 = () => ['E']
      const merged = mergeSlots(slot1, slot2, slot3)

      expect(merged()).toEqual(['A', 'B', 'C', 'D', 'E'])
    })

    it('should handle all undefined slots', () => {
      const merged = mergeSlots(undefined, undefined)
      expect(merged()).toEqual([])
    })
  })
})
