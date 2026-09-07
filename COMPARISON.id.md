# Flint vs React vs Vue vs Svelte vs Solid

Perbandingan kode nyata. Fitur yang sama, framework berbeda. Cari yang cocok dengan cara berpikir kamu.

---

## Hello World

Aplikasi paling kecil di setiap framework.

### Flint

```jsx
function App() {
  const name = state('World')
  return <h1>Hello, {name()}!</h1>
}
render(App, '#app')
```

Tidak perlu import. Tulis fungsi dan render.

### React

```jsx
import { useState } from 'react'

function App() {
  const [name, setName] = useState('World')
  return <h1>Hello, {name}!</h1>
}
```

Kamu perlu import `useState` dan panggil di awal component.

### Vue

```vue
<script setup>
import { ref } from 'vue'
const name = ref('World')
</script>

<template>
  <h1>Hello, {{ name }}!</h1>
</template>
```

Vue memisahkan logika dan template ke blok terpisah.

### Svelte

```svelte
<script>
  let name = 'World'
</script>

<h1>Hello, {name}!</h1>
```

Svelte pakai compiler. Kamu tulis JavaScript biasa dan framework menangani reaktivitas.

### Solid

```jsx
import { createSignal } from 'solid-js'

function App() {
  const [name, setName] = createSignal('World')
  return <h1>Hello, {name()}!</h1>
}
```

Solid pakai fungsi untuk membaca signal, sama seperti Flint.

---

## Counter

Counter dengan increment, decrement, reset, dan value turunan.

### Flint

```jsx
const counter = model({
  state: { count: 0 },
  computed: { doubled: (s) => s.count * 2 },
  actions: {
    increment(s) { s.count++ },
    decrement(s) { s.count-- },
    reset(s) { s.count = 0 },
  },
})

function App() {
  return (
    <div>
      <p>Count: {counter.count()}</p>
      <p>Doubled: {counter.doubled()}</p>
      <button onClick={counter.decrement}>-</button>
      <button onClick={counter.increment}>+</button>
      <button onClick={counter.reset}>Reset</button>
    </div>
  )
}
```

Satu object menampung semua. `computed` dan `actions` merujuk ke `s.count` langsung — tidak ada syntax khusus.

### React

```jsx
import { useState, useMemo, useCallback } from 'react'

function App() {
  const [count, setCount] = useState(0)
  const doubled = useMemo(() => count * 2, [count])
  const increment = useCallback(() => setCount(c => c + 1), [])
  const decrement = useCallback(() => setCount(c => c - 1), [])
  const reset = useCallback(() => setCount(0), [])

  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubled}</p>
      <button onClick={decrement}>-</button>
      <button onClick={increment}>+</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}
```

React butuh `useMemo` agar `doubled` tidak dihitung ulang setiap render, dan `useCallback` agar fungsi tetap stabil. Lupa satu dependency dan kamu dapat bug.

### Vue

```vue
<script setup>
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
const increment = () => count.value++
const decrement = () => count.value--
const reset = () => count.value = 0
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Doubled: {{ doubled }}</p>
    <button @click="decrement">-</button>
    <button @click="increment">+</button>
    <button @click="reset">Reset</button>
  </div>
</template>
```

Vue bersih. Kamu define value reaktif pakai `ref()`, baca pakai `.value` di script, dan template menangani sisanya.

### Svelte

```svelte
<script>
  let count = 0
  $: doubled = count * 2
</script>

<div>
  <p>Count: {count}</p>
  <p>Doubled: {doubled}</p>
  <button on:click={() => count--}>-</button>
  <button on:click={() => count++}>+</button>
  <button on:click={() => count = 0}>Reset</button>
</div>
```

Svelte pakai label `$:` untuk deklarasi reaktif. Compiler mengubahnya jadi update yang presisi.

### Solid

```jsx
import { createSignal, createMemo } from 'solid-js'

function App() {
  const [count, setCount] = createSignal(0)
  const doubled = createMemo(() => count() * 2)

  return (
    <div>
      <p>Count: {count()}</p>
      <p>Doubled: {doubled()}</p>
      <button onClick={() => setCount(c => c - 1)}>-</button>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}
```

Solid dan Flint nyaris identik. Keduanya menjalankan component sekali dan melacak signal secara individual.

---

## Two-Way Binding

Mengikat input ke signal tanpa boilerplate.

### Flint

```jsx
const name = state('')

function App() {
  return (
    <div>
      <input value={name()} onInput={(e) => name.set(e.target.value)} />
      <p>Hello, {name()}</p>
    </div>
  )
}
```

