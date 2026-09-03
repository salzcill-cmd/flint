import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnimationEngine, Transition, TransitionGroup, useTransition, useAnimate, easings, presets, animate, getAnimationEngine } from '../src/animations/index.js'
import { h } from '../src/renderer/index.js'

describe('Animations', () => {
  describe('Easing Functions', () => {
    it('should have linear easing', () => {
      expect(easings.linear(0)).toBe(0)
      expect(easings.linear(0.5)).toBe(0.5)
      expect(easings.linear(1)).toBe(1)
    })

    it('should have easeInQuad easing', () => {
      expect(easings.easeInQuad(0)).toBe(0)
      expect(easings.easeInQuad(1)).toBe(1)
      expect(easings.easeInQuad(0.5)).toBe(0.25)
    })

    it('should have easeOutQuad easing', () => {
      expect(easings.easeOutQuad(0)).toBe(0)
      expect(easings.easeOutQuad(1)).toBe(1)
    })

    it('should have easeInOutQuad easing', () => {
      expect(easings.easeInOutQuad(0)).toBe(0)
      expect(easings.easeInOutQuad(1)).toBe(1)
    })

    it('should have easeInCubic easing', () => {
      expect(easings.easeInCubic(0)).toBe(0)
      expect(easings.easeInCubic(1)).toBe(1)
    })

    it('should have easeOutCubic easing', () => {
      expect(easings.easeOutCubic(0)).toBe(0)
      expect(easings.easeOutCubic(1)).toBe(1)
    })
  })

  describe('AnimationEngine', () => {
    let engine: AnimationEngine

    beforeEach(() => {
      engine = new AnimationEngine()
    })

    it('should create animation engine', () => {
      expect(engine).toBeDefined()
    })

    it('should get singleton engine', () => {
      const engine1 = getAnimationEngine()
      const engine2 = getAnimationEngine()
      expect(engine1).toBe(engine2)
    })
  })

  describe('Presets', () => {
    it('should have fadeIn preset', () => {
      expect(presets.fadeIn).toBeDefined()
      expect(presets.fadeIn.enter).toBeDefined()
      expect(presets.fadeIn.exit).toBeDefined()
    })

    it('should have slideUp preset', () => {
      expect(presets.slideUp).toBeDefined()
      expect(presets.slideUp.enter).toBeDefined()
      expect(presets.slideUp.exit).toBeDefined()
    })

    it('should have scale preset', () => {
      expect(presets.scale).toBeDefined()
      expect(presets.scale.enter).toBeDefined()
      expect(presets.scale.exit).toBeDefined()
    })

    it('should have bounce preset', () => {
      expect(presets.bounce).toBeDefined()
      expect(presets.bounce.enter).toBeDefined()
      expect(presets.bounce.exit).toBeDefined()
    })
  })

  describe('useTransition', () => {
    it('should create transition hook', () => {
      const transition = useTransition()
      
      expect(transition).toBeDefined()
      expect(typeof transition.start).toBe('function')
      expect(transition.isPending).toBeDefined()
    })
  })

  describe('useAnimate', () => {
    it('should create animate hook', () => {
      const animateHelper = useAnimate()
      
      expect(animateHelper).toBeDefined()
      expect(typeof animateHelper.animate).toBe('function')
      expect(typeof animateHelper.cancel).toBe('function')
      expect(animateHelper.isAnimating).toBeDefined()
    })
  })

  describe('animate function', () => {
    it('should be callable', () => {
      expect(typeof animate).toBe('function')
    })
  })
})
