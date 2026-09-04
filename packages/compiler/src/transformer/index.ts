// Flint Compiler — JSX Transformer v3
// Transforms JSX AST into Flint runtime calls with fine-grained reactivity
// Supports source maps for debugging
//
// Transformations:
//   <div>...</div>          → h("div", null, ...)
//   <div class="x">...</div> → h("div", { class: "x" }, ...)
//   <Comp prop={v} />       → h(Comp, { prop: v })
//   <div>{expr}</div>       → h("div", null, track(() => expr))
//   <div onClick={fn}>      → h("div", { onClick: trackEvent(fn) })

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
}

export interface TransformResult {
  code: string
  ast: ASTNode
  map?: SourceMap
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
  private currentLine = 1
  private currentColumn = 0
  private sourceIndex = 0
  private originalLine = 1
  private originalColumn = 0

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

  setSourceContent(sourceIndex: number, content: string | null): void {
    this.sourcesContent[sourceIndex] = content
  }

  generate(): SourceMap {
    // Encode mappings using VLQ encoding
    const encodedMappings = this.encodeMappings()

    return {
      version: 3,
      file: 'output.js',
      sources: this.sources,
      sourcesContent: this.sourcesContent,
      names: this.names,
      mappings: encodedMappings,
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
        keys.push('argument')
        break
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
        keys.push('test', 'body')
        break
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

function generate(node: ASTNode | null | undefined, code: string, options?: { inJSXExpression?: boolean }): string {
  if (!node || typeof node !== 'object') return ''
  if (!node.type) return ''

  const start = node.start ?? 0
  const end = node.end ?? code.length

  switch (node.type) {
    case 'JSXElement':
      return generateJSXElement(node as JSXElement, code)
    case 'JSXFragment':
      return generateJSXFragment(node as JSXFragment, code)
    default:
      return code.slice(start, end)
  }
}

function isLikelyReactive(exprNode: ASTNode | null | undefined, code: string): boolean {
  if (!exprNode || typeof exprNode !== 'object') return false

  // Function calls are likely reactive (signal reads)
  if (exprNode.type === 'CallExpression') return true
  // Member expressions like state.value
  if (exprNode.type === 'MemberExpression') return true
  // Identifier references (could be a signal)
  if (exprNode.type === 'Identifier') return true
  // Binary/logical expressions with reactive parts
  if (exprNode.type === 'BinaryExpression' || exprNode.type === 'LogicalExpression') {
    return isLikelyReactive(exprNode.left, code) || isLikelyReactive(exprNode.right, code)
  }
  // Conditional expressions
  if (exprNode.type === 'ConditionalExpression') {
    return isLikelyReactive(exprNode.consequent, code) || isLikelyReactive(exprNode.alternate, code)
  }
  // Template literals
  if (exprNode.type === 'TemplateLiteral') {
    return exprNode.expressions.some((e: ASTNode) => isLikelyReactive(e, code))
  }
  // Arrow functions and function expressions are NOT reactive (they create new closures)
  if (exprNode.type === 'ArrowFunctionExpression' || exprNode.type === 'FunctionExpression') {
    return false
  }
  // Assignment expressions
  if (exprNode.type === 'AssignmentExpression') return true

  return false
}

function generateJSXElement(node: JSXElement, code: string): string {
  const tag = getJSXTagName(node.openingElement.name, code)
  const isComponent = isJSXComponent(node.openingElement.name)

  // Separate static vs reactive attributes
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

  // For DOM elements (not components), add reactive tracking calls after h()
  if (!isComponent && reactiveCalls.length > 0) {
    // Wrap in IIFE to capture element reference
    result = `(() => { const __el = ${result}; ${reactiveCalls.map(c => c.replace('__el', '__el')).join('; ')}; return __el })()`
  }

  return result
}

/**
 * Separate attributes into static (can go in props object) and reactive (need trackAttribute/trackEvent calls).
 */
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
        // Boolean attribute: <div disabled />
        staticProps.push(`${name}: true`)
      } else if (attr.value.type === 'Literal') {
        // Static string: <div class="x" />
        staticProps.push(`${name}: ${JSON.stringify(attr.value.value)}`)
      } else if (attr.value.type === 'JSXExpressionContainer') {
        const expr = generate(attr.value.expression, code)
        const isReactive = isLikelyReactive(attr.value.expression, code)

        // For components, always pass as prop (components handle their own reactivity)
        if (isComponent) {
          staticProps.push(`${name}: ${expr}`)
        } else if (isReactive) {
          // For DOM elements with reactive expressions:
          // Event handlers → trackEvent()
          // Other attributes → trackAttribute()
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
          // Static expression — put in props object
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
    // Components start with uppercase
    return name.name[0] === name.name[0].toUpperCase()
  }
  return name.type === 'JSXMemberExpression'
}

function generateJSXAttributes(attributes: (JSXAttribute | JSXSpreadAttribute)[], code: string): string {
  if (!attributes || attributes.length === 0) return 'null'

  const props: string[] = []
  let hasSpread = false

  for (const attr of attributes) {
    if (attr.type === 'JSXSpreadAttribute') {
      hasSpread = true
      const arg = generate(attr.argument, code)
      if (props.length > 0) {
        props.push(`...(${arg} || {})`)
      } else {
        props.push(`...${arg}`)
      }
    } else if (attr.type === 'JSXAttribute') {
      const name = attr.name.name
      if (attr.value === null) {
        // Boolean attribute: <div disabled />
        props.push(`${name}: true`)
      } else if (attr.value.type === 'JSXExpressionContainer') {
        const expr = generate(attr.value.expression, code)
        props.push(`${name}: ${expr}`)
      } else if (attr.value.type === 'Literal') {
        props.push(`${name}: ${JSON.stringify(attr.value.value)}`)
      }
    }
  }

  if (props.length === 0) return 'null'
  if (hasSpread && props.length > 1) {
    return `{ ${props.join(', ')} }`
  }
  return `{ ${props.join(', ')} }`
}

function generateJSXChildren(children: ASTNode[], code: string): string {
  if (!children || children.length === 0) return ''

  const parts: string[] = []

  for (const child of children) {
    if (child.type === 'JSXText') {
      const text = child.value
        .replace(/\n\s*/g, ' ')
        .trim()
      if (text) {
        parts.push(JSON.stringify(text))
      }
    } else if (child.type === 'JSXExpressionContainer') {
      if (child.expression.type !== 'JSXEmptyExpression') {
        const expr = generate(child.expression, code)
        // Wrap reactive expressions in track() for fine-grained DOM updates
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

// ─── Transformer ────────────────────────────────────────────────

export function transform(ast: ASTNode, code: string, options: TransformOptions = {}): TransformResult {
  const hImport = `import { h, track, trackAttribute, trackEvent } from 'flint'`
  const imports: string[] = []
  let hasFlintImport = false
  let hasJSX = false
  let needsTrack = false

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
    // No JSX, return original code
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

  // Add h import if needed
  if (hasJSX && !hasFlintImport) {
    transformedCode = hImport + '\n' + transformedCode
  }

  // Generate source map if requested
  let sourceMap: SourceMap | undefined
  if (options.sourceMaps !== false) {
    const generator = new SourceMapGenerator(code, options.filename)

    // Add mappings for each JSX transformation
    for (const r of replacements) {
      // Map generated positions back to original
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

  return { code: transformedCode, ast, map: sourceMap }
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
