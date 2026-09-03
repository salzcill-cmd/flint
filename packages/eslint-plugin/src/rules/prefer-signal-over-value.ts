// Rule: prefer-signal-over-value
// Suggests using signal() instead of direct property access

export const preferSignalOverValue = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Suggest using signal() instead of .value for reading signals',
      recommended: true,
    },
    messages: {
      preferSignalOverValue:
        'Use signal() to read reactive values instead of .value property.',
    },
    schema: [],
    fixable: 'code' as const,
  },

  create(context: any) {
    return {
      MemberExpression(node: any) {
        if (
          node.property?.name === 'value' &&
          node.object?.type === 'Identifier' &&
          node.object?.name?.endsWith('Signal')
        ) {
          context.report({
            node,
            messageId: 'preferSignalOverValue',
            fix(fixer: any) {
              return fixer.replaceText(node, `${node.object.name}()`)
            },
          })
        }
      },
    }
  },
}
