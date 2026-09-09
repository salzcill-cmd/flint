// Flint Compiler — JSX Transformer v4
// Transforms JSX AST into Flint runtime calls with fine-grained reactivity
// Supports source maps, auto-imports, and simplified syntax

import type * as acorn from 'acorn'

// ─── AST Node Types ─────────────────────────────────────────────

interface ASTNode {
  type: string
  start: number
  end: number
  [key: string]: any
}

interface JSXElement extends ASTNode {
  type: 'JSXElement'
  openingElement: JSXOpeningElement
  closingElement: JSXClosingElement | null
  children: ASTNode[]
}

interface JSXOpeningElement extends ASTNode {
  type: 'JSXOpeningElement'
  name: JSXTagName
  attributes: (JSXAttribute | JSXSpreadAttribute)[]
  selfClosing: boolean
}

interface JSXClosingElement extends ASTNode {
  type: 'JSXClosingElement'
  name: JSXTagName
}

interface JSXAttribute extends ASTNode {
  type: 'JSXAttribute'
  name: JSXIdentifier
  value: ASTNode | null
}

interface JSXSpreadAttribute extends ASTNode {
  type: 'JSXSpreadAttribute'
  argument: ASTNode
}

interface JSXIdentifier extends ASTNode {
  type: 'JSXIdentifier'
  name: string
}

interface JSXMemberExpression extends ASTNode {
  type: 'JSXMemberExpression'
  object: JSXIdentifier | JSXMemberExpression
  property: JSXIdentifier
}

interface JSXNamespacedName extends ASTNode {
  type: 'JSXNamespacedName'
  namespace: JSXIdentifier
  name: JSXIdentifier
}

type JSXTagName = JSXIdentifier | JSXMemberExpression | JSXNamespacedName

interface JSXText extends ASTNode {
  type: 'JSXText'
  value: string
  raw: string
}

interface JSXExpressionContainer extends ASTNode {
  type: 'JSXExpressionContainer'
  expression: ASTNode
}

interface JSXFragment extends ASTNode {
  type: 'JSXFragment'
  openingFragment: JSXOpeningFragment
  closingFragment: JSXClosingFragment
  children: ASTNode[]
}

interface JSXOpeningFragment extends ASTNode {
  type: 'JSXOpeningFragment'
}

interface JSXClosingFragment extends ASTNode {
  type: 'JSXClosingFragment'
}

export interface TransformOptions {
  filename?: string
  dev?: boolean
  sourceMaps?: boolean
  /** Auto-import flint functions (default: true) */
  autoImport?: boolean
}

export interface TransformResult {
  code: string
  ast: ASTNode
  map?: SourceMap
  /** List of auto-imported symbols */
  imports?: string[]
}

export interface SourceMap {
  version: 3
  file?: string
  sourceRoot?: string
  sources: string[]
  sourcesContent?: (string | null)[]
  names: string[]
  mappings: string
}

// ─── Source Map Generator ────────────────────────────────────────

class SourceMapGenerator {
  private mappings: number[][] = []
  private names: string[] = []
  private sources: string[] = []
  private sourcesContent: (string | null)[] = []

  constructor(source?: string, filename?: string) {
    if (source) {
      this.sources.push(filename || 'input.jsx')
      this.sourcesContent.push(source)
    }
  }

  addMapping(
    generatedLine: number,
    generatedColumn: number,
    originalLine: number,
    originalColumn: number,
    sourceIndex: number = 0
  ): void {
    this.mappings.push([
      generatedColumn,
      sourceIndex,
      originalLine - 1,
      originalColumn,
    ])
  }

  generate(): SourceMap {
    return {
      version: 3,
      file: 'output.js',
      sources: this.sources,
      sourcesContent: this.sourcesContent,
      names: this.names,
      mappings: this.encodeMappings(),
    }
  }

  private encodeMappings(): string {
    if (this.mappings.length === 0) return ''

    const lines: string[][] = []
    let lastGeneratedColumn = 0
    let lastSourceIndex = 0
    let lastOriginalLine = 0
    let lastOriginalColumn = 0

    for (const mapping of this.mappings) {
      const [generatedCol, sourceIdx, origLine, origCol] = mapping

      const encoded = this.encodeVLQ(generatedCol - lastGeneratedColumn)
      encoded.push(...this.encodeVLQ(sourceIdx - lastSourceIndex))
      encoded.push(...this.encodeVLQ(origLine - lastOriginalLine))
      encoded.push(...this.encodeVLQ(origCol - lastOriginalColumn))

      lines.push(encoded)

      lastGeneratedColumn = generatedCol
      lastSourceIndex = sourceIdx
      lastOriginalLine = origLine
      lastOriginalColumn = origCol
    }

    return lines.map(line => line.join('')).join(';')
  }

