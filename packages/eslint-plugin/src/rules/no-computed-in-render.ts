// Rule: no-computed-in-render
// Prevents calling computed() inside render (should be at module level)

export const noComputedInRender = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow computed() calls inside render functions',
      recommended: true,
    },
    messages: {
      noComputedInRender:
        'computed() should be called at module level or in component initialization, not inside render. Move it outside the component or use useMemo().',
    },
    schema: [],
  },

  create(context: any) {
    let inJSX = false

    return {
      JSXExpressionContainer(node: any) {
        inJSX = true
      },
      'JSXExpressionContainer:exit'(node: any) {
        inJSX = false
      },
      'CallExpression[callee.name="computed"]'(node: any) {
        if (inJSX) {
          context.report({ node, messageId: 'noComputedInRender' })
        }
      },
    }
  },
}
