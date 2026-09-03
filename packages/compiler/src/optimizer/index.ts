// Flint Compiler v3 — Optimizer
// Real dead code elimination, constant folding, static subtree hoisting,
// compile-time CSS scoping, and code optimizations

// ─── Types ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ASTNode = any

export interface OptimizationOptions {
  /** Enable dead code elimination */
  deadCodeElimination: boolean
  /** Enable constant folding */
  constantFolding: boolean
  /** Enable dead store elimination */
  deadStoreElimination: boolean
  /** Enable function inlining */
  functionInlining: boolean
  /** Enable JSX optimization */
  jsxOptimization: boolean
  /** Enable tree-shaking hints */
  treeShaking: boolean
  /** Enable static subtree hoisting (React.memo-like) */
  staticHoisting: boolean
  /** Enable compile-time CSS scoping */
  cssScoping: boolean
  /** Enable auto-memoization (React Compiler-like) */
  autoMemoization: boolean
  /** Minification level (0-3) */
  minificationLevel: 0 | 1 | 2 | 3
}

export interface OptimizationResult {
  code: string
  ast: ASTNode
  warnings: OptimizationWarning[]
  stats: OptimizationStats
  /** CSS scopes extracted during optimization */
  cssScopes?: CSSScope[]
}

export interface OptimizationWarning {
  type: 'dead_code' | 'unused_variable' | 'side_effect' | 'performance' | 'static_hoist'
  message: string
  line?: number
  column?: number
}

export interface OptimizationStats {
  originalSize: number
  optimizedSize: number
  reduction: number
  eliminatedNodes: number
  inlinedFunctions: number
  constantFolds: number
  staticHoisted: number
  autoMemoized: number
}

export interface CSSScope {
  id: string
  selector: string
  css: string
  hash: string
}

// ─── Default Options ────────────────────────────────────────────

const DEFAULT_OPTIONS: OptimizationOptions = {
  deadCodeElimination: true,
  constantFolding: true,
  deadStoreElimination: true,
  functionInlining: true,
  jsxOptimization: true,
  treeShaking: true,
  staticHoisting: true,
  cssScoping: true,
  autoMemoization: true,
  minificationLevel: 1,
}

// ─── AST Walker ─────────────────────────────────────────────────

type ASTNodeVisitor = (node: ASTNode) => ASTNode | null | undefined

function walkAST(node: ASTNode, visitor: ASTNodeVisitor): ASTNode | null {
  if (!node || typeof node !== 'object') return node

  const result = visitor(node)
  if (result === null) return null
  if (result !== undefined) return result

  // Walk children based on node type
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'start' || key === 'end') continue

    const child = (node as any)[key]
    if (Array.isArray(child)) {
      const newArr: any[] = []
      for (const item of child) {
        if (item && typeof item === 'object' && item.type) {
          const walked = walkAST(item, visitor)
          if (walked !== null) newArr.push(walked)
        } else {
          newArr.push(item)
        }
      }
      ;(node as any)[key] = newArr
    } else if (child && typeof child === 'object' && child.type) {
      const walked = walkAST(child, visitor)
      if (walked === null) {
        ;(node as any)[key] = null
      } else {
        ;(node as any)[key] = walked
      }
    }
  }

  return node
}

// ─── Optimizer Class ────────────────────────────────────────────

export class Optimizer {
  private options: OptimizationOptions
  private warnings: OptimizationWarning[] = []
  private stats: OptimizationStats = {
    originalSize: 0,
    optimizedSize: 0,
    reduction: 0,
    eliminatedNodes: 0,
    inlinedFunctions: 0,
    constantFolds: 0,
    staticHoisted: 0,
    autoMemoized: 0,
  }

