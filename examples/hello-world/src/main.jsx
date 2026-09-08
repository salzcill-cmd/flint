// Hello World with Flint!

function Counter() {
  const [count, setCount] = state(0)

  return (
    <div class="container">
      <h1>Hello Flint!</h1>
      <p>This is a simple counter built with Flint framework.</p>
      <div class="counter">
        <button onClick={() => setCount(count - 1)}>-</button>
        <span>{count}</span>
        <button onClick={() => setCount(count + 1)}>+</button>
      </div>
    </div>
  )
}

render(Counter, '#app')
