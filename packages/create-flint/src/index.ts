#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

// ─── Templates v4 — Simplified Syntax ───────────────────────────

interface Template {
  name: string
  description: string
  files: Record<string, string>
}

const BLANK_TEMPLATE: Template = {
  name: 'blank',
  description: 'Minimal starter — auto-imports, no boilerplate',
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
    'src/main.jsx': `// No import needed — auto-imported by the compiler!
// state, computed, effect, render, Show, When, For — all available

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
  description: 'Counter with model(), computed, effects',
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
    'src/main.jsx': `// model() — state + computed + actions in one clean object
const counter = model({
  state: { count: 0, step: 1 },
  computed: {
    doubled: (s) => s.count * 2,
    isEven: (s) => s.count % 2 === 0,
  },
  actions: {
    increment(s) { s.count += s.step },
    decrement(s) { s.count -= s.step },
    reset(s) { s.count = 0 },
  },
})

function App() {
  return (
    <div class="container">
      <h1>Counter App</h1>
      <div class="counter">
        <button onClick={counter.decrement}>-</button>
        <span class="count">{counter.count()}</span>
        <button onClick={counter.increment}>+</button>
      </div>
      <p>Doubled: {counter.doubled()}</p>
      <p>Even: {counter.isEven() ? 'Yes' : 'No'}</p>
      <button onClick={counter.reset}>Reset</button>
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
  description: 'Todo app with createStore — minimal boilerplate',
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
    'src/main.jsx': `// createStore — simplified state management
const useTodoStore = createStore({
  todos: [],
  filter: 'all',
  newTodo: '',

  get filteredTodos() {
    switch (this.filter) {
      case 'active': return this.todos.filter(t => !t.done)
      case 'done': return this.todos.filter(t => t.done)
      default: return this.todos()
    }
  },

  get remaining() {
    return this.todos.filter(t => !t.done).length
  },

  addTodo(text) {
    if (!text.trim()) return
    this.todos = [...this.todos, { id: Date.now(), text, done: false }]
  },

  toggleTodo(id) {
    this.todos = this.todos.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    )
  },

  removeTodo(id) {
    this.todos = this.todos.filter(t => t.id !== id)
  },

  setFilter(f) { this.filter = f },
  setNewTodo(t) { this.newTodo = t },
})

function App() {
  const { todos, filter, newTodo, filteredTodos, remaining } = useTodoStore()

  return (
    <div class="container">
      <h1>Todo App</h1>
      <div class="input-row">
        <input
          type="text"
          placeholder="What needs to be done?"
          value={newTodo()}
          onInput={(e) => useTodoStore.setNewTodo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              useTodoStore.addTodo(newTodo())
              useTodoStore.setNewTodo('')
            }
          }}
        />
        <button onClick={() => {
          useTodoStore.addTodo(newTodo())
          useTodoStore.setNewTodo('')
        }}>Add</button>
      </div>
      <div class="filters">
        <button onClick={() => useTodoStore.setFilter('all')} class={filter() === 'all' ? 'active' : ''}>All</button>
        <button onClick={() => useTodoStore.setFilter('active')} class={filter() === 'active' ? 'active' : ''}>Active</button>
        <button onClick={() => useTodoStore.setFilter('done')} class={filter() === 'done' ? 'active' : ''}>Done</button>
      </div>
      <ul class="todo-list">
        {filteredTodos().map(todo => (
          <li key={todo.id} class={todo.done ? 'done' : ''}>
            <input type="checkbox" checked={todo.done} onChange={() => useTodoStore.toggleTodo(todo.id)} />
            <span>{todo.text}</span>
            <button onClick={() => useTodoStore.removeTodo(todo.id)} class="remove">×</button>
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

const REACTIVE_TEMPLATE: Template = {
  name: 'reactive',
  description: 'reactive(), bind(), When — maximum DX',
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
    'src/main.jsx': `// reactive() — proxy-based reactivity (like Vue)
// When — simplified conditional (like a cleaner Show)
// bind() — two-way binding helper

function App() {
  const user = reactive({ name: 'John', age: 30 })
  const visible = state(true)

  return (
    <div class="container">
      <h1>Reactive Demo</h1>

      <When condition={visible()}>
        <div class="card">
          <p>Name: {user.name}</p>
          <p>Age: {user.age}</p>
          <button onClick={() => user.age++}>Birthday</button>
          <button onClick={() => visible.set(false)}>Hide</button>
        </div>
      </When>

      <When condition={!visible()}>
        <button onClick={() => visible.set(true)}>Show</button>
      </When>
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

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
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

// ─── Dashboard Template ────────────────────────────────────────

const DASHBOARD_TEMPLATE: Template = {
  name: 'dashboard',
  description: 'Admin dashboard with charts, stats, and data tables',
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
    'src/main.jsx': `// Dashboard template with stat cards, chart, and data table
const dashboard = createStore({
  stats: [
    { id: 1, name: 'Total Users', value: '12,345', change: '+12%', up: true },
    { id: 2, name: 'Revenue', value: '$45,678', change: '+8%', up: true },
    { id: 3, name: 'Orders', value: '1,234', change: '-3%', up: false },
    { id: 4, name: 'Conversion', value: '3.2%', change: '+0.5%', up: true },
  ],
  activeTab: 'overview',
  tabs: ['overview', 'analytics', 'users', 'settings'],
})

function App() {
  return (
    <div class="dashboard">
      <header class="header">
        <h1>Dashboard</h1>
        <nav class="nav">
          {dashboard.tabs.map(tab => (
            <button
              key={tab}
              class={dashboard.activeTab() === tab ? 'active' : ''}
              onClick={() => dashboard.activeTab.set(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </header>

      <main class="main">
        <div class="stats-grid">
          {dashboard.stats.map(stat => (
            <div key={stat.id} class="stat-card">
              <p class="stat-label">{stat.name}</p>
              <p class="stat-value">{stat.value}</p>
              <p class={stat.up ? 'stat-change positive' : 'stat-change negative'}>
                {stat.change}
              </p>
            </div>
          ))}
        </div>

        <div class="chart-container">
          <h2>Revenue Overview</h2>
          <div class="chart-placeholder">
            <div class="bar" style={{ height: '40%' }}></div>
            <div class="bar" style={{ height: '60%' }}></div>
            <div class="bar" style={{ height: '45%' }}></div>
            <div class="bar" style={{ height: '80%' }}></div>
            <div class="bar" style={{ height: '65%' }}></div>
            <div class="bar" style={{ height: '90%' }}></div>
            <div class="bar" style={{ height: '70%' }}></div>
          </div>
        </div>

        <div class="table-container">
          <h2>Recent Orders</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#12345</td>
                <td>John Doe</td>
                <td>$125.00</td>
                <td><span class="badge success">Completed</span></td>
              </tr>
              <tr>
                <td>#12346</td>
                <td>Jane Smith</td>
                <td>$89.50</td>
                <td><span class="badge warning">Pending</span></td>
              </tr>
              <tr>
                <td>#12347</td>
                <td>Bob Johnson</td>
                <td>$210.00</td>
                <td><span class="badge info">Processing</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

render(App, '#app')
`,
    'src/style.css': `* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: system-ui, sans-serif;
  background: #f3f4f6;
  color: #111827;
}

.dashboard { min-height: 100vh; }

.header {
  background: white;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav { display: flex; gap: 0.5rem; }

.nav button {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  color: #6b7280;
}

.nav button.active { background: #eff6ff; color: #3b82f6; }
.nav button:hover { background: #f3f4f6; }

.main { padding: 2rem; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.stat-label { color: #6b7280; font-size: 0.875rem; }
.stat-value { font-size: 1.5rem; font-weight: 700; margin: 0.5rem 0; }
.stat-change { font-size: 0.875rem; }
.stat-change.positive { color: #22c55e; }
.stat-change.negative { color: #ef4444; }

.chart-container, .table-container {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
}

.chart-container h2, .table-container h2 { margin-bottom: 1rem; }

.chart-placeholder {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  height: 200px;
}

.bar {
  flex: 1;
  background: #3b82f6;
  border-radius: 4px 4px 0 0;
}

.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
.data-table th { font-weight: 500; color: #6b7280; }

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge.success { background: #dcfce7; color: #166534; }
.badge.warning { background: #fef3c7; color: #92400e; }
.badge.info { background: #dbeafe; color: #1e40af; }
`,
    'vite.config.js': `import { defineConfig } from 'vite'
import flint from '@flint/vite-plugin'

export default defineConfig({
  plugins: [flint()],
})
`,
  },
}

// ─── Landing Template ──────────────────────────────────────────

const LANDING_TEMPLATE: Template = {
  name: 'landing',
  description: 'Landing page with hero, features, pricing, and CTA',
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
    'src/main.jsx': `// Landing page template with hero, features, pricing, and footer
const landing = createStore({
  pricing: [
    { id: 'starter', name: 'Starter', price: '9', features: ['5 projects', '10GB storage', 'Email support'] },
    { id: 'pro', name: 'Pro', price: '29', features: ['Unlimited projects', '100GB storage', 'Priority support', 'Custom domain'] },
    { id: 'enterprise', name: 'Enterprise', price: '99', features: ['Unlimited everything', '1TB storage', '24/7 support', 'SLA', 'Dedicated account manager'] },
  ],
  features: [
    { icon: '⚡', title: 'Lightning Fast', description: 'Built for speed with zero virtual DOM overhead.' },
    { icon: '🎯', title: 'Simple API', description: 'Write less code with intuitive APIs and auto-imports.' },
    { icon: '🔒', title: 'Type Safe', description: 'Full TypeScript support with end-to-end type safety.' },
    { icon: '📦', title: 'Tiny Bundle', description: 'Ship less JavaScript to your users with our compiler.' },
    { icon: '🔧', title: 'Developer Experience', description: 'Hot reload, clear errors, and great tooling.' },
    { icon: '🌍', title: 'Universal', description: 'Works in browser, Node.js, and edge runtimes.' },
  ],
})

function App() {
  return (
    <div class="landing">
      <header class="hero">
        <nav class="nav">
          <div class="logo">Flint</div>
          <div class="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#docs">Docs</a>
            <button class="cta-small">Get Started</button>
          </div>
        </nav>
        <div class="hero-content">
          <h1>Build faster with Flint</h1>
          <p class="hero-subtitle">The JavaScript framework that's simple to learn, small to write, and powerful to build.</p>
          <div class="hero-cta">
            <button class="cta-primary">Start Building</button>
            <button class="cta-secondary">View Documentation</button>
          </div>
        </div>
      </header>

      <section id="features" class="features">
        <h2>Why Flint?</h2>
        <p class="section-subtitle">Everything you need to build modern web applications.</p>
        <div class="features-grid">
          {landing.features.map(feature => (
            <div key={feature.title} class="feature-card">
              <span class="feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" class="pricing">
        <h2>Simple Pricing</h2>
        <p class="section-subtitle">Start free. Scale as you grow.</p>
        <div class="pricing-grid">
          {landing.pricing.map(plan => (
            <div key={plan.id} class={plan.id === 'pro' ? 'pricing-card popular' : 'pricing-card'}>
              {plan.id === 'pro' && <span class="popular-badge">Most Popular</span>}
              <h3>{plan.name}</h3>
              <div class="price">
                <span class="currency">$</span>
                <span class="amount">{plan.price}</span>
                <span class="period">/month</span>
              </div>
              <ul class="features-list">
                {plan.features.map(f => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <button class={plan.id === 'pro' ? 'cta-primary full-width' : 'cta-secondary full-width'}>
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>

      <section class="cta-section">
        <h2>Ready to start building?</h2>
        <p>Join thousands of developers building with Flint.</p>
        <button class="cta-primary">Get Started for Free</button>
      </section>

      <footer class="footer">
        <div class="footer-content">
          <div class="footer-brand">
            <div class="logo">Flint</div>
            <p>Simple. Fast. Powerful.</p>
          </div>
          <div class="footer-links">
            <div class="footer-column">
              <h4>Product</h4>
              <a href="#">Features</a>
              <a href="#">Pricing</a>
              <a href="#">Docs</a>
            </div>
            <div class="footer-column">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
            </div>
            <div class="footer-column">
              <h4>Community</h4>
              <a href="#">GitHub</a>
              <a href="#">Discord</a>
              <a href="#">Twitter</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2024 Flint. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

render(App, '#app')
`,
    'src/style.css': `* { margin: 0; padding: 0; box-sizing: border-box; }

body { font-family: system-ui, sans-serif; color: #111827; }

.landing { overflow-x: hidden; }

/* Hero */
.hero {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  padding: 1rem 2rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
}

.logo { font-size: 1.5rem; font-weight: 700; }

.nav-links { display: flex; align-items: center; gap: 2rem; }
.nav-links a { color: white; text-decoration: none; opacity: 0.9; }
.nav-links a:hover { opacity: 1; }

.cta-small {
  padding: 0.5rem 1rem;
  background: white;
  color: #3b82f6;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.hero-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.hero-content h1 { font-size: 4rem; margin-bottom: 1.5rem; }
.hero-subtitle { font-size: 1.25rem; opacity: 0.9; margin-bottom: 2rem; }

.hero-cta { display: flex; gap: 1rem; }

.cta-primary {
  padding: 0.75rem 1.5rem;
  background: white;
  color: #3b82f6;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.cta-secondary {
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: white;
  border: 2px solid white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

/* Features */
.features {
  padding: 5rem 2rem;
  text-align: center;
}

.features h2 { font-size: 2.5rem; margin-bottom: 0.5rem; }
.section-subtitle { color: #6b7280; margin-bottom: 3rem; }

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.feature-card {
  padding: 2rem;
  text-align: left;
}

.feature-icon { font-size: 2rem; }
.feature-card h3 { margin: 1rem 0 0.5rem; }
.feature-card p { color: #6b7280; }

/* Pricing */
.pricing {
  padding: 5rem 2rem;
  background: #f9fafb;
  text-align: center;
}

.pricing h2 { font-size: 2.5rem; margin-bottom: 0.5rem; }

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.pricing-card {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  position: relative;
}

.pricing-card.popular {
  border-color: #3b82f6;
  transform: scale(1.05);
}

.popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #3b82f6;
  color: white;
  padding: 0.25rem 1rem;
  border-radius: 9999px;
  font-size: 0.75rem;
}

.price { margin: 1.5rem 0; }
.currency { font-size: 1.5rem; vertical-align: top; }
.amount { font-size: 3rem; font-weight: 700; }
.period { color: #6b7280; }

.features-list { list-style: none; margin: 1.5rem 0; text-align: left; }
.features-list li { padding: 0.5rem 0; color: #374151; }

.full-width { width: 100%; }

/* CTA Section */
.cta-section {
  padding: 5rem 2rem;
  text-align: center;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
}

.cta-section h2 { font-size: 2.5rem; margin-bottom: 1rem; }
.cta-section p { font-size: 1.125rem; opacity: 0.9; margin-bottom: 2rem; }

/* Footer */
.footer {
  background: #111827;
  color: white;
  padding: 4rem 2rem 2rem;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  max-width: 1000px;
  margin: 0 auto;
}

.footer-brand p { color: #9ca3af; margin-top: 0.5rem; }

.footer-links { display: flex; gap: 4rem; }

.footer-column h4 { margin-bottom: 1rem; }
.footer-column a { display: block; color: #9ca3af; text-decoration: none; margin-bottom: 0.5rem; }
.footer-column a:hover { color: white; }

.footer-bottom {
  text-align: center;
  padding-top: 2rem;
  margin-top: 2rem;
  border-top: 1px solid #374151;
  color: #9ca3af;
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

// ─── Auth Template ─────────────────────────────────────────────

const AUTH_TEMPLATE: Template = {
  name: 'auth',
  description: 'Login and registration forms with validation',
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
    'src/main.jsx': `// Auth template with login and registration forms
const auth = createStore({
  currentView: 'login',
  loginForm: { email: '', password: '' },
  registerForm: { name: '', email: '', password: '', confirmPassword: '' },
  errors: {},
  isLoading: false,
  user: null,

  async login() {
    const { email, password } = this.loginForm
    this.errors = {}

    if (!email) this.errors.email = 'Email is required'
    else if (!email.includes('@')) this.errors.email = 'Invalid email'
    if (!password) this.errors.password = 'Password is required'
    else if (password.length < 6) this.errors.password = 'Password must be at least 6 characters'

    if (Object.keys(this.errors).length === 0) {
      this.isLoading = true
      // Simulate API call
      await new Promise(r => setTimeout(r, 1000))
      this.user = { name: 'John Doe', email }
      this.isLoading = false
    }
  },

  async register() {
    const { name, email, password, confirmPassword } = this.registerForm
    this.errors = {}

    if (!name) this.errors.name = 'Name is required'
    if (!email) this.errors.email = 'Email is required'
    else if (!email.includes('@')) this.errors.email = 'Invalid email'
    if (!password) this.errors.password = 'Password is required'
    else if (password.length < 6) this.errors.password = 'Password must be at least 6 characters'
    if (password !== confirmPassword) this.errors.confirmPassword = 'Passwords do not match'

    if (Object.keys(this.errors).length === 0) {
      this.isLoading = true
      await new Promise(r => setTimeout(r, 1000))
      this.user = { name, email }
      this.isLoading = false
    }
  },

  logout() {
    this.user = null
    this.loginForm = { email: '', password: '' }
    this.registerForm = { name: '', email: '', password: '', confirmPassword: '' }
    this.errors = {}
    this.currentView = 'login'
  },
})

function App() {
  return (
    <div class="auth-container">
      <When condition={auth.user()}>
        <div class="dashboard">
          <h1>Welcome, {auth.user().name}!</h1>
          <p>You are logged in as {auth.user().email}</p>
          <button onClick={auth.logout}>Logout</button>
        </div>
      </When>

      <When condition={!auth.user()}>
        <div class="auth-card">
          <When condition={auth.currentView() === 'login'}>
            <h1>Login</h1>
            <form onSubmit={(e) => { e.preventDefault(); auth.login() }}>
              <div class="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={auth.loginForm.email()}
                  onInput={(e) => auth.loginForm.email.set(e.target.value)}
                  class={auth.errors().email ? 'error' : ''}
                />
                <When condition={auth.errors().email}>
                  <span class="error-message">{auth.errors().email}</span>
                </When>
              </div>
              <div class="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={auth.loginForm.password()}
                  onInput={(e) => auth.loginForm.password.set(e.target.value)}
                  class={auth.errors().password ? 'error' : ''}
                />
                <When condition={auth.errors().password}>
                  <span class="error-message">{auth.errors().password}</span>
                </When>
              </div>
              <button type="submit" disabled={auth.isLoading()}>
                {auth.isLoading() ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <p class="switch-view">
              Don't have an account?{' '}
              <button onClick={() => { auth.currentView.set('register'); auth.errors.set({}) }}>
                Register
              </button>
            </p>
          </When>

          <When condition={auth.currentView() === 'register'}>
            <h1>Register</h1>
            <form onSubmit={(e) => { e.preventDefault(); auth.register() }}>
              <div class="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={auth.registerForm.name()}
                  onInput={(e) => auth.registerForm.name.set(e.target.value)}
                  class={auth.errors().name ? 'error' : ''}
                />
                <When condition={auth.errors().name}>
                  <span class="error-message">{auth.errors().name}</span>
                </When>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={auth.registerForm.email()}
                  onInput={(e) => auth.registerForm.email.set(e.target.value)}
                  class={auth.errors().email ? 'error' : ''}
                />
                <When condition={auth.errors().email}>
                  <span class="error-message">{auth.errors().email}</span>
                </When>
              </div>
              <div class="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={auth.registerForm.password()}
                  onInput={(e) => auth.registerForm.password.set(e.target.value)}
                  class={auth.errors().password ? 'error' : ''}
                />
                <When condition={auth.errors().password}>
                  <span class="error-message">{auth.errors().password}</span>
                </When>
              </div>
              <div class="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={auth.registerForm.confirmPassword()}
                  onInput={(e) => auth.registerForm.confirmPassword.set(e.target.value)}
                  class={auth.errors().confirmPassword ? 'error' : ''}
                />
                <When condition={auth.errors().confirmPassword}>
                  <span class="error-message">{auth.errors().confirmPassword}</span>
                </When>
              </div>
              <button type="submit" disabled={auth.isLoading()}>
                {auth.isLoading() ? 'Creating account...' : 'Register'}
              </button>
            </form>
            <p class="switch-view">
              Already have an account?{' '}
              <button onClick={() => { auth.currentView.set('login'); auth.errors.set({}) }}>
                Login
              </button>
            </p>
          </When>
        </div>
      </When>
    </div>
  )
}

render(App, '#app')
`,
    'src/style.css': `* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: system-ui, sans-serif;
  background: #f3f4f6;
}

.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-card {
  background: white;
  padding: 2.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.auth-card h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #111827;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.15s;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input.error {
  border-color: #ef4444;
}

.error-message {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #ef4444;
}

button[type="submit"] {
  width: 100%;
  padding: 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.5rem;
}

button[type="submit"]:hover {
  background: #2563eb;
}

button[type="submit"]:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.switch-view {
  text-align: center;
  margin-top: 1.5rem;
  color: #6b7280;
}

.switch-view button {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 1rem;
}

.switch-view button:hover {
  text-decoration: underline;
}

.dashboard {
  text-align: center;
}

.dashboard h1 {
  margin-bottom: 0.5rem;
}

.dashboard p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.dashboard button {
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 1rem;
}

.dashboard button:hover {
  background: #dc2626;
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

const TEMPLATES: Record<string, Template> = {
  blank: BLANK_TEMPLATE,
  counter: COUNTER_TEMPLATE,
  todo: TODO_TEMPLATE,
  reactive: REACTIVE_TEMPLATE,
  dashboard: DASHBOARD_TEMPLATE,
  landing: LANDING_TEMPLATE,
  auth: AUTH_TEMPLATE,
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
  const eqArg = process.argv.find(a => a.startsWith(`--${name}=`))
  if (eqArg) return eqArg.split('=')[1]
  return undefined
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  let name = getArg('name') || process.argv[2]
  let templateKey = getArg('template') || getArg('t')

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

  if (!name) name = 'my-flint-app'
  if (!templateKey) templateKey = 'blank'

  const template = TEMPLATES[templateKey]
  if (!template) {
    const available = Object.keys(TEMPLATES).join(', ')
    console.error(`\n  Unknown template "${templateKey}". Available: ${available}\n`)
    process.exit(1)
  }

  const projectPath = path.resolve(process.cwd(), name)

  if (fs.existsSync(projectPath)) {
    if (!hasFlag('force') && !hasFlag('overwrite')) {
      console.error(`\n  Directory "${name}" already exists. Use --force to overwrite.\n`)
      process.exit(1)
    }
    fs.rmSync(projectPath, { recursive: true, force: true })
  }

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
      'flint': '^4.0.0',
    },
    devDependencies: {
      '@flint/vite-plugin': '^4.0.0',
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
