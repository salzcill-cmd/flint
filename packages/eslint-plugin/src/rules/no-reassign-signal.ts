// Rule: no-reassign-signal
// Prevents direct assignment to signals (should use .set())

export const noReassignSignal = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct assignment to signal variables',
      recommended: true,
    },
    messages: {
      noReassignSignal:
        'Do not assign directly to a signal. Use signal.set() or signal.value = instead.',
    },
    schema: [],
  },

  create(context: any) {
    const signalNames = new Set<string>()

    return {
      'VariableDeclarator[id.name][init.callee.name="state"]'(node: any) {
        if (node.id?.name) {
          signalNames.add(node.id.name)
        }
      },
      AssignmentExpression(node: any) {
        if (
          node.left?.type === 'Identifier' &&
          signalNames.has(node.left.name)
        ) {
          context.report({ node, messageId: 'noReassignSignal' })
        }
      },
      UpdateExpression(node: any) {
        if (
          node.argument?.type === 'Identifier' &&
          signalNames.has(node.argument.name)
        ) {
          context.report({ node, messageId: 'noReassignSignal' })
        }
      },
    }
  },
}
