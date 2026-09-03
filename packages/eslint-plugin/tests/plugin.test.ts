import { describe, it, expect } from 'vitest'
import plugin, { rules, configs } from '../src/index'

describe('ESLint Plugin', () => {
  describe('rules', () => {
    it('should export all 6 rules', () => {
      expect(Object.keys(rules)).toHaveLength(6)
    })

    it('should have no-state-outside-effect rule', () => {
      expect(rules['no-state-outside-effect']).toBeDefined()
      expect(rules['no-state-outside-effect'].meta).toBeDefined()
    })

    it('should have no-computed-in-render rule', () => {
      expect(rules['no-computed-in-render']).toBeDefined()
      expect(rules['no-computed-in-render'].meta).toBeDefined()
    })

    it('should have prefer-signal-over-value rule', () => {
      expect(rules['prefer-signal-over-value']).toBeDefined()
      expect(rules['prefer-signal-over-value'].meta).toBeDefined()
    })

    it('should have no-reassign-signal rule', () => {
      expect(rules['no-reassign-signal']).toBeDefined()
      expect(rules['no-reassign-signal'].meta).toBeDefined()
    })

    it('should have require-effect-cleanup rule', () => {
      expect(rules['require-effect-cleanup']).toBeDefined()
      expect(rules['require-effect-cleanup'].meta).toBeDefined()
    })

    it('should have no-nested-effect rule', () => {
      expect(rules['no-nested-effect']).toBeDefined()
      expect(rules['no-nested-effect'].meta).toBeDefined()
    })

    it('all rules should have create function', () => {
      for (const [name, rule] of Object.entries(rules)) {
        expect(typeof rule.create).toBe('function')
      }
    })

    it('all rules should have meta with type', () => {
      for (const [name, rule] of Object.entries(rules)) {
        expect(rule.meta.type).toBeDefined()
      }
    })
  })

  describe('configs', () => {
    it('should export recommended config', () => {
      expect(configs.recommended).toBeDefined()
      expect(configs.recommended.plugins).toEqual(['@flint'])
      expect(configs.recommended.rules).toBeDefined()
    })

    it('should export strict config', () => {
      expect(configs.strict).toBeDefined()
      expect(configs.strict.plugins).toEqual(['@flint'])
      expect(configs.strict.rules).toBeDefined()
    })

    it('recommended should have all rules', () => {
      const ruleKeys = Object.keys(configs.recommended.rules)
      expect(ruleKeys).toHaveLength(6)
      for (const key of ruleKeys) {
        expect(key).toMatch(/^@flint\//)
      }
    })

    it('strict should have all rules as errors', () => {
      for (const [key, value] of Object.entries(configs.strict.rules)) {
        expect(value).toBe('error')
      }
    })

    it('recommended should have mixed severity levels', () => {
      const values = Object.values(configs.recommended.rules)
      expect(values).toContain('warn')
      expect(values).toContain('error')
    })
  })

  describe('rule metadata', () => {
    it('no-state-outside-effect should have correct meta', () => {
      const rule = rules['no-state-outside-effect']
      expect(rule.meta.type).toBeDefined()
      expect(rule.meta.docs).toBeDefined()
    })

    it('no-computed-in-render should have correct meta', () => {
      const rule = rules['no-computed-in-render']
      expect(rule.meta.type).toBeDefined()
      expect(rule.meta.docs).toBeDefined()
    })
  })
})
