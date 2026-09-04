// Flint CLI — Add Command
// Adds Flint modules to an existing project

import fs from 'node:fs'
import path from 'node:path'

const MODULES: Record<string, {
  name: string
  description: string
  import: string
  install?: string
  files?: Record<string, string>
}> = {
  router: {
    name: 'Router',
    description: 'Client-side routing',
    import: `import { createRouter } from 'flint/router'

const routes = [
  { path: '/', component: () => import('./pages/Home') },
  { path: '/about', component: () => import('./pages/About') },
  { path: '*', component: () => import('./pages/NotFound') },
]

export const router = createRouter({ routes, mode: 'hash' })`,
  },
  store: {
    name: 'Store',
    description: 'Global state management',
    import: `import { create, logger } from 'flint/store'

export const useCounterStore = create(
  (set, get) => ({
    count: 0,
  }),
  [logger()]
)

// Actions
export function increment() {
  useCounterStore.setState((prev) => ({ count: prev.count + 1 }))
}

export function decrement() {
  useCounterStore.setState((prev) => ({ count: prev.count - 1 }))
}

export function reset() {
  useCounterStore.setState({ count: 0 })
}

// Read state
export function getDouble() {
  return useCounterStore.getState().count * 2
}`,
  },
  forms: {
    name: 'Forms',
    description: 'Form handling and validation',
    import: `import { createFormAction } from 'flint'

const submitForm = createFormAction(async (formData, prev) => {
  const name = formData.get('name')
  const email = formData.get('email')
  const message = formData.get('message')

  // Validate
  if (!name || !email || !message) {
    return { ...prev, errors: { name: !name ? 'Required' : '', email: !email ? 'Required' : '', message: !message ? 'Required' : '' } }
  }

  // Submit
  await fetch('/api/contact', {
    method: 'POST',
    body: JSON.stringify({ name, email, message }),
  })

  return { success: true, errors: {} }
})`,
  },
  i18n: {
    name: 'i18n',
    description: 'Internationalization',
    import: `import { state, computed } from 'flint'

// Simple i18n implementation using signals
const locale = state('en')
const messages = {
  en: {
    greeting: 'Hello',
    farewell: 'Goodbye',
  },
  id: {
    greeting: 'Halo',
    farewell: 'Selamat tinggal',
  },
}

export function setLocale(loc: string) {
  locale.set(loc)
}

export function t(key: string): string {
  return messages[locale()]?.[key] || key
}

export function useLocale() {
  return { locale, setLocale, t }
}`,
  },
  query: {
    name: 'Query',
    description: 'Data fetching and caching',
    import: `import { state } from 'flint'

// Simple data fetching with signals
const todoCache = new Map<string, any>()

export async function fetchTodos() {
  if (todoCache.has('todos')) {
    return todoCache.get('todos')
  }
  const res = await fetch('/api/todos')
  const data = await res.json()
  todoCache.set('todos', data)
  return data
}

export function invalidateTodoCache() {
  todoCache.delete('todos')
}

export function useTodos() {
  const data = state<any[]>([])
  const loading = state(false)
  const error = state<string | null>(null)

  const refetch = async () => {
    loading.set(true)
    error.set(null)
    try {
      const result = await fetchTodos()
      data.set(result)
    } catch (e) {
      error.set(e instanceof Error ? e.message : 'Failed to fetch')
    } finally {
      loading.set(false)
    }
  }

  refetch()
  return { data, loading, error, refetch }
}`,
  },
  seo: {
    name: 'SEO',
    description: 'Meta tags and structured data',
    import: `import { onMount, onDestroy } from 'flint'

export function usePageSEO(title: string, description: string) {
  onMount(() => {
    document.title = title

    const metaDesc = document.createElement('meta')
    metaDesc.name = 'description'
    metaDesc.content = description
    document.head.appendChild(metaDesc)

    return () => {
      document.title = 'My App'
      document.head.removeChild(metaDesc)
    }
  })
}`,
  },
  pwa: {
    name: 'PWA',
    description: 'Progressive Web App support',
    import: `import { onMount } from 'flint'

export function initPWA(swPath: string = '/sw.js') {
  onMount(async () => {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register(swPath)
        console.log('Service Worker registered')
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  })
}`,
  },
  image: {
    name: 'Image',
    description: 'Image optimization and lazy loading',
    import: `import { onMount } from 'flint'

// Lazy load images using IntersectionObserver
export function lazyLoadImages() {
  onMount(() => {
    const images = document.querySelectorAll('img[data-src]')

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          img.src = img.dataset.src || ''
          img.removeAttribute('data-src')
          observer.unobserve(img)
        }
      })
    })

    images.forEach((img) => observer.observe(img))

    return () => observer.disconnect()
  })
}

// Use in JSX:
// <img data-src="/photo.jpg" alt="Photo" width={400} height={300} />`,
  },
  animations: {
    name: 'Animations',
    description: 'Animation utilities and presets',
    import: `import { animate, presets } from 'flint'

// Animate element with keyframes
const el = document.querySelector('.box')
if (el) {
  animate(el, [{ transform: 'translateX(0)' }, { transform: 'translateX(100px)' }], {
    duration: 300,
    fill: 'forwards',
  })
}

// Use preset animations
// presets.fadeIn.enter, presets.fadeOut.enter
// presets.slideUp.enter, presets.slideDown.enter
// presets.scale.enter`,
  },
  ssr: {
    name: 'SSR',
    description: 'Server-side rendering',
    import: `import { renderToString, generateHTML, hydrate } from 'flint/ssr'

// Server-side render
const result = await renderToString({
  component: App,
  props: { name: 'World' },
  hydrate: true,
})

// Generate full HTML page
const html = generateHTML({
  title: 'My App',
  body: result.html,
  styles: result.styles,
  scripts: result.scripts,
})

// Client-side hydration
await hydrate({
  root: document.getElementById('app'),
  component: App,
})`,
  },
}

export async function addModule(moduleName: string): Promise<void> {
  const module = MODULES[moduleName]

  if (!module) {
    const available = Object.keys(MODULES).join(', ')
    console.log(`\n  Unknown module: "${moduleName}"`)
    console.log(`\n  Available modules:\n`)
    for (const [key, mod] of Object.entries(MODULES)) {
      console.log(`    ${key.padEnd(14)} ${mod.description}`)
    }
    console.log(`\n  Usage: flint add <module>\n`)
    return
  }

  console.log(`\n  Adding ${module.name} module...\n`)

  // Create example file
  const exampleDir = path.join(process.cwd(), 'src', 'examples')
  const examplePath = path.join(exampleDir, `${moduleName}.example.js`)

  fs.mkdirSync(exampleDir, { recursive: true })
  fs.writeFileSync(examplePath, `// ${module.name} Example\n// ${module.description}\n\n${module.import}\n`)

  console.log(`  ✔ Created src/examples/${moduleName}.example.js`)

  // Check if module needs additional files
  if (module.files) {
    for (const [filePath, content] of Object.entries(module.files)) {
      const fullPath = path.join(process.cwd(), filePath)
      fs.mkdirSync(path.dirname(fullPath), { recursive: true })
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, content)
        console.log(`  ✔ Created ${filePath}`)
      }
    }
  }

  console.log(`\n  ${module.name} module ready!`)
  console.log(`\n  Import example:`)
  console.log(`    import from 'flint/${moduleName}'\n`)

  // Check if package needs to be installed
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    if (!pkg.dependencies?.[`flint/${moduleName}`] && !pkg.dependencies?.['flint']) {
      console.log(`  Note: Install flint package first:`)
      console.log(`    pnpm add flint\n`)
    }
  }
}
