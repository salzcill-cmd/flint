# create-flint

> Scaffold Flint projects with one command

## Usage

```bash
npm create flint my-app
npx create-flint my-app
```

## Options

```bash
# Non-interactive mode
create-flint my-app --template counter

# Skip dependency installation
create-flint my-app --no-install

# Force overwrite existing directory
create-flint my-app --force
```

## Templates

| Template | Description |
|----------|-------------|
| `blank` | Minimal starter with auto-imports |
| `counter` | Counter app with model(), computed, effects |
| `todo` | Todo app with createStore |
| `reactive` | reactive(), bind(), When components |
| `dashboard` | Admin dashboard with charts, stats, tables |
| `landing` | Landing page with hero, features, pricing |
| `auth` | Login and registration with form validation |

## What's Included

- Pre-configured Vite setup
- Auto-imports enabled
- TypeScript support
- ESLint configuration
- Proper .gitignore
- package.json with scripts

## License

MIT