Atau pakai helper `bind`:

```jsx
<Input bind={name} placeholder="Masukkan nama" />
```

### React

```jsx
import { useState } from 'react'

function App() {
  const [name, setName] = useState('')
  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <p>Hello, {name}</p>
    </div>
  )
}
```

React mengharuskan kamu menulis handler onChange setiap kali. Tidak ada shorthand bawaan.

### Vue

```vue
<script setup>
import { ref } from 'vue'
const name = ref('')
</script>

<template>
  <input v-model="name" />
  <p>Hello, {{ name }}</p>
</template>
```

`v-model` Vue adalah syntax two-way binding yang paling bersih.

### Svelte

```svelte
<script>
  let name = ''
</script>

<input bind:value={name} />
<p>Hello, {name}</p>
```

Direktif `bind:` Svelte bekerja mirip `v-model` Vue.

### Solid

```jsx
import { createSignal } from 'solid-js'

function App() {
  const [name, setName] = createSignal('')
  return (
    <div>
      <input value={name()} onInput={(e) => setName(e.target.value)} />
      <p>Hello, {name()}</p>
    </div>
  )
}
```

Solid mengharuskan kamu menulis handler secara manual, seperti Flint tanpa helper `bind`.

---

## Conditional Rendering

Menampilkan konten berbeda berdasarkan kondisi.

### Flint

```jsx
const isLoggedIn = state(false)

function App() {
  return (
    <div>
      <When condition={isLoggedIn()}>
        <p>Selamat datang kembali!</p>
        <button onClick={() => isLoggedIn.set(false)}>Logout</button>
      </When>
      <When condition={!isLoggedIn()}>
        <p>Mohon login</p>
        <button onClick={() => isLoggedIn.set(true)}>Login</button>
      </When>
    </div>
  )
}
```

`<When>` terbaca seperti bahasa Inggris biasa. Tidak ada syntax khusus yang perlu dipelajari.

### React

```jsx
import { useState } from 'react'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  return (
    <div>
      {isLoggedIn ? (
        <>
          <p>Selamat datang kembali!</p>
          <button onClick={() => setIsLoggedIn(false)}>Logout</button>
        </>
      ) : (
        <>
          <p>Mohon login</p>
          <button onClick={() => setIsLoggedIn(true)}>Login</button>
        </>
      )}
    </div>
  )
}
```

React pakai ekspresi ternary atau `&&` untuk kondisional. Fragment (`<>...</>`) diperlukan saat mengembalikan banyak element.

### Vue

```vue
<script setup>
import { ref } from 'vue'
const isLoggedIn = ref(false)
</script>

<template>
  <div>
    <template v-if="isLoggedIn">
      <p>Selamat datang kembali!</p>
      <button @click="isLoggedIn = false">Logout</button>
    </template>
    <template v-else>
      <p>Mohon login</p>
      <button @click="isLoggedIn = true">Login</button>
    </template>
  </div>
</template>
```

Direktif `v-if` dan `v-else` Vue jelas, tapi ada di template alih-alih di logika JavaScript.

### Svelte

```svelte
<script>
  let isLoggedIn = false
</script>

<div>
  {#if isLoggedIn}
    <p>Selamat datang kembali!</p>
    <button on:click={() => isLoggedIn = false}>Logout</button>
  {:else}
    <p>Mohon login</p>
    <button on:click={() => isLoggedIn = true}>Login</button>
  {/if}
</div>
```

Svelte pakai blok `{#if}` yang dikompilasi jadi update DOM yang efisien.

### Solid

```jsx
import { createSignal } from 'solid-js'

function App() {
  const [isLoggedIn, setIsLoggedIn] = createSignal(false)
  return (
    <div>
      <Show
        when={isLoggedIn()}
        fallback={
          <>
            <p>Mohon login</p>
            <button onClick={() => setIsLoggedIn(true)}>Login</button>
          </>
        }
      >
        <p>Selamat datang kembali!</p>
        <button onClick={() => setIsLoggedIn(false)}>Logout</button>
      </Show>
    </div>
  )
}
```

Solid pakai `<Show>` dengan prop `when` dan `fallback`. Mirip `<Show>` Flint.

---

## List Rendering

Merender list item dengan key yang benar.

### Flint

```jsx
const items = state([
  { id: 1, name: 'Apel' },
  { id: 2, name: 'Pisang' },
  { id: 3, name: 'Ceri' },
])

function App() {
  return (
    <ul>
      <For each={items()}>
        {(item) => <li key={item.id}>{item.name}</li>}
      </For>
    </ul>
  )
}
```

