# Flint

Framework JavaScript yang dirancang agar kamu menulis lebih sedikit kode, tapi aplikasinya berjalan lebih cepat.

Flint menggunakan fine-grained signals alih-alih virtual DOM. Ketika state berubah, hanya DOM node yang bergantung padanya yang diperbarui. Tidak ada diffing, tidak ada reconciliation, tidak ada pekerjaan sia-sia.

```
npm create flint my-app
cd my-app
npm run dev
```

Selesai. Aplikasi kamu sudah jalan.

---

## Kenapa Flint Ada

Kebanyakan framework meminta kamu mengelola state, memoize value, melacak dependency, dan mengoptimalkan re-render secara manual. Flint menghapus semua pekerjaan itu.

Fungsi component kamu hanya berjalan sekali. Setelah itu, hanya signal yang kamu baca yang dilacak, dan hanya DOM node yang bergantung pada signal tersebut yang diperbarui. Kamu tidak perlu menulis `useMemo`, `useCallback`, atau dependency array. Compiler yang menangani.

```jsx
// Seluruh component ini render sekali. Setelah itu:
// - count() hanya memperbarui tag <p> pertama
// - doubled() hanya memperbarui tag <p> kedua
// - Tidak ada yang re-render lagi
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

Bandingkan dengan React, di mana kamu butuh `useState`, `useMemo`, dan dependency tracking yang hati-hati untuk hasil yang sama.

---

## Mulai Cepat

### Yang Dibutuhkan

- Node.js 18 atau lebih tinggi
- npm, pnpm, atau yarn

### Buat Proyek

```bash
npx create-flint my-app
cd my-app
npm run dev
```

CLI akan menanyakan template mana yang ingin kamu pakai: blank, counter, todo, reactive, dashboard, landing, atau auth. Pilih satu dan kamu sudah mulai coding.

### Setup Manual

```bash
mkdir my-app && cd my-app
npm init -y
npm install flint
npm install -D vite @flint/vite-plugin typescript
```

Buat file-file ini:

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

Jalankan `npm run dev` dan buka browser kamu.

---

## Konsep Inti

### Signals

Signal menyimpan state reaktif. Ketika kamu mengubah value signal, setiap DOM node yang membaca signal tersebut akan diperbarui secara otomatis.

```jsx
const count = state(0)

count()       // baca: 0
count.set(5)  // update
count()       // baca: 5
```

Itu saja API untuk state dasar.

### Computed Values

Computed value berasal dari signal lain. Ia hanya menghitung ulang ketika dependency-nya berubah, dan menyimpan hasilnya dalam cache.

```jsx
const count = state(0)
const doubled = computed(() => count() * 2)

doubled()  // 0
count.set(3)
doubled()  // 6
```

### Effects

Effect menjalankan kode ketika dependency-nya berubah. Gunakan untuk menyinkronkan state reaktif dengan dunia luar.

```jsx
const count = state(0)

effect(() => {
  document.title = `Count: ${count()}`
})
```

Ketika `count` berubah, judul dokumen diperbarui. Tidak ada dependency array, tidak ada closure yang stale.

### Reactive Objects

Untuk state kompleks, `reactive()` membuat proxy object. Mutasi pada object tersebut memicu update secara otomatis.

```jsx
const user = reactive({ name: 'Alice', age: 30 })

user.name = 'Bob'  // memicu re-render di mana user.name digunakan
user.age++          // memicu re-render di mana user.age digunakan
```

### model()

`model()` menggabungkan state, computed value, dan actions dalam satu object. Ini cara tercepat untuk membangun component interaktif.

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

// Di component kamu:
<button onClick={counter.increment}>+1</button>
<p>Count: {counter.count()}</p>
<p>Doubled: {counter.doubled()}</p>
```

---

## Components

Component adalah fungsi yang mengembalikan JSX. Ia berjalan sekali, dan signal menangani sisanya.

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
    // ambil data, mulai subscription, dll.
  })

  onDestroy(() => {
    console.log('cleaned up')
  })

  return <div>Dashboard</div>
}
```

### Refs

Akses element DOM langsung:

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

Flint menyediakan `<Show>` dan `<When>` untuk conditional rendering.

```jsx
const isLoggedIn = state(false)

// Pakai When (lebih sederhana)
<When condition={isLoggedIn()}>
  <p>Selamat datang kembali!</p>
</When>

// Pakai Show (dengan fallback)
<Show when={isLoggedIn()} fallback={<p>Mohon login dulu</p>}>
  <p>Selamat datang kembali!</p>
