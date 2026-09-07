# Flint

A JavaScript framework built around one idea: you write less code, and it runs faster.

Flint uses fine-grained signals instead of a virtual DOM. When state changes, only the exact DOM node that depends on it updates. No diffing, no reconciliation, no wasted work.

```
npm create flint my-app
cd my-app
npm run dev
```

That's it. You're running.

---

## Why Flint Exists

Most frameworks ask you to manage state, memoize values, track dependencies, and manually optimize re-renders. Flint removes that work entirely.

Your component function runs once. After that, only the signals you read get tracked, and only the DOM nodes that depend on those signals update. You don't write `useMemo`, `useCallback`, or dependency arrays. The compiler handles it.

```jsx
// This whole component renders once. After that:
// - count() updates only the <p> tag
// - doubled() updates only the second <p> tag
// - Nothing else re-renders
function Counter() {
  const count = state(0)
  const doubled = computed(() => count() * 2)

  return (
    <div>
      <p>Count: {count()}</p>
      <p>Doubled: {doubled()}</p>
      <button onClick={() => count.set(c => c + 1)}>+1</button>
    </div>
  )
}
```

Compare that to React, where you'd need `useState`, `useMemo`, and careful dependency tracking to get the same result.

---

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm, pnpm, or yarn

### Create a Project

```bash
npx create-flint my-app
cd my-app
npm run dev
```

The CLI asks you to pick a template: blank, counter, todo, reactive, dashboard, landing, or auth. Pick one and you're coding in seconds.

### Manual Setup

```bash
mkdir my-app && cd my-app
npm init -y
npm install flint
npm install -D vite @flint/vite-plugin typescript
```

Create these files:

**vite.config.js**
```js
import { defineConfig } from 'vite'
import flint from '@flint/vite-plugin'

export default defineConfig({
  plugins: [flint()]
})
```

**index.html**
```html
<!DOCTYPE html>
<html>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

**src/main.jsx**
```jsx
import { render } from 'flint'

function App() {
  return <h1>Hello, Flint!</h1>
}

render(App, '#app')
```

Run `npm run dev` and open your browser.

---

## Core Concepts

### Signals

Signals hold reactive state. When you change a signal's value, every DOM node that read that signal updates automatically.

```jsx
const count = state(0)

count()       // read: 0
count.set(5)  // update
count()       // read: 5
```

That's the whole API for basic state.

### Computed Values

A computed value derives from other signals. It recalculates only when its dependencies change, and it caches the result.

```jsx
const count = state(0)
const doubled = computed(() => count() * 2)

doubled()  // 0
count.set(3)
doubled()  // 6
```

### Effects

An effect runs code whenever its dependencies change. Use it to sync reactive state with the outside world.

```jsx
const count = state(0)

effect(() => {
  document.title = `Count: ${count()}`
})
```

When `count` changes, the document title updates. No dependency arrays, no stale closures.

### Reactive Objects

For complex state, `reactive()` creates a proxy object. Mutations to the object trigger updates automatically.

```jsx
const user = reactive({ name: 'Alice', age: 30 })

user.name = 'Bob'  // triggers re-render where user.name is used
user.age++          // triggers re-render where user.age is used
```

### model()

`model()` bundles state, computed values, and actions into a single object. It's the fastest way to build interactive components.

```jsx
const counter = model({
  state: { count: 0, step: 1 },
  computed: {
    doubled: (s) => s.count * 2,
  },
  actions: {
    increment(s) { s.count += s.step },
    decrement(s) { s.count -= s.step },
    reset(s) { s.count = 0 },
  },
})

// In your component:
<button onClick={counter.increment}>+1</button>
<p>Count: {counter.count()}</p>
<p>Doubled: {counter.doubled()}</p>
```

---

## Components

A component is a function that returns JSX. It runs once, and signals handle the rest.

```jsx
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>
}

