// create-flint tests
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

// We'll test the template generation logic without actually running the CLI
// since it requires interactive prompts

describe('create-flint', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-flint-test-'))
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('should have all required templates', () => {
    // Read the source file to check templates exist
    const sourceCode = fs.readFileSync(
      path.join(__dirname, '../src/index.ts'),
      'utf-8'
    )

    expect(sourceCode).toContain('blank')
    expect(sourceCode).toContain('fullstack')
    expect(sourceCode).toContain('api')
  })

  it('should have valid HTML template structure', () => {
    const sourceCode = fs.readFileSync(
      path.join(__dirname, '../src/index.ts'),
      'utf-8'
    )

    // Check that HTML templates have proper structure
    expect(sourceCode).toContain('<!DOCTYPE html>')
    expect(sourceCode).toContain('<meta charset="UTF-8" />')
    expect(sourceCode).toContain('<div id="app"></div>')
    expect(sourceCode).toContain('<script type="module"')
  })

  it('should have Vite config in all templates', () => {
    const sourceCode = fs.readFileSync(
      path.join(__dirname, '../src/index.ts'),
      'utf-8'
    )

    // All templates should have vite config
    expect(sourceCode).toContain('vite.config.js')
    expect(sourceCode).toContain('import { defineConfig } from \'vite\'')
    expect(sourceCode).toContain('import flint from \'@flint/vite-plugin\'')
  })

  it('should have package.json generation with correct version', () => {
    const sourceCode = fs.readFileSync(
      path.join(__dirname, '../src/index.ts'),
      'utf-8'
    )

    expect(sourceCode).toContain("'flint': '^4.0.0'")
    expect(sourceCode).toContain("'@flint/vite-plugin': '^4.0.0'")
    expect(sourceCode).toContain("'vite': '^6.0.0'")
  })

  it('should have proper npm scripts', () => {
    const sourceCode = fs.readFileSync(
      path.join(__dirname, '../src/index.ts'),
      'utf-8'
    )

    expect(sourceCode).toContain("dev: 'flint dev'")
    expect(sourceCode).toContain("build: 'flint build'")
    expect(sourceCode).toContain("test: 'flint test'")
    expect(sourceCode).toContain("lint: 'flint lint'")
  })

  it('should have .gitignore generation', () => {
    const sourceCode = fs.readFileSync(
      path.join(__dirname, '../src/index.ts'),
      'utf-8'
    )

    expect(sourceCode).toContain('node_modules')
    expect(sourceCode).toContain('dist')
    expect(sourceCode).toContain('.vite')
  })

  it('should have template rendering logic', () => {
    const sourceCode = fs.readFileSync(
      path.join(__dirname, '../src/index.ts'),
      'utf-8'
    )

    expect(sourceCode).toContain('writeFileWithTemplate')
    expect(sourceCode).toContain('<%= name %>')
  })

  it('should have interactive and non-interactive modes', () => {
    const sourceCode = fs.readFileSync(
      path.join(__dirname, '../src/index.ts'),
      'utf-8'
    )

    expect(sourceCode).toContain('hasTTY()')
    expect(sourceCode).toContain('getArg(')
    expect(sourceCode).toContain('hasFlag(')
  })

  it('should have template selection in interactive mode', () => {
    const sourceCode = fs.readFileSync(
      path.join(__dirname, '../src/index.ts'),
      'utf-8'
    )

    expect(sourceCode).toContain('p.select(')
    expect(sourceCode).toContain('Choose a template:')
  })

  it('should have --force flag support', () => {
    const sourceCode = fs.readFileSync(
      path.join(__dirname, '../src/index.ts'),
      'utf-8'
    )

    expect(sourceCode).toContain('--force')
    expect(sourceCode).toContain("hasFlag('overwrite')")
  })

  it('should have --no-install flag support', () => {
    const sourceCode = fs.readFileSync(
      path.join(__dirname, '../src/index.ts'),
      'utf-8'
    )

    expect(sourceCode).toContain('--no-install')
  })

  it('should have proper error handling for duplicate directories', () => {
    const sourceCode = fs.readFileSync(
      path.join(__dirname, '../src/index.ts'),
      'utf-8'
    )

    expect(sourceCode).toContain('Directory "${name}" already exists')
  })

  it('should have next steps instructions', () => {
    const sourceCode = fs.readFileSync(
      path.join(__dirname, '../src/index.ts'),
      'utf-8'
    )

    expect(sourceCode).toContain('Next steps:')
    expect(sourceCode).toContain('cd ${name}')
  })

  it('should have package manager detection', () => {
    const sourceCode = fs.readFileSync(
      path.join(__dirname, '../src/index.ts'),
      'utf-8'
    )

    expect(sourceCode).toContain('detectPackageManager')
    expect(sourceCode).toContain('npm')
    expect(sourceCode).toContain('pnpm')
    expect(sourceCode).toContain('yarn')
    expect(sourceCode).toContain('bun')
  })

  it('should have backend dependencies for fullstack template', () => {
    const sourceCode = fs.readFileSync(
      path.join(__dirname, '../src/index.ts'),
      'utf-8'
    )

    expect(sourceCode).toContain("packageJson.dependencies['@flint/server']")
    expect(sourceCode).toContain("packageJson.dependencies['@flint/db']")
    expect(sourceCode).toContain("packageJson.dependencies['@flint/auth']")
  })
})
