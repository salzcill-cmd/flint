import { createStyles, h } from 'flint'

const styles = createStyles({
  section: {
    padding: 'clamp(80px, 10vw, 140px) 24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: { textAlign: 'center', marginBottom: '64px' },
  label: { fontSize: '12px', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '12px' },
  title: { fontSize: 'clamp(30px, 4.5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '16px' },
  desc: { fontSize: 'clamp(15px, 1.5vw, 17px)', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  card: { borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-tertiary)' },
  cardName: { fontSize: '14px', fontWeight: 600 },
  badge: { fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '9999px' },
  badgeFlint: { background: 'var(--accent-subtle)', color: 'var(--accent)' },
  badgeReact: { background: 'rgba(97,218,251,0.15)', color: '#61dafb' },
  codeBody: { padding: '24px', background: 'var(--code-bg)', fontFamily: 'var(--font-mono)', fontSize: '12.5px', lineHeight: 1.8, color: 'var(--text-secondary)', overflowX: 'auto', whiteSpace: 'pre' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginTop: '48px' },
  stat: { textAlign: 'center', padding: '32px 16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-card)' },
  statValue: { fontSize: 'clamp(36px, 4vw, 48px)', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '8px' },
  statLabel: { fontSize: '14px', color: 'var(--text-secondary)' },
})

const flintCode = `function Counter() {
  const count = state(0)
  const doubled = computed(() => count() * 2)

  return (
    <div>
      <p>Count: {count()}</p>
      <p>Doubled: {doubled()}</p>
      <button onClick={() => count.set(c => c + 1)}>
        +1
      </button>
    </div>
  )
}`

const reactCode = `function Counter() {
  const [count, setCount] = useState(0)
  const doubled = useMemo(() => count * 2, [count])

  const increment = useCallback(() => {
    setCount(c => c + 1)
  }, [])

  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubled}</p>
      <button onClick={increment}>
        +1
      </button>
    </div>
  )
}`

function Comparison() {
  return h('section', { className: styles.classNames.section }, [
    h('div', { className: styles.classNames.header }, [
      h('p', { className: styles.classNames.label }, 'Comparison'),
      h('h2', { className: styles.classNames.title }, 'See the difference'),
      h('p', { className: styles.classNames.desc }, 'Same component, dramatically less code. Flint eliminates the boilerplate.'),
    ]),
    h('div', { className: styles.classNames.grid }, [
      h('div', { className: styles.classNames.card }, [
        h('div', { className: styles.classNames.cardHeader }, [
          h('span', { className: styles.classNames.cardName }, 'Flint'),
          h('span', { className: styles.classNames.badge + ' ' + styles.classNames.badgeFlint }, '14 lines'),
        ]),
        h('pre', { className: styles.classNames.codeBody }, flintCode),
      ]),
      h('div', { className: styles.classNames.card }, [
        h('div', { className: styles.classNames.cardHeader }, [
          h('span', { className: styles.classNames.cardName }, 'React'),
          h('span', { className: styles.classNames.badge + ' ' + styles.classNames.badgeReact }, '30 lines'),
        ]),
        h('pre', { className: styles.classNames.codeBody }, reactCode),
      ]),
    ]),
    h('div', { className: styles.classNames.stats }, [
      h('div', { className: styles.classNames.stat }, [
        h('div', { className: styles.classNames.statValue }, '0'),
        h('div', { className: styles.classNames.statLabel }, 'Dependencies'),
      ]),
      h('div', { className: styles.classNames.stat }, [
        h('div', { className: styles.classNames.statValue }, 'O(1)'),
        h('div', { className: styles.classNames.statLabel }, 'Update Complexity'),
      ]),
      h('div', { className: styles.classNames.stat }, [
        h('div', { className: styles.classNames.statValue }, '100%'),
        h('div', { className: styles.classNames.statLabel }, 'TypeScript'),
      ]),
    ]),
  ])
}

export default Comparison