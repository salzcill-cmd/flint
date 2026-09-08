// @flint/db — Tests

import { describe, it, expect, vi, afterAll } from 'vitest'
import { createDatabase, eq, and, or, sql, sqliteTable, text, integer } from '../src/index.js'

describe('FlintDB', () => {
  let adapter: any

  afterAll(async () => {
    if (adapter) {
      await adapter.close()
    }
  })

  it('should create SQLite database', async () => {
    adapter = await createDatabase({
      driver: 'sqlite',
      path: ':memory:',
    })
    expect(adapter).toBeDefined()
    expect(adapter.db).toBeDefined()
    expect(adapter.driver).toBe('sqlite')
    expect(typeof adapter.close).toBe('function')
  })

  it('should support SQLite queries', async () => {
    adapter = await createDatabase({
      driver: 'sqlite',
      path: ':memory:',
    })

    const users = sqliteTable('users', {
      id: integer('id').primaryKey({ autoIncrement: true }),
      name: text('name').notNull(),
      email: text('email').notNull().unique(),
    })

    // Create table
    adapter.db.run(sql`CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    )`)

    // Insert user
    adapter.db.insert(users).values({
      name: 'John Doe',
      email: 'john@example.com',
    }).run()

    // Query users
    const result = adapter.db.select().from(users).all()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('John Doe')
    expect(result[0].email).toBe('john@example.com')
  })

  it('should support SQLite with eq operator', async () => {
    adapter = await createDatabase({
      driver: 'sqlite',
      path: ':memory:',
    })

    const users = sqliteTable('users', {
      id: integer('id').primaryKey({ autoIncrement: true }),
      name: text('name').notNull(),
    })

    adapter.db.run(sql`CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )`)

    adapter.db.insert(users).values({ name: 'Alice' }).run()
    adapter.db.insert(users).values({ name: 'Bob' }).run()

    const result = adapter.db.select().from(users).where(eq(users.name, 'Alice')).all()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
  })

  it('should support SQLite with and operator', async () => {
    adapter = await createDatabase({
      driver: 'sqlite',
      path: ':memory:',
    })

    const users = sqliteTable('users', {
      id: integer('id').primaryKey({ autoIncrement: true }),
      name: text('name').notNull(),
      age: integer('age').notNull(),
    })

    adapter.db.run(sql`CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL
    )`)

    adapter.db.insert(users).values({ name: 'Alice', age: 25 }).run()
    adapter.db.insert(users).values({ name: 'Bob', age: 30 }).run()
    adapter.db.insert(users).values({ name: 'Charlie', age: 35 }).run()

    const result = adapter.db.select().from(users).where(
      and(eq(users.age, 25), eq(users.name, 'Alice'))
    ).all()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
  })

  it('should support SQLite with or operator', async () => {
    adapter = await createDatabase({
      driver: 'sqlite',
      path: ':memory:',
    })

    const users = sqliteTable('users', {
      id: integer('id').primaryKey({ autoIncrement: true }),
      name: text('name').notNull(),
    })

    adapter.db.run(sql`CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )`)

    adapter.db.insert(users).values({ name: 'Alice' }).run()
    adapter.db.insert(users).values({ name: 'Bob' }).run()
    adapter.db.insert(users).values({ name: 'Charlie' }).run()

    const result = adapter.db.select().from(users).where(
      or(eq(users.name, 'Alice'), eq(users.name, 'Charlie'))
    ).all()
    expect(result).toHaveLength(2)
  })

  it('should close database connection', async () => {
    adapter = await createDatabase({
      driver: 'sqlite',
      path: ':memory:',
    })
    expect(adapter.close).toBeDefined()
    await adapter.close()
  })
})

describe('Drizzle Operators', () => {
  it('should export eq operator', async () => {
    const { eq } = await import('../src/index.js')
    expect(typeof eq).toBe('function')
  })

  it('should export and operator', async () => {
    const { and } = await import('../src/index.js')
    expect(typeof and).toBe('function')
  })

  it('should export or operator', async () => {
    const { or } = await import('../src/index.js')
    expect(typeof or).toBe('function')
  })

  it('should export sql operator', async () => {
    const { sql } = await import('../src/index.js')
    expect(typeof sql).toBe('function')
  })
})

describe('Schema Helpers', () => {
  it('should export sqliteTable', async () => {
    const { sqliteTable } = await import('../src/index.js')
    expect(typeof sqliteTable).toBe('function')
  })

  it('should export pgTable', async () => {
    const { pgTable } = await import('../src/index.js')
    expect(typeof pgTable).toBe('function')
  })

  it('should export mysqlTable', async () => {
    const { mysqlTable } = await import('../src/index.js')
    expect(typeof mysqlTable).toBe('function')
  })
})
