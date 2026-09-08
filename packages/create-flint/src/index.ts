#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

// ─── Templates v5 — Full-Stack Support ──────────────────────────

interface Template {
  name: string
  description: string
  files: Record<string, string>
}

const BLANK_TEMPLATE: Template = {
  name: 'blank',
  description: 'Minimal starter — auto-imports, no boilerplate',
  files: {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><%= name %></title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
`,
    'src/main.jsx': `// No import needed — auto-imported by the compiler!
// state, computed, effect, render, Show, When, For — all available

function App() {
  const count = state(0)

  return (
    <div class="container">
      <h1>Hello, Flint!</h1>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(c => c + 1)}>
        Increment
      </button>
    </div>
  )
}

render(App, '#app')
`,
    'src/style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.container {
  font-family: system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1rem;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  background: #3b82f6;
  color: white;
}

button:hover {
  background: #2563eb;
}
`,
    'vite.config.js': `import { defineConfig } from 'vite'
import flint from 'flint-vite-plugin'

export default defineConfig({
  plugins: [flint()],
})
`,
  },
}

const FULLSTACK_TEMPLATE: Template = {
  name: 'fullstack',
  description: 'Full-stack app with server, database, and auth',
  files: {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><%= name %></title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
`,
    'src/main.jsx': `function App() {
  const [user, setUser] = state(null)
  const [email, setEmail] = state('')
  const [password, setPassword] = state('')
  const [error, setError] = state('')

  const login = async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok) {
        setUser(data.user)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Login failed')
    }
  }

  const logout = () => {
    setUser(null)
    setEmail('')
    setPassword('')
  }

  if (user) {
    return (
      <div class="container">
        <h1>Welcome, {user.name}!</h1>
        <button onClick={logout}>Logout</button>
      </div>
    )
  }

  return (
    <div class="container">
      <h1>Login</h1>
      {error && <p class="error">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onInput={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onInput={(e) => setPassword(e.target.value)}
      />
      <button onClick={login}>Login</button>
    </div>
  )
}

render(App, '#app')
`,
    'src/style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.container {
  font-family: system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1rem;
}

input {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 300px;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  background: #3b82f6;
  color: white;
}

button:hover {
  background: #2563eb;
}

.error {
  color: #dc2626;
  font-size: 0.875rem;
}
`,
    'server/index.js': `import { createServer, validate, z } from 'flint-server'
import { createDatabase, sqliteTable, text, integer } from 'flint-drizzle'
import { createAuth } from 'flint-auth'

// Setup database
const db = await createDatabase({ driver: 'sqlite', path: 'app.db' })

// Define schema
const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
})

// Create tables
db.run(\`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL
)\`)

// Setup auth
const auth = createAuth({ secret: 'your-secret-key-change-in-production' })

// Create server
const app = createServer({ port: 3000 })

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// Routes
app.post('/api/auth/login', validate({ body: loginSchema }), async (c) => {
  const { email, password } = c.get('validatedBody')
  
  // Find user
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  // Check password
  const valid = await auth.comparePassword(password, user.password)
  if (!valid) {
    return c.json({ error: 'Invalid password' }, 401)
  }

  // Generate token
  const token = auth.signToken({ sub: user.id, email: user.email })

  return c.json({
    user: { id: user.id, email: user.email, name: user.name },
    token,
  })
})

app.post('/api/auth/register', validate({ body: loginSchema }), async (c) => {
  const { email, password } = c.get('validatedBody')
  
  // Hash password
  const hashedPassword = await auth.hashPassword(password)

  // Insert user
  try {
    db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)').run(
      email,
      hashedPassword,
      email.split('@')[0]
    )
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Email already exists' }, 400)
  }
})

// Protected route
app.get('/api/profile', auth.protect(), async (c) => {
  const user = c.get('user')
  return c.json(user)
})

// Start server
app.listen()
console.log('Server running on http://localhost:3000')
`,
    'vite.config.js': `import { defineConfig } from 'vite'
import flint from 'flint-vite-plugin'

export default defineConfig({
  plugins: [flint()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
`,
  },
}

