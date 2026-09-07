# @flint/store

> Simple state management for Flint

## Install

```bash
npm install @flint/store
```

## Quick Start

```typescript
import { createStore } from '@flint/store'

const useTodoStore = createStore({
  todos: [],
  filter: 'all',

  get filteredTodos() {
    switch (this.filter) {
      case 'active': return this.todos.filter(t => !t.done)
      case 'done': return this.todos.filter(t => t.done)
      default: return this.todos
    }
  },

  addTodo(text) {
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
})

// In component
function App() {
  const { todos, addTodo } = useTodoStore()
  return (
    <div>
      {todos().map(todo => <div key={todo.id}>{todo.text}</div>)}
      <button onClick={() => addTodo('New item')}>Add</button>
    </div>
  )
}
```

## API

### `createStore(config)`

Create a reactive store with state, computed, and actions.

```typescript
const store = createStore({
  // State
  count: 0,
  name: 'World',

  // Computed (getters)
  get greeting() {
    return `Hello, ${this.name}!`
  },

  // Actions
  increment() {
    this.count++
  },

  setName(name) {
    this.name = name
  },
})
```

### `useStore()`

Access the store in components.

```typescript
function App() {
  const { count, increment } = useStore()
  return <button onClick={increment}>{count()}</button>
}
```

## Middleware

```typescript
const store = createStore({
  // ...config
}, {
  middleware: [
    (state, next) => {
      console.log('State changed:', state)
      next()
    }
  ]
})
```

## License

MIT