  private encodeVLQ(value: number): string[] {
    const result: string[] = []
    let vlq = (value < 0 ? (-value << 1) | 1 : value << 1)

    while (vlq > 31) {
      result.push(this.encodeBase64(vlq & 31 | 32))
      vlq >>= 5
    }

    result.push(this.encodeBase64(vlq & 31))
    return result
  }

  private encodeBase64(value: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
    return chars[value] || ''
  }
}

// ─── AST Walker ─────────────────────────────────────────────────

interface WalkContext {
  enter(node: ASTNode, parent: ASTNode | null): void | false
  leave(node: ASTNode, parent: ASTNode | null): void
}

function walk(node: ASTNode | null | undefined, parent: ASTNode | null, ctx: WalkContext): void {
  if (!node || typeof node !== 'object') return
  if (node.type) {
    const skip = ctx.enter(node, parent)
    if (skip === false) return

    const keys = getNodeKeys(node)
    for (const key of keys) {
      const child = node[key]
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === 'object' && item.type) {
            walk(item, node, ctx)
          }
        }
      } else if (child && typeof child === 'object' && child.type) {
        walk(child, node, ctx)
      }
    }

    ctx.leave(node, parent)
  }
}

function getNodeKeys(node: ASTNode): string[] {
  const keys: string[] = []
  if (node.type) {
    switch (node.type) {
      case 'Program':
      case 'BlockStatement':
        keys.push('body')
        break
      case 'ExpressionStatement':
        keys.push('expression')
        break
      case 'CallExpression':
        keys.push('callee', 'arguments')
        break
      case 'MemberExpression':
        keys.push('object', 'property')
        break
      case 'BinaryExpression':
      case 'LogicalExpression':
        keys.push('left', 'right')
        break
      case 'UnaryExpression':
      case 'UpdateExpression':
        keys.push('argument')
        break
      case 'AssignmentExpression':
        keys.push('left', 'right')
        break
      case 'ConditionalExpression':
        keys.push('test', 'consequent', 'alternate')
        break
      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        keys.push('params', 'body')
        break
      case 'FunctionDeclaration':
        keys.push('id', 'params', 'body')
        break
      case 'VariableDeclaration':
        keys.push('declarations')
        break
      case 'VariableDeclarator':
        keys.push('id', 'init')
        break
      case 'Identifier':
      case 'Literal':
      case 'ThisExpression':
      case 'Super':
        break
      case 'Property':
        keys.push('key', 'value')
        break
      case 'ObjectExpression':
        keys.push('properties')
        break
      case 'ArrayExpression':
        keys.push('elements')
        break
      case 'SpreadElement':
        keys.push('argument')
        break
      case 'TemplateLiteral':
        keys.push('quasis', 'expressions')
        break
      case 'TemplateElement':
        break
      case 'TaggedTemplateExpression':
        keys.push('tag', 'quasi')
        break
      case 'SequenceExpression':
        keys.push('expressions')
        break
      case 'ImportDeclaration':
        keys.push('specifiers', 'source')
        break
      case 'ImportSpecifier':
      case 'ImportDefaultSpecifier':
      case 'ImportNamespaceSpecifier':
        keys.push('imported', 'local')
        break
      case 'ExportNamedDeclaration':
        keys.push('declaration', 'specifiers', 'source')
        break
      case 'ExportDefaultDeclaration':
        keys.push('declaration')
        break
      case 'ExportAllDeclaration':
        keys.push('source')
        break
      case 'ReturnStatement':
        keys.push('argument')
        break
      case 'IfStatement':
        keys.push('test', 'consequent', 'alternate')
        break
      case 'ForStatement':
        keys.push('init', 'test', 'update', 'body')
        break
      case 'WhileStatement':
      case 'DoWhileStatement':
        keys.push('test', 'body')
        break
      case 'ForInStatement':
      case 'ForOfStatement':
        keys.push('left', 'right', 'body')
        break
      case 'TryStatement':
        keys.push('block', 'handler', 'finalizer')
        break
      case 'CatchClause':
        keys.push('param', 'body')
        break
      case 'ThrowStatement':
        keys.push('argument')
        break
      case 'NewExpression':
        keys.push('callee', 'arguments')
        break
      case 'AwaitExpression':
      case 'YieldExpression':
        keys.push('argument')
        break
      case 'ClassDeclaration':
      case 'ClassExpression':
        keys.push('id', 'superClass', 'body')
        break
      case 'ClassBody':
        keys.push('body')
        break
      case 'MethodDefinition':
      case 'PropertyDefinition':
        keys.push('key', 'value')
        break
      // JSX types
      case 'JSXElement':
        keys.push('openingElement', 'children', 'closingElement')
        break
      case 'JSXOpeningElement':
        keys.push('name', 'attributes')
        break
      case 'JSXClosingElement':
        keys.push('name')
        break
      case 'JSXAttribute':
        keys.push('name', 'value')
        break
      case 'JSXSpreadAttribute':
        keys.push('argument')
        break
      case 'JSXIdentifier':
        break
      case 'JSXMemberExpression':
        keys.push('object', 'property')
        break
      case 'JSXText':
        break
      case 'JSXExpressionContainer':
        keys.push('expression')
        break
      case 'JSXFragment':
        keys.push('openingFragment', 'children', 'closingFragment')
        break
      case 'JSXOpeningFragment':
      case 'JSXClosingFragment':
        break
      case 'JSXEmptyExpression':
        break
    }
  }
  return keys
}

