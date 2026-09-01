// Flint Compiler — JSX Transformer
// Transforms JSX AST into Flint runtime calls
//
// Transformations:
//   <div>...</div>          → h("div", null, ...)
//   <div class="x">...</div> → h("div", { class: "x" }, ...)
//   <Comp prop={v} />       → h(Comp, { prop: v })
//   <div>{expr}</div>       → h("div", null, expr)

import type * as acorn from 'acorn'

export interface TransformOptions {
  filename?: string
  dev?: boolean
}

export interface TransformResult {
  code: string
  ast: acorn.Node
}

// ─── AST Walker ─────────────────────────────────────────────────

interface WalkContext {
  enter(node: acorn.Node, parent: acorn.Node | null): void | false
  leave(node: acorn.Node, parent: acorn.Node | null): void
}

function walk(node: any, parent: any, ctx: WalkContext): void {
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

function getNodeKeys(node: any): string[] {
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

function generate(node: any, code: string): string {
  if (!node || typeof node !== 'object') return ''
  if (!node.type) return ''

  const start = node.start ?? 0
  const end = node.end ?? code.length

  switch (node.type) {
    case 'JSXElement':
      return generateJSXElement(node, code)
    case 'JSXFragment':
      return generateJSXFragment(node, code)
    default:
      return code.slice(start, end)
  }
}

function generateJSXElement(node: any, code: string): string {
  const tag = getJSXTagName(node.openingElement.name, code)
  const attrs = generateJSXAttributes(node.openingElement.attributes, code)
  const children = generateJSXChildren(node.children, code)

  const isComponent = isJSXComponent(node.openingElement.name)

  let result = `h(${tag}, ${attrs}`
  if (children) {
    result += `, ${children}`
  }
  result += ')'

  return result
}

function generateJSXFragment(node: any, code: string): string {
  const children = generateJSXChildren(node.children, code)
  let result = 'h(null'
  if (children) {
    result += `, ${children}`
  }
  result += ')'
  return result
}

function getJSXTagName(name: any, code: string): string {
  if (name.type === 'JSXIdentifier') {
    return isJSXComponent(name) ? name.name : `"${name.name}"`
  }
  if (name.type === 'JSXMemberExpression') {
    return `${getJSXTagName(name.object, code)}.${name.property.name}`
  }
  return code.slice(name.start, name.end)
}

function isJSXComponent(name: any): boolean {
  if (name.type === 'JSXIdentifier') {
    // Components start with uppercase
    return name.name[0] === name.name[0].toUpperCase()
  }
  return name.type === 'JSXMemberExpression'
}

function generateJSXAttributes(attributes: any[], code: string): string {
  if (!attributes || attributes.length === 0) return 'null'

  const props: string[] = []
  let hasSpread = false

  for (const attr of attributes) {
    if (attr.type === 'JSXSpreadAttribute') {
      hasSpread = true
      const arg = generate(attr.argument, code)
      if (props.length > 0) {
        props.push(`...__flint_merge(${arg})`)
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

function generateJSXChildren(children: any[], code: string): string {
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
        parts.push(generate(child.expression, code))
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

export function transform(ast: any, code: string, options: TransformOptions = {}): TransformResult {
  const hImport = `import { h } from 'flint'`
  const imports: string[] = []
  let hasFlintImport = false
  let hasJSX = false

  // First pass: detect JSX and check for existing flint imports
  walk(ast, null, {
    enter(node) {
      if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
        hasJSX = true
      }
      if (node.type === 'ImportDeclaration' && (node as any).source?.value === 'flint') {
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

  return { code: transformedCode, ast }
}
