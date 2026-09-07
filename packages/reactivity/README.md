# @flint/reactivity

> Fine-grained signals system for Flint — the fastest reactive primitives

## Install

```bash
npm install @flint/reactivity
```

## Quick Start

```typescript
import { state, computed, effect } from '@flint/reactivity'

const count = state(0)
const doubled = computed(() => count() * 2)

effect(() => {
  console.log(`Count: ${count()}, Doubled: ${doubled()}`)
})

count.set(5) // Logs: Count: 5, Doubled: 10
```

## API

### `state(initial)`

Create a reactive signal.

```typescript
const count = state(0)
count()       // read: 0
count.set(5)  // write: 5
count.set(c => c + 1)  // write: 6
count.peek()  // read without tracking
```

### `computed(fn)`

Create a derived value (lazy, cached).

```typescript
const doubled = computed(() => count() * 2)
doubled() // recomputes only when count() changes
```

### `computedSet({ get, set })`

Create a writable computed value.

```typescript
const count = state(0)
const doubled = computedSet({
  get: () => count() * 2,
  set: (value) => count.set(value / 2)
})
doubled()      // read: 0
doubled.set(10) // write: sets count to 5
```

### `effect(fn)`

Run side effects when dependencies change.

```typescript
effect(() => {
  console.log(count())
})
```

### `batch(fn)`

Group multiple updates into one.

```typescript
batch(() => {
  count.set(1)
  name.set('hello')
}) // Only one re-render
```

### `reactive(obj)`

Proxy-based reactivity (like Vue).

```typescript
const user = reactive({ name: 'John', age: 30 })
user.age++ // triggers updates
```

### `model(config)`

State + computed + actions in one object.

```typescript
const counter = model({
  state: { count: 0 },
  computed: { doubled: (s) => s.count * 2 },
  actions: { increment(s) { s.count++ } }
})
```

## License

MIT
