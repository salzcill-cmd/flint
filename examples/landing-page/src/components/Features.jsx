import { createStyles, h } from 'flint'

const styles = createStyles({
  section: {
    padding: 'clamp(80px, 10vw, 140px) 24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '64px',
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
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  card: {
    padding: '32px',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    transition: 'all 0.3s',
  },
  cardFeatured: {
    gridColumn: 'span 2',
    background: 'linear-gradient(135deg, var(--accent-subtle), var(--bg-card))',
    borderColor: 'var(--accent-border)',
  },
  icon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    background: 'var(--accent-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    fontSize: '20px',
  },
  cardTitle: {
    fontSize: '17px',
    fontWeight: 700,
    marginBottom: '8px',
  },
  cardDesc: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.65,
  },
})

const features = [
  { icon: '⚡', title: 'Fine-Grained Reactivity', desc: 'Signals track dependencies automatically. When state changes, only the exact DOM nodes that depend on it update. No virtual DOM diffing.', featured: true },
  { icon: '🎯', title: 'Zero Overhead', desc: 'No runtime cost from reconcilers. Components compile to direct DOM updates — O(1) regardless of app size.' },
  { icon: '🛡️', title: 'Type Safe', desc: 'First-class TypeScript with fully inferred types. Catch errors at compile time, not in production.' },
  { icon: '🔥', title: 'Blazing Fast', desc: 'Benchmark-proven performance. Your app stays fast as it grows because updates are always constant-time.' },
  { icon: '🧩', title: 'Composable', desc: 'Build complex UIs from simple, reusable pieces. Mix signals, effects, and components naturally.' },
  { icon: '📦', title: 'Tiny Bundle', desc: 'Ship less JavaScript to your users. The runtime is minimal and tree-shakable.' },
]

function Features() {
  const cards = features.map(f =>
    h('div', { className: styles.classNames.card + (f.featured ? ' ' + styles.classNames.cardFeatured : '') }, [
      h('div', { className: styles.classNames.icon }, f.icon),
      h('h3', { className: styles.classNames.cardTitle }, f.title),
      h('p', { className: styles.classNames.cardDesc }, f.desc),
    ])
  )

  return h('section', { id: 'features', className: styles.classNames.section }, [
    h('div', { className: styles.classNames.header }, [
      h('p', { className: styles.classNames.label }, 'Features'),
      h('h2', { className: styles.classNames.title }, 'Why developers choose Flint'),
      h('p', { className: styles.classNames.desc }, 'A JavaScript framework built around one idea: you write less code, and it runs faster.'),
    ]),
    h('div', { className: styles.classNames.grid }, cards),
  ])
}

export default Features