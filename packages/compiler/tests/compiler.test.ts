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

describe('Bug Fixes — JSX Transformation', () => {
  it('Bug 1: does not duplicate last children with 3+ sibling elements', () => {
    const code = `function App() {
  return (
    <div>
      <ComponentA />
      <ComponentB />
      <ComponentC />
    </div>
  )
}`
    const { ast } = parse(code)
    const result = transform(ast, code)

    // Should NOT have duplicate h() calls for the same components
    const componentBCount = (result.code.match(/h\(ComponentB/g) || []).length
    const componentCCount = (result.code.match(/h\(ComponentC/g) || []).length
    expect(componentBCount).toBe(1)
    expect(componentCCount).toBe(1)

    // Should contain all three components inside the div
    expect(result.code).toContain('h(ComponentA')
    expect(result.code).toContain('h(ComponentB')
    expect(result.code).toContain('h(ComponentC')
  })

  it('Bug 1: does not duplicate with 4+ sibling elements', () => {
    const code = `function App() {
  return (
    <div>
      <A />
      <B />
      <C />
      <D />
    </div>
  )
}`
    const { ast } = parse(code)
    const result = transform(ast, code)

    // Each component should appear exactly once
    expect((result.code.match(/h\(A\b/g) || []).length).toBe(1)
    expect((result.code.match(/h\(B\b/g) || []).length).toBe(1)
    expect((result.code.match(/h\(C\b/g) || []).length).toBe(1)
    expect((result.code.match(/h\(D\b/g) || []).length).toBe(1)
  })

  it('Bug 2: handles .map() inside JSX correctly', () => {
    const code = `function Features() {
  return (
    <div>
      {features.map(f => (
        <div>{f.title}</div>
      ))}
    </div>
  )
}`
    const { ast } = parse(code)
    const result = transform(ast, code)

    // Should contain the .map() call
    expect(result.code).toContain('.map(')
    // Should NOT have broken syntax like ')(f) =>' outside the IIFE
    expect(result.code).not.toMatch(/\}\)\(f\)/)
    // Should contain the arrow function inside map
    expect(result.code).toMatch(/\(f\)\s*=>|f\s*=>/)
  })

  it('Bug 2: handles .map() with nested JSX correctly', () => {
    const code = `function List() {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  )
}`
    const { ast } = parse(code)
    const result = transform(ast, code)

    // Should contain .map() and transform the JSX inside
    expect(result.code).toContain('.map(')
    expect(result.code).toContain('h("li"')
    expect(result.code).toContain('item.name')
  })

  it('Bug 3: handles template literals with HTML-like content', () => {
    const code = 'const el = <pre>{`<div>Hello</div>`}</pre>'
    const { ast } = parse(code)
    const result = transform(ast, code)

    // Should transform to h("pre", null, `<div>Hello</div>`)
    expect(result.code).toContain('h("pre"')
    // The template literal should be preserved (not double-escaped or broken)
    expect(result.code).toContain('`<div>Hello</div>`')
  })

  it('Bug 3: handles template literals with expressions', () => {
    const code = 'const el = <pre>{`Count: ${count}`}</pre>'
    const { ast } = parse(code)
    const result = transform(ast, code)

    expect(result.code).toContain('h("pre"')
    expect(result.code).toContain('count')
  })

  it('deeply nested JSX does not cause duplication', () => {
    const code = `function App() {
  return (
    <div>
      <header>
        <h1>Title</h1>
        <p>Subtitle</p>
      </header>
      <main>
        <section>
          <h2>Section</h2>
          <p>Content</p>
        </section>
      </main>
    </div>
  )
}`
    const { ast } = parse(code)
    const result = transform(ast, code)

    // Each element should appear exactly once
    expect((result.code.match(/h\("h1"/g) || []).length).toBe(1)
    expect((result.code.match(/h\("h2"/g) || []).length).toBe(1)
    expect((result.code.match(/h\("header"/g) || []).length).toBe(1)
    expect((result.code.match(/h\("main"/g) || []).length).toBe(1)
    expect((result.code.match(/h\("section"/g) || []).length).toBe(1)
  })
})