`<For>` melacak setiap item berdasarkan key-nya. Hanya item yang berubah yang re-render.

### React

```jsx
function App() {
  const items = [
    { id: 1, name: 'Apel' },
    { id: 2, name: 'Pisang' },
    { id: 3, name: 'Ceri' },
  ]

  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  )
}
```

React pakai `.map()` untuk merender list. Kamu mengelola key secara manual.

### Vue

```vue
<script setup>
const items = [
  { id: 1, name: 'Apel' },
  { id: 2, name: 'Pisang' },
  { id: 3, name: 'Ceri' },
]
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </ul>
</template>
```

Direktif `v-for` Vue menangani list rendering dengan keying.

### Svelte

```svelte
<script>
  const items = [
    { id: 1, name: 'Apel' },
    { id: 2, name: 'Pisang' },
    { id: 3, name: 'Ceri' },
  ]
</script>

<ul>
  {#each items as item (item.id)}
    <li>{item.name}</li>
  {/each}
</ul>
```

Blok `{#each}` Svelte dengan ekspresi key.

### Solid

```jsx
import { For } from 'solid-js'

function App() {
  const items = [
    { id: 1, name: 'Apel' },
    { id: 2, name: 'Pisang' },
    { id: 3, name: 'Ceri' },
  ]

  return (
    <ul>
      <For each={items}>
        {(item) => <li>{item.name}</li>}
      </For>
    </ul>
  )
}
```

`<For>` Solid identik dengan `<For>` Flint.

---

## Side Effects

Menjalankan kode saat state berubah.

### Flint

```jsx
const count = state(0)

effect(() => {
  document.title = `Count: ${count()}`
})
```

Tidak ada dependency array. Effect secara otomatis melacak `count()` dan menjalankan ulang saat berubah.

### React

```jsx
import { useState, useEffect } from 'react'

function App() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    document.title = `Count: ${count}`
  }, [count])

  return <div>{count}</div>
}
```

`useEffect` React membutuhkan dependency array. Lupa satu dan kamu dapat closure yang stale. Salah tambah satu dan kamu dapat infinite loop.

### Vue

```vue
<script setup>
import { ref, watch } from 'vue'

const count = ref(0)

watch(count, (newVal) => {
  document.title = `Count: ${newVal}`
})
</script>
```

`watch` Vue eksplisit tentang apa yang kamu tonton.

### Svelte

```svelte
<script>
  let count = 0

  $: {
    document.title = `Count: ${count}`
  }
</script>
```

Label `$:` Svelte menjalankan kode reaktif setiap kali dependency-nya berubah.

### Solid

```jsx
import { createSignal, createEffect } from 'solid-js'

function App() {
  const [count, setCount] = createSignal(0)

  createEffect(() => {
    document.title = `Count: ${count()}`
  })

  return <div>{count()}</div>
}
```

`createEffect` Solid bekerja persis seperti `effect()` Flint.

---

## Form Handling

Membangun formulir dengan validasi.

### Flint

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

function App() {
  return (
    <form {...form.formProps()}>
      <Input {...form.field('email')} label="Email" type="email" />
      <Input {...form.field('password')} label="Password" type="password" />
      <button disabled={!form.state.isValid()}>Login</button>
    </form>
  )
}
```

`useForm` menangani state, validasi, dan submission. Kamu define bentuk, aturannya, dan handler-nya.

### React

```jsx
import { useState } from 'react'

function App() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const errs = {}
    if (!form.email) errs.email = 'Wajib diisi'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email tidak valid'
    if (!form.password) errs.password = 'Wajib diisi'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setIsSubmitting(true)
    await login(form)
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      {errors.email && <span>{errors.email}</span>}
      <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {errors.password && <span>{errors.password}</span>}
      <button disabled={isSubmitting}>Login</button>
    </form>
  )
}
```

React mengharuskan manajemen state manual untuk setiap field, error, dan loading state.

### Vue

```vue
<script setup>
import { reactive } from 'vue'

const form = reactive({ email: '', password: '' })
const errors = reactive({})

const validate = () => {
  errors.email = !form.email ? 'Wajib diisi' : !/\S+@\S+\.\S+/.test(form.email) ? 'Email tidak valid' : ''
  errors.password = !form.password ? 'Wajib diisi' : ''
}