// ─── Code Generator ─────────────────────────────────────────────

function generate(node: ASTNode | null | undefined, code: string): string {
  if (!node || typeof node !== 'object') return ''
  if (!node.type) return ''

  switch (node.type) {
    case 'JSXElement':
      return generateJSXElement(node as JSXElement, code)
    case 'JSXFragment':
      return generateJSXFragment(node as JSXFragment, code)
    default:
      return code.slice(node.start ?? 0, node.end ?? code.length)
  }
}

function isLikelyReactive(exprNode: ASTNode | null | undefined, code: string): boolean {
  if (!exprNode || typeof exprNode !== 'object') return false

  if (exprNode.type === 'CallExpression') return true
  if (exprNode.type === 'MemberExpression') return true
  if (exprNode.type === 'Identifier') return true
  if (exprNode.type === 'BinaryExpression' || exprNode.type === 'LogicalExpression') {
    return isLikelyReactive(exprNode.left, code) || isLikelyReactive(exprNode.right, code)
  }
  if (exprNode.type === 'ConditionalExpression') {
    return isLikelyReactive(exprNode.consequent, code) || isLikelyReactive(exprNode.alternate, code)
  }
  if (exprNode.type === 'TemplateLiteral') {
    return exprNode.expressions.some((e: ASTNode) => isLikelyReactive(e, code))
  }
  if (exprNode.type === 'ArrowFunctionExpression' || exprNode.type === 'FunctionExpression') {
    return false
  }
  if (exprNode.type === 'AssignmentExpression') return true

  return false
}

function generateJSXElement(node: JSXElement, code: string): string {
  const tag = getJSXTagName(node.openingElement.name, code)
  const isComponent = isJSXComponent(node.openingElement.name)

  const { staticProps, reactiveCalls } = separateAttributes(
    node.openingElement.attributes,
    code,
    isComponent
  )

  const children = generateJSXChildren(node.children, code)

  const attrs = staticProps.length > 0
    ? `{ ${staticProps.join(', ')} }`
    : 'null'

  let result = `h(${tag}, ${attrs}`
  if (children) {
    result += `, ${children}`
  }
  result += ')'

  // For DOM elements, add reactive tracking calls after h()
  if (!isComponent && reactiveCalls.length > 0) {
    result = `(() => { const __el = ${result}; ${reactiveCalls.join('; ')}; return __el })()`
  }

  return result
}

