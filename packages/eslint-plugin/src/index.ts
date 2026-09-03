// @flint/eslint-plugin — ESLint rules for Flint applications

import { noStateOutsideEffect } from './rules/no-state-outside-effect'
import { noComputedInRender } from './rules/no-computed-in-render'
import { preferSignalOverValue } from './rules/prefer-signal-over-value'
import { noReassignSignal } from './rules/no-reassign-signal'
import { requireEffectCleanup } from './rules/require-effect-cleanup'
import { noNestedEffect } from './rules/no-nested-effect'

export const rules = {
  'no-state-outside-effect': noStateOutsideEffect,
  'no-computed-in-render': noComputedInRender,
  'prefer-signal-over-value': preferSignalOverValue,
  'no-reassign-signal': noReassignSignal,
  'require-effect-cleanup': requireEffectCleanup,
  'no-nested-effect': noNestedEffect,
}

export const configs = {
  recommended: {
    plugins: ['@flint'],
    rules: {
      '@flint/no-state-outside-effect': 'warn',
      '@flint/no-computed-in-render': 'error',
      '@flint/prefer-signal-over-value': 'warn',
      '@flint/no-reassign-signal': 'error',
      '@flint/require-effect-cleanup': 'warn',
      '@flint/no-nested-effect': 'error',
    },
  },
  strict: {
    plugins: ['@flint'],
    rules: {
      '@flint/no-state-outside-effect': 'error',
      '@flint/no-computed-in-render': 'error',
      '@flint/prefer-signal-over-value': 'error',
      '@flint/no-reassign-signal': 'error',
      '@flint/require-effect-cleanup': 'error',
      '@flint/no-nested-effect': 'error',
    },
  },
}

export { noStateOutsideEffect } from './rules/no-state-outside-effect'
export { noComputedInRender } from './rules/no-computed-in-render'
export { preferSignalOverValue } from './rules/prefer-signal-over-value'
export { noReassignSignal } from './rules/no-reassign-signal'
export { requireEffectCleanup } from './rules/require-effect-cleanup'
export { noNestedEffect } from './rules/no-nested-effect'
