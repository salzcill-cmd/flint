// Flint CLI — Playground Command
// Open interactive Flint playground in browser

import { spawn } from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

export interface PlaygroundOptions {
  port: number
}

export async function startPlayground(options: PlaygroundOptions): Promise<void> {
  const playgroundDir = join(process.cwd(), '.flint-playground')

  if (!existsSync(playgroundDir)) {
    mkdirSync(playgroundDir, { recursive: true })
  }

  // Create playground index.html
  writeFileSync(join(playgroundDir, 'index.html'), `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Flint Playground</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; }
    .container { display: grid; grid-template-columns: 1fr 1fr; height: 100vh; }
    .editor { padding: 16px; border-right: 1px solid #1e293b; }
    .preview { padding: 16px; }
    textarea {
      width: 100%; height: 100%; background: #1e293b; color: #e2e8f0;
      border: 1px solid #334155; border-radius: 8px; padding: 12px;
      font-family: 'JetBrains Mono', monospace; font-size: 14px; resize: none;
    }
    h1 { font-size: 1rem; margin-bottom: 12px; color: #3b82f6; }
    #output {
      background: #1e293b; border-radius: 8px; padding: 12px;
      font-family: monospace; white-space: pre-wrap; height: calc(100% - 40px);
      overflow: auto;
    }
    button {
      margin-top: 8px; padding: 8px 16px; background: #3b82f6; color: white;
      border: none; border-radius: 6px; cursor: pointer; font-size: 14px;
    }
    button:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="editor">
      <h1>Flint Playground</h1>
      <textarea id="code" spellcheck="false">// Write Flint code here
import { state, computed } from 'flint-reactivity'

const count = state(0)
const doubled = computed(() => count() * 2)

document.getElementById('output').innerHTML = \`
  Count: \${count()}
  Doubled: \${doubled()}
\`
</textarea>
      <button onclick="runCode()">Run ▶</button>
    </div>
    <div class="preview">
      <h1>Output</h1>
      <div id="output">Click "Run" to execute your code</div>
    </div>
  </div>
  <script>
    function runCode() {
      const code = document.getElementById('code').value
      const output = document.getElementById('output')
      try {
        const logs = []
        const fakeConsole = { log: (...args) => logs.push(args.join(' ')) }
        const fn = new Function('console', 'document', code)
        fn(fakeConsole, document)
        output.textContent = logs.join('\\n') || '(no output)'
      } catch (e) {
        output.textContent = 'Error: ' + e.message
      }
    }
  </script>
</body>
</html>`)

  // Create playground server
  writeFileSync(join(playgroundDir, 'server.ts'), `import { createServer } from '../../server/src/index.js'

const app = createServer({ port: ${options.port}, logger: false })

app.get('/', (c) => {
  return c.html(require('fs').readFileSync('./index.html', 'utf-8'))
})

app.listen(() => {
  console.log('Flint Playground running at http://localhost:${options.port}')
})
`)

  console.log(`\n  🎮 Flint Playground\n`)
  console.log(`  Starting playground at http://localhost:${options.port}\n`)

  // Start with tsx
  const child = spawn('npx', ['tsx', join(playgroundDir, 'server.ts')], {
    stdio: 'inherit',
    cwd: playgroundDir,
  })

  child.on('error', () => {
    console.log('  Starting with Node.js...')
    spawn('node', ['--experimental-strip-types', join(playgroundDir, 'server.ts')], {
      stdio: 'inherit',
      cwd: playgroundDir,
    })
  })

  process.on('SIGINT', () => {
    child.kill()
    process.exit(0)
  })
}
