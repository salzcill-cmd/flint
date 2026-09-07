# @flint/eslint-plugin

> ESLint rules for Flint projects

## Install

```bash
npm install -D @flint/eslint-plugin
```

## Usage

```javascript
// eslint.config.js
import flint from '@flint/eslint-plugin'

export default [
  ...flint.configs.recommended,
  {
    rules: {
      // Customize rules
      '@flint/no-reactive-in-loop': 'warn',
    }
  }
]
```

## Rules

### Recommended

| Rule | Description |
|------|-------------|
| `no-reactive-in-loop` | Warns against creating reactive state inside loops |
| `no-side-effect-in-computed` | Warns against side effects in computed values |
| `no-untracked-derivations` | Warns against untracked reactive dependencies |
| `require-cleanup` | Requires cleanup functions in effects |
| `no-mutation-in-computed` | Warns against mutations in computed values |

### Best Practices

| Rule | Description |
|------|-------------|
| `prefer-state-over-ref` | Prefer `state()` over `ref()` |
| `prefer-model-over-store` | Prefer `model()` for simple state |
| `use-when-over-show` | Prefer `<When>` over `<Show>` for simple conditionals |

### Styling

| Rule | Description |
|------|-------------|
| `consistent-component-naming` | Enforce consistent component naming |
| `prefer-functional-components` | Prefer function components over class components |

## License

MIT