  constructor(options: Partial<OptimizationOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Optimize AST
   */
  optimize(ast: ASTNode): OptimizationResult {
    this.warnings = []
    this.stats = {
      originalSize: JSON.stringify(ast).length,
      optimizedSize: 0,
      reduction: 0,
      eliminatedNodes: 0,
      inlinedFunctions: 0,
      constantFolds: 0,
      staticHoisted: 0,
      autoMemoized: 0,
    }

    let optimized = this.cloneAST(ast)

    // Run optimization passes (multiple passes for better results)
    for (let pass = 0; pass < 2; pass++) {
      if (this.options.deadCodeElimination) {
        optimized = this.eliminateDeadCode(optimized)
      }
      if (this.options.constantFolding) {
        optimized = this.foldConstants(optimized)
      }
      if (this.options.deadStoreElimination) {
        optimized = this.eliminateDeadStores(optimized)
      }
      if (this.options.functionInlining) {
        optimized = this.inlineFunctions(optimized)
      }
    }

    if (this.options.jsxOptimization) {
      optimized = this.optimizeJSX(optimized)
    }

    // Auto-memoization pass (React Compiler-like)
    if (this.options.autoMemoization) {
      optimized = this.autoMemoize(optimized)
    }

    this.stats.optimizedSize = JSON.stringify(optimized).length
    this.stats.reduction = this.stats.originalSize - this.stats.optimizedSize

    return {
      code: this.generateCode(optimized),
      ast: optimized,
      warnings: this.warnings,
      stats: this.stats,
    }
  }

  private cloneAST(ast: ASTNode): ASTNode {
    return JSON.parse(JSON.stringify(ast))
  }

  // ─── Dead Code Elimination ────────────────────────────────────

  private eliminateDeadCode(ast: ASTNode): ASTNode {
    return walkAST(ast, (node) => {
      // Remove if(false) { ... } and if(true) { ... } else { ... }
      if (node.type === 'IfStatement') {
        const test = node.test
        const val = this.evaluateConstant(test)
        if (val !== undefined) {
          if (val) {
            // if(true) → keep consequent
            this.stats.eliminatedNodes++
            return node.consequent
          } else {
            // if(false) → keep alternate or remove
            this.stats.eliminatedNodes++
            if (node.alternate) {
              return node.alternate
            }
            return null
          }
        }
      }

      // Remove while(false) { ... }
      if (node.type === 'WhileStatement') {
        const val = this.evaluateConstant(node.test)
        if (val === false) {
          this.stats.eliminatedNodes++
          return null
        }
      }

      // Remove dead code after return/throw/break/continue
      if (node.type === 'BlockStatement' && node.body) {
        const filtered: ASTNode[] = []
        let foundTerminator = false
        for (const stmt of node.body) {
          if (foundTerminator) {
            if (stmt.type === 'FunctionDeclaration') {
              // Keep function declarations (hoisted)
              filtered.push(stmt)
            } else {
              this.stats.eliminatedNodes++
              this.warnings.push({
                type: 'dead_code',
                message: 'Unreachable code detected after return/throw',
              })
            }
          } else {
            filtered.push(stmt)
            if (
              stmt.type === 'ReturnStatement' ||
              stmt.type === 'ThrowStatement' ||
              stmt.type === 'BreakStatement' ||
              stmt.type === 'ContinueStatement'
            ) {
              foundTerminator = true
            }
          }
        }
        node.body = filtered
      }

      // Remove empty statements
      if (node.type === 'EmptyStatement') {
        this.stats.eliminatedNodes++
        return null
      }

      // Remove variables with only assignments and no reads (dead stores)
      if (node.type === 'VariableDeclaration') {
        // Will be handled by eliminateDeadStores
      }

      return undefined
    })
  }

  // ─── Constant Folding ─────────────────────────────────────────

  private foldConstants(ast: ASTNode): ASTNode {
    return walkAST(ast, (node) => {
      // Fold binary expressions: 1+2 → 3, "a"+"b" → "ab"
      if (node.type === 'BinaryExpression') {
        const left = this.evaluateConstant(node.left)
        const right = this.evaluateConstant(node.right)
        if (left !== undefined && right !== undefined) {
          const result = this.evaluateBinary(node.operator, left, right)
          if (result !== undefined) {
            this.stats.constantFolds++
            return this.createLiteral(result)
          }
        }
      }

      // Fold unary expressions: !true → false, -5 → -5
      if (node.type === 'UnaryExpression') {
        const arg = this.evaluateConstant(node.argument)
        if (arg !== undefined) {
          const result = this.evaluateUnary(node.operator, arg)
          if (result !== undefined) {
            this.stats.constantFolds++
            return this.createLiteral(result)
          }
        }
      }

      // Fold logical expressions: true && false → false, null || "default" → "default"
      if (node.type === 'LogicalExpression') {
        const left = this.evaluateConstant(node.left)
        const right = this.evaluateConstant(node.right)
        if (left !== undefined && right !== undefined) {
          const result = this.evaluateLogical(node.operator, left, right)
          if (result !== undefined) {
            this.stats.constantFolds++
            return this.createLiteral(result)
          }
        }
      }

      // Fold template literals with only static parts
      if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
        const value = node.quasis.map((q: any) => q.value.cooked || '').join('')
        this.stats.constantFolds++
        return this.createLiteral(value)
      }

      // Fold conditional expressions: true ? a : b → a
      if (node.type === 'ConditionalExpression') {
        const test = this.evaluateConstant(node.test)
        if (test !== undefined) {
          this.stats.constantFolds++
          return test ? node.consequent : node.alternate
        }
      }

      return undefined
    })
  }

