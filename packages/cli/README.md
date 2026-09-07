# @flint/cli

> Command-line interface for Flint projects

## Install

```bash
npm install -g @flint/cli
```

## Commands

### `flint create`

Create a new Flint project.

```bash
flint create my-app
flint create my-app --template counter
```

### `flint dev`

Start development server.

```bash
flint dev
flint dev --port 3000
```

### `flint build`

Build for production.

```bash
flint build
flint build --minify
```

### `flint test`

Run tests.

```bash
flint test
flint test --watch
```

### `flint lint`

Lint your code.

```bash
flint lint
flint lint --fix
```

## Templates

- `blank` — Minimal starter
- `counter` — Counter with model(), computed, effects
- `todo` — Todo app with createStore
- `reactive` — reactive(), bind(), When
- `dashboard` — Admin dashboard with charts and tables
- `landing` — Landing page with hero, features, pricing
- `auth` — Login and registration with validation

## License

MIT
