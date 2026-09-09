import { createStyles, h } from 'flint'

const styles = createStyles({
  section: {
    padding: 'clamp(80px, 10vw, 140px) 24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr',
    gap: '64px',
    alignItems: 'center',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    marginBottom: '12px',
  },
  title: {
    fontSize: 'clamp(30px, 4.5vw, 44px)',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
    marginBottom: '16px',
  },
  desc: {
    fontSize: 'clamp(15px, 1.5vw, 17px)',
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    maxWidth: '560px',
  },
  codeBlock: {
    borderRadius: '16px',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    background: 'var(--code-bg)',
  },
  codeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
  },
  dot: { width: '10px', height: '10px', borderRadius: '50%' },
  codeBody: {
    padding: '24px',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    lineHeight: 1.8,
    color: 'var(--text-secondary)',
    overflowX: 'auto',
    whiteSpace: 'pre',
  },
})

const code = `import { render, state, computed, effect } from 'flint'

function Counter() {
  const count = state(0)
  const doubled = computed(() => count() * 2)

  effect(() => {
    document.title = \`Count: \${count()}\`
  })

  return (
    <div>
      <p>Count: {count()}</p>
      <p>Doubled: {doubled()}</p>
      <button onClick={() => count.set(c => c + 1)}>
        +1
      </button>
    </div>
  )
}

render(Counter, '#app')`

function CodeExample() {
  return h('section', { id: 'code', className: styles.classNames.section }, [
    h('div', { className: styles.classNames.layout }, [
      h('div', null, [
        h('p', { className: styles.classNames.label }, 'Simple API'),
        h('h2', { className: styles.classNames.title }, [
          'Write components,',
          h('br'),
          'not boilerplate',
        ]),
        h('p', { className: styles.classNames.desc }, 'Your component function runs once. After that, only the signals you read get tracked. No dependency arrays, no optimization tricks.'),
      ]),
      h('div', { className: styles.classNames.codeBlock }, [
        h('div', { className: styles.classNames.codeHeader }, [
          h('div', { className: styles.classNames.dot, style: { background: '#ff5f56' } }),
          h('div', { className: styles.classNames.dot, style: { background: '#ffbd2e' } }),
          h('div', { className: styles.classNames.dot, style: { background: '#27c93f' } }),
        ]),
        h('pre', { className: styles.classNames.codeBody }, code),
      ]),
    ]),
  ])
}

export default CodeExample