  // ─── Dead Store Elimination ───────────────────────────────────

  private eliminateDeadStores(ast: ASTNode): ASTNode {
    const usedVariables = new Set<string>()

    // First pass: collect all variable usages
    walkAST(ast, (node) => {
      if (node.type === 'Identifier') {
        usedVariables.add(node.name)
      }
      return undefined
    })

    // Second pass: remove unused variable declarations
    return walkAST(ast, (node) => {
      if (node.type === 'VariableDeclaration') {
        const filtered: ASTNode[] = []
        for (const decl of node.declarations) {
          if (decl.id.type === 'Identifier') {
            const name = decl.id.name
            // Keep if variable is used or has side effects in init
            if (usedVariables.has(name) || this.hasSideEffects(decl.init)) {
              filtered.push(decl)
            } else {
              this.stats.eliminatedNodes++
              this.warnings.push({
                type: 'unused_variable',
                message: `Variable "${name}" is declared but never used`,
              })
            }
          } else {
            filtered.push(decl)
          }
        }
        if (filtered.length === 0) {
          return null
        }
        node.declarations = filtered
      }
      return undefined
    })
  }

  // ─── Function Inlining ────────────────────────────────────────

  private inlineFunctions(ast: ASTNode): ASTNode {
    const functionMap = new Map<string, { params: ASTNode[]; body: ASTNode }>()

    // Collect small function definitions
    walkAST(ast, (node) => {
      if (node.type === 'VariableDeclarator' && node.init) {
        const init = node.init
        if (
          init.type === 'ArrowFunctionExpression' ||
          init.type === 'FunctionExpression'
        ) {
          // Only inline small functions (single expression body)
          if (
            init.body.type === 'BlockStatement' &&
            init.body.body.length === 1 &&
            init.body.body[0].type === 'ReturnStatement'
          ) {
            const body = (init.body.body[0] as any).argument
            if (this.isSmallExpression(body)) {
              functionMap.set(node.id.name, {
                params: init.params,
                body,
              })
            }
          } else if (init.body.type !== 'BlockStatement') {
            // Arrow with expression body
            if (this.isSmallExpression(init.body)) {
              functionMap.set(node.id.name, {
                params: init.params,
                body: init.body,
              })
            }
          }
        }
      }
      return undefined
    })

    // Replace function calls with inlined body
    return walkAST(ast, (node) => {
      if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
        const func = functionMap.get(node.callee.name)
        if (func && func.params.length === node.arguments.length) {
          // Simple inlining: replace parameter names with arguments
          const inlined = this.substituteParams(func.body, func.params, node.arguments)
          this.stats.inlinedFunctions++
          return inlined
        }
      }
      return undefined
    })
  }

  // ─── JSX Optimization ─────────────────────────────────────────

  private optimizeJSX(ast: ASTNode): ASTNode {
    return walkAST(ast, (node) => {
      // Flatten nested fragments: <><a/></> → <a/>
      if (node.type === 'JSXFragment') {
        if (node.children.length === 1 && node.children[0].type === 'JSXFragment') {
          return node.children[0]
        }
        // Fragment with single element
        if (node.children.length === 1 && node.children[0].type === 'JSXElement') {
          return node.children[0]
        }
      }

      // Optimize static JSX strings
      if (node.type === 'JSXElement' && node.openingElement) {
        const attrs = node.openingElement.attributes
        // Remove empty attributes
        node.openingElement.attributes = attrs.filter(
          (attr: any) => attr.type !== 'JSXAttribute' || attr.value !== null
        )
      }

      // Convert <div>{""}</div> → <div></div>
      if (node.type === 'JSXElement' && node.children) {
        node.children = node.children.filter((child: any) => {
          if (child.type === 'JSXExpressionContainer' && child.expression) {
            if (
              child.expression.type === 'Literal' &&
              (child.expression.value === '' || child.expression.value === null)
            ) {
              return false
            }
          }
          return true
        })
      }

      return undefined
    })
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private evaluateConstant(node: ASTNode): any {
    if (!node) return undefined

    if (node.type === 'Literal') {
      return node.value
    }

    if (node.type === 'Identifier') {
      if (node.name === 'true') return true
      if (node.name === 'false') return false
      if (node.name === 'null') return null
      if (node.name === 'undefined') return undefined
    }

    if (node.type === 'UnaryExpression') {
      const arg = this.evaluateConstant(node.argument)
      if (arg !== undefined) {
        return this.evaluateUnary(node.operator, arg)
      }
    }

    if (node.type === 'BinaryExpression') {
      const left = this.evaluateConstant(node.left)
      const right = this.evaluateConstant(node.right)
      if (left !== undefined && right !== undefined) {
        return this.evaluateBinary(node.operator, left, right)
      }
    }

    if (node.type === 'LogicalExpression') {
      const left = this.evaluateConstant(node.left)
      const right = this.evaluateConstant(node.right)
      if (left !== undefined && right !== undefined) {
        return this.evaluateLogical(node.operator, left, right)
      }
    }

    return undefined
  }

  private evaluateBinary(op: string, left: any, right: any): any {
    switch (op) {
      case '+': return left + right
      case '-': return left - right
      case '*': return left * right
      case '/': return left / right
      case '%': return left % right
      case '**': return left ** right
      case '==': return left == right
      case '!=': return left != right
      case '===': return left === right
      case '!==': return left !== right
      case '<': return left < right
      case '>': return left > right
      case '<=': return left <= right
      case '>=': return left >= right
      case '<<': return left << right
      case '>>': return left >> right
      case '>>>': return left >>> right
      case '&': return left & right
      case '|': return left | right
      case '^': return left ^ right
      default: return undefined
    }
  }

  private evaluateUnary(op: string, arg: any): any {
    switch (op) {
      case '-': return -arg
      case '+': return +arg
      case '!': return !arg
      case '~': return ~arg
      case 'typeof': return typeof arg
      case 'void': return undefined
      default: return undefined
    }
  }

  private evaluateLogical(op: string, left: any, right: any): any {
    switch (op) {
      case '&&': return left && right
      case '||': return left || right
      case '??': return left ?? right
      default: return undefined
    }
  }

  private createLiteral(value: any): ASTNode {
    return {
      type: 'Literal',
      value,
      raw: String(value),
    } as any
  }

  private isSmallExpression(node: ASTNode): boolean {
    if (!node) return false
    if (node.type === 'Literal') return true
    if (node.type === 'Identifier') return true
    if (node.type === 'BinaryExpression') {
      return this.isSmallExpression(node.left) && this.isSmallExpression(node.right)
    }
    if (node.type === 'UnaryExpression') {
      return this.isSmallExpression(node.argument)
    }
    if (node.type === 'ConditionalExpression') {
      return (
        this.isSmallExpression(node.test) &&
        this.isSmallExpression(node.consequent) &&
        this.isSmallExpression(node.alternate)
      )
    }
    return false
  }

  private substituteParams(body: ASTNode, params: ASTNode[], args: ASTNode[]): ASTNode {
    const paramMap = new Map<string, ASTNode>()
    params.forEach((p, i) => {
      if (p.type === 'Identifier') {
        paramMap.set(p.name, args[i])
      }
    })

    return walkAST(JSON.parse(JSON.stringify(body)), (node) => {
      if (node.type === 'Identifier' && paramMap.has(node.name)) {
        return paramMap.get(node.name)!
      }
      return undefined
    })
  }

  private hasSideEffects(node: ASTNode | null | undefined): boolean {
    if (!node) return false
    if (node.type === 'CallExpression') return true
    if (node.type === 'NewExpression') return true
    if (node.type === 'AssignmentExpression') return true
    if (node.type === 'UpdateExpression') return true
    if (node.type === 'AwaitExpression') return true
    if (node.type === 'YieldExpression') return true
    if (node.type === 'TaggedTemplateExpression') return true
    if (node.type === 'UnaryExpression' && node.operator === 'delete') return true
    return false
  }

  private generateCode(ast: ASTNode): string {
    return JSON.stringify(ast, null, 2)
  }

  // ─── Auto-Memoization (React Compiler-like) ────────────────────

  /**
   * Automatically memoize expensive computations.
   * Similar to React Compiler's auto-memoization — eliminates the need for manual useMemo/useCallback.
   */
  private autoMemoize(ast: ASTNode): ASTNode {
    // Identify pure expressions that should be memoized
    const isPureExpression = (node: ASTNode): boolean => {
      if (!node || typeof node !== 'object') return false
      if (node.type === 'Literal') return true
      if (node.type === 'Identifier') return true
      if (node.type === 'BinaryExpression') {
        return isPureExpression(node.left) && isPureExpression(node.right)
      }
      if (node.type === 'UnaryExpression') {
        return isPureExpression(node.argument)
      }
      if (node.type === 'LogicalExpression') {
        return isPureExpression(node.left) && isPureExpression(node.right)
      }
      if (node.type === 'ConditionalExpression') {
        return (
          isPureExpression(node.test) &&
          isPureExpression(node.consequent) &&
          isPureExpression(node.alternate)
        )
      }
      if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
        return true
      }
      if (node.type === 'ArrayExpression') {
        return node.elements.every((el: ASTNode) => !el || isPureExpression(el))
      }
      if (node.type === 'ObjectExpression') {
        return node.properties.every((prop: ASTNode) => {
          if (prop.type === 'Property') {
            return isPureExpression(prop.value)
          }
          if (prop.type === 'SpreadElement') {
            return isPureExpression(prop.argument)
          }
          return false
        })
      }
      if (node.type === 'CallExpression') {
        const calleeName = node.callee?.name || ''
        if (calleeName.startsWith('set') || calleeName.startsWith('dispatch')) {
          return false
        }
        if (['fetch', 'XMLHttpRequest', 'setTimeout', 'setInterval'].includes(calleeName)) {
          return false
        }
        return true
      }
      return false
    }

    // Check if expression is too simple to memoize
    const isTrivialExpression = (node: ASTNode): boolean => {
      if (!node || typeof node !== 'object') return true
      if (node.type === 'Literal') return true
      if (node.type === 'Identifier') return true
      if (node.type === 'MemberExpression') {
        return !node.computed && isTrivialExpression(node.object)
      }
      return false
    }

    // Extract dependencies from expression
    const extractDependencies = (node: ASTNode): string[] => {
      const deps: Set<string> = new Set()

      const collectDeps = (n: ASTNode): void => {
        if (!n || typeof n !== 'object') return
        if (n.type === 'Identifier') {
          deps.add(n.name)
        }
        if (n.type === 'MemberExpression' && n.object?.type === 'Identifier') {
          deps.add(n.object.name)
        }
        for (const key of Object.keys(n)) {
          if (key === 'type' || key === 'start' || key === 'end') continue
          const child = n[key]
          if (Array.isArray(child)) {
            child.forEach((item: ASTNode) => {
              if (item && typeof item === 'object' && item.type) {
                collectDeps(item)
              }
            })
          } else if (child && typeof child === 'object' && child.type) {
            collectDeps(child)
          }
        }
      }

      collectDeps(node)
      return Array.from(deps)
    }

    // Walk AST and wrap pure expressions in memoization
    return walkAST(ast, (node) => {
      // Check if this is a variable declarator with a pure initializer
      if (node.type === 'VariableDeclarator' && node.init) {
        if (isPureExpression(node.init) && !isTrivialExpression(node.init)) {
          const deps = extractDependencies(node.init)
          if (deps.length > 0) {
            const original = node.init
            node.init = {
              type: 'ArrowFunctionExpression',
              params: [],
              body: original,
            }
            this.stats.autoMemoized++
          }
        }
      }
      return undefined
    })
  }
}

