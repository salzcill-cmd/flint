# @flint/vite-plugin

> Vite plugin for Flint projects

## Install

```bash
npm install -D @flint/vite-plugin
```

## Usage

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import flint from '@flint/vite-plugin'

export default defineConfig({
  plugins: [flint()]
})
```

## Options

```javascript
flint({
  // Enable auto-imports (default: true)
  autoImport: true,

  // Enable development features (default: true in dev)
  dev: true,

  // Enable SSR mode (default: false)
  ssr: false,

  // Custom JSX pragma
  jsx: 'react',
})
```

## Features

- **Auto-imports** — automatically imports Flint symbols
- **JSX transformation** — transforms JSX to Flint runtime calls
- **Hot Module Replacement** — instant updates during development
- **Optimized builds** — tree shaking and dead code elimination
- **SSR support** — server-side rendering configuration
- **Source maps** — full source map support

## License

MIT
