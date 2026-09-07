# @flint/compiler

> The Flint JSX compiler — transforms JSX with auto-imports and optimizations

## Install

```bash
npm install @flint/compiler
```

## Usage

The compiler is typically used via the Vite plugin:

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import flint from '@flint/vite-plugin'

export default defineConfig({
  plugins: [flint()]
})
```

## Features

- **Auto-imports** — no need to import `state`, `computed`, `effect`, `render`
- **JSX transformation** — converts JSX to efficient DOM operations
- **Optimizations** — dead code elimination, tree shaking
- **Source maps** — full source map support for debugging
- **TypeScript** — full TypeScript support

## Manual Usage

```typescript
import { parse, transform, compile } from '@flint/compiler'

const ast = parse('<div>Hello</div>')
const transformed = transform(ast)
const code = compile(transformed)
```

## Auto-Imported Symbols

The following symbols are automatically available without importing:

- `state`, `computed`, `effect`, `batch`
- `render`, `h`, `Show`, `When`, `For`
- `ref`, `onMount`, `onUpdate`, `onDestroy`
- And more...

## License

MIT