const handleSubmit = async () => {
  validate()
  if (errors.email || errors.password) return
  await login(form)
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.email" />
    <span v-if="errors.email">{{ errors.email }}</span>
    <input v-model="form.password" type="password" />
    <span v-if="errors.password">{{ errors.password }}</span>
    <button>Login</button>
  </form>
</template>
```

Vue tetap bersih dengan `reactive` dan `v-model`, tapi kamu tetap menulis validasi secara manual.

### Svelte

```svelte
<script>
  let email = ''
  let password = ''
  let errors = {}

  const validate = () => {
    errors = {}
    if (!email) errors.email = 'Wajib diisi'
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email tidak valid'
    if (!password) errors.password = 'Wajib diisi'
  }

  const handleSubmit = async () => {
    validate()
    if (Object.keys(errors).length > 0) return
    await login({ email, password })
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <input bind:value={email} />
  {#if errors.email}<span>{errors.email}</span>{/if}
  <input bind:value={password} type="password" />
  {#if errors.password}<span>{errors.password}</span>{/if}
  <button>Login</button>
</form>
```

Svelte ringkas, tapi form handling tetap membutuhkan wiring manual.

### Solid

```jsx
import { createSignal } from 'solid-js'

function App() {
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [errors, setErrors] = createSignal({})

  const validate = () => {
    const errs = {}
    if (!email()) errs.email = 'Wajib diisi'
    else if (!/\S+@\S+\.\S+/.test(email())) errs.email = 'Email tidak valid'
    if (!password()) errs.password = 'Wajib diisi'
    setErrors(errs)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    validate()
    if (Object.keys(errors()).length > 0) return
    await login({ email: email(), password: password() })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={email()} onInput={(e) => setEmail(e.target.value)} />
      {errors().email && <span>{errors().email}</span>}
      <input value={password()} onInput={(e) => setPassword(e.target.value)} type="password" />
      {errors().password && <span>{errors().password}</span>}
      <button>Login</button>
    </form>
  )
}
```

Solid membutuhkan state manual untuk setiap field. Tidak ada helper form bawaan.

---

## Ringkasan

| Fitur | Flint | React | Vue | Svelte | Solid |
|-------|-------|-------|-----|--------|-------|
| State | `state()` | `useState()` | `ref()` | `let` | `createSignal()` |
| Computed | `computed()` | `useMemo()` | `computed()` | `$:` | `createMemo()` |
| Effect | `effect()` | `useEffect()` | `watch()` | `$:` | `createEffect()` |
| Two-way binding | `bind={}` | Manual | `v-model` | `bind:` | Manual |
| Kondisional | `<When>` | Ternary | `v-if` | `{#if}` | `<Show>` |
| List | `<For>` | `.map()` | `v-for` | `{#each}` | `<For>` |
| Helper form | `useForm()` | Manual | Manual | Manual | Manual |
| Ukuran bundle | ~5KB | ~40KB | ~30KB | ~3KB | ~7KB |
| Kurva belajar | Rendah | Sedang | Sedang | Rendah | Sedang |
| TypeScript | Bawaan | Terpisah | Bawaan | Terpisah | Bawaan |
| SSR | Bawaan | Next.js | Nuxt | SvelteKit | SolidStart |

---

## Panjang Kode

Baris kode untuk fitur yang sama:

| Fitur | Flint | React | Vue | Svelte | Solid |
|-------|-------|-------|-----|--------|-------|
| Hello World | 4 | 8 | 6 | 3 | 8 |
| Counter | 12 | 18 | 14 | 8 | 14 |
| Form | 10 | 30 | 20 | 16 | 25 |
| List + Filter | 15 | 25 | 18 | 12 | 18 |

Flint rata-rata 30-40% lebih sedikit kode dari React. Jurangnya melebar untuk fitur kompleks seperti form dan state management.

---

## Kapan Memilih Mana

**Pilih Flint** kalau kamu mau syntax React dengan performa lebih baik, boilerplate lebih sedikit, dan semua fitur bawaan.

**Pilih React** kalau kamu butuh ekosistem terbesar, lowongan kerja paling banyak, dan tidak masalah menulis lebih banyak kode.

**Pilih Vue** kalau kamu suka template, mau dokumentasi yang bagus, dan lebih suka kurva belajar yang landai.

**Pilih Svelte** kalau kamu mau ukuran bundle paling kecil dan pengalaman "tulis JavaScript saja" yang paling murni.

**Pilih Solid** kalau kamu mau reaktivitas presisi seperti Flint tapi lebih suka framework yang lebih mapan.

---

## Coba Flint

```bash
npx create-flint my-app
cd my-app
npm run dev
```

Lima menit untuk mencoba. Kamu akan tahu apakah ini cocok.
