import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

interface GenerateOptions {
  type: string
  name: string
}

const TEMPLATES: Record<string, (name: string) => string> = {
  component: (name: string) => `import { state, onMount, onUnmount } from 'flint'

interface ${name}Props {
  // Add props here
}

export function ${name}(props: ${name}Props) {
  const [count, setCount] = state(0)

  onMount(() => {
    console.log('${name} mounted')
    return () => console.log('${name} unmounted')
  })

  return (
    <div class="${name.toLowerCase()}">
      <h2>${name}</h2>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  )
}
`,
  'page': (name: string) => `import { state, onMount } from 'flint'
import { Link } from 'flint/router'

export default function ${name}Page() {
  const [data, setData] = state<any[]>([])

  onMount(async () => {
    // Fetch data here
    const response = await fetch('/api/${name.toLowerCase()}')
    const result = await response.json()
    setData(result)
  })

  return (
    <div class="page">
      <h1>${name} Page</h1>
      <nav>
        <Link href="/">Home</Link>
      </nav>
      <div class="content">
        {data().map(item => (
          <div key={item.id}>{item.name}</div>
        ))}
      </div>
    </div>
  )
}
`,
  'store': (name: string) => `import { createStore } from 'flint/store'

interface ${name}State {
  items: any[]
  loading: boolean
  error: string | null
}

export const ${name.toLowerCase()}Store = createStore<${name}State>({
  items: [],
  loading: false,
  error: null,
}, {
  name: '${name.toLowerCase()}',
  persistence: 'local',
  devtools: true,
})

// Actions
export function fetchItems() {
  ${name.toLowerCase()}Store.setState({ loading: true, error: null })
}

export function setItems(items: any[]) {
  ${name.toLowerCase()}Store.setState({ items, loading: false })
}

export function setError(error: string) {
  ${name.toLowerCase()}Store.setState({ error, loading: false })
}

export function clearItems() {
  ${name.toLowerCase()}Store.setState({ items: [] })
}
`,
  'hook': (name: string) => `import { state, effect, onCleanup } from 'flint'

export function ${name.startsWith('use') ? name : `use${name}`}<T>(options?: any) {
  const [value, setValue] = state<T | null>(null)
  const [loading, setLoading] = state(false)
  const [error, setError] = state<string | null>(null)

  effect(() => {
    // Implement hook logic here
  })

  onCleanup(() => {
    // Cleanup logic
  })

  return { value, loading, error }
}
`,
  'test': (name: string) => `import { describe, it, expect } from 'vitest'
import { ${name} } from './${name}'

describe('${name}', () => {
  it('renders correctly', () => {
    // Test implementation
    expect(true).toBe(true)
  })

  it('handles user interaction', () => {
    // Test implementation
    expect(true).toBe(true)
  })
})
`,
}

export function generate(options: GenerateOptions): void {
  const { type, name } = options

  if (!TEMPLATES[type]) {
    console.error(`Unknown type: ${type}. Available types: ${Object.keys(TEMPLATES).join(', ')}`)
    process.exit(1)
  }

  const template = TEMPLATES[type](name)
  const ext = type === 'test' ? '.test.ts' : '.tsx'
  const filename = `${name}${ext}`
  const filepath = path.join(process.cwd(), 'src', filename)

  if (fs.existsSync(filepath)) {
    console.error(`File already exists: ${filepath}`)
    process.exit(1)
  }

  fs.mkdirSync(path.dirname(filepath), { recursive: true })
  fs.writeFileSync(filepath, template)
  console.log(`Generated: ${filepath}`)
}

export function generateHelp(): string {
  return `
Usage: flint generate <type> <name>

Generate files from templates.

Types:
  component  Generate a new component
  page       Generate a new page component
  store      Generate a new store
  hook       Generate a new hook
  test       Generate a new test file

Examples:
  flint generate component Button
  flint generate page Home
  flint generate store user
  flint generate hook useAuth
  flint generate test Button
`
}