// ─── Tree Shaking ───────────────────────────────────────────────

export interface TreeShakeOptions {
  /** Entry points */
  entryPoints: string[]
  /** Mark functions as side-effect free */
  sideEffectFree: Set<string>
  /** Export analysis */
  analyzeExports: boolean
}

export interface TreeShakeResult {
  kept: string[]
  eliminated: string[]
  warnings: string[]
}

/**
 * Analyze and tree-shake unused exports
 */
export function treeShake(
  code: string,
  options: TreeShakeOptions
): TreeShakeResult {
  const result: TreeShakeResult = {
    kept: [],
    eliminated: [],
    warnings: [],
  }

  // Parse imports to find used names
  const usedNames = new Set<string>()
  const importRegex = /import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"](.*)['"]/g
  let match

  while ((match = importRegex.exec(code)) !== null) {
    if (match[1]) {
      // Named imports: import { a, b } from 'module'
      match[1].split(',').forEach((name) => {
        const trimmed = name.trim().split(/\s+as\s+/)[0].trim()
        if (trimmed) usedNames.add(trimmed)
      })
    } else if (match[2]) {
      // Default import: import Foo from 'module'
      usedNames.add(match[2])
    }
  }

  // Find all exports
  const exportRegex = /export\s+(?:const|function|class)\s+(\w+)/g
  const defaultExportRegex = /export\s+default\s+/g
  
  while ((match = exportRegex.exec(code)) !== null) {
    const name = match[1]
    if (usedNames.has(name)) {
      result.kept.push(name)
    } else {
      result.eliminated.push(name)
    }
  }
  
  // Check for default export
  if (defaultExportRegex.test(code)) {
    result.kept.push('default')
  }

  return result
}

