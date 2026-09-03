<div align="center">

# 🔥 Flint

### Write less. Ship faster. Build beautifully.

A modern JavaScript framework with fine-grained signals, JSX, and zero Virtual DOM.

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/Tests-748%20passing-brightgreen)]()
[![Version](https://img.shields.io/badge/Version-3.1.0-blue)]()
[![Packages](https://img.shields.io/badge/Packages-13-blueviolet)]()

[Getting Started](#-getting-started) • [Examples](#-examples) • [API Reference](#-api-reference) • [Contributing](#-contributing)

</div>

---

## Table of Contents

- [What is Flint?](#-what-is-flint)
- [Why Flint?](#-why-flint)
- [Getting Started](#-getting-started)
- [Core Concepts](#-core-concepts)
- [Packages](#-packages)
- [Metaframework (FlintKit)](#-metaframework-flintkit)
- [State Management (Store)](#-state-management-store)
- [Server-Side Rendering](#-server-side-rendering)
- [Server Components & Actions](#-server-components--actions)
- [Optimistic Updates](#-optimistic-updates)
- [Form Actions & Resource Preloading](#-form-actions--resource-preloading)
- [Compiler Auto-Memoization](#-compiler-auto-memoization)
- [DevTools](#-devtools)
- [ESLint Plugin](#-eslint-plugin)
- [Testing](#-testing)
- [Examples](#-examples)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)
- [License](#-license)

---

## What is Flint?

Flint is a modern JavaScript framework designed for building fast, reactive user interfaces. It uses **fine-grained signals** for state management and **JSX** for templating, with **zero Virtual DOM** overhead.

### Key Features

| Feature | Description |
|---------|-------------|
| **Fine-Grained Signals** | Reactive state that only updates what changed |
| **Zero Virtual DOM** | Direct DOM manipulation for maximum performance |
| **JSX Syntax** | Familiar syntax for React developers |
| **Compiler-Optimized** | Automatic optimizations at build time |
| **TypeScript First** | Full TypeScript support with inference |
| **Small Bundle** | ~5KB gzipped core |
| **Server Components** | React 19-compatible RSC support |
| **Optimistic Updates** | Instant UI feedback with useOptimistic |
| **Form Actions** | Progressive enhancement for forms |
| **Resource Preloading** | preload, preinit, prefetchDNS APIs |
| **Metaframework** | FlintKit for full-stack apps |
| **Built-in Store** | Zustand-compatible with middleware |
| **Built-in i18n** | Internationalization in core |
| **Built-in Security** | CSP, CSRF, rate limiting |
| **Built-in a11y** | Focus trap, keyboard nav, ARIA |
| **Built-in SEO** | Structured data, meta management |
| **Built-in PWA** | Service worker, caching |
| **Time-Travel Debugging** | Built into DevTools |
| **Deep Reactivity** | Vue-style reactive objects |
| **Effect Events** | Debounced, throttled, intersection |

---

## Why Flint?

### Comparison with Other Frameworks

| Feature | Flint | React | Vue | Svelte | Solid |
|---------|-------|-------|-----|--------|-------|
| Virtual DOM | ❌ None | ✅ Yes | ✅ Yes | ❌ None | ❌ None |
| Fine-Grained Reactivity | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| Bundle Size (gzip) | ~5KB | ~40KB | ~30KB | ~3KB | ~7KB |
| Learning Curve | Easy | Medium | Easy | Easy | Medium |
| TypeScript Support | First-Class | Good | Good | Good | Good |
| Compiler Optimization | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Server Components | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Form Actions | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Built-in Store | ✅ Yes | ❌ No | ✅ Pinia | ❌ No | ❌ No |
| Built-in i18n | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| Built-in Security | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| Built-in a11y | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| Built-in SEO | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| Built-in PWA | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| Optimistic Updates | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Effect Events | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Deep Reactivity | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| Time-Travel Debugging | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |

---

## Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm 9 or higher

### Installation

```bash
# Create a new project
npx create-flint my-app

# Navigate to project
cd my-app

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Manual Setup

```bash
# Create project directory
mkdir my-flint-app && cd my-flint-app

# Initialize package.json
pnpm init

# Install Flint
pnpm add @flint/runtime @flint/reactivity

# Install Vite plugin
pnpm add -D @flint/vite-plugin vite typescript
```

### Project Structure

```
my-flint-app/
├── src/
│   ├── components/
│   │   └── Counter.jsx
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.js
```

### Configuration Files

**vite.config.js**
```javascript
import { defineConfig } from 'vite'
import flint from '@flint/vite-plugin'

export default defineConfig({
  plugins: [flint()]
})
```

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "node"
  }
}
```

---

## Core Concepts

### Signals (Reactivity)

Signals are the heart of Flint's reactivity system. They are reactive state containers that automatically track dependencies and update only when needed.

#### Creating Signals

```javascript
import { state, computed, effect } from '@flint/reactivity'

// Create a writable signal
const count = state(0)

// Read the value
console.log(count()) // 0

// Update the value
count.set(1)
console.log(count()) // 1

// Update based on previous value
count.set(prev => prev + 1)
console.log(count()) // 2
```

#### Computed Values

Computed values derive from other signals and are automatically cached.

```javascript
const count = state(0)
const doubled = computed(() => count() * 2)

console.log(doubled()) // 0

count.set(5)
console.log(doubled()) // 10
```

#### Effects

Effects run whenever their dependencies change.

```javascript
const count = state(0)

effect(() => {
  console.log(`Count is: ${count()}`)
})

// Output: "Count is: 0"

count.set(1)
// Output: "Count is: 1"
```

#### Watching

Watch specific signals with more control.

```javascript
const count = state(0)

watch(
  () => count(),
  (newValue, oldValue) => {
    console.log(`Changed from ${oldValue} to ${newValue}`)
  }
)

count.set(5)
// Output: "Changed from 0 to 5"
```

#### Batching Updates

Batch multiple updates to prevent unnecessary re-renders.

```javascript
const firstName = state('John')
const lastName = state('Doe')

batch(() => {
  firstName.set('Jane')
  lastName.set('Smith')
})
// Only triggers effects once
```

---

### Components

Components are reusable UI building blocks in Flint.

#### Creating Components

```jsx
// Counter.jsx
export function Counter() {
  const count = state(0)

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(prev => prev + 1)}>
        Increment
      </button>
    </div>
  )
}
```

#### Component with Props

```jsx
// Greeting.jsx
export function Greeting({ name, age }) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>You are {age} years old.</p>
    </div>
  )
}

// Usage
<Greeting name="John" age={30} />
```

#### Lifecycle Hooks

```jsx
import { onMount, onUpdate, onDestroy } from '@flint/runtime'

export function MyComponent() {
  const data = state(null)

  onMount(() => {
    console.log('Component mounted!')
    // Fetch data, set up subscriptions, etc.
  })

  onUpdate(() => {
    console.log('Component updated!')
  })

  onDestroy(() => {
    console.log('Component destroyed!')
    // Cleanup subscriptions, timers, etc.
  })

  return <div>My Component</div>
}
```

#### Refs

Access DOM elements directly.

```jsx
import { ref } from '@flint/runtime'

export function InputComponent() {
  const inputRef = ref()

  const focusInput = () => {
    inputRef.current?.focus()
  }

  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={focusInput}>Focus Input</button>
    </div>
  )
}
```

---

### JSX

Flint uses JSX syntax for building UIs.

#### Expressions

```jsx
const name = state('World')

// Text interpolation
<p>Hello, {name()}!</p>

// Conditional rendering
<p>{count() > 0 ? 'Positive' : 'Non-positive'}</p>

// Inline styles
<div style={{ color: 'red', fontSize: '20px' }}>Red Text</div>

// Event handlers
<button onClick={() => console.log('Clicked!')}>Click Me</button>
```

#### Fragments

```jsx
<>
  <h1>Title</h1>
  <p>Content</p>
</>
```

#### Spread Props

```jsx
const props = { class: 'btn', id: 'submit' }
<button {...props}>Submit</button>
```

---

### Rendering

Mount your app to the DOM.

```jsx
import { render } from '@flint/runtime'
import App from './App'

// Render to DOM
const container = document.getElementById('app')
const dispose = render(() => <App />, container)

// Cleanup when needed
dispose.dispose()
```

---

## Packages

Flint is organized as a monorepo with the following packages:

| Package | Description |
|---------|-------------|
| `@flint/reactivity` | Fine-grained signals, computed, effects |
| `@flint/runtime` | Runtime, renderer, components, hooks |
| `@flint/compiler` | JSX compiler with optimizations |
| `@flint/vite-plugin` | Vite integration |
| `@flint/cli` | CLI tools (generate, preview, doctor) |
| `@flint/store` | Zustand-compatible state management |
| `@flint/devtools` | Browser DevTools integration |
| `@flint/eslint-plugin` | ESLint rules for Flint |
| `@flint/playwright-utils` | E2E testing utilities |
| `@flint/ts-presets` | TypeScript configuration presets |
| `flintkit` | Metaframework with SSR & file-based routing |
| `create-flint` | Project scaffolding CLI |

---

## Metaframework (FlintKit)

FlintKit is a full-stack metaframework for Flint, similar to Next.js or Nuxt.

### File-Based Routing

```
pages/
├── index.tsx          → /
├── about.tsx          → /about
├── blog/
│   ├── index.tsx      → /blog
│   └── [slug].tsx     → /blog/:slug
├── _layout.tsx        → Root layout
└── _error.tsx         → Error boundary
```

### Data Loading

```tsx
// pages/blog/[slug].loader.ts
export async function loader({ params }) {
  const post = await fetchPost(params.slug)
  return { post }
}

// pages/blog/[slug].tsx
export default function BlogPost({ post }) {
  return <article>{post.title}</article>
}
```

### Form Actions

```tsx
// pages/contact.action.ts
export async function action({ request }) {
  const formData = await request.formData()
  await sendEmail(formData)
  return { success: true }
}
```

### Configuration

```ts
// flintkit.config.ts
import { defineConfig } from 'flintkit'

export default defineConfig({
  name: 'my-app',
  ssr: true,
  fileRoutes: true,
  routesDir: 'pages',
})
```

---

## State Management Store

Flint provides a Zustand-compatible store with reactive signals.

### Basic Usage

```tsx
import { create } from '@flint/store'

const useStore = create((set, get) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))

// In component
function Counter() {
  const { count, increment } = useStore()
  return <button onClick={increment}>{count}</button>
}
```

### Middleware

```tsx
import { create, logger, persist, devtools } from '@flint/store'

const useStore = create(
  (set) => ({
    todos: [],
    addTodo: (todo) => set((state) => ({ todos: [...state.todos, todo] })),
  }),
  [logger(), persist('todos'), devtools({ name: 'TodoStore' })]
)
```

### Selectors

```tsx
import { useStore } from '@flint/store'

function TodoCount() {
  const count = useStore((state) => state.todos.length)
  return <span>{count} todos</span>
}
```

---

## Server-Side Rendering

### Basic SSR

```tsx
import { renderToString } from '@flint/runtime'

const html = await renderToString(() => <App />)
```

### Streaming SSR

```tsx
import { renderToPipeableStream } from '@flint/runtime'

const stream = renderToPipeableStream(() => <App />)
stream.pipe(res)
```

### Hydration

```tsx
import { hydrate } from '@flint/runtime'

hydrate(() => <App />, document.getElementById('app'))
```

### Data Loading

```tsx
import { dataLoader } from '@flint/runtime'

const userDataLoader = dataLoader(async ({ params }) => {
  const user = await fetchUser(params.id)
  return { user }
})

const router = createRouter({
  routes: [
    {
      path: '/users/:id',
      component: () => <UserProfile />,
      loader: userDataLoader,
    },
  ],
})
```

---

## Server Components & Actions

### Server Components

```tsx
import { createServerComponent } from '@flint/runtime'

const ServerGreeting = createServerComponent(async ({ name }) => {
  // This runs on the server only
  const data = await fetchFromDatabase()
  return <div>Hello {name}! Data: {data}</div>
})
```

### Server Actions

```tsx
import { createServerAction } from '@flint/runtime'

const saveTodo = createServerAction(async (title: string) => {
  // This runs on the server when called from client
  await db.todos.create({ title })
  return { success: true }
}, { revalidate: ['todos'] })

// In client component
function TodoForm() {
  const handleSubmit = async (title: string) => {
    const result = await saveTodo(title)
    console.log(result)
  }
}
```

### Universal Components

```tsx
import { createUniversalComponent } from '@flint/runtime'

const UserCard = createUniversalComponent(
  async (props) => {
    // Server: fetch data
    const user = await fetchUser(props.id)
    return <Card user={user} />
  },
  (props) => {
    // Client: render with data
    return <Card user={props.user} />
  }
)
```

---

## Optimistic Updates

### useOptimistic

```tsx
import { useOptimistic } from '@flint/runtime'

function TodoList({ todos }) {
  const [optimisticTodos, setOptimisticTodos] = useOptimistic(todos)

  const addTodo = async (text: string) => {
    // Optimistically add
    setOptimisticTodos(prev => [...prev, { text, done: false }])
    
    // Then save to server
    await saveTodo(text)
  }

  return (
    <ul>
      {optimisticTodos.map(todo => <li>{todo.text}</li>)}
    </ul>
  )
}
```

### useOptimisticAction

```tsx
import { useOptimisticAction } from '@flint/runtime'

function LikeButton({ likes, postId }) {
  const { optimisticState, execute } = useOptimisticAction(
    likes,
    (current) => current + 1,
    async () => {
      await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
    }
  )

  return <button onClick={execute}>👍 {optimisticState}</button>
}
```

---

## Form Actions & Resource Preloading

### Form Actions

```tsx
import { createFormAction } from '@flint/runtime'

const submitForm = createFormAction({
  action: async (formData) => {
    await saveData(formData)
    return { success: true }
  },
  onSubmit: (result) => console.log('Submitted:', result),
  onError: (error) => console.error('Error:', error),
})

// In component
<form action={submitForm}>
  <input name="title" />
  <button type="submit">Submit</button>
</form>
```

### Resource Preloading

```tsx
import { preload, preinit, prefetchDNS, preconnect } from '@flint/runtime'

function App() {
  // Preload a font
  preload('/fonts/inter.woff2', { as: 'font' })
  
  // Preinitialize a script
  preinit('/analytics.js', { as: 'script' })
  
  // Prefetch DNS for an API
  prefetchDNS('https://api.example.com')
  
  // Preconnect to a CDN
  preconnect('https://cdn.example.com')
  
  return <div>App</div>
}
```

---

## Compiler Auto-Memoization

The Flint compiler automatically memoizes pure expressions, eliminating the need for manual `useMemo`.

### Automatic

```jsx
// Before compilation
const doubled = count() * 2
const fullName = firstName() + ' ' + lastName()

// After compilation (automatic memoization)
const doubled = _memo(() => count() * 2)
const fullName = _memo(() => firstName() + ' ' + lastName())
```

### Configuration

```ts
// vite.config.ts
import flint from '@flint/vite-plugin'

export default defineConfig({
  plugins: [
    flint({
      autoMemoization: true, // Enable auto-memoization
    })
  ]
})
```

---

## DevTools

### Browser Extension

```tsx
import { initDevTools, trackSignal, trackComponent } from '@flint/devtools'

// Initialize devtools
initDevTools({
  appName: 'My App',
  logLevel: 'debug',
})

// Track signals
const count = state(0)
trackSignal(count, 'count', 'state')

// Track components
function MyComponent() {
  trackComponent('MyComponent', { prop: 'value' })
  return <div>Component</div>
}
```

### Redux DevTools Integration

```tsx
import { create, devtools } from '@flint/store'

const useStore = create(
  (set) => ({ count: 0 }),
  [devtools({ name: 'CounterStore' })]
)

// Opens in Redux DevTools extension
```

---

## ESLint Plugin

### Installation

```bash
pnpm add -D @flint/eslint-plugin eslint
```

### Configuration

```js
// .eslintrc.js
module.exports = {
  plugins: ['@flint'],
  extends: ['plugin:@flint/recommended'],
}
```

### Available Rules

| Rule | Description |
|------|-------------|
| `no-state-outside-effect` | Prevents state() in effects/callbacks |
| `no-computed-in-render` | Prevents computed() in JSX |
| `prefer-signal-over-value` | Suggests signal() over .value |
| `no-reassign-signal` | Prevents direct signal assignment |
| `require-effect-cleanup` | Requires cleanup in effects |
| `no-nested-effect` | Prevents nested effects |

---

## Testing

### Unit Testing

```bash
pnpm add -D vitest happy-dom
```

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
  },
})
```

### Testing Components

```jsx
import { describe, it, expect } from 'vitest'
import { testRender } from '@flint/runtime'
import Counter from './Counter'

describe('Counter', () => {
  it('renders correctly', () => {
    const { querySelector, textContent } = testRender(() => <Counter />)
    
    expect(querySelector('button')).toBeDefined()
    expect(textContent('p')).toBe('0')
  })
  
  it('increments on click', () => {
    const { click, textContent } = testRender(() => <Counter />)
    
    click('button')
    expect(textContent('p')).toBe('1')
  })
})
```

### E2E Testing

```bash
pnpm add -D @playwright/test @flint/playwright-utils
```

```tsx
import { test, expect } from '@flint/playwright-utils'

test('counter works', async ({ flint, page }) => {
  await page.goto('/')
  
  // Wait for hydration
  await flint.waitForHydration()
  
  // Check initial state
  await expect(page.locator('p')).toHaveText('0')
  
  // Click button
  await page.click('button')
  
  // Wait for signal update
  await flint.waitForSignal('count', 1)
  
  // Verify
  await expect(page.locator('p')).toHaveText('1')
})
```

---

## Examples

### Counter App

```jsx
import { state } from '@flint/reactivity'
import { render } from '@flint/runtime'

function Counter() {
  const count = state(0)
  
  return (
    <div>
      <h1>Counter: {count()}</h1>
      <button onClick={() => count.set(prev => prev + 1)}>
        +
      </button>
      <button onClick={() => count.set(prev => prev - 1)}>
        -
      </button>
    </div>
  )
}

render(() => <Counter />, document.getElementById('app'))
```

### Todo App with Store

```tsx
import { create } from '@flint/store'
import { For } from '@flint/runtime'

const useTodoStore = create((set) => ({
  todos: [],
  addTodo: (text) => set((state) => ({
    todos: [...state.todos, { text, done: false }]
  })),
  toggleTodo: (index) => set((state) => ({
    todos: state.todos.map((t, i) => 
      i === index ? { ...t, done: !t.done } : t
    )
  })),
}))

function TodoApp() {
  const { todos, addTodo, toggleTodo } = useTodoStore()
  const newTodo = state('')

  return (
    <div>
      <h1>Todo App</h1>
      <input
        value={newTodo()}
        onInput={(e) => newTodo.set(e.target.value)}
      />
      <button onClick={() => {
        addTodo(newTodo())
        newTodo.set('')
      }}>Add</button>
      <ul>
        <For each={todos}>
          {(todo, index) => (
            <li
              style={{ textDecoration: todo().done ? 'line-through' : 'none' }}
              onClick={() => toggleTodo(index())}
            >
              {todo().text}
            </li>
          )}
        </For>
      </ul>
    </div>
  )
}
```

### Server-Side Todo App with FlintKit

```tsx
// pages/index.tsx
import { createServerAction } from '@flint/runtime'

const addTodo = createServerAction(async (title: string) => {
  await db.todos.create({ title })
  return { success: true }
}, { revalidate: ['todos'] })

export async function loader() {
  const todos = await db.todos.findMany()
  return { todos }
}

export default function TodoPage({ todos }) {
  return (
    <div>
      <h1>Todos</h1>
      <form action={async (formData) => {
        await addTodo(formData.get('title'))
      }}>
        <input name="title" />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todos.map(todo => <li key={todo.id}>{todo.title}</li>)}
      </ul>
    </div>
  )
}
```

---

## API Reference

### @flint/reactivity

| Function | Description |
|----------|-------------|
| `state(initialValue)` | Create a reactive signal |
| `computed(fn)` | Create a computed value |
| `effect(fn)` | Run on dependency changes |
| `watch(source, callback)` | Watch specific signals |
| `batch(fn)` | Batch multiple updates |
| `untrack(fn)` | Read without tracking |
| `createSelector()` | Efficient list updates |
| `createRoot(fn)` | Create effect scope |
| `onCleanup(fn)` | Register cleanup |

### @flint/runtime — Components

| Component | Description |
|-----------|-------------|
| `Show` | Conditional rendering with fallback |
| `For` | Keyed list rendering |
| `ForEach` | Fine-grained list with DOM-level reconciliation |
| `Index` | List rendering with index tracking |
| `Switch` / `Match` | Pattern-matching conditional |
| `Portal` | Render to different DOM node |
| `Suspense` | Async loading boundary |
| `ErrorBoundary` | Error catching boundary |
| `Activity` | Hide/restore UI (React 19) |
| `KeepAlive` | Cache component instances (Vue) |
| `memo` | Memoized rendering |
| `lazy` | Lazy component loading |

### @flint/runtime — Hooks

| Hook | Description |
|------|-------------|
| `useTransition` | Mark updates as low-priority |
| `useDeferredValue` | Defer value updates |
| `useId` | Generate unique IDs |
| `useImperativeHandle` | Customize ref handle |
| `forwardRef` | Forward ref to child |
| `useRef` | Mutable ref |
| `useOptimistic` | Optimistic UI updates |
| `useActionState` | Form action state (React 19) |
| `useFormStatus` | Parent form status (React 19) |
| `use` | Read Promise/Context in render (React 19) |

### @flint/runtime — Effect Events

| Hook | Description |
|------|-------------|
| `useEffectEvent(fn)` | Stable event handler (React 19) |
| `useStableEvent(fn)` | Simplified effect event |
| `useEffectEventDebounced(fn, ms)` | Debounced effect event |
| `useEffectEventThrottled(fn, ms)` | Throttled effect event |
| `useEffectAnimationFrame(fn)` | Effect on animation frame |
| `useEffectEventIntersection(el, fn)` | IntersectionObserver event |

### @flint/runtime — Utilities

| Function | Description |
|----------|-------------|
| `reactive(obj)` | Deep reactive proxy (Vue-style) |
| `shallowRef(value)` | Reference-change-only signal |
| `readonly(obj)` | Immutable proxy |
| `shallowReadonly(obj)` | Shallow immutable proxy |
| `toRef(obj, key)` | Create ref from reactive property |
| `toRefs(obj)` | Create refs from all properties |
| `triggerRef(ref)` | Force-trigger effects |
| `createRef()` | Create ref object (React 19) |
| `assignRef(ref, value)` | Assign to ref |
| `mergeRefs(...refs)` | Merge multiple refs |
| `mergeProps(...props)` | Merge props (Solid-style) |
| `splitProps(props, ...keys)` | Split props into groups |
| `bindable(value)` | Two-way binding (Svelte 5) |
| `cn(...classes)` | Class name utility (clsx-style) |

### @flint/runtime — Transitions

| Function | Description |
|----------|-------------|
| `useTransitionClasses(options)` | CSS transition class management |
| `applyTransition(el, options)` | Apply transition classes |

### @flint/runtime — SSR

| Function | Description |
|----------|-------------|
| `renderToString(fn)` | Render to HTML string |
| `renderToPipeableStream(fn)` | Render to Node.js stream |
| `hydrate(fn, container)` | Hydrate server HTML |
| `generateHTML(fn)` | Generate full HTML page |
| `dataLoader(fn)` | Define route data loader |
| `useTitle(title)` | Set page title (SSR) |
| `useMeta(meta)` | Set meta tags (SSR) |

### @flint/runtime — Server Components & Actions

| Function | Description |
|----------|-------------|
| `createServerAction(fn)` | Create server action |
| `createServerComponent(fn)` | Create server component |
| `createUniversalComponent(fn)` | Universal component (SSR + CSR) |
| `createFormActionHandler(fn)` | Form action handler |

### @flint/runtime — Form Actions & Preloading

| Function | Description |
|----------|-------------|
| `createFormAction(options)` | Create form action |
| `preload(href, options)` | Preload resource |
| `preinit(href, options)` | Preinitialize resource |
| `prefetchDNS(origin)` | Prefetch DNS |
| `preconnect(origin)` | Preconnect to server |

### @flint/runtime — Styling

| Function | Description |
|----------|-------------|
| `createStyles(styles)` | Create CSS-in-JS styles |
| `createDynamicStyles(fn)` | Reactive dynamic styles |
| `setTheme(theme)` | Set theme |
| `getTheme()` | Get current theme |
| `cssVariablesFromTheme(theme)` | Generate CSS variables |
| `cx(...classes)` | Conditional class builder |
| `mergeStyles(...styles)` | Merge style objects |

### @flint/runtime — Animations

| Function | Description |
|----------|-------------|
| `Transition` | Single element transition |
| `TransitionGroup` | Group transition |
| `animate(el, keyframes, options)` | Animate element |
| `easings` | Easing functions library |

### @flint/runtime — Security

| Function | Description |
|----------|-------------|
| `escapeHtml(str)` | Escape HTML entities |
| `sanitizeInput(input)` | Sanitize user input |
| `generateCSP(rules)` | Generate Content Security Policy |
| `generateCSRFToken()` | Generate CSRF token |
| `validateCSRFToken(token)` | Validate CSRF token |
| `createRateLimiter(options)` | API rate limiter |

### @flint/runtime — Accessibility (a11y)

| Hook | Description |
|------|-------------|
| `useFocusTrap(container)` | Trap focus within container |
| `useFocusVisible()` | Detect keyboard vs mouse focus |
| `useKeyboard(handlers)` | Keyboard event handler |
| `useListNavigation(options)` | Arrow-key list navigation |
| `useAriaLive(priority)` | ARIA live region management |
| `useReducedMotion()` | Detect prefers-reduced-motion |
| `useRovingTabindex(options)` | Roving tabindex pattern |

### @flint/runtime — Performance

| Function | Description |
|----------|-------------|
| `initPerformance()` | Initialize monitoring |
| `trackRender(component)` | Track render time |
| `trackApi(name)` | Track API call time |
| `getWebVitals()` | Get CLS, FID, LCP metrics |

### @flint/runtime — i18n

| Function | Description |
|----------|-------------|
| `createI18n(options)` | Create i18n instance |
| `formatNumber(num, locale)` | Format numbers |
| `formatDate(date, locale)` | Format dates |
| `formatRelativeTime(date, locale)` | Format relative time |

### @flint/runtime — Data Fetching

| Function | Description |
|----------|-------------|
| `createQueryManager()` | Create query cache |
| `useQuery(options)` | Fetch data with caching |
| `useMutation(options)` | Mutate data |
| `invalidateQueries(key)` | Invalidate cached queries |

### @flint/runtime — SEO

| Function | Description |
|----------|-------------|
| `useSEO(meta)` | Set SEO meta tags |
| `useStructuredData(data)` | Add JSON-LD structured data |
| `createArticleSchema(data)` | Create Article schema |
| `createProductSchema(data)` | Create Product schema |

### @flint/runtime — PWA

| Function | Description |
|----------|-------------|
| `initPWA(options)` | Initialize PWA features |
| `isOnline()` | Check online status |
| `ServiceWorkerManager` | Service worker lifecycle |
| `CacheManager` | Cache storage management |

### @flint/runtime — Router

| Function | Description |
|----------|-------------|
| `createRouter(options)` | Create router |
| `navigate(path)` | Programmatic navigation |
| `useParams()` | Access route parameters |
| `useQueryParams()` | Access query parameters |
| `useLocation()` | Access current location |
| `Link` | Navigation link component |
| `Outlet` | Render child routes |
| `createLazyRoute(fn)` | Lazy-loaded route |

### @flint/store

| Function | Description |
|----------|-------------|
| `create(creator, middlewares?)` | Create store |
| `logger()` | Logger middleware |
| `persist(name, options?)` | Persistence middleware |
| `devtools(options?)` | Redux DevTools middleware |
| `immer()` | Immutable updates middleware |
| `createSelector(selector, equalityFn?)` | Memoized selector |
| `useStore(store, selector?)` | Use store in component |

### @flint/compiler

| Option | Description |
|--------|-------------|
| `autoMemoization` | Auto-memoize pure expressions |
| `staticHoisting` | Hoist static subtrees |
| `cssScoping` | Compile-time CSS scoping |
| `sourceMaps` | Generate source maps |
| `deadCodeElimination` | Remove dead code |
| `constantFolding` | Fold constants |
| `functionInlining` | Inline small functions |

### @flint/eslint-plugin

| Rule | Severity |
|------|----------|
| `no-state-outside-effect` | warn |
| `no-computed-in-render` | error |
| `prefer-signal-over-value` | warn |
| `no-reassign-signal` | error |
| `require-effect-cleanup` | warn |
| `no-nested-effect` | error |

### @flint/devtools

| Function | Description |
|----------|-------------|
| `initDevTools(options)` | Initialize client DevTools |
| `trackSignal(signal, name)` | Track signal changes |
| `trackComponent(name, props)` | Track component lifecycle |
| `trackPerformance(metric)` | Track performance metric |
| `buildSignalGraph()` | Build dependency graph |

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/flint.git

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build packages
pnpm build
```

### Code Style

- Use TypeScript for all source files
- Follow ESLint rules
- Write tests for new features
- Update documentation as needed

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ by the Flint Community**

[GitHub](https://github.com/salzcill-cmd/flint) • [Issues](https://github.com/salzcill-cmd/flint/issues)

</div>