<Greeting name="Alice" />
```

### Lifecycle

```jsx
function Dashboard() {
  onMount(() => {
    console.log('mounted')
    // fetch data, start subscriptions, etc.
  })

  onDestroy(() => {
    console.log('cleaned up')
  })

  return <div>Dashboard</div>
}
```

### Refs

Access DOM elements directly:

```jsx
function SearchBox() {
  const inputRef = ref()

  onMount(() => {
    inputRef.current?.focus()
  })

  return <input ref={inputRef} type="search" />
}
```

---

## Conditional Rendering

Flint gives you `<Show>` and `<When>` for conditional rendering.

```jsx
const isLoggedIn = state(false)

// Using When (simpler)
<When condition={isLoggedIn()}>
  <p>Welcome back!</p>
</When>

// Using Show (with fallback)
<Show when={isLoggedIn()} fallback={<p>Please log in</p>}>
  <p>Welcome back!</p>
</Show>
```

---

## List Rendering

Use `<For>` to render lists with fine-grained updates. Only the changed item re-renders, not the whole list.

```jsx
const todos = state([
  { id: 1, text: 'Learn Flint', done: false },
  { id: 2, text: 'Build something', done: false },
])

<ul>
  <For each={todos()}>
    {(todo) => (
      <li style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
        {todo.text}
      </li>
    )}
  </For>
</ul>
```

---

## Styling

Use inline styles, CSS classes, or the built-in `createStyles` for scoped CSS-in-JS.

```jsx
// Inline
<div style={{ color: 'red', fontSize: '20px' }}>Red text</div>

// Classes
<div className="container">Styled div</div>

// Scoped CSS-in-JS
const styles = createStyles({
  card: { padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  title: { fontSize: '24px', fontWeight: 'bold' },
})

<div className={styles.classNames.card}>
  <h2 className={styles.classNames.title}>Card Title</h2>
</div>
```

---

## State Management

### Local State

For component-level state, use `state()` directly.

### Global Store

For shared state across components, use `createStore()`.

```jsx
const useStore = create((set) => ({
  todos: [],
  addTodo: (text) => set((state) => ({
    todos: [...state.todos, { id: Date.now(), text, done: false }]
  })),
  toggleTodo: (id) => set((state) => ({
    todos: state.todos.map(t => t.id === id ? { ...t, done: !t.done } : t)
  })),
}))

function TodoApp() {
  const { todos, addTodo, toggleTodo } = useStore()
  return (
    <div>
      <button onClick={() => addTodo('New todo')}>Add</button>
      {todos.map(todo => (
        <div key={todo.id} onClick={() => toggleTodo(todo.id)}>
          {todo.done ? '✓' : '○'} {todo.text}
        </div>
      ))}
    </div>
  )
}
```

### Middleware

```jsx
const useStore = create(
  (set) => ({ count: 0, increment: () => set(s => ({ count: s.count + 1 })) }),
  [logger(), persist('counter')]
)
```

---

## Fetching Data

### Simple Fetch

```jsx
function UserProfile({ userId }) {
  const { data, error, loading } = $api(`/api/users/${userId}`)

  if (loading()) return <p>Loading...</p>
  if (error()) return <p>Error: {error().message}</p>
  return <p>{data().name}</p>
}
```

### HTTP Client

```jsx
const api = $http({ baseUrl: '/api', token: 'abc123' })

const users = await api.get('/users')
const newUser = await api.post('/users', { name: 'Alice' })
```

### Cached Queries

```jsx
const todos = $query({
  key: 'todos',
  fetch: () => fetch('/api/todos').then(r => r.json()),
  staleTime: 5 * 60 * 1000,  // cache for 5 minutes
})

todos.data()    // the cached data
todos.refetch() // force a refresh
```

---

## Routing

```jsx
import { createRouter, Link, Outlet } from 'flint'

const router = createRouter({
  routes: [
    { path: '/', component: () => <Home /> },
    { path: '/about', component: () => <About /> },
    { path: '/users/:id', component: () => <UserProfile /> },
  ],
})

function App() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
    </nav>
    <Outlet />
  </nav>
  )
}
```

### Lazy Routes

```jsx
const routes = [
  { path: '/dashboard', lazy: () => import('./Dashboard') },
  { path: '/settings', lazy: () => import('./Settings') },
]
```

---

## Forms

```jsx
const form = useForm(
  { email: '', password: '' },
  {
    email: [v.required(), v.email()],
    password: v.required(),
  },
  async (values) => {
    await login(values)
  }
)