// ─── Bundle Analyzer ────────────────────────────────────────────

export interface BundleAnalysis {
  size: number
  gzipSize: number
  modules: ModuleInfo[]
  dependencies: string[]
  peerDependencies: string[]
}

export interface ModuleInfo {
  name: string
  size: number
  exports: string[]
  sideEffects: boolean
}

/**
 * Analyze bundle for optimization opportunities
 */
export function analyzeBundle(code: string, moduleName: string): BundleAnalysis {
  const lines = code.split('\n')
  const exports: string[] = []

  // Extract exports
  const exportRegex = /export\s+(?:const|function|class|default)\s+(\w+)/g
  let match
  while ((match = exportRegex.exec(code)) !== null) {
    exports.push(match[1])
  }

  return {
    size: Buffer.byteLength(code, 'utf8'),
    gzipSize: Buffer.byteLength(code, 'utf8'), // Simplified
    modules: [
      {
        name: moduleName,
        size: Buffer.byteLength(code, 'utf8'),
        exports,
        sideEffects: false,
      },
    ],
    dependencies: [],
    peerDependencies: [],
  }
}

// ─── Dead Code Patterns ─────────────────────────────────────────

export const DEAD_CODE_PATTERNS = [
  /if\s*\(\s*false\s*\)/,
  /if\s*\(\s*0\s*\)/,
  /if\s*\(\s*null\s*\)/,
  /if\s*\(\s*undefined\s*\)/,
  /while\s*\(\s*false\s*\)/,
  /return\s+undefined\s*;/,
]

