// FlintKit — Metaframework for Flint
// File-based routing, SSR, and full-stack features

export * from './router'
export * from './ssr'

// ─── FlintKit Config ────────────────────────────────────────────

export interface FlintKitConfig {
  /** Project name */
  name?: string
  /** Enable SSR */
  ssr?: boolean
  /** Enable file-based routing */
  fileRoutes?: boolean
  /** Routes directory */
  routesDir?: string
  /** Output directory */
  outDir?: string
  /** Enable dev server */
  dev?: boolean
}

/**
 * Define FlintKit configuration
 */
export function defineConfig(config: FlintKitConfig): FlintKitConfig {
  return {
    name: 'flintkit-app',
    ssr: true,
    fileRoutes: true,
    routesDir: 'pages',
    outDir: 'dist',
    dev: false,
    ...config,
  }
}

// ─── Scaffolding ────────────────────────────────────────────────

export interface ScaffoldOptions {
  /** Project name */
  name: string
  /** Template to use */
  template?: 'basic' | 'full' | 'minimal'
  /** Enable TypeScript */
  typescript?: boolean
  /** Enable SSR */
  ssr?: boolean
}

/**
 * Generate project structure from template
 */
export function generateProject(options: ScaffoldOptions): {
  files: Record<string, string>
} {
  const { name, template = 'basic', typescript = true, ssr = true } = options
  const ext = typescript ? 'tsx' : 'jsx'

  const files: Record<string, string> = {
    // Package config
    'package.json': JSON.stringify({
      name,
      version: '0.1.0',
      type: 'module',
      scripts: {
        dev: 'flintkit dev',
        build: 'flintkit build',
        preview: 'flintkit preview',
        start: 'flintkit start',
      },
      dependencies: {
        'flintkit': 'latest',
        '@flint/runtime': 'latest',
        '@flint/reactivity': 'latest',
      },
      devDependencies: {
        'typescript': typescript ? '^5.8.3' : undefined,
      },
    }, null, 2),

    // Main entry
    [`src/app.${ext}`]: `import { createApp } from 'flintkit'
import { routes } from './routes'

const app = createApp({
  routes,
  ${ssr ? 'ssr: true,' : ''}
})

app.mount('#app')
`,

    // Pages
    [`src/pages/index.${ext}`]: `export default function Home() {
  return (
    <div>
      <h1>Welcome to ${name}</h1>
      <p>Built with FlintKit</p>
    </div>
  )
}
`,

    // Layout
    [`src/pages/_layout.${ext}`]: `export default function Layout({ children }: { children: any }) {
  return (
    <div class="layout">
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
      </nav>
      <main>{children}</main>
      <footer>
        <p>&copy; ${new Date().getFullYear()} ${name}</p>
      </footer>
    </div>
  )
}
`,

    // TypeScript config
    ...(typescript ? {
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          jsx: 'preserve',
          jsxImportSource: 'flint',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
        },
        include: ['src/**/*'],
      }, null, 2),
    } : {}),
  }

  // Add about page for full template
  if (template === 'full' || template === 'basic') {
    files[`src/pages/about.${ext}`] = `export default function About() {
  return (
    <div>
      <h1>About</h1>
      <p>This is the about page.</p>
    </div>
  )
}
`
  }

  // Add blog pages for full template
  if (template === 'full') {
    files[`src/pages/blog/index.${ext}`] = `export default function BlogIndex() {
  return (
    <div>
      <h1>Blog</h1>
      <ul>
        <li><a href="/blog/hello">Hello World</a></li>
      </ul>
    </div>
  )
}
`

    files[`src/pages/blog/[slug].${ext}`] = `export default function BlogPost({ params }: { params: { slug: string } }) {
  return (
    <article>
      <h1>Post: {params.slug}</h1>
      <p>This is a blog post.</p>
    </article>
  )
}
`

    files[`src/pages/blog/[slug].loader.ts`] = `export async function loader({ params }: { params: { slug: string } }) {
  // Fetch post data
  return {
    post: {
      slug: params.slug,
      title: 'Hello World',
      content: 'This is a sample blog post.',
    },
  }
}
`
  }

  return { files }
}
