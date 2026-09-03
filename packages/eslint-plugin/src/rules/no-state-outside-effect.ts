// Rule: no-state-outside-effect
// Prevents creating state outside of component initialization

export const noStateOutsideEffect = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow state() calls outside component initialization',
      recommended: true,
    },
    messages: {
      noStateOutsideEffect:
        'state() should not be called inside effects or callbacks. Use state() at component initialization or in a createRoot().',
    },
    schema: [],
  },

  create(context: any) {
    let inEffect = false
    let inCallback = false

    return {
      'CallExpression[callee.name="effect"]'(node: any) {
        inEffect = true
      },
      'CallExpression[callee.name="effect"]:exit'(node: any) {
        inEffect = false
      },
      'CallExpression[callee.name="setTimeout"], CallExpression[callee.name="setInterval"]'(node: any) {
        inCallback = true
      },
      'CallExpression[callee.name="setTimeout"]:exit, CallExpression[callee.name="setInterval"]:exit'(node: any) {
        inCallback = false
      },
      'JSXAttribute[name.name=/on[A-Z]/] ArrowFunctionExpression'(node: any) {
        inCallback = true
      },
      'JSXAttribute[name.name=/on[A-Z]/] ArrowFunctionExpression:exit'(node: any) {
        inCallback = false
      },
      'CallExpression[callee.name="state"]'(node: any) {
        if (inEffect || inCallback) {
          context.report({ node, messageId: 'noStateOutsideEffect' })
        }
      },
    }
  },
}