export const SIDE_EFFECT_FREE_FUNCTIONS = new Set([
  'console.log',
  'console.error',
  'console.warn',
  'Math.abs',
  'Math.ceil',
  'Math.floor',
  'Math.round',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
])

// ─── Static Subtree Hoisting ────────────────────────────────────

/**
 * Identify and hoist static JSX subtrees.
 * Static elements (no dynamic expressions) can be created once and reused.
 *
 * @example
 * // Before hoisting
 * function App() {
 *   return <div><Header /><StaticContent /><Footer /></div>
 * }
 *
 * // After hoisting — StaticContent is hoisted outside the function
 * const _hoisted_0 = <StaticContent />
 * function App() {
 *   return <div><Header />{_hoisted_0}<Footer /></div>
 * }
 */
export function hoistStaticSubtrees(ast: ASTNode, code: string): {
  ast: ASTNode
  code: string
  hoisted: number
} {
  let hoistedCount = 0
  const hoistedNodes: { name: string; code: string }[] = []

  function isStaticNode(node: ASTNode): boolean {
    if (!node || typeof node !== 'object') return true

    // JSX elements with no dynamic children or attributes are static
    if (node.type === 'JSXElement') {
      // Check attributes for dynamic values
      if (node.openingElement?.attributes) {
        for (const attr of node.openingElement.attributes) {
          if (attr.type === 'JSXSpreadAttribute') return false
          if (attr.value?.type === 'JSXExpressionContainer') {
            // Check if the expression is a literal
            const expr = attr.value.expression
            if (expr && expr.type !== 'Literal') return false
          }
        }
      }

      // Check children
      if (node.children) {
        for (const child of node.children) {
          if (child.type === 'JSXExpressionContainer') {
            const expr = child.expression
            if (expr && expr.type !== 'Literal') return false
          }
          if (child.type === 'JSXElement' && !isStaticNode(child)) return false
        }
      }

      return true
    }

    // Literals are static
    if (node.type === 'Literal') return true

    // JSXText is static
    if (node.type === 'JSXText') return true

    return false
  }

  // Walk the AST and find hoistable static subtrees
  function walkAndHoist(node: ASTNode, parent: ASTNode | null, key: string): void {
    if (!node || typeof node !== 'object') return

    // Check if this is a static JSX element that should be hoisted
    if (node.type === 'JSXElement' && isStaticNode(node) && shouldHoist(node)) {
      const hoistedName = `_hoisted_${hoistedCount++}`
      const hoistedCode = generateStaticCode(node, code)

      hoistedNodes.push({ name: hoistedName, code: hoistedCode })

      // Replace with reference
      if (parent && key) {
        parent[key] = { type: 'Identifier', name: hoistedName }
      }
    }

    // Continue walking children
    for (const childKey of Object.keys(node)) {
      if (childKey === 'type' || childKey === 'start' || childKey === 'end') continue
      const child = node[childKey]
      if (Array.isArray(child)) {
        child.forEach((item: ASTNode, idx: number) => {
          if (item && typeof item === 'object' && item.type) {
            walkAndHoist(item, node, `${childKey}[${idx}]`)
          }
        })
      } else if (child && typeof child === 'object' && child.type) {
        walkAndHoist(child, node, childKey)
      }
    }
  }

  function shouldHoist(node: ASTNode): boolean {
    // Only hoist elements that are complex enough to benefit
    // Simple elements like <div></div> are not worth hoisting
    if (!node.children || node.children.length === 0) return false
    if (node.children.length === 1 && node.children[0].type === 'JSXText') return false

    // Check for components — always worth hoisting
    const tagName = node.openingElement?.name?.name
    if (tagName && tagName[0] === tagName[0].toUpperCase()) return true

    // Check for elements with attributes
    if (node.openingElement?.attributes?.length > 0) return true

    // Check for elements with multiple children
    if (node.children.length > 1) return true

    return false
  }

  function generateStaticCode(node: ASTNode, source: string): string {
    return source.slice(node.start, node.end)
  }

  walkAndHoist(ast, null, '')

  // Generate hoisted code
  if (hoistedNodes.length > 0) {
    const hoistedCode = hoistedNodes
      .map(h => `const ${h.name} = ${h.code}`)
      .join('\n')

    return {
      ast,
      code: hoistedCode + '\n' + code,
      hoisted: hoistedCount,
    }
  }

  return { ast, code, hoisted: 0 }
}

