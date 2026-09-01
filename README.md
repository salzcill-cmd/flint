<div align="center">

# 🔥 Flint

### Write less. Ship faster. Build beautifully.

A modern JavaScript framework with fine-grained signals, JSX, and zero Virtual DOM.

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/Tests-301%20passing-brightgreen)]()
[![Version](https://img.shields.io/badge/Version-2.0.0-blue)]()

[Getting Started](#-getting-started) • [Examples](#-examples) • [API Reference](#-api-reference) • [Contributing](#-contributing)

</div>

---

## Table of Contents

- [What is Flint?](#-what-is-flint)
- [Why Flint?](#-why-flint)
- [Getting Started](#-getting-started)
- [Core Concepts](#-core-concepts)
  - [Signals (Reactivity)](#signals-reactivity)
  - [Components](#components)
  - [JSX](#jsx)
  - [Rendering](#rendering)
- [Built-in Components](#-built-in-components)
- [Styling](#-styling)
- [Forms & Validation](#-forms--validation)
- [Router](#-router)
- [State Management](#-state-management)
- [Server-Side Rendering](#-server-side-rendering)
- [Animations](#-animations)
- [Testing](#-testing)
- [DevTools](#-devtools)
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

---

## Why Flint?

### Comparison with Other Frameworks

| Feature | Flint | React | Vue | Svelte |
|---------|-------|-------|-----|--------|
| Virtual DOM | ❌ None | ✅ Yes | ✅ Yes | ❌ None |
| Fine-Grained Reactivity | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| Bundle Size (gzip) | ~5KB | ~40KB | ~30KB | ~3KB |
| Learning Curve | Easy | Medium | Easy | Easy |
| TypeScript Support | First-Class | Good | Good | Good |
| Compiler Optimization | ✅ Yes | ❌ No | ❌ No | ✅ Yes |

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

## Built-in Components

### Show

Conditional rendering.

```jsx
import { Show } from '@flint/runtime'

<Show
  when={isLoggedIn()}
  fallback={<LoginButton />}
>
  <Dashboard />
</Show>
```

### For

List rendering.

```jsx
import { For } from '@flint/runtime'

const items = state(['Apple', 'Banana', 'Cherry'])

<For each={items()}>
  {(item, index) => (
    <li>{index()}: {item}</li>
  )}
</For>
```

### Index

List rendering with index.

```jsx
import { Index } from '@flint/runtime'

<Index each={items()}>
  {(item, index) => (
    <li>{index}: {item()}</li>
  )}
</Index>
```

### Switch

Multi-condition rendering.

```jsx
import { Switch, Match } from '@flint/runtime'

<Switch>
  <Match when={status() === 'loading'}>
    <Spinner />
  </Match>
  <Match when={status() === 'error'}>
    <ErrorMessage />
  </Match>
  <Match when={status() === 'success'}>
    <Content />
  </Match>
</Switch>
```

### Portal

Render content in a different DOM node.

```jsx
import { Portal } from '@flint/runtime'

<Portal mount={document.body}>
  <Modal>Content</Modal>
</Portal>
```

### Suspense

Handle async loading.

```jsx
import { Suspense } from '@flint/runtime'

<Suspense fallback={<Spinner />}>
  <AsyncComponent />
</Suspense>
```

### Memo

Optimize expensive computations.

```jsx
import { memo } from '@flint/runtime'

const expensiveValue = memo(() => {
  return heavyComputation(data())
})
```

---

## Styling

### CSS-in-JS

```jsx
import { createStyles } from '@flint/runtime'

const styles = createStyles({
  container: {
    padding: '20px',
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
})

function MyComponent() {
  return (
    <div class={styles.container}>
      <h1 class={styles.title}>Hello</h1>
    </div>
  )
}
```

### Dynamic Styles

```jsx
import { createDynamicStyles } from '@flint/runtime'

const styles = createDynamicStyles({
  button: (color) => ({
    backgroundColor: color,
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  }),
})

function ColoredButton({ color, children }) {
  return (
    <button class={styles.button(color)}>
      {children}
    </button>
  )
}
```

### Theming

```jsx
import { setTheme, getTheme, cssVariablesFromTheme } from '@flint/runtime'

// Set theme
setTheme({
  primary: '#3498db',
  secondary: '#2ecc71',
  background: '#ffffff',
})

// Get current theme
const theme = getTheme()

// Apply as CSS variables
cssVariablesFromTheme(theme, document.documentElement)
```

### Responsive Design

```jsx
import { responsive, mediaQuery } from '@flint/runtime'

// Responsive styles
const styles = responsive({
  mobile: {
    padding: '10px',
    fontSize: '14px',
  },
  tablet: {
    padding: '20px',
    fontSize: '16px',
  },
  desktop: {
    padding: '40px',
    fontSize: '18px',
  },
})

// Media query helper
const isMobile = mediaQuery('(max-width: 768px)')
```

### Keyframes

```jsx
import { createKeyframes } from '@flint/runtime'

const animations = createKeyframes({
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  slideUp: {
    from: { transform: 'translateY(20px)' },
    to: { transform: 'translateY(0)' },
  },
})

function AnimatedComponent() {
  return (
    <div style={{ animation: `${animations.fadeIn} 0.3s ease` }}>
      Animated content
    </div>
  )
}
```

---

## Forms & Validation

### Basic Form

```jsx
import { createForm, validators } from '@flint/runtime'

function LoginForm() {
  const form = createForm({
    initialValues: {
      email: '',
      password: '',
    },
    validation: {
      email: [validators.required(), validators.email()],
      password: [validators.required(), validators.minLength(8)],
    },
    onSubmit: async (values) => {
      await login(values)
    },
  })

  return (
    <form onSubmit={form.handleSubmit}>
      <div>
        <input
          type="email"
          {...form.bind('email')}
          placeholder="Email"
        />
        {form.errors.email && (
          <span>{form.errors.email}</span>
        )}
      </div>
      <div>
        <input
          type="password"
          {...form.bind('password')}
          placeholder="Password"
        />
        {form.errors.password && (
          <span>{form.errors.password}</span>
        )}
      </div>
      <button type="submit" disabled={!form.isValid()}>
        Login
      </button>
    </form>
  )
}
```

### Built-in Validators

```javascript
import { validators } from '@flint/runtime'

// Required
validators.required()

// Email
validators.email()

// Min/Max Length
validators.minLength(8)
validators.maxLength(100)

// Min/Max Value
validators.min(0)
validators.max(100)

// Pattern (Regex)
validators.pattern(/^[A-Z]/)

// URL
validators.url()

// Phone
validators.phone()

// Custom validator
validators.custom((value) => {
  return value.includes('@') ? true : 'Must contain @'
})

// Match (password confirmation)
validators.password('password')
```

### Async Validation

```javascript
const form = createForm({
  initialValues: {
    username: '',
  },
  validation: {
    username: [
      validators.required(),
      validators.custom(async (value) => {
        const exists = await checkUsernameExists(value)
        return exists ? 'Username taken' : true
      }),
    ],
  },
})
```

---

## Router

### Basic Setup

```jsx
import { createRouter, Link, Outlet } from '@flint/runtime'

const router = createRouter({
  routes: [
    { path: '/', component: () => <Home /> },
    { path: '/about', component: () => <About /> },
    { path: '/users/:id', component: () => <UserProfile /> },
  ],
})

function App() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <Outlet />
    </div>
  )
}

router.start()
```

### Route Parameters

```jsx
// Access params in component
function UserProfile() {
  const params = useParams()
  
  return <div>User ID: {params().id}</div>
}
```

### Query Parameters

```jsx
function SearchPage() {
  const query = useQuery()
  
  return <div>Search: {query().q}</div>
}
```

### Navigation

```jsx
import { navigate } from '@flint/runtime'

// Programmatic navigation
const goToUser = (id) => {
  navigate(`/users/${id}`)
}

// Replace current history
navigate('/login', { replace: true })
```

### Route Guards

```jsx
const router = createRouter({
  routes: [
    {
      path: '/dashboard',
      component: () => <Dashboard />,
      guard: (to, from) => {
        // Return true to allow, false to block, or string to redirect
        return isLoggedIn() ? true : '/login'
      },
    },
  ],
})
```

### Nested Routes

```jsx
const router = createRouter({
  routes: [
    {
      path: '/dashboard',
      component: () => <DashboardLayout />,
      children: [
        { path: 'settings', component: () => <Settings /> },
        { path: 'profile', component: () => <Profile /> },
      ],
    },
  ],
})
```

---

## State Management

### Local State (Signals)

```jsx
function Counter() {
  const count = state(0)
  
  return (
    <div>
      <p>{count()}</p>
      <button onClick={() => count.set(prev => prev + 1)}>
        +
      </button>
    </div>
  )
}
```

### Global State (Store)

```jsx
import { createStore } from '@flint/runtime'

// Create global store
const useStore = createStore({
  state: {
    user: null,
    theme: 'light',
    notifications: [],
  },
  actions: {
    setUser(state, user) {
      state.user = user
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
    addNotification(state, notification) {
      state.notifications.push(notification)
    },
  },
})

// Usage in component
function Header() {
  const { user, theme } = useStore()
  
  return (
    <header class={theme()}>
      Welcome, {user()?.name}
    </header>
  )
}
```

### Provide/Inject

```jsx
import { provide, inject, createInjectionKey } from '@flint/runtime'

// Create injection key
const ThemeKey = createInjectionKey('theme')

// Provider (parent)
function App() {
  provide(ThemeKey, () => state('light'))
  
  return <Child />
}

// Consumer (child)
function Child() {
  const theme = inject(ThemeKey)
  
  return <div class={theme()}>Themed content</div>
}
```

---

## Server-Side Rendering

### Basic SSR

```jsx
import { renderToString } from '@flint/runtime'

const html = await renderToString(() => <App />)
```

### Streaming SSR

```jsx
import { renderToPipeableStream } from '@flint/runtime'

const stream = renderToPipeableStream(() => <App />)

// Pipe to response
stream.pipe(res)
```

### Hydration

```jsx
import { hydrate } from '@flint/runtime'

// Hydrate server-rendered HTML
hydrate(() => <App />, document.getElementById('app'))
```

### Data Loading

```jsx
import { dataLoader } from '@flint/runtime'

// Define data loader
const userDataLoader = dataLoader(async ({ params }) => {
  const user = await fetchUser(params.id)
  return { user }
})

// Use in route
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

## Animations

### Transitions

```jsx
import { Transition } from '@flint/runtime'

function Modal({ isOpen, onClose }) {
  return (
    <Transition
      show={isOpen()}
      options={{
        enter: { duration: 300 },
        exit: { duration: 200 },
      }}
    >
      <div class="modal">
        <h2>Modal Title</h2>
        <p>Modal content</p>
        <button onClick={onClose}>Close</button>
      </div>
    </Transition>
  )
}
```

### Element Animation

```jsx
import { useAnimate, easings } from '@flint/runtime'

function AnimatedBox() {
  const { animate, isAnimating } = useAnimate()
  
  const handleClick = () => {
    animate(
      [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.1)', opacity: 0.8 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      {
        duration: 300,
        easing: easings.easeInOutCubic,
      }
    )
  }
  
  return (
    <div
      class="box"
      onClick={handleClick}
      style={{
        transform: isAnimating() ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      Click me!
    </div>
  )
}
```

### Preset Animations

```jsx
import { presets } from '@flint/runtime'

// Available presets:
// - fadeIn / fadeOut
// - slideUp / slideDown
// - scale
// - bounce
// - flip

<Transition show={visible()} options={presets.fadeIn}>
  <div>Fading content</div>
</Transition>
```

---

## Testing

### Setup

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

### Testing Async

```jsx
import { testRender, flushPromises } from '@flint/runtime'

it('loads data', async () => {
  const { querySelector } = testRender(() => <DataComponent />)
  
  await flushPromises()
  
  expect(querySelector('.data')).toBeDefined()
})
```

### Mocking

```jsx
import { createMockFetch, createSpy } from '@flint/runtime'

// Mock fetch
const mockFetch = createMockFetch({
  '/api/users': [{ id: 1, name: 'John' }],
})

// Mock functions
const spy = createSpy()
component.onClick = spy
```

---

## DevTools

### Enable DevTools

```jsx
import { enableDebug, trackSignal } from '@flint/reactivity'

// Enable debug mode
enableDebug()

// Track signals
const count = state(0)
const tracked = trackSignal('count', count)

tracked.set(1)
// Console: [Flint Debug] Signal "count" changed: 0 -> 1
```

### State Inspector

```jsx
import { 
  calculateStateDiff, 
  recordState, 
  undo, 
  redo 
} from '@flint/runtime'

// Record state changes
recordState({ count: 1 }, 'increment')
recordState({ count: 2 }, 'increment')

// Undo/Redo
const prevState = undo() // { count: 1 }
const nextState = redo() // { count: 2 }

// Compare states
const diff = calculateStateDiff(
  { count: 1, name: 'John' },
  { count: 2, name: 'John', age: 30 }
)
// { added: { age: 30 }, removed: {}, changed: { count: { old: 1, new: 2 } } }
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

### Todo App

```jsx
import { state, computed } from '@flint/reactivity'
import { For } from '@flint/runtime'

function TodoApp() {
  const todos = state([])
  const newTodo = state('')
  const remaining = computed(() => todos().filter(t => !t.done).length)
  
  const addTodo = () => {
    if (newTodo()) {
      todos.set(prev => [...prev, { text: newTodo(), done: false }])
      newTodo.set('')
    }
  }
  
  const toggleTodo = (index) => {
    todos.set(prev => prev.map((t, i) => 
      i === index ? { ...t, done: !t.done } : t
    ))
  }
  
  return (
    <div>
      <h1>Todo App</h1>
      <p>Remaining: {remaining()}</p>
      <input
        value={newTodo()}
        onInput={(e) => newTodo.set(e.target.value)}
        placeholder="Add todo..."
      />
      <button onClick={addTodo}>Add</button>
      <ul>
        <For each={todos()}>
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

### Fetch Data

```jsx
import { state, onMount } from '@flint/runtime'

function UserList() {
  const users = state([])
  const loading = state(true)
  const error = state(null)
  
  onMount(async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      users.set(data)
    } catch (err) {
      error.set(err.message)
    } finally {
      loading.set(false)
    }
  })
  
  if (loading()) return <p>Loading...</p>
  if (error()) return <p>Error: {error()}</p>
  
  return (
    <ul>
      {users().map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
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
| `enableDebug()` | Enable debug mode |
| `trackSignal(name, signal)` | Track signal changes |

### @flint/runtime

| Function | Description |
|----------|-------------|
| `render(fn, container)` | Render component to DOM |
| `h(tag, props, ...children)` | Create virtual node |
| `component(fn)` | Create component |
| `onMount(fn)` | Run on mount |
| `onUpdate(fn)` | Run on update |
| `onDestroy(fn)` | Run on destroy |
| `ref()` | Create DOM ref |
| `provide(key, value)` | Provide value to children |
| `inject(key)` | Inject value from parent |
| `createStore(options)` | Create global store |
| `createRouter(options)` | Create router |
| `renderToString(fn)` | Render to HTML string |
| `createStyles(styles)` | Create CSS-in-JS styles |
| `createForm(options)` | Create form with validation |

### Built-in Components

| Component | Description |
|-----------|-------------|
| `<Show when={condition}>` | Conditional rendering |
| `<For each={array}>` | List rendering |
| `<Switch>/<Match>` | Multi-condition rendering |
| `<Portal>` | Render in different DOM node |
| `<Suspense>` | Handle async loading |
| `<Transition>` | Enter/leave animations |
| `<Link to={path}>` | Navigation link |
| `<Outlet>` | Nested route outlet |

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