const API_TEMPLATE: Template = {
  name: 'api',
  description: 'REST API with validation, auth, and database',
  files: {
    'src/index.js': `import { createServer, validate, z, rateLimit } from 'flint-server'
import { createDatabase, sqliteTable, text, integer } from 'flint-drizzle'
import { createAuth } from 'flint-auth'

// Setup
const db = await createDatabase({ driver: 'sqlite', path: 'api.db' })
const auth = createAuth({ secret: 'your-secret-key' })

// Schema
const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
})

db.run(\`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
)\`)

// Server
const app = createServer({ port: 3000 })
app.use(rateLimit({ max: 100 }))

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// Routes
app.post('/api/register', validate({ body: registerSchema }), async (c) => {
  const { email, password } = c.get('validatedBody')
  const hashed = await auth.hashPassword(password)
  
  try {
    db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hashed)
    return c.json({ success: true }, 201)
  } catch {
    return c.json({ error: 'Email exists' }, 400)
  }
})

app.post('/api/login', validate({ body: registerSchema }), async (c) => {
  const { email, password } = c.get('validatedBody')
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  
  if (!user || !(await auth.comparePassword(password, user.password))) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const token = auth.signToken({ sub: user.id, email })
  return c.json({ token })
})

app.get('/api/me', auth.protect(), async (c) => {
  return c.json(c.get('user'))
})

app.listen()
console.log('API running on http://localhost:3000')
`,
  },
}

const TEMPLATES: Record<string, Template> = {
  blank: BLANK_TEMPLATE,
  fullstack: FULLSTACK_TEMPLATE,
  api: API_TEMPLATE,
}

