// Flint CLI — Main Entry Point

import { Command } from 'commander'
import { createProject } from './commands/create.js'
import { startDev } from './commands/dev.js'
import { buildProject } from './commands/build.js'

const program = new Command()

program
  .name('flint')
  .description('Flint — Write less. Ship faster. Build beautifully.')
  .version('0.0.1')

program
  .command('create <project-name>')
  .description('Create a new Flint project')
  .option('--template <template>', 'Project template (blank, counter, dashboard)', 'blank')
  .action(async (projectName: string, options: { template: string }) => {
    try {
      await createProject(projectName, options.template)
    } catch (err) {
      console.error(`\n❌ Error: ${err instanceof Error ? err.message : String(err)}\n`)
      process.exit(1)
    }
  })

program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-h, --host <host>', 'Host', 'localhost')
  .action(async (options: { port: string; host: string }) => {
    try {
      await startDev({
        port: parseInt(options.port, 10),
        host: options.host,
      })
    } catch (err) {
      console.error(`\n❌ Error: ${err instanceof Error ? err.message : String(err)}\n`)
      process.exit(1)
    }
  })

program
  .command('build')
  .description('Build for production')
  .option('-o, --outDir <dir>', 'Output directory', 'dist')
  .action(async (options: { outDir: string }) => {
    try {
      await buildProject(options.outDir)
    } catch (err) {
      console.error(`\n❌ Error: ${err instanceof Error ? err.message : String(err)}\n`)
      process.exit(1)
    }
  })

program.parse()