</Show>
```

---

## List Rendering

Pakai `<For>` untuk merender list dengan update yang presisi. Hanya item yang berubah yang re-render, bukan seluruh list.

```jsx
const todos = state([
  { id: 1, text: 'Belajar Flint', done: false },
  { id: 2, text: 'Bangun sesuatu', done: false },
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

Pakai inline style, CSS class, atau `createStyles` bawaan untuk scoped CSS-in-JS.

```jsx
// Inline
<div style={{ color: 'red', fontSize: '20px' }}>Teks merah</div>

// Class
<div className="container">Div styled</div>

// Scoped CSS-in-JS
const styles = createStyles({
  card: { padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  title: { fontSize: '24px', fontWeight: 'bold' },
})

<div className={styles.classNames.card}>
  <h2 className={styles.classNames.title}>Judul Card</h2>
</div>
```

---

## State Management

### State Lokal

Untuk state level component, pakai `state()` langsung.

### Store Global

Untuk state yang dibagikan antar component, pakai `createStore()`.

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
      <button onClick={() => addTodo('Todo baru')}>Tambah</button>
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

## Mengambil Data

### Fetch Sederhana

```jsx
function UserProfile({ userId }) {
  const { data, error, loading } = $api(`/api/users/${userId}`)

  if (loading()) return <p>Memuat...</p>
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
  staleTime: 5 * 60 * 1000,  // cache selama 5 menit
})

todos.data()    // data dari cache
todos.refetch() // paksa refresh
```

---

## Routing

```jsx
import { createRouter, Link, Outlet } from 'flint'

const router = createRouter({
  routes: [
    { path: '/', component: () => <Home /> },
    { path: '/tentang', component: () => <About /> },
    { path: '/pengguna/:id', component: () => <UserProfile /> },
  ],
})

function App() {
  return (
    <nav>
      <Link href="/">Beranda</Link>
      <Link href="/tentang">Tentang</Link>
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
  { path: '/pengaturan', lazy: () => import('./Settings') },
]
```

---

## Formulir

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

## Pengujian

```bash
npm install -D vitest @testing-library/jest-dom
```

```jsx
import { describe, it, expect } from 'vitest'
import { testRender } from 'flint'

describe('Counter', () => {
  it('increment', () => {
    const { click, textContent } = testRender(() => <Counter />)
    expect(textContent('p')).toBe('0')
    click('button')
    expect(textContent('p')).toBe('1')
  })
})
```

---

## Kompatibilitas Solid/React

Datang dari Solid.js atau React? Flint mendukung kedua gaya API.

```jsx
// Gaya Solid.js
const [count, setCount] = createSignal(0)
createEffect(() => console.log(count()))
const doubled = createMemo(() => count() * 2)

// Gaya React (hal yang sama, nama berbeda)
const [name, setName] = createSignal('Alice')
```

Ini adalah alias untuk fungsi `state()`, `effect()`, dan `computed()` Flint. Pakai gaya mana pun yang terasa nyaman.

---

## Referensi API Reactivity

| Fungsi | Apa yang Dilakukan |
|--------|-------------------|
| `state(initial)` | Membuat signal reaktif |
| `computed(fn)` | Membuat value cache dari signal |
| `effect(fn)` | Menjalankan kode saat dependency berubah |
| `reactive(obj)` | Membuat object reaktif berbasis proxy |
| `model(config)` | Menggabungkan state + computed + actions |
| `batch(fn)` | Mengelompokkan beberapa update jadi satu render |
| `watch(signal, cb)` | Menonton signal dan menjalankan callback saat berubah |
| `watchDebounced(signal, cb, ms)` | Menonton dengan debounce |
| `onMount(fn)` | Dijalankan setelah component terpasang |
| `onDestroy(fn)` | Dijalankan saat component dilepas |

## Alias Solid

| Solid.js | Flint Equivalent |
|----------|------------------|
| `createSignal(0)` | `state(0)` |
| `createEffect(fn)` | `effect(fn)` |
| `createMemo(fn)` | `computed(fn)` |
| `createStore(obj)` | `reactive(obj)` |
| `createResource(src, fn)` | `$api(url)` atau `$query({...})` |
| `createRoot(fn)` | `createRoot(fn)` |
| `batch(fn)` | `batch(fn)` |

## Components

| Component | Apa yang Dilakukan |
|-----------|-------------------|
| `<Show when={cond}>` | Render kondisional dengan fallback |
| `<When condition={cond}>` | Kondisional yang lebih sederhana |
| `<For each={list}>` | Render list dengan key |
| `<Switch>/<Match>` | Pattern matching |
| `<Portal>` | Render ke DOM node berbeda |
| `<Suspense>` | Batas loading async |
| `<ErrorBoundary>` | Menangkap error |
| `lazy(() => import('./X'))` | Lazy-load component |

## Fungsi Utilitas

| Fungsi | Apa yang Dilakukan |
|--------|-------------------|
| `$api(url, opts)` | Fetch dengan loading/error state reaktif |
| `$http(opts)` | Membuat HTTP client dengan method |
| `$query({ key, fetch })` | Query dengan cache dan refetch |
| `$mutation({ mutation })` | Mutasi dengan optimistic update |
| `createStyles(obj)` | Scoped CSS-in-JS |
| `useForm(values, rules, submit)` | Formulir dengan validasi |
| `debounce(fn, ms)` | Debounce fungsi |
| `throttle(fn, ms)` | Throttle fungsi |
| `clamp(val, min, max)` | Membatasi angka |
| `lerp(a, b, t)` | Interpolasi linear |

---

## Struktur Proyek

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

## Berkontribusi

1. Fork repo-nya
2. Buat branch: `git checkout -b fitur-saya`
3. Buat perubahan dan tambahkan test
4. Jalankan `pnpm test` untuk verifikasi
5. Push dan buka PR

---

## Lisensi

MIT

---

<div align="center">

**Flint** — Kode lebih sedikit. Aplikasi lebih cepat. DX lebih baik.

[GitHub](https://github.com/salzcill-cmd/flint)

</div>
