// Flint Runtime — Slots System
// Named slots, default slots, and slot props

import { h } from '../renderer/index.js'
import type { Child } from '../renderer/index.js'

// ─── Types ──────────────────────────────────────────────────────

export type SlotContent = () => Child[]
export type NamedSlots = Record<string, SlotContent>

// ─── Slot Rendering ─────────────────────────────────────────────

export function renderSlot(slot: SlotContent | undefined, fallback?: Child[]): Child[] {
  if (slot) {
    const result = slot()
    if (result != null) {
      return Array.isArray(result) ? result : [result]
    }
  }
  return fallback ?? []
}

export function createSlot(content: Child | Child[] | undefined): SlotContent {
  return () => {
    if (content == null) return []
    if (Array.isArray(content)) return content
    return [content]
  }
}

export function mergeSlots(...slots: (SlotContent | undefined)[]): SlotContent {
  return () => {
    const result: Child[] = []
    for (const slot of slots) {
      if (slot) {
        const content = slot()
        if (Array.isArray(content)) {
          result.push(...content)
        } else if (content != null) {
          result.push(content)
        }
      }
    }
    return result
  }
}
