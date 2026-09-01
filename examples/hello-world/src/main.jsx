import { render, state, computed } from 'flint'

function Counter() {
  const count = state(0)
  const doubled = computed(() => count() * 2)

  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        🔥 Flint
      </h1>
      <p style={{ fontSize: '18px', color: '#888', marginBottom: '40px' }}>
        Write less. Ship faster. Build beautifully.
      </p>

      <div style={{ fontSize: '64px', fontWeight: 'bold', marginBottom: '10px' }}>
        {count()}
      </div>
      <div style={{ fontSize: '24px', color: '#666', marginBottom: '40px' }}>
        × 2 = {doubled()}
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={() => count.set(c => c - 1)}
          style={{
            padding: '12px 24px',
            fontSize: '18px',
            border: '2px solid #333',
            borderRadius: '8px',
            background: 'transparent',
            color: '#fafafa',
            cursor: 'pointer',
          }}
        >
          −
        </button>
        <button
          onClick={() => count.set(0)}
          style={{
            padding: '12px 24px',
            fontSize: '18px',
            border: '2px solid #333',
            borderRadius: '8px',
            background: 'transparent',
            color: '#fafafa',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
        <button
          onClick={() => count.set(c => c + 1)}
          style={{
            padding: '12px 24px',
            fontSize: '18px',
            border: '2px solid #ff6b35',
            borderRadius: '8px',
            background: '#ff6b35',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}

render(Counter, '#app')