<form {...form.formProps()}>
  <Input {...form.field('email')} label="Email" type="email" />
  <Input {...form.field('password')} label="Password" type="password" />
  <button disabled={!form.state.isValid()}>Login</button>
</form>
```

---

## Testing

```bash
npm install -D vitest @testing-library/jest-dom
```

```jsx
import { describe, it, expect } from 'vitest'
import { testRender } from 'flint'

describe('Counter', () => {
  it('increments', () => {
    const { click, textContent } = testRender(() => <Counter />)
    expect(textContent('p')).toBe('0')
    click('button')
    expect(textContent('p')).toBe('1')
  })
})
```

---

## Solid/React Compatibility

Coming from Solid.js or React? Flint supports both API styles.

```jsx
// Solid.js style
const [count, setCount] = createSignal(0)
createEffect(() => console.log(count()))
const doubled = createMemo(() => count() * 2)

// React style (same thing, different names)
const [name, setName] = createSignal('Alice')
```

These are aliases for Flint's `state()`, `effect()`, and `computed()` functions. Use whichever style feels natural.

---

## Reactivity API Reference

| Function | What It Does |
|----------|--------------|
| `state(initial)` | Create a reactive signal |
| `computed(fn)` | Derive a cached value from signals |
| `effect(fn)` | Run code when dependencies change |
| `reactive(obj)` | Create a proxy-based reactive object |
| `model(config)` | Bundle state + computed + actions |
| `batch(fn)` | Group multiple updates into one render |
| `watch(signal, cb)` | Watch a signal and run on change |
| `watchDebounced(signal, cb, ms)` | Debounced watching |
| `onMount(fn)` | Run after component mounts |
| `onDestroy(fn)` | Run when component unmounts |

## Solid Aliases

| Solid.js | Flint Equivalent |
|----------|------------------|
| `createSignal(0)` | `state(0)` |
| `createEffect(fn)` | `effect(fn)` |
| `createMemo(fn)` | `computed(fn)` |
| `createStore(obj)` | `reactive(obj)` |
| `createResource(src, fn)` | `$api(url)` or `$query({...})` |
| `createRoot(fn)` | `createRoot(fn)` |
| `batch(fn)` | `batch(fn)` |

## Components

| Component | What It Does |
|-----------|--------------|
| `<Show when={cond}>` | Conditional render with fallback |
| `<When condition={cond}>` | Simplified conditional |
| `<For each={list}>` | Keyed list rendering |
| `<Switch>/<Match>` | Pattern matching |
| `<Portal>` | Render to a different DOM node |
| `<Suspense>` | Async loading boundary |
| `<ErrorBoundary>` | Catch errors |
| `lazy(() => import('./X'))` | Lazy-load a component |

## Utility Functions

| Function | What It Does |
|----------|--------------|
| `$api(url, opts)` | Fetch with reactive loading/error state |
| `$http(opts)` | Create an HTTP client with methods |
| `$query({ key, fetch })` | Cached query with refetch |
| `$mutation({ mutation })` | Mutation with optimistic updates |
| `createStyles(obj)` | Scoped CSS-in-JS |
| `useForm(values, rules, submit)` | Form with validation |
| `debounce(fn, ms)` | Debounce a function |
| `throttle(fn, ms)` | Throttle a function |
| `clamp(val, min, max)` | Clamp a number |
| `lerp(a, b, t)` | Linear interpolation |

---

## Project Structure

```
my-app/
├── src/
│   ├── components/
│   │   └── Counter.jsx
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b my-feature`
3. Make changes and add tests
4. Run `pnpm test` to verify
5. Push and open a PR

---

## License

MIT

---

<div align="center">

**Flint** — Less code. Faster apps. Better DX.

[GitHub](https://github.com/salzcill-cmd/flint)

</div>
