// Flint CLI — Create Command
// Scaffolds a new Flint project

import fs from 'node:fs'
import path from 'node:path'

const BLANK_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Flint App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
`

const MAIN_JSX = `import { render, state } from 'flint'

function App() {
  const count = state(0)

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', marginTop: '100px' }}>
      <h1>Hello, Flint! 🔥</h1>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(c => c + 1)}>
        Increment
      </button>
    </div>
  )
}

render(App, '#app')
`

const VITE_CONFIG = `import { defineConfig } from 'vite'
import flint from '@flint/vite-plugin'

export default defineConfig({
  plugins: [flint()],
})
`

const PACKAGE_JSON = (name: string) => `{
  "name": "${name}",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "flint dev",
    "build": "flint build"
  },
  "dependencies": {
    "flint": "^0.0.1"
  },
  "devDependencies": {
    "@flint/vite-plugin": "^0.0.1",
    "vite": "^6.0.0"
  }
}
`

export async function createProject(projectName: string, template: string): Promise<void> {
  const projectPath = path.resolve(process.cwd(), projectName)

  // Check if directory already exists
  if (fs.existsSync(projectPath)) {
    throw new Error(`Directory "${projectName}" already exists. Please choose a different name.`)
  }

  console.log(`\n🔥 Creating Flint project: ${projectName}\n`)

  // Create project directory
  fs.mkdirSync(projectPath, { recursive: true })
  fs.mkdirSync(path.join(projectPath, 'src'), { recursive: true })

  // Write files
  fs.writeFileSync(path.join(projectPath, 'index.html'), BLANK_TEMPLATE)
  fs.writeFileSync(path.join(projectPath, 'src', 'main.jsx'), MAIN_JSX)
  fs.writeFileSync(path.join(projectPath, 'vite.config.js'), VITE_CONFIG)
  fs.writeFileSync(path.join(projectPath, 'package.json'), PACKAGE_JSON(projectName))

  console.log(`  ✅ Created project structure`)
  console.log(`  📄 index.html`)
  console.log(`  📄 src/main.jsx`)
  console.log(`  📄 vite.config.js`)
  console.log(`  📄 package.json`)
  console.log(`\n  Next steps:\n`)
  console.log(`    cd ${projectName}`)
  console.log(`    pnpm install`)
  console.log(`    pnpm dev\n`)
}
