import { describe, it, expect } from 'vitest'
import { defineConfig, generateProject } from '../src/index'

describe('FlintKit', () => {
  describe('defineConfig()', () => {
    it('should return config with defaults', () => {
      const config = defineConfig({ name: 'my-app' })
      expect(config.name).toBe('my-app')
      expect(config.ssr).toBe(true)
      expect(config.fileRoutes).toBe(true)
      expect(config.routesDir).toBe('pages')
      expect(config.outDir).toBe('dist')
      expect(config.dev).toBe(false)
    })

    it('should override defaults', () => {
      const config = defineConfig({
        name: 'custom-app',
        ssr: false,
        fileRoutes: false,
        routesDir: 'routes',
        outDir: 'build',
        dev: true,
      })
      expect(config.name).toBe('custom-app')
      expect(config.ssr).toBe(false)
      expect(config.fileRoutes).toBe(false)
      expect(config.routesDir).toBe('routes')
      expect(config.outDir).toBe('build')
      expect(config.dev).toBe(true)
    })

    it('should handle empty config', () => {
      const config = defineConfig({})
      expect(config.name).toBe('flintkit-app')
      expect(config.ssr).toBe(true)
    })
  })

  describe('generateProject()', () => {
    it('should generate basic project files', () => {
      const { files } = generateProject({ name: 'test-app' })

      expect(files).toHaveProperty('package.json')
      expect(files).toHaveProperty('src/app.tsx')
      expect(files).toHaveProperty('src/pages/index.tsx')
      expect(files).toHaveProperty('src/pages/_layout.tsx')
      expect(files).toHaveProperty('tsconfig.json')
    })

    it('should generate package.json with correct dependencies', () => {
      const { files } = generateProject({ name: 'test-app' })
      const pkg = JSON.parse(files['package.json'])

      expect(pkg.name).toBe('test-app')
      expect(pkg.dependencies).toHaveProperty('flintkit')
      expect(pkg.dependencies).toHaveProperty('@flint/runtime')
      expect(pkg.dependencies).toHaveProperty('@flint/reactivity')
    })

    it('should use tsx extension for TypeScript', () => {
      const { files } = generateProject({ name: 'test-app', typescript: true })
      expect(files).toHaveProperty('src/app.tsx')
      expect(files).toHaveProperty('src/pages/index.tsx')
    })

    it('should use jsx extension for JavaScript', () => {
      const { files } = generateProject({ name: 'test-app', typescript: false })
      expect(files).toHaveProperty('src/app.jsx')
      expect(files).toHaveProperty('src/pages/index.jsx')
      expect(files).not.toHaveProperty('tsconfig.json')
    })

    it('should generate basic template with about page', () => {
      const { files } = generateProject({ name: 'test-app', template: 'basic' })
      expect(files).toHaveProperty('src/pages/about.tsx')
    })

    it('should generate full template with blog pages', () => {
      const { files } = generateProject({ name: 'test-app', template: 'full' })
      expect(files).toHaveProperty('src/pages/about.tsx')
      expect(files).toHaveProperty('src/pages/blog/index.tsx')
      expect(files).toHaveProperty('src/pages/blog/[slug].tsx')
      expect(files).toHaveProperty('src/pages/blog/[slug].loader.ts')
    })

    it('should generate minimal template without extra pages', () => {
      const { files } = generateProject({ name: 'test-app', template: 'minimal' })
      expect(files).not.toHaveProperty('src/pages/about.tsx')
      expect(files).not.toHaveProperty('src/pages/blog/index.tsx')
    })

    it('should include SSR config when ssr: true', () => {
      const { files } = generateProject({ name: 'test-app', ssr: true })
      expect(files['src/app.tsx']).toContain('ssr: true')
    })

    it('should not include SSR config when ssr: false', () => {
      const { files } = generateProject({ name: 'test-app', ssr: false })
      expect(files['src/app.tsx']).not.toContain('ssr: true')
    })

    it('should generate valid JSON in package.json', () => {
      const { files } = generateProject({ name: 'test-app' })
      expect(() => JSON.parse(files['package.json'])).not.toThrow()
    })

    it('should generate valid JSON in tsconfig.json', () => {
      const { files } = generateProject({ name: 'test-app', typescript: true })
      expect(() => JSON.parse(files['tsconfig.json'])).not.toThrow()
    })

    it('should include project name in index page', () => {
      const { files } = generateProject({ name: 'my-cool-app' })
      expect(files['src/pages/index.tsx']).toContain('my-cool-app')
    })

    it('should include project name in layout footer', () => {
      const { files } = generateProject({ name: 'my-cool-app' })
      expect(files['src/pages/_layout.tsx']).toContain('my-cool-app')
    })
  })
})
