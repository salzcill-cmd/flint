import { createServer, validate, z, rateLimit } from '@flint/server'
import { createDatabase, sqliteTable, text, integer } from '@flint/db'

// Setup database
const db = await createDatabase({ driver: 'sqlite', path: 'todos.db' })

// Create todos table
db.run(`CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  done INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`)

// Create server
const app = createServer({ port: 3000 })

// Add rate limiting
app.use(rateLimit({ max: 100, windowMs: 60000 }))

// Validation schemas
const createTodoSchema = z.object({
  text: z.string().min(1, 'Todo text is required'),
})

// Routes
app.get('/api/todos', async (c) => {
  const todos = db.all('SELECT * FROM todos ORDER BY created_at DESC')
  return c.json(todos)
})

app.post('/api/todos', validate({ body: createTodoSchema }), async (c) => {
  const { text } = c.get('validatedBody')
  const result = db.prepare('INSERT INTO todos (text) VALUES (?)').run(text)
  const todo = db.get('SELECT * FROM todos WHERE id = ?', result.lastInsertRowid)
  return c.json(todo, 201)
})

app.patch('/api/todos/:id', async (c) => {
  const { id } = c.req.param()
  const todo = db.get('SELECT * FROM todos WHERE id = ?', id)
  if (!todo) return c.json({ error: 'Todo not found' }, 404)
  
  db.prepare('UPDATE todos SET done = ? WHERE id = ?').run(todo.done ? 0 : 1, id)
  const updated = db.get('SELECT * FROM todos WHERE id = ?', id)
  return c.json(updated)
})

app.delete('/api/todos/:id', async (c) => {
  const { id } = c.req.param()
  const todo = db.get('SELECT * FROM todos WHERE id = ?', id)
  if (!todo) return c.json({ error: 'Todo not found' }, 404)
  
  db.prepare('DELETE FROM todos WHERE id = ?').run(id)
  return c.json({ success: true })
})

// Start server
app.listen()
console.log('API running on http://localhost:3000')