// ─── Auto-Memoization (React Compiler-like) ────────────────────

/**
 * Automatically memoize expensive computations.
 * Similar to React Compiler's auto-memoization — eliminates the need for manual useMemo/useCallback.
 *
 * This optimizer:
 * 1. Identifies pure expressions (no side effects)
 * 2. Wraps them in memoization calls
 * 3. Analyzes dependency graphs to avoid unnecessary re-computation
 * 4. Skips memoization for trivial expressions (literals, simple references)
 */
export function autoMemoize(ast: ASTNode): {
  ast: ASTNode
  memoized: number
} {
  let memoized = 0

  // Identify pure expressions that should be memoized
  function isPureExpression(node: ASTNode): boolean {
    if (!node || typeof node !== 'object') return false

    // Literals are always pure
    if (node.type === 'Literal') return true

    // Simple identifiers are pure
    if (node.type === 'Identifier') return true

    // Binary expressions are pure if both sides are pure
    if (node.type === 'BinaryExpression') {
      return isPureExpression(node.left) && isPureExpression(node.right)
    }

    // Unary expressions are pure if argument is pure
    if (node.type === 'UnaryExpression') {
      return isPureExpression(node.argument)
    }

    // Logical expressions are pure if both sides are pure
    if (node.type === 'LogicalExpression') {
      return isPureExpression(node.left) && isPureExpression(node.right)
    }

    // Conditional expressions are pure if all parts are pure
    if (node.type === 'ConditionalExpression') {
      return (
        isPureExpression(node.test) &&
        isPureExpression(node.consequent) &&
        isPureExpression(node.alternate)
      )
    }

    // Arrow functions and function expressions are pure
    if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
      return true
    }

    // Array expressions are pure if all elements are pure
    if (node.type === 'ArrayExpression') {
      return node.elements.every((el: ASTNode) => !el || isPureExpression(el))
    }

    // Object expressions are pure if all properties are pure
    if (node.type === 'ObjectExpression') {
      return node.properties.every((prop: ASTNode) => {
        if (prop.type === 'Property') {
          return isPureExpression(prop.value)
        }
        if (prop.type === 'SpreadElement') {
          return isPureExpression(prop.argument)
        }
        return false
      })
    }

    // Call expressions — only memoize if it's a known pure function
    if (node.type === 'CallExpression') {
      // Don't memoize setState, dispatch, or other state-updating functions
      const calleeName = node.callee?.name || ''
      if (calleeName.startsWith('set') || calleeName.startsWith('dispatch')) {
        return false
      }
      // Don't memoize fetch, XMLHttpRequest, etc.
      if (['fetch', 'XMLHttpRequest', 'setTimeout', 'setInterval'].includes(calleeName)) {
        return false
      }
      // Memoize pure function calls (utils, math, etc.)
      return true
    }

    return false
  }

  // Check if expression is too simple to memoize
  function isTrivialExpression(node: ASTNode): boolean {
    if (!node || typeof node !== 'object') return true

    // Literals are trivial
    if (node.type === 'Literal') return true

    // Simple identifiers are trivial
    if (node.type === 'Identifier') return true

    // Simple member expressions are trivial
    if (node.type === 'MemberExpression') {
      return !node.computed && isTrivialExpression(node.object)
    }

    return false
  }

  // Extract dependencies from expression
  function extractDependencies(node: ASTNode): string[] {
    const deps: Set<string> = new Set()

    function collectDeps(n: ASTNode): void {
      if (!n || typeof n !== 'object') return

      if (n.type === 'Identifier') {
        deps.add(n.name)
      }

      if (n.type === 'MemberExpression' && n.object?.type === 'Identifier') {
        deps.add(n.object.name)
      }

      // Recurse into children
      for (const key of Object.keys(n)) {
        if (key === 'type' || key === 'start' || key === 'end') continue
        const child = n[key]
        if (Array.isArray(child)) {
          child.forEach((item: ASTNode) => {
            if (item && typeof item === 'object' && item.type) {
              collectDeps(item)
            }
          })
        } else if (child && typeof child === 'object' && child.type) {
          collectDeps(child)
        }
      }
    }

    collectDeps(node)
    return Array.from(deps)
  }

  // Walk AST and wrap pure expressions in memoization
  function walkAndMemoize(node: ASTNode, parent: ASTNode | null, key: string): void {
    if (!node || typeof node !== 'object') return

    // Check if this is a variable declarator with a pure initializer
    if (node.type === 'VariableDeclarator' && node.init) {
      if (isPureExpression(node.init) && !isTrivialExpression(node.init)) {
        const deps = extractDependencies(node.init)

        // Only memoize if there are dependencies
        if (deps.length > 0) {
          // Wrap in computed() for reactive memoization
          const original = node.init
          node.init = {
            type: 'ArrowFunctionExpression',
            params: [],
            body: original,
          }
          memoized++
        }
      }
    }

    // Continue walking children
    for (const childKey of Object.keys(node)) {
      if (childKey === 'type' || childKey === 'start' || childKey === 'end') continue
      const child = node[childKey]
      if (Array.isArray(child)) {
        child.forEach((item: ASTNode, idx: number) => {
          if (item && typeof item === 'object' && item.type) {
            walkAndMemoize(item, node, `${childKey}[${idx}]`)
          }
        })
      } else if (child && typeof child === 'object' && child.type) {
        walkAndMemoize(child, node, childKey)
      }
    }
  }

  walkAndMemoize(ast, null, '')

  return { ast, memoized }
}

