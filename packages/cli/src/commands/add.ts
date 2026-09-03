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
    import: `import { createStore } from 'flint/store'

export const useCounterStore = createStore({
  state: {
    count: 0,
    name: 'Counter',
  },
  actions: {
    increment(state) {
      state.count++
    },
    decrement(state) {
      state.count--
    },
    reset(state) {
      state.count = 0
    },
  },
  getters: {
    double: (state) => state.count * 2,
  },
})`,
  },
  forms: {
    name: 'Forms',
    description: 'Form handling and validation',
    import: `import { useForm } from 'flint/forms'

export function useContactForm() {
  return useForm({
    initialValues: {
      name: '',
      email: '',
      message: '',
    },
    validate: {
      name: (v) => v.length > 0 || 'Name is required',
      email: (v) => /^[^@]+@[^@]+$/.test(v) || 'Invalid email',
      message: (v) => v.length > 10 || 'Message must be at least 10 characters',
    },
    onSubmit: async (values) => {
      console.log('Form submitted:', values)
    },
  })
}`,
  },
  i18n: {
    name: 'i18n',
    description: 'Internationalization',
    import: `import { createI18n } from 'flint/i18n'

export const i18n = createI18n({
  locales: ['en', 'id'],
  defaultLocale: 'en',
  messages: {
    en: {
      greeting: 'Hello',
      farewell: 'Goodbye',
    },
    id: {
      greeting: 'Halo',
      farewell: 'Selamat tinggal',
    },
  },
})`,
  },
  query: {
    name: 'Query',
    description: 'Data fetching and caching',
    import: `import { useQuery, useMutation, invalidateQueries } from 'flint/query'

export function useTodos() {
  return useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await fetch('/api/todos')
      return res.json()
    },
  })
}

export function useAddTodo() {
  return useMutation({
    mutationFn: async (todo) => {
      const res = await fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify(todo),
      })
      return res.json()
    },
    onSuccess: () => {
      invalidateQueries(['todos'])
    },
  })
}`,
  },
  seo: {
    name: 'SEO',
    description: 'Meta tags and structured data',
    import: `import { useSEO, useTitle, useMeta } from 'flint/seo'

export function usePageSEO() {
  useTitle('My Page')
  useMeta('description', 'Page description for search engines')
  useMeta('og:title', 'My Page')
  useMeta('og:description', 'Page description')
  useMeta('og:image', '/og-image.png')
}`,
  },
  pwa: {
    name: 'PWA',
    description: 'Progressive Web App support',
    import: `import { initPWA } from 'flint/pwa'

// Initialize PWA in your app entry point
const pwa = initPWA({
  swPath: '/sw.js',
  scope: '/',
  cacheName: 'my-app-v1',
  offlinePage: '/offline.html',
})

// Register service worker
pwa.serviceWorker.register()`,
  },
  image: {
    name: 'Image',
    description: 'Image optimization and lazy loading',
    import: `import { Image, preloadImage, preloadImages } from 'flint/image'

// Use in JSX
// <Image src="/photo.jpg" alt="Photo" width={400} height={300} lazy />

// Preload images
preloadImage('/hero.jpg')
preloadImages(['/1.jpg', '/2.jpg', '/3.jpg'])`,
  },
  animations: {
    name: 'Animations',
    description: 'Animation utilities and presets',
    import: `import { animate, spring, fadeIn, slideUp } from 'flint/animations'

// Animate element
const el = document.querySelector('.box')
animate(el, { x: 100, opacity: 1 }, { duration: 300 })

// Use spring physics
spring(el, { x: 200 }, { stiffness: 200, damping: 10 })

// Predefined animations
fadeIn(el, { duration: 500 })
slideUp(el, { delay: 100 })`,
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
