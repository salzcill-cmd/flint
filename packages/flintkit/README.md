# flintkit

> Utility functions and helpers for Flint projects

## Install

```bash
npm install flintkit
```

## Features

- **TypeScript types** — additional type definitions
- **Utility functions** — common helper functions
- **Testing utilities** — test helpers and mocks
- **Server utilities** — server-side helpers

## Usage

```typescript
import { mergeRefs, isSignal, isComputed } from 'flintkit'

// Merge multiple refs
const mergedRef = mergeRefs(ref1, ref2)

// Check if value is a signal
if (isSignal(value)) {
  // ...
}

// Check if value is computed
if (isComputed(value)) {
  // ...
}
```

## API

### Ref Utilities

```typescript
import { mergeRefs, assignRef } from 'flintkit'

// Merge multiple refs into one
const merged = mergeRefs(ref1, ref2, ref3)

// Assign value to ref
assignRef(ref, value)
```

### Type Guards

```typescript
import { isSignal, isComputed, isWritable } from 'flintkit'

isSignal(value)    // true if signal
isComputed(value)  // true if computed
isWritable(value)  // true if writable signal
```

### Testing Utilities

```typescript
import { renderComponent, waitFor } from 'flintkit/testing'

// Render a component for testing
const { container, unmount } = renderComponent(MyComponent)

// Wait for async updates
await waitFor(() => {
  expect(container.textContent).toBe('Hello')
})
```

## License

MIT
