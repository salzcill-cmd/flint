// Todo App with Flint - No imports needed!

function TodoApp() {
  const [todos, setTodos] = state([])
  const [input, setInput] = state('')

  const addTodo = () => {
    if (!input.trim()) return
    setTodos([...todos, { id: Date.now(), text: input, done: false }])
    setInput('')
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id))
  }

  return (
    <div class="container">
      <h1>Todo App</h1>
      <div class="input-group">
        <input
          type="text"
          placeholder="Add a todo..."
          value={input}
          onInput={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul class="todo-list">
        {todos.map(todo => (
          <li key={todo.id} class={todo.done ? 'done' : ''}>
            <span onClick={() => toggleTodo(todo.id)}>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
      {todos.length === 0 && <p class="empty">No todos yet. Add one above!</p>}
    </div>
  )
}

render(TodoApp, '#app')