function separateAttributes(
  attributes: (JSXAttribute | JSXSpreadAttribute)[],
  code: string,
  isComponent: boolean
): { staticProps: string[]; reactiveCalls: string[] } {
  const staticProps: string[] = []
  const reactiveCalls: string[] = []

  if (!attributes || attributes.length === 0) {
    return { staticProps, reactiveCalls }
  }

  for (const attr of attributes) {
    if (attr.type === 'JSXSpreadAttribute') {
      const arg = generate(attr.argument, code)
      staticProps.push(`...(${arg} || {})`)
    } else if (attr.type === 'JSXAttribute') {
      const name = attr.name.name

      if (attr.value === null) {
        staticProps.push(`${name}: true`)
      } else if (attr.value.type === 'Literal') {
        staticProps.push(`${name}: ${JSON.stringify(attr.value.value)}`)
      } else if (attr.value.type === 'JSXExpressionContainer') {
        const expr = generate(attr.value.expression, code)
        const isReactive = isLikelyReactive(attr.value.expression, code)

        if (isComponent) {
          staticProps.push(`${name}: ${expr}`)
        } else if (isReactive) {
          if (/^on[A-Z]/.test(name)) {
            const eventName = name.slice(2).toLowerCase()
            reactiveCalls.push(
              `trackEvent(__el, '${eventName}', () => ${expr})`
            )
          } else {
            reactiveCalls.push(
              `trackAttribute(__el, '${name}', () => ${expr})`
            )
          }
        } else {
          staticProps.push(`${name}: ${expr}`)
        }
      }
    }
  }

  return { staticProps, reactiveCalls }
}

function generateJSXFragment(node: JSXFragment, code: string): string {
  const children = generateJSXChildren(node.children, code)
  let result = 'h(null'
  if (children) {
    result += `, ${children}`
  }
  result += ')'
  return result
}

function getJSXTagName(name: JSXTagName, code: string): string {
  if (name.type === 'JSXIdentifier') {
    return isJSXComponent(name) ? name.name : `"${name.name}"`
  }
  if (name.type === 'JSXMemberExpression') {
    return `${getJSXTagName(name.object, code)}.${name.property.name}`
  }
  return code.slice(name.start, name.end)
}

function isJSXComponent(name: JSXTagName): boolean {
  if (name.type === 'JSXIdentifier') {
    return name.name[0] === name.name[0].toUpperCase()
  }
  return name.type === 'JSXMemberExpression'
}

function generateJSXChildren(children: ASTNode[], code: string): string {
  if (!children || children.length === 0) return ''

  const parts: string[] = []

  for (const child of children) {
    if (child.type === 'JSXText') {
      const text = child.value.replace(/\n\s*/g, ' ').trim()
      if (text) {
        parts.push(JSON.stringify(text))
      }
    } else if (child.type === 'JSXExpressionContainer') {
      if (child.expression.type !== 'JSXEmptyExpression') {
        const expr = generate(child.expression, code)
        if (isLikelyReactive(child.expression, code)) {
          parts.push(`track(() => ${expr})`)
        } else {
          parts.push(expr)
        }
      }
    } else if (child.type === 'JSXElement' || child.type === 'JSXFragment') {
      parts.push(generate(child, code))
    }
  }

  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  return `[${parts.join(', ')}]`
}

// ─── Auto-Import Detection ──────────────────────────────────────

const FLINT_SYMBOLS = [
  'state', 'computed', 'effect', 'watch', 'batch', 'flushSync',
  'reactive', 'model', 'bind', 'createRef', 'shallowRef', 'derive',
  'signals', 'poll', 'watchDebounced', 'watchThrottled',
  'Show', 'For', 'ForEach', 'Index', 'Switch', 'Match',
  'Portal', 'Suspense', 'ErrorBoundary', 'Activity', 'KeepAlive',
  'memo', 'lazy', 'createMemo', 'createEffect', 'trackPromise',
  'ref', 'useSignal', 'cn', 'createStyles', 'cx',
  'onMount', 'onUpdate', 'onDestroy',
  'render', 'h', 'track', 'trackAttribute', 'trackEvent',
  'createRouter', 'navigate', 'Link', 'Outlet',
  'createForm', 'validators',
  'useTransition', 'useDeferredValue', 'useId',
  'useOptimistic', 'useOptimisticAction',
  'useEffectEvent', 'useEffectEventDebounced', 'useEffectEventThrottled',
  'useFocusTrap', 'useKeyboard', 'useAriaLive', 'useReducedMotion',
  'useSEO', 'useStructuredData',
  'preload', 'preinit', 'prefetchDNS', 'preconnect',
  'escapeHtml', 'sanitizeInput', 'safeUrl',
  'createServerAction', 'createServerComponent',
  // Data fetching
  '$api', '$http', '$query', '$mutation', '$fetch', '$submit',
  // Beginner-friendly DX helpers
  '$form', '$load', '$modal', '$toast', '$storage',
  '$debounce', '$throttle', '$time', '$ref', '$refCallback', '$reactive',
  '$store', '$model', '$computed', '$effect', '$watch', '$event',
  '$class', '$style', '$if', '$map', '$await', '$immerStore',
  '$log', '$inspect', '$perf', 'component', 'memo',
  'hc',
  // Enterprise features
  'createI18n', 'formatNumber', 'formatRelativeTime',
  'sanitizeInput', 'isSafeUrl', 'generateCSP', 'generateCSRFToken',
]