// ─── Helpers ────────────────────────────────────────────────────

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`)
  if (idx === -1) return undefined
  return process.argv[idx + 1]
}

function hasTTY(): boolean {
  return process.stdin.isTTY === true
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

// ─── Package Manager Detection ──────────────────────────────────

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

function detectPackageManager(): PackageManager {
  // Check environment variable
  const userAgent = process.env.npm_config_user_agent || ''
  if (userAgent.includes('pnpm')) return 'pnpm'
  if (userAgent.includes('yarn')) return 'yarn'
  if (userAgent.includes('bun')) return 'bun'

  // Check for lock files
  if (fs.existsSync('pnpm-lock.yaml')) return 'pnpm'
  if (fs.existsSync('yarn.lock')) return 'yarn'
  if (fs.existsSync('bun.lockb')) return 'bun'

  // Default to npm
  return 'npm'
}

function getInstallCommand(pm: PackageManager): string {
  switch (pm) {
    case 'pnpm': return 'pnpm install'
    case 'yarn': return 'yarn install'
    case 'bun': return 'bun install'
    case 'npm':
    default: return 'npm install'
  }
}

function getRunCommand(pm: PackageManager, script: string): string {
  switch (pm) {
    case 'pnpm': return `pnpm run ${script}`
    case 'yarn': return `yarn ${script}`
    case 'bun': return `bun run ${script}`
    case 'npm':
    default: return `npm run ${script}`
  }
}

function getCreateCommand(pm: PackageManager): string {
  switch (pm) {
    case 'pnpm': return 'pnpm create flint'
    case 'yarn': return 'yarn create flint'
    case 'bun': return 'bun create flint'
    case 'npm':
    default: return 'npm create flint'
  }
}

// ─── Template Rendering ─────────────────────────────────────────

function writeFileWithTemplate(filePath: string, content: string, data: Record<string, string>): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Simple template rendering (<%= name %>)
  let rendered = content
  for (const [key, value] of Object.entries(data)) {
    rendered = rendered.replace(new RegExp(`<%= ${key} %>`, 'g'), value)
  }

  fs.writeFileSync(filePath, rendered)
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  let name = getArg('name') || process.argv[2]
  let templateKey = getArg('template') || getArg('t')
  const pm = detectPackageManager()

  if (hasTTY()) {
    try {
      const p = await import('@clack/prompts')

      if (!name) {
        name = await p.text({
          message: 'Project name:',
          placeholder: 'my-flint-app',
          initialValue: 'my-flint-app',
          validate: (value: string) => {
            if (!value.trim()) return 'Project name is required'
            if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Name can only contain letters, numbers, hyphens, and underscores'
            return undefined
          },
        }) as string

        if (typeof name === 'symbol') {
          console.log('\n  Cancelled.\n')
          process.exit(0)
        }
      }

      if (!templateKey) {
        templateKey = await p.select({
          message: 'Choose a template:',
          options: Object.values(TEMPLATES).map(t => ({
            value: t.name,
            label: t.name.charAt(0).toUpperCase() + t.name.slice(1),
            hint: t.description,
          })),
        }) as string

        if (typeof templateKey === 'symbol') {
          console.log('\n  Cancelled.\n')
          process.exit(0)
        }
      }
    } catch (e) {
      console.warn('[Flint] Interactive prompts failed, using defaults:', e)
    }
  }

  if (!name) name = 'my-flint-app'
  if (!templateKey) templateKey = 'blank'

  const template = TEMPLATES[templateKey]
  if (!template) {
    const available = Object.keys(TEMPLATES).join(', ')
    console.error(`\n  Unknown template "${templateKey}". Available: ${available}\n`)
    process.exit(1)
  }

  const projectPath = path.resolve(process.cwd(), name)

  if (fs.existsSync(projectPath)) {
    if (!hasFlag('force') && !hasFlag('overwrite')) {
      console.error(`\n  Directory "${name}" already exists. Use --force to overwrite.\n`)
      process.exit(1)
    }
    fs.rmSync(projectPath, { recursive: true, force: true })
  }

  console.log(`\n  Creating Flint project: ${name}`)
  console.log(`  Using package manager: ${pm}\n`)

  fs.mkdirSync(projectPath, { recursive: true })

  const data = { name }
  for (const [filePath, content] of Object.entries(template.files)) {
    const fullPath = path.join(projectPath, filePath)
    writeFileWithTemplate(fullPath, content, data)
    console.log(`  ✔ ${filePath}`)
  }

  // Write package.json
  const packageJson: any = {
    name,
    private: true,
    version: '0.0.1',
    type: 'module',
    scripts: {
      dev: 'flint dev',
      build: 'flint build',
      test: 'flint test',
      lint: 'flint lint',
    },
    dependencies: {
      'flint': '^4.0.0',
    },
    devDependencies: {
      'flint-vite-plugin': '^4.0.0',
      'vite': '^6.0.0',
    },
  }

  // Add backend dependencies for fullstack/api templates
  if (templateKey === 'fullstack' || templateKey === 'api') {
    packageJson.dependencies['flint-server'] = '^4.0.0'
    packageJson.dependencies['flint-drizzle'] = '^4.0.0'
    packageJson.dependencies['flint-auth'] = '^4.0.0'
  }

  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )
  console.log('  ✔ package.json')

  // Write .gitignore
  fs.writeFileSync(
    path.join(projectPath, '.gitignore'),
    'node_modules\ndist\n.vite\n*.db\n.env\n'
  )
  console.log('  ✔ .gitignore')

  // Write .env.example for fullstack/api templates
  if (templateKey === 'fullstack' || templateKey === 'api') {
    fs.writeFileSync(
      path.join(projectPath, '.env.example'),
      `PORT=3000
HOST=0.0.0.0
DATABASE_URL=./app.db
JWT_SECRET=your-secret-key-change-in-production
CORS_ORIGIN=http://localhost:5173
`
    )
    console.log('  ✔ .env.example')
  }

  // Install deps (unless --no-install)
  if (!hasFlag('no-install')) {
    console.log('\n  Installing dependencies...\n')
    try {
      execSync(getInstallCommand(pm), { cwd: projectPath, stdio: 'inherit' })
    } catch {
      console.log(`\n  Failed to install dependencies. Run manually:\n`)
      console.log(`    cd ${name}`)
      console.log(`    ${getInstallCommand(pm)}\n`)
    }
  }

  console.log(`\n  Next steps:`)
  console.log(`    cd ${name}`)
  if (hasFlag('no-install')) console.log(`    ${getInstallCommand(pm)}`)
  console.log(`    ${getRunCommand(pm, 'dev')}\n`)
}

main()
