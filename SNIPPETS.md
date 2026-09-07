# Flint Quick Start Snippets

> Copy-paste ready code patterns for maximum speed

## Table of Contents

- [Hello World](#hello-world)
- [Counter](#counter)
- [Form](#form)
- [List](#list)
- [Conditional](#conditional)
- [Async Data](#async-data)
- [Store](#store)
- [Router](#router)
- [Modal](#modal)
- [Tabs](#tabs)
- [Theme](#theme)
- [Auth](#auth)

---

## Hello World

```jsx
// Minimal Flint app — 5 lines
function App() {
  const name = state('World')
  return <h1>Hello, {name()}!</h1>
}
render(App, '#app')
```

---

## Counter

```jsx
// Counter with model() — one object for everything
const counter = model({
  state: { count: 0, step: 1 },
  computed: { doubled: (s) => s.count * 2 },
  actions: {
    increment(s) { s.count += s.step },
    decrement(s) { s.count -= s.step },
    reset(s) { s.count = 0 },
  },
})

function App() {
  return (
    <div>
      <h1>{counter.count()}</h1>
      <button onClick={counter.decrement}>-</button>
      <button onClick={counter.increment}>+</button>
      <button onClick={counter.reset}>Reset</button>
      <p>Doubled: {counter.doubled()}</p>
    </div>
  )
}
```

---

## Form

```jsx
// Form with validation — useForm() does everything
const form = useForm(
  { email: '', password: '', remember: false },
  {
    email: [v.required(), v.email()],
    password: v.required(),
  },
  async (values) => {
    await login(values)
    console.log('Logged in!')
  }
)

function App() {
  return (
    <form {...form.formProps()}>
      <Input {...form.field('email')} label="Email" type="email" />
      <Input {...form.field('password')} label="Password" type="password" />
      <label>
        <input type="checkbox" {...form.field('remember')} />
        Remember me
      </label>
      <button disabled={!form.state.isValid() || form.state.isSubmitting()}>
        {form.state.isSubmitting() ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

---

## List

```jsx
// Todo list with add/delete/toggle
const todos = $store({
  items: [],
  newTodo: '',

  get remaining() {
    return this.items.filter(t => !t.done).length
  },

  addTodo(text) {
    this.items.push({ id: Date.now(), text, done: false })
  },

  toggleTodo(id) {
    const todo = this.items.find(t => t.id === id)
    if (todo) todo.done = !todo.done
  },

  removeTodo(id) {
    this.items = this.items.filter(t => t.id !== id)
  },
})

function App() {
  return (
    <div>
      <input
        value={todos.newTodo}
        onInput={(e) => todos.newTodo = e.target.value}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            todos.addTodo(todos.newTodo)
            todos.newTodo = ''
          }
        }}
      />
      <ul>
        {todos.items.map(todo => (
          <li key={todo.id} style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
            <input type="checkbox" checked={todo.done} onChange={() => todos.toggleTodo(todo.id)} />
            {todo.text}
            <button onClick={() => todos.removeTodo(todo.id)}>×</button>
          </li>
        ))}
      </ul>
      <p>{todos.remaining} items left</p>
    </div>
  )
}
```

---

## Conditional

```jsx
// Show/Hide with When
const isVisible = state(true)

function App() {
  return (
    <div>
      <When condition={isVisible()}>
        <div class="card">
          <h2>Visible Content</h2>
          <button onClick={() => isVisible.set(false)}>Hide</button>
        </div>
      </When>
      <When condition={!isVisible()}>
        <button onClick={() => isVisible.set(true)}>Show</button>
      </When>
    </div>
  )
}
```

---

## Async Data

```jsx
// Fetch data with useAsync
function App() {
  const { data: users, isLoading, error } = useAsync(
    () => fetch('/api/users').then(r => r.json())
  )

  if (isLoading()) return <Spinner />
  if (error()) return <Alert type="error">{error().message}</Alert>

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

## Store

```jsx
// Global store with createStore
const useAuthStore = createStore({
  user: null,
  token: null,

  get isLoggedIn() {
    return this.user !== null
  },

  async login(email, password) {
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    this.user = data.user
    this.token = data.token
  },

  logout() {
    this.user = null
    this.token = null
  },
})

function App() {
  const { user, isLoggedIn, login, logout } = useAuthStore()

  return (
    <div>
      <When condition={isLoggedIn()}>
        <p>Welcome, {user().name}!</p>
        <button onClick={logout}>Logout</button>
      </When>
      <When condition={!isLoggedIn()}>
        <button onClick={() => login('test@example.com', 'password')}>
          Login
        </button>
      </When>
    </div>
  )
}
```

---

## Router

```jsx
// SPA routing with Router
import { Router, Link, useNavigate } from 'flint'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/users/:id', component: UserProfile },
  { path: '*', component: NotFound },
]

function App() {
  return (
    <Router routes={routes}>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <Outlet />
    </Router>
  )
}

function UserProfile() {
  const params = useParams()
  return <h1>User {params.id}</h1>
}
```

---

## Modal

```jsx
// Modal with state toggle
const showModal = state(false)

function App() {
  return (
    <div>
      <button onClick={() => showModal.set(true)}>Open Modal</button>

      <Modal open={showModal()} onClose={() => showModal.set(false)}>
        <h2>Modal Title</h2>
        <p>Modal content goes here.</p>
        <button onClick={() => showModal.set(false)}>Close</button>
      </Modal>
    </div>
  )
}
```

---

## Tabs

```jsx
// Tab navigation
const activeTab = state('home')

function App() {
  return (
    <div>
      <Tabs
        value={activeTab()}
        onChange={activeTab.set}
        items={[
          { key: 'home', label: 'Home', content: <Home /> },
          { key: 'settings', label: 'Settings', content: <Settings /> },
          { key: 'profile', label: 'Profile', content: <Profile /> },
        ]}
      />
    </div>
  )
}
```

---

## Theme

```jsx
// Dark/Light theme toggle
const theme = useLocalStorage('theme', 'light')

function App() {
  return (
    <div class={theme() === 'dark' ? 'dark' : 'light'}>
      <button onClick={() => theme.set(theme() === 'dark' ? 'light' : 'dark')}>
        Toggle Theme
      </button>
    </div>
  )
}
```

---

## Auth

```jsx
// Complete auth flow with forms
const auth = useForm(
  { email: '', password: '' },
  {
    email: [v.required(), v.email()],
    password: [v.required(), v.minLength(6)],
  },
  async (values) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify(values),
    })
    if (!res.ok) throw new Error('Login failed')
    const data = await res.json()
    localStorage.setItem('token', data.token)
  }
)

function App() {
  return (
    <form {...auth.formProps()}>
      <Input {...auth.field('email')} label="Email" type="email" />
      <Input {...auth.field('password')} label="Password" type="password" />
      <Button type="submit" loading={auth.state.isSubmitting()}>
        Login
      </Button>
    </form>
  )
}
```

---

## More Snippets

See [COMPARISON.md](../COMPARISON.md) for comparisons with React, Vue, Svelte, and Solid.
