// Rule: require-effect-cleanup
// Warns when effect() doesn't return a cleanup function

export const requireEffectCleanup = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require effect() to return a cleanup function when subscriptions are created',
      recommended: true,
    },
    messages: {
      requireEffectCleanup:
        'effect() should return a cleanup function to prevent memory leaks. Return () => { /* cleanup */ }.',
    },
    schema: [],
  },

  create(context: any) {
    let hasAddEventListener = false
    let hasSetTimeout = false

    return {
      'CallExpression[callee.name="effect"]'(node: any) {
        hasAddEventListener = false
        hasSetTimeout = false
      },
      'CallExpression[callee.property.name="addEventListener"]'(node: any) {
        hasAddEventListener = true
      },
      'CallExpression[callee.name="setTimeout"], CallExpression[callee.name="setInterval"]'(node: any) {
        hasSetTimeout = true
      },
      'CallExpression[callee.name="effect"]:exit'(node: any) {
        if (hasAddEventListener || hasSetTimeout) {
          const effectArg = node.arguments?.[0]
          if (effectArg?.type === 'ArrowFunctionExpression' || effectArg?.type === 'FunctionExpression') {
            const body = effectArg.body
            if (body?.type !== 'BlockStatement' || !body.body?.some((s: any) => s.type === 'ReturnStatement')) {
              context.report({ node, messageId: 'requireEffectCleanup' })
            }
          }
        }
      },
    }
  },
}
