# @flint/devtools

> Developer tools for Flint — debugging, profiling, and inspection

## Install

```bash
npm install -D @flint/devtools
```

## Features

- **Signal inspection** — visualize reactive dependencies
- **Component tree** — inspect component hierarchy
- **Performance profiling** — track render times
- **Error overlay** — detailed error information
- **HMR status** — hot module replacement status

## Usage

```typescript
import { enableDevtools } from '@flint/devtools'

// Enable in development
if (import.meta.env.DEV) {
  enableDevtools()
}
```

## API

### `enableDevtools()`

Enable the Flint devtools.

### `disableDevtools()`

Disable the Flint devtools.

### `getDevtools()`

Get the devtools instance.

### `logComponentTree()`

Log the component tree to console.

### `logSignals()`

Log all active signals.

### `logStores()`

Log all active stores.

## License

MIT