function detectUsedSymbols(code: string): string[] {
  const used: string[] = []
  for (const sym of FLINT_SYMBOLS) {
    // Check if symbol is used as identifier (word boundary)
    const regex = new RegExp(`\\b${sym}\\b`)
    if (regex.test(code)) {
      used.push(sym)
    }
  }
  return used
}

function detectExistingImports(code: string): Set<string> {
  const imported = new Set<string>()
  const regex = /import\s+{([^}]+)}\s+from\s+['"][^'"]+['"]/g
  let match
  while ((match = regex.exec(code)) !== null) {
    const specs = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim())
    for (const spec of specs) {
      if (spec) imported.add(spec)
    }
  }
  return imported
}

// ─── Transformer ────────────────────────────────────────────────

export function transform(ast: ASTNode, code: string, options: TransformOptions = {}): TransformResult {
  const hImport = `import { h, track, trackAttribute, trackEvent } from 'flint'`
  const imports: string[] = []
  let hasFlintImport = false
  let hasJSX = false

  // First pass: detect JSX and check for existing flint imports
  walk(ast, null, {
    enter(node) {
      if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
        hasJSX = true
      }
      if (node.type === 'ImportDeclaration' && node.source?.value === 'flint') {
        hasFlintImport = true
      }
    },
    leave() {},
  })

  if (!hasJSX) {
    return { code, ast }
  }

  // Second pass: transform JSX in-place
  let transformedCode = code
  const replacements: { start: number; end: number; replacement: string }[] = []

  walk(ast, null, {
    enter(node, parent) {
      if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
        const replacement = generate(node, code)
        replacements.push({
          start: node.start,
          end: node.end,
          replacement,
        })
      }
    },
    leave() {},
  })

  // Apply replacements in reverse order to maintain positions
  for (let i = replacements.length - 1; i >= 0; i--) {
    const r = replacements[i]
    transformedCode = transformedCode.slice(0, r.start) + r.replacement + transformedCode.slice(r.end)
  }

  // Auto-import flint symbols if enabled
  if (options.autoImport !== false && hasJSX && !hasFlintImport) {
    const usedSymbols = detectUsedSymbols(transformedCode)
    const existingImports = detectExistingImports(transformedCode)

    // Core h/track imports always needed
    const coreImports = ['h', 'track', 'trackAttribute', 'trackEvent']
    const additionalImports = usedSymbols.filter(s => !coreImports.includes(s) && !existingImports.has(s))

    if (additionalImports.length > 0) {
      transformedCode = `import { ${coreImports.join(', ')}, ${additionalImports.join(', ')} } from 'flint'\n` + transformedCode
      imports.push(...coreImports, ...additionalImports)
    } else {
      transformedCode = hImport + '\n' + transformedCode
      imports.push(...coreImports)
    }
  } else if (hasJSX && !hasFlintImport) {
    transformedCode = hImport + '\n' + transformedCode
    imports.push('h', 'track', 'trackAttribute', 'trackEvent')
  }

  // Generate source map if requested
  let sourceMap: SourceMap | undefined
  if (options.sourceMaps !== false) {
    const generator = new SourceMapGenerator(code, options.filename)

    for (const r of replacements) {
      const originalStart = getOriginalPosition(code, r.start)
      const generatedLine = transformedCode.slice(0, transformedCode.indexOf(r.replacement)).split('\n').length
      const generatedColumn = transformedCode.indexOf(r.replacement) % (transformedCode.split('\n')[generatedLine - 1]?.length || 1)

      generator.addMapping(
        generatedLine,
        generatedColumn,
        originalStart.line,
        originalStart.column
      )
    }

    sourceMap = generator.generate()
  }

  return { code: transformedCode, ast, map: sourceMap, imports }
}

function getOriginalPosition(code: string, offset: number): { line: number; column: number } {
  let line = 1
  let column = 0
  for (let i = 0; i < offset && i < code.length; i++) {
    if (code[i] === '\n') {
      line++
      column = 0
    } else {
      column++
    }
  }
  return { line, column }
}
