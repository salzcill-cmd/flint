# Flint Potongan Kode Cepat

> Pola kode siap tempel untuk kecepatan maksimal

## Daftar Isi

- [Hello World](#hello-world)
- [Counter](#counter)
- [Formulir](#formulir)
- [List](#list)
- [Kondisional](#kondisional)
- [Data Async](#data-async)
- [Store](#store)
- [Router](#router)
- [Modal](#modal)
- [Tab](#tab)
- [Tema](#tema)
- [Autentikasi](#autentikasi)

---

## Hello World

```jsx
// Aplikasi Flint minimal — 5 baris
function App() {
  const name = state('Dunia')
  return <h1>Halo, {name()}!</h1>
}
render(App, '#app')
```

---

## Counter

```jsx
// Counter dengan model() — satu object untuk semua
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
      <p>Dobel: {counter.doubled()}</p>
    </div>
  )
}
```

---

## Formulir

```jsx
// Formulir dengan validasi — useForm() menangani semua
const form = useForm(
  { email: '', password: '', remember: false },
  {
    email: [v.required(), v.email()],
    password: v.required(),
  },
  async (values) => {
    await login(values)
    console.log('Login berhasil!')
  }
)

function App() {
  return (
    <form {...form.formProps()}>
      <Input {...form.field('email')} label="Email" type="email" />
      <Input {...form.field('password')} label="Password" type="password" />
      <label>
        <input type="checkbox" {...form.field('remember')} />
        Ingat saya
      </label>
      <button disabled={!form.state.isValid() || form.state.isSubmitting()}>
        {form.state.isSubmitting() ? 'Masuk...' : 'Login'}
      </button>
    </form>
  )
}
```

---

## List

```jsx
// Todo list dengan tambah/hapus/toggle
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
      <p>{todos.remaining} item tersisa</p>
    </div>
  )
}
```

---

## Kondisional

```jsx
// Tampilkan/Sembunyikan dengan When
const isVisible = state(true)

function App() {
  return (
    <div>
      <When condition={isVisible()}>
        <div class="card">
          <h2>Konten Terlihat</h2>
          <button onClick={() => isVisible.set(false)}>Sembunyikan</button>
        </div>
      </When>
      <When condition={!isVisible()}>
        <button onClick={() => isVisible.set(true)}>Tampilkan</button>
      </When>
    </div>
  )
}
```

---

## Data Async

```jsx
// Ambil data dengan useAsync
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
// Store global dengan createStore
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
        <p>Selamat datang, {user().name}!</p>
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
// Routing SPA dengan Router
import { Router, Link, useNavigate } from 'flint'

const routes = [
  { path: '/', component: Home },
  { path: '/tentang', component: About },
  { path: '/pengguna/:id', component: UserProfile },
  { path: '*', component: NotFound },
]

function App() {
  return (
    <Router routes={routes}>
      <nav>
        <Link to="/">Beranda</Link>
        <Link to="/tentang">Tentang</Link>
      </nav>
      <Outlet />
    </Router>
  )
}

function UserProfile() {
  const params = useParams()
  return <h1>Pengguna {params.id}</h1>
}
```

---

## Modal

```jsx
// Modal dengan toggle state
const showModal = state(false)

function App() {
  return (
    <div>
      <button onClick={() => showModal.set(true)}>Buka Modal</button>

      <Modal open={showModal()} onClose={() => showModal.set(false)}>
        <h2>Judul Modal</h2>
        <p>Isi modal ada di sini.</p>
        <button onClick={() => showModal.set(false)}>Tutup</button>
      </Modal>
    </div>
  )
}
```

---

## Tab

```jsx
// Navigasi tab
const activeTab = state('beranda')

function App() {
  return (
    <div>
      <Tabs
        value={activeTab()}
        onChange={activeTab.set}
        items={[
          { key: 'beranda', label: 'Beranda', content: <Home /> },
          { key: 'pengaturan', label: 'Pengaturan', content: <Settings /> },
          { key: 'profil', label: 'Profil', content: <Profile /> },
        ]}
      />
    </div>
  )
}
```

---

## Tema

```jsx
// Toggle tema Gelap/Terang
const theme = useLocalStorage('theme', 'light')

function App() {
  return (
    <div class={theme() === 'dark' ? 'dark' : 'light'}>
      <button onClick={() => theme.set(theme() === 'dark' ? 'light' : 'dark')}>
        Ganti Tema
      </button>
    </div>
  )
}
```

---

## Autentikasi

```jsx
// Alur autentikasi lengkap dengan formulir
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
    if (!res.ok) throw new Error('Login gagal')
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

## Potongan Kode Lainnya

Lihat [COMPARISON.id.md](../COMPARISON.id.md) untuk perbandingan dengan React, Vue, Svelte, dan Solid.
