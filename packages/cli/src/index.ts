#!/usr/bin/env node

import { Command } from 'commander'
import { createProject } from './commands/create.js'
import { startDev } from './commands/dev.js'
import { buildProject } from './commands/build.js'
import { testProject } from './commands/test.js'
import { lintProject } from './commands/lint.js'
import { addModule } from './commands/add.js'
import { infoProject } from './commands/info.js'
import { generate, generateHelp } from './commands/generate.js'
import { preview, previewHelp } from './commands/preview.js'
import { doctor, doctorHelp } from './commands/doctor.js'

const program = new Command()

program
  .name('flint')
  .description('Flint — Write less. Ship faster. Build beautifully.')
  .version('3.0.0')

program
  .command('create [project-name]')
  .description('Create a new Flint project')
  .option('-t, --template <template>', 'Project template (blank, counter, todo, dashboard)')
  .option('--no-install', 'Skip dependency installation')
  .action(async (projectName: string | undefined, options: { template?: string; install: boolean }) => {
    try {
      await createProject(projectName, options.template, options.install)
    } catch (err) {
      console.error(`\n✖ Error: ${err instanceof Error ? err.message : String(err)}\n`)
      process.exit(1)
    }
  })

program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-h, --host <host>', 'Host', 'localhost')
  .option('--open', 'Open browser automatically')
  .action(async (options: { port: string; host: string; open: boolean }) => {
    try {
      await startDev({
        port: parseInt(options.port, 10),
        host: options.host,
        open: options.open,
      })
    } catch (err) {
      console.error(`\n✖ Error: ${err instanceof Error ? err.message : String(err)}\n`)
      process.exit(1)
    }
  })

program
  .command('build')
  .description('Build for production')
  .option('-o, --outDir <dir>', 'Output directory', 'dist')
  .option('--minify', 'Enable minification', true)
  .option('--sourcemap', 'Generate source maps', true)
  .action(async (options: { outDir: string; minify: boolean; sourcemap: boolean }) => {
    try {
      await buildProject(options.outDir, options.minify, options.sourcemap)
    } catch (err) {
      console.error(`\n✖ Error: ${err instanceof Error ? err.message : String(err)}\n`)
      process.exit(1)
    }
  })

program
  .command('test')
  .description('Run tests')
  .option('-w, --watch', 'Run tests in watch mode')
  .option('-c, --coverage', 'Generate coverage report')
  .option('-u, --update', 'Update test snapshots')
  .action(async (options: { watch: boolean; coverage: boolean; update: boolean }) => {
    try {
      await testProject(options)
    } catch (err) {
      console.error(`\n✖ Error: ${err instanceof Error ? err.message : String(err)}\n`)
      process.exit(1)
    }
  })

program
  .command('lint')
  .description('Lint project files')
  .option('--fix', 'Automatically fix issues')
  .action(async (options: { fix: boolean }) => {
    try {
      await lintProject(options.fix)
    } catch (err) {
      console.error(`\n✖ Error: ${err instanceof Error ? err.message : String(err)}\n`)
      process.exit(1)
    }
  })

program
  .command('add <module>')
  .description('Add a Flint module to your project (router, store, forms, i18n, query, seo, pwa, image, animations, ssr)')
  .action(async (module: string) => {
    try {
      await addModule(module)
    } catch (err) {
      console.error(`\n✖ Error: ${err instanceof Error ? err.message : String(err)}\n`)
      process.exit(1)
    }
  })

program
  .command('generate <type> <name>')
  .description('Generate files from templates (component, page, store, hook, test)')
  .action(async (type: string, name: string) => {
    try {
      generate({ type, name })
    } catch (err) {
      console.error(`\n✖ Error: ${err instanceof Error ? err.message : String(err)}\n`)
      process.exit(1)
    }
  })

program
  .command('preview')
  .description('Preview production build locally')
  .option('-p, --port <port>', 'Port number', '4173')
  .option('-h, --host <host>', 'Host', 'localhost')
  .option('--no-open', 'Don\'t open browser automatically')
  .action(async (options: { port: string; host: string; open: boolean }) => {
    try {
      preview({
        port: parseInt(options.port, 10),
        host: options.host,
        open: options.open,
      })
    } catch (err) {
      console.error(`\n✖ Error: ${err instanceof Error ? err.message : String(err)}\n`)
      process.exit(1)
    }
  })

program
  .command('doctor')
  .description('Check project for issues and missing dependencies')
  .action(async () => {
    try {
      doctor()
    } catch (err) {
      console.error(`\n✖ Error: ${err instanceof Error ? err.message : String(err)}\n`)
      process.exit(1)
    }
  })

program
  .command('info')
  .description('Display project and environment information')
  .action(async () => {
    try {
      await infoProject()
    } catch (err) {
      console.error(`\n✖ Error: ${err instanceof Error ? err.message : String(err)}\n`)
      process.exit(1)
    }
  })

program.parse()
