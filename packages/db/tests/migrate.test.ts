// @flint/db — Migration Tests

import { describe, it, expect } from 'vitest'
import {
  generateDrizzleConfig,
  type MigrationConfig,
} from '../src/migrate.js'

describe('Migration Commands', () => {
  it('should generate drizzle config for SQLite', () => {
    const config: MigrationConfig = {
      driver: 'sqlite',
      url: 'local.db',
    }
    const result = generateDrizzleConfig(config)
    expect(result).toContain('sqlite')
    expect(result).toContain('local.db')
  })

  it('should generate drizzle config for PostgreSQL', () => {
    const config: MigrationConfig = {
      driver: 'pg',
      url: 'postgres://user:pass@localhost/db',
    }
    const result = generateDrizzleConfig(config)
    expect(result).toContain('pg')
    expect(result).toContain('postgres://user:pass@localhost/db')
  })

  it('should generate drizzle config for MySQL', () => {
    const config: MigrationConfig = {
      driver: 'mysql',
      url: 'mysql://user:pass@localhost/db',
    }
    const result = generateDrizzleConfig(config)
    expect(result).toContain('mysql')
    expect(result).toContain('mysql://user:pass@localhost/db')
  })

  it('should generate config with default URL', () => {
    const config: MigrationConfig = {
      driver: 'sqlite',
    }
    const result = generateDrizzleConfig(config)
    expect(result).toContain('local.db')
  })

  it('should generate config with custom schema path', () => {
    const config: MigrationConfig = {
      driver: 'sqlite',
      schemaPath: './custom/schema',
    }
    const result = generateDrizzleConfig(config)
    expect(result).toContain('schema')
  })
})
