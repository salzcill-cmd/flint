import { describe, it, expect } from 'vitest'
import { Optimizer, treeShake, analyzeBundle } from '../src/optimizer/index.js'

// Helper to parse JS to AST (simplified for tests)
function parseToAST(code: string): any {
  // Simple AST representation for testing
  return {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        expression: { type: 'Literal', value: code },
      },
    ],
  }
}

describe('Optimizer', () => {
  describe('Dead Code Elimination', () => {
    it('should eliminate if(false) blocks', () => {
      const optimizer = new Optimizer({
        deadCodeElimination: true,
        constantFolding: false,
        deadStoreElimination: false,
        functionInlining: false,
        jsxOptimization: false,
      })

      const ast = {
        type: 'Program',
        body: [
          {
            type: 'IfStatement',
            test: { type: 'Literal', value: false },
            consequent: {
              type: 'BlockStatement',
              body: [
                {
                  type: 'ExpressionStatement',
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'console' },
                    arguments: [],
                  },
                },
              ],
            },
            alternate: null,
          },
        ],
      }

      const result = optimizer.optimize(ast)
      expect(result.stats.eliminatedNodes).toBeGreaterThan(0)
    })

    it('should keep if(true) blocks', () => {
      const optimizer = new Optimizer({
        deadCodeElimination: true,
        constantFolding: false,
        deadStoreElimination: false,
        functionInlining: false,
        jsxOptimization: false,
      })

      const ast = {
        type: 'Program',
        body: [
          {
            type: 'IfStatement',
            test: { type: 'Literal', value: true },
            consequent: {
              type: 'BlockStatement',
              body: [
                {
                  type: 'ExpressionStatement',
                  expression: { type: 'Literal', value: 42 },
                },
              ],
            },
            alternate: null,
          },
        ],
      }

      const result = optimizer.optimize(ast)
      expect(result.ast.body).toHaveLength(1)
    })
  })

  describe('Constant Folding', () => {
    it('should fold arithmetic expressions', () => {
      const optimizer = new Optimizer({
        deadCodeElimination: false,
        constantFolding: true,
        deadStoreElimination: false,
        functionInlining: false,
        jsxOptimization: false,
      })

      const ast = {
        type: 'Program',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'BinaryExpression',
              operator: '+',
              left: { type: 'Literal', value: 1 },
              right: { type: 'Literal', value: 2 },
            },
          },
        ],
      }

      const result = optimizer.optimize(ast)
      expect(result.stats.constantFolds).toBeGreaterThan(0)
    })

    it('should fold string concatenation', () => {
      const optimizer = new Optimizer({
        deadCodeElimination: false,
        constantFolding: true,
        deadStoreElimination: false,
        functionInlining: false,
        jsxOptimization: false,
      })

      const ast = {
        type: 'Program',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'BinaryExpression',
              operator: '+',
              left: { type: 'Literal', value: 'hello' },
              right: { type: 'Literal', value: ' world' },
            },
          },
        ],
      }

      const result = optimizer.optimize(ast)
      expect(result.stats.constantFolds).toBeGreaterThan(0)
    })

    it('should fold unary expressions', () => {
      const optimizer = new Optimizer({
        deadCodeElimination: false,
        constantFolding: true,
        deadStoreElimination: false,
        functionInlining: false,
        jsxOptimization: false,
      })

      const ast = {
        type: 'Program',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'UnaryExpression',
              operator: '!',
              prefix: true,
              argument: { type: 'Literal', value: true },
            },
          },
        ],
      }

      const result = optimizer.optimize(ast)
      expect(result.stats.constantFolds).toBeGreaterThan(0)
    })

    it('should fold logical expressions', () => {
      const optimizer = new Optimizer({
        deadCodeElimination: false,
        constantFolding: true,
        deadStoreElimination: false,
        functionInlining: false,
        jsxOptimization: false,
      })

      const ast = {
        type: 'Program',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'LogicalExpression',
              operator: '&&',
              left: { type: 'Literal', value: true },
              right: { type: 'Literal', value: false },
            },
          },
        ],
      }

      const result = optimizer.optimize(ast)
      expect(result.stats.constantFolds).toBeGreaterThan(0)
    })

    it('should fold conditional expressions', () => {
      const optimizer = new Optimizer({
        deadCodeElimination: false,
        constantFolding: true,
        deadStoreElimination: false,
        functionInlining: false,
        jsxOptimization: false,
      })

      const ast = {
        type: 'Program',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'ConditionalExpression',
              test: { type: 'Literal', value: true },
              consequent: { type: 'Literal', value: 'yes' },
              alternate: { type: 'Literal', value: 'no' },
            },
          },
        ],
      }

      const result = optimizer.optimize(ast)
      expect(result.stats.constantFolds).toBeGreaterThan(0)
    })
  })

  describe('JSX Optimization', () => {
    it('should optimize JSX elements', () => {
      const optimizer = new Optimizer({
        deadCodeElimination: false,
        constantFolding: false,
        deadStoreElimination: false,
        functionInlining: false,
        jsxOptimization: true,
      })

      const ast = {
        type: 'Program',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'JSXElement',
              openingElement: {
                type: 'JSXOpeningElement',
                name: { type: 'JSXIdentifier', name: 'div' },
                attributes: [],
              },
              children: [
                {
                  type: 'JSXExpressionContainer',
                  expression: { type: 'Literal', value: '' },
                },
              ],
            },
          },
        ],
      }

      const result = optimizer.optimize(ast)
      expect(result.ast).toBeDefined()
    })
  })

  describe('Statistics', () => {
    it('should track optimization stats', () => {
      const optimizer = new Optimizer()
      const ast = {
        type: 'Program',
        body: [
          {
            type: 'ExpressionStatement',
            expression: { type: 'Literal', value: 42 },
          },
        ],
      }

      const result = optimizer.optimize(ast)
      expect(result.stats).toHaveProperty('originalSize')
      expect(result.stats).toHaveProperty('optimizedSize')
      expect(result.stats).toHaveProperty('reduction')
      expect(result.stats).toHaveProperty('eliminatedNodes')
      expect(result.stats).toHaveProperty('inlinedFunctions')
      expect(result.stats).toHaveProperty('constantFolds')
    })
  })
})

describe('treeShake', () => {
  it('should identify all exports', () => {
    const code = `
      export const Counter = () => {}
      export const Button = () => {}
    `
    const result = treeShake(code, {
      entryPoints: ['index.js'],
      sideEffectFree: new Set(),
      analyzeExports: true,
    })

    // All exports should be identified
    expect(result.kept.length + result.eliminated.length).toBe(2)
  })

  it('should identify default exports as kept', () => {
    const code = `
      export default function App() {}
      export const Helper = () => {}
    `
    const result = treeShake(code, {
      entryPoints: ['index.js'],
      sideEffectFree: new Set(),
      analyzeExports: true,
    })

    expect(result.kept).toContain('default')
  })
})

describe('analyzeBundle', () => {
  it('should analyze bundle size', () => {
    const code = `
      export const foo = () => {}
      export const bar = () => {}
    `
    const result = analyzeBundle(code, 'test-module')

    expect(result.size).toBeGreaterThan(0)
    expect(result.modules).toHaveLength(1)
    expect(result.modules[0].exports).toContain('foo')
    expect(result.modules[0].exports).toContain('bar')
  })
})
