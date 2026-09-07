# @flint/runtime

> The core runtime for Flint — JSX rendering, components, hooks, and utilities

## Install

```bash
npm install flint
```

(Or `npm install @flint/runtime` for just the runtime)

## Quick Start

```jsx
import { render, state, When } from 'flint'

function App() {
  const count = state(0)

  return (
    <div>
      <h1>Count: {count()}</h1>
      <button onClick={() => count.set(c => c + 1)}>+1</button>
      <When condition={count() > 10}>
        <p>Count is greater than 10!</p>
      </When>
    </div>
  )
}

render(App, '#app')
```

## Features

- **Fine-grained reactivity** — no virtual DOM, direct DOM updates
- **JSX support** — familiar syntax for React developers
- **Auto-imports** — `state`, `computed`, `effect`, `render` available without imports
- **Built-in components** — `Show`, `When`, `For`, `Switch`, `Portal`, `Suspense`
- **UI components** — `Text`, `Input`, `Button`, `Card`, `Tabs`, `Modal`, `Accordion`
- **Styling** — `sx()` utility for Tailwind-like syntax
- **Forms** — `useForm()` with built-in validation
- **Hooks** — `useAsync`, `useDebounce`, `useLocalStorage`, `useMediaQuery`
- **Router** — file-based routing with middleware and guards
- **SSR** — server-side rendering with streaming and hydration
- **TypeScript** — full type safety

## API

### Rendering

```jsx
import { render } from 'flint'

render(App, '#app')
```

### Components

```jsx
// Function component
function MyComponent({ name }) {
  return <div>Hello, {name}</div>
}

// With decorator
@view
function MyComponent() {
  return <div>Hello</div>
}
```

### Built-in Components

```jsx
import { Show, When, For, Switch, Portal, Suspense } from 'flint'

// Conditional
<Show when={condition()} fallback={<div>Loading...</div>}>
  <div>Content</div>
</Show>

// Simplified conditional
<When condition={condition()}>
  <div>Content</div>
</When>

// List
<For each={items()}>
  {(item) => <div key={item.id}>{item.name}</div>}
</For>

// Portal
<Portal into="#modal">
  <div>Modal content</div>
</Portal>
```

### Hooks

```jsx
import { use, useAsync, useDebounce, useLocalStorage } from 'flint'

// Use a promise
const user = use(fetchUser(id))

// Async data fetching
const { data, isLoading, error } = useAsync(() => fetch('/api/data'))

// Debounce
const debouncedSearch = useDebounce(search(), 300)

// Local storage
const [theme, setTheme] = useLocalStorage('theme', 'light')
```

## License

MIT
