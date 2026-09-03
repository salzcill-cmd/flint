import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const CLI_PATH = path.resolve(__dirname, '../dist/index.js')
const TEMP_DIR = path.join(os.tmpdir(), 'flint-cli-test')

beforeAll(() => {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
})

afterAll(() => {
  fs.rmSync(TEMP_DIR, { recursive: true, force: true })
})

function run(args: string = '', options: { cwd?: string } = {}): string {
  return execSync(`node ${CLI_PATH} ${args}`, {
    encoding: 'utf-8',
    cwd: options.cwd || TEMP_DIR,
    env: { ...process.env, NODE_ENV: 'test' },
  })
}

describe('Flint CLI', () => {
  describe('--help', () => {
    it('should show help text', () => {
      const output = run('--help')
      expect(output).toContain('Flint')
      expect(output).toContain('Commands:')
      expect(output).toContain('create')
      expect(output).toContain('dev')
      expect(output).toContain('build')
      expect(output).toContain('test')
      expect(output).toContain('lint')
      expect(output).toContain('add')
      expect(output).toContain('info')
    })
  })

  describe('--version', () => {
    it('should show version number', () => {
      const output = run('--version')
      expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/)
    })
  })

  describe('create', () => {
    it('should show create help', () => {
      const output = run('create --help')
      expect(output).toContain('project-name')
      expect(output).toContain('--template')
      expect(output).toContain('--no-install')
    })

    it('should create a blank project', () => {
      const projectName = 'test-blank'
      const output = run(`create ${projectName} --template blank --no-install`)

      expect(output).toContain('Creating Flint project')
      expect(output).toContain(projectName)

      const projectPath = path.join(TEMP_DIR, projectName)
      expect(fs.existsSync(projectPath)).toBe(true)
      expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true)
      expect(fs.existsSync(path.join(projectPath, 'index.html'))).toBe(true)
      expect(fs.existsSync(path.join(projectPath, 'src', 'main.jsx'))).toBe(true)
      expect(fs.existsSync(path.join(projectPath, 'vite.config.js'))).toBe(true)
      expect(fs.existsSync(path.join(projectPath, '.gitignore'))).toBe(true)

      // Check package.json content
      const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8'))
      expect(pkg.name).toBe(projectName)
      expect(pkg.scripts.dev).toBe('flint dev')
      expect(pkg.scripts.build).toBe('flint build')
    })

    it('should create a counter project', () => {
      const projectName = 'test-counter'
      const output = run(`create ${projectName} --template counter --no-install`)

      expect(output).toContain('Creating Flint project')

      const projectPath = path.join(TEMP_DIR, projectName)
      expect(fs.existsSync(projectPath)).toBe(true)

      const mainJsx = fs.readFileSync(path.join(projectPath, 'src', 'main.jsx'), 'utf-8')
      expect(mainJsx).toContain('computed')
      expect(mainJsx).toContain('effect')
    })

    it('should create a todo project', () => {
      const projectName = 'test-todo'
      const output = run(`create ${projectName} --template todo --no-install`)

      expect(output).toContain('Creating Flint project')

      const projectPath = path.join(TEMP_DIR, projectName)
      expect(fs.existsSync(projectPath)).toBe(true)

      const mainJsx = fs.readFileSync(path.join(projectPath, 'src', 'main.jsx'), 'utf-8')
      expect(mainJsx).toContain('todos')
      expect(mainJsx).toContain('filter')
    })

    it('should fail for unknown template', () => {
      expect(() => run('create test-bad --template unknown --no-install')).toThrow()
    })
  })

  describe('add', () => {
    it('should show add help', () => {
      const output = run('add --help')
      expect(output).toContain('module')
      expect(output).toContain('router')
      expect(output).toContain('store')
    })

    it('should add a module', () => {
      const output = run('add router')
      expect(output).toContain('Adding Router module')
      expect(output).toContain('Created src/examples/router.example.js')
    })

    it('should list available modules for unknown module', () => {
      const output = run('add unknown')
      expect(output).toContain('Unknown module')
      expect(output).toContain('Available modules')
      expect(output).toContain('router')
      expect(output).toContain('store')
      expect(output).toContain('forms')
    })
  })

describe('info', () => {
    it('should show project info', () => {
      const output = run('info')
      expect(output).toContain('Flint Project Info')
      expect(output).toContain('Environment:')
    }, 10000)
  })

  describe('test', () => {
    it('should show test help', () => {
      const output = run('test --help')
      expect(output).toContain('--watch')
      expect(output).toContain('--coverage')
      expect(output).toContain('--update')
    })
  })

  describe('lint', () => {
    it('should show lint help', () => {
      const output = run('lint --help')
      expect(output).toContain('--fix')
    })
  })

  describe('build', () => {
    it('should show build help', () => {
      const output = run('build --help')
      expect(output).toContain('--outDir')
      expect(output).toContain('--minify')
      expect(output).toContain('--sourcemap')
    })
  })

  describe('dev', () => {
    it('should show dev help', () => {
      const output = run('dev --help')
      expect(output).toContain('--port')
      expect(output).toContain('--host')
      expect(output).toContain('--open')
    })
  })
})

describe('create-flint CLI', () => {
  const CREATE_CLI_PATH = path.resolve(__dirname, '../../create-flint/dist/index.js')

  it('should create a project non-interactively', () => {
    const projectName = 'test-create-flint'
    const output = execSync(`node ${CREATE_CLI_PATH} ${projectName} --template blank --no-install`, {
      encoding: 'utf-8',
      cwd: TEMP_DIR,
      env: { ...process.env, NODE_ENV: 'test' },
    })

    expect(output).toContain('Creating Flint project')
    expect(output).toContain(projectName)

    const projectPath = path.join(TEMP_DIR, projectName)
    expect(fs.existsSync(projectPath)).toBe(true)
    expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true)
  })
})
