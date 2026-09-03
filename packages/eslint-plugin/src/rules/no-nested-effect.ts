// Rule: no-nested-effect
// Prevents calling effect() inside another effect()

export const noNestedEffect = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow effect() calls inside other effects',
      recommended: true,
    },
    messages: {
      noNestedEffect:
        'Do not call effect() inside another effect. Move the nested effect to the component initialization level.',
    },
    schema: [],
  },

  create(context: any) {
    let effectDepth = 0

    return {
      'CallExpression[callee.name="effect"]'(node: any) {
        if (effectDepth > 0) {
          context.report({ node, messageId: 'noNestedEffect' })
        }
        effectDepth++
      },
      'CallExpression[callee.name="effect"]:exit'(node: any) {
        effectDepth--
      },
    }
  },
}
