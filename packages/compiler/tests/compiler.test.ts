import { describe, it, expect } from 'vitest'
import { parse } from '../src/parser/index.js'
import { transform } from '../src/transformer/index.js'

describe('Parser', () => {
  it('parses simple JavaScript', () => {
    const code = 'const x = 1'
    const { ast } = parse(code)
    expect(ast.type).toBe('Program')
  })

  it('parses JSX', () => {
    const code = 'const el = <div>Hello</div>'
    const { ast } = parse(code)
    expect(ast.type).toBe('Program')
  })

  it('parses JSX with attributes', () => {
    const code = 'const el = <div class="foo" id="bar">Content</div>'
    const { ast } = parse(code)
    expect(ast.type).toBe('Program')
  })

  it('parses JSX expression container', () => {
    const code = 'const el = <div>{count}</div>'
    const { ast } = parse(code)
    expect(ast.type).toBe('Program')
  })

  it('parses component JSX', () => {
    const code = 'const el = <Greeting name="World" />'
    const { ast } = parse(code)
    expect(ast.type).toBe('Program')
  })
})

describe('Transformer', () => {
  it('transforms simple JSX element', () => {
    const code = 'const el = <div>Hello</div>'
    const { ast } = parse(code)
    const result = transform(ast, code)
    expect(result.code).toContain('h("div", null')
    expect(result.code).toContain('"Hello"')
  })

  it('transforms JSX with string attributes', () => {
    const code = 'const el = <div class="foo">Content</div>'
    const { ast } = parse(code)
    const result = transform(ast, code)
    expect(result.code).toContain('h("div", { class: "foo" }')
  })

  it('transforms JSX with expression attributes', () => {
    const code = 'const el = <div style={dynamicStyle}>Content</div>'
    const { ast } = parse(code)
    const result = transform(ast, code)
    // Reactive expressions use trackAttribute for fine-grained updates
    expect(result.code).toContain('trackAttribute')
    expect(result.code).toContain('dynamicStyle')
  })

  it('transforms JSX expression container', () => {
    const code = 'const el = <div>{count()}</div>'
    const { ast } = parse(code)
    const result = transform(ast, code)
    expect(result.code).toContain('h("div", null, track(() => count()))')
  })

  it('transforms component JSX', () => {
    const code = 'const el = <Greeting name="World" />'
    const { ast } = parse(code)
    const result = transform(ast, code)
    expect(result.code).toContain('h(Greeting, { name: "World" }')
  })

  it('transforms nested JSX', () => {
    const code = 'const el = <div><span>Text</span></div>'
    const { ast } = parse(code)
    const result = transform(ast, code)
    expect(result.code).toContain('h("div", null')
    expect(result.code).toContain('h("span", null')
  })

  it('transforms JSX with multiple children', () => {
    const code = 'const el = <div><span>A</span><span>B</span></div>'
    const { ast } = parse(code)
    const result = transform(ast, code)
    expect(result.code).toContain('h("div", null')
    expect(result.code).toContain('h("span", null')
  })

  it('transforms boolean attributes', () => {
    const code = 'const el = <input disabled />'
    const { ast } = parse(code)
    const result = transform(ast, code)
    expect(result.code).toContain('disabled: true')
  })

  it('adds h import automatically', () => {
    const code = 'const el = <div>Hello</div>'
    const { ast } = parse(code)
    const result = transform(ast, code)
    expect(result.code).toContain("import { h, track, trackAttribute, trackEvent } from 'flint'")
  })

  it('does not add duplicate h import', () => {
    const code = "import { h, state } from 'flint'\nconst el = <div>Hello</div>"
    const { ast } = parse(code)
    const result = transform(ast, code)
    const importCount = (result.code.match(/import.*from 'flint'/g) || []).length
    expect(importCount).toBe(1)
  })

  it('does not transform non-JSX code', () => {
    const code = 'const x = 1 + 2'
    const { ast } = parse(code)
    const result = transform(ast, code)
    expect(result.code).toBe(code)
  })
})
