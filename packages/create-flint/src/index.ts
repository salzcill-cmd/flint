#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

// ─── Templates ────────────────────────────────────────────────

interface Template {
  name: string
  description: string
  files: Record<string, string>
}

const BLANK_TEMPLATE: Template = {
  name: 'blank',
  description: 'Minimal starter with counter example',
  files: {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><%= name %></title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
`,
    'src/main.jsx': `import { render, state } from 'flint'

function App() {
  const count = state(0)

  return (
    <div class="container">
      <h1>Hello, Flint!</h1>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(c => c + 1)}>
        Increment
      </button>
    </div>
  )
}

render(App, '#app')
`,
    'src/style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.container {
  font-family: system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1rem;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  background: #3b82f6;
  color: white;
}

button:hover {
  background: #2563eb;
}
`,
    'vite.config.js': `import { defineConfig } from 'vite'
import flint from '@flint/vite-plugin'

export default defineConfig({
  plugins: [flint()],
})
`,
  },
}

const COUNTER_TEMPLATE: Template = {
  name: 'counter',
  description: 'Counter with computed values and effects',
  files: {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><%= name %></title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
`,
    'src/main.jsx': `import { render, state, computed, effect } from 'flint'

function App() {
  const count = state(0)
  const doubled = computed(() => count() * 2)
  const isEven = computed(() => count() % 2 === 0)

  effect(() => {
    document.title = \`Count: \${count()} | Doubled: \${doubled()}\`
  })

  return (
    <div class="container">
      <h1>Counter App</h1>
      <div class="counter">
        <button onClick={() => count.set(c => c - 1)}>-</button>
        <span class="count">{count()}</span>
        <button onClick={() => count.set(c => c + 1)}>+</button>
      </div>
      <p>Doubled: {doubled()}</p>
      <p>Is even: {isEven() ? 'Yes' : 'No'}</p>
      <button onClick={() => count.set(0)}>Reset</button>
    </div>
  )
}

render(App, '#app')
`,
    'src/style.css': `* { margin: 0; padding: 0; box-sizing: border-box; }

.container {
  font-family: system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1.5rem;
}

.counter {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.count {
  font-size: 3rem;
  font-weight: bold;
  min-width: 100px;
  text-align: center;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  background: #3b82f6;
  color: white;
}

button:hover { background: #2563eb; }
`,
    'vite.config.js': `import { defineConfig } from 'vite'
import flint from '@flint/vite-plugin'

export default defineConfig({
  plugins: [flint()],
})
`,
  },
}

const TODO_TEMPLATE: Template = {
  name: 'todo',
  description: 'Todo app with state management',
  files: {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><%= name %></title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
`,
    'src/main.jsx': `import { render, state, computed } from 'flint'

const todos = state([])
const filter = state('all')
const newTodo = state('')

const filteredTodos = computed(() => {
  switch (filter()) {
    case 'active': return todos().filter(t => !t.done)
    case 'done': return todos().filter(t => t.done)
    default: return todos()
  }
})

const remaining = computed(() => todos().filter(t => !t.done).length)

function addTodo() {
  if (!newTodo().trim()) return
  todos.set(prev => [...prev, { id: Date.now(), text: newTodo(), done: false }])
  newTodo.set('')
}

function toggleTodo(id) {
  todos.set(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
}

function removeTodo(id) {
  todos.set(prev => prev.filter(t => t.id !== id))
}

function App() {
  return (
    <div class="container">
      <h1>Todo App</h1>
      <div class="input-row">
        <input
          type="text"
          placeholder="What needs to be done?"
          value={newTodo()}
          onInput={(e) => newTodo.set(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <div class="filters">
        <button onClick={() => filter.set('all')} class={filter() === 'all' ? 'active' : ''}>All</button>
        <button onClick={() => filter.set('active')} class={filter() === 'active' ? 'active' : ''}>Active</button>
        <button onClick={() => filter.set('done')} class={filter() === 'done' ? 'active' : ''}>Done</button>
      </div>
      <ul class="todo-list">
        {filteredTodos().map(todo => (
          <li key={todo.id} class={todo.done ? 'done' : ''}>
            <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id)} />
            <span>{todo.text}</span>
            <button onClick={() => removeTodo(todo.id)} class="remove">×</button>
          </li>
        ))}
      </ul>
      <p class="remaining">{remaining()} items left</p>
    </div>
  )
}

render(App, '#app')
`,
    'src/style.css': `* { margin: 0; padding: 0; box-sizing: border-box; }

.container {
  font-family: system-ui, sans-serif;
  max-width: 500px;
  margin: 3rem auto;
  padding: 0 1rem;
}

h1 { text-align: center; margin-bottom: 1rem; }

.input-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.input-row input {
  flex: 1;
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.filters button.active { background: #3b82f6; color: white; }

.todo-list { list-style: none; }

.todo-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
}

.todo-list li.done span { text-decoration: line-through; opacity: 0.5; }

.remove {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1.2rem;
  cursor: pointer;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  background: #3b82f6;
  color: white;
}

button:hover { background: #2563eb; }

.remaining { text-align: center; margin-top: 1rem; opacity: 0.6; }
`,
    'vite.config.js': `import { defineConfig } from 'vite'
import flint from '@flint/vite-plugin'

export default defineConfig({
  plugins: [flint()],
})
`,
  },
}

const TEMPLATES: Record<string, Template> = {
  blank: BLANK_TEMPLATE,
  counter: COUNTER_TEMPLATE,
  todo: TODO_TEMPLATE,
}

// ─── Helpers ──────────────────────────────────────────────────

function renderTemplate(template: string, data: Record<string, string>): string {
  return template.replace(/<%=\s*(\w+)\s*%>/g, (_, key) => data[key] || '')
}

function writeFileWithTemplate(
  filePath: string,
  content: string,
  data: Record<string, string>
): void {
  const rendered = renderTemplate(content, data)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, rendered)
}

function hasTTY(): boolean {
  return Boolean(process.stdout?.isTTY) && Boolean(process.stderr?.isTTY)
}

// ─── Non-interactive mode ─────────────────────────────────────

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(name)
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1]
  }
  // Also support --name=value
  const eqArg = process.argv.find(a => a.startsWith(`--${name}=`))
  if (eqArg) return eqArg.split('=')[1]
  return undefined
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  // Parse CLI args
  let name = getArg('name') || process.argv[2]
  let templateKey = getArg('template') || getArg('t')

  // Interactive mode if TTY available and args missing
  if (hasTTY()) {
    try {
      const p = await import('@clack/prompts')

      if (!name) {
        name = await p.text({
          message: 'Project name:',
          placeholder: 'my-flint-app',
          initialValue: 'my-flint-app',
          validate: (value: string) => {
            if (!value.trim()) return 'Project name is required'
            if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Name can only contain letters, numbers, hyphens, and underscores'
            return undefined
          },
        }) as string

        if (typeof name === 'symbol') {
          console.log('\n  Cancelled.\n')
          process.exit(0)
        }
      }

      if (!templateKey) {
        templateKey = await p.select({
          message: 'Choose a template:',
          options: Object.values(TEMPLATES).map(t => ({
            value: t.name,
            label: t.name.charAt(0).toUpperCase() + t.name.slice(1),
            hint: t.description,
          })),
        }) as string

        if (typeof templateKey === 'symbol') {
          console.log('\n  Cancelled.\n')
          process.exit(0)
        }
      }
    } catch (e) {
      console.warn('[Flint] Interactive prompts failed, using defaults:', e)
    }
  }

  // Defaults
  if (!name) name = 'my-flint-app'
  if (!templateKey) templateKey = 'blank'

  const template = TEMPLATES[templateKey]
  if (!template) {
    const available = Object.keys(TEMPLATES).join(', ')
    console.error(`\n  Unknown template "${templateKey}". Available: ${available}\n`)
    process.exit(1)
  }

  const projectPath = path.resolve(process.cwd(), name)

  // Check if directory exists
  if (fs.existsSync(projectPath)) {
    if (!hasFlag('force') && !hasFlag('overwrite')) {
      console.error(`\n  Directory "${name}" already exists. Use --force to overwrite.\n`)
      process.exit(1)
    }
    fs.rmSync(projectPath, { recursive: true, force: true })
  }

  // Create project
  console.log(`\n  Creating Flint project: ${name}\n`)

  fs.mkdirSync(projectPath, { recursive: true })

  const data = { name }
  for (const [filePath, content] of Object.entries(template.files)) {
    const fullPath = path.join(projectPath, filePath)
    writeFileWithTemplate(fullPath, content, data)
    console.log(`  ✔ ${filePath}`)
  }

  // Write package.json
  const packageJson = {
    name,
    private: true,
    version: '0.0.1',
    type: 'module',
    scripts: {
      dev: 'flint dev',
      build: 'flint build',
      test: 'flint test',
      lint: 'flint lint',
    },
    dependencies: {
      'flint': '^3.2.0',
    },
    devDependencies: {
      '@flint/vite-plugin': '^3.2.0',
      'vite': '^6.0.0',
    },
  }
  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )
  console.log('  ✔ package.json')

  // Write .gitignore
  fs.writeFileSync(
    path.join(projectPath, '.gitignore'),
    'node_modules\ndist\n.vite\n'
  )
  console.log('  ✔ .gitignore')

  // Install deps (unless --no-install)
  if (!hasFlag('no-install')) {
    console.log('\n  Installing dependencies...\n')
    try {
      execSync('npm install', { cwd: projectPath, stdio: 'inherit' })
    } catch {
      console.log('\n  Failed to install dependencies. Run manually:\n')
      console.log(`    cd ${name}`)
      console.log('    npm install\n')
    }
  }

  console.log(`\n  Next steps:`)
  console.log(`    cd ${name}`)
  if (hasFlag('no-install')) console.log('    npm install')
  console.log('    npm run dev\n')
}

main()