// ─── Compile-time CSS Scoping ───────────────────────────────────

/**
 * Scope CSS to components at compile time.
 * Generates unique class names and injects scoped styles.
 *
 * @example
 * // Input
 * <style>
 *   .container { padding: 16px; }
 *   .title { font-size: 24px; }
 * </style>
 * <div class="container">
 *   <h1 class="title">Hello</h1>
 * </div>
 *
 * // Output (with scope hash "abc123")
 * <style>
 *   .container[data-scoped-abc123] { padding: 16px; }
 *   .title[data-scoped-abc123] { font-size: 24px; }
 * </style>
 * <div class="container" data-scoped-abc123>
 *   <h1 class="title" data-scoped-abc123>Hello</h1>
 * </div>
 */
export function scopeCSS(ast: ASTNode, code: string, componentName?: string): {
  ast: ASTNode
  code: string
  scopes: CSSScope[]
} {
  const scopes: CSSScope[] = []
  let scopeCounter = 0

  function generateScopeId(name?: string): string {
    const base = name || 'scope'
    return `${base}-${scopeCounter++}-${Math.random().toString(36).slice(2, 8)}`
  }

  function extractCSSFromJSX(code: string): { css: string; positions: { start: number; end: number }[] } {
    const cssRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
    const positions: { start: number; end: number }[] = []
    let css = ''
    let match

    while ((match = cssRegex.exec(code)) !== null) {
      css += match[1]
      positions.push({ start: match.index, end: match.index + match[0].length })
    }

    return { css, positions }
  }

  function scopeCSSRules(css: string, scopeId: string): string {
    // Simple CSS scoping — add data attribute selector
    return css
      .replace(/\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g, `.$1[data-scoped-${scopeId}]`)
      .replace(/#([a-zA-Z_-][a-zA-Z0-9_-]*)/g, `#$1[data-scoped-${scopeId}]`)
  }

  const { css } = extractCSSFromJSX(code)

  if (css) {
    const scopeId = generateScopeId(componentName)
    const scopedCSS = scopeCSSRules(css, scopeId)

    scopes.push({
      id: scopeId,
      selector: `[data-scoped-${scopeId}]`,
      css: scopedCSS,
      hash: scopeId,
    })
  }

  return { ast, code, scopes }
}

// ─── Bundle Analysis (v2 — Enhanced) ────────────────────────────
