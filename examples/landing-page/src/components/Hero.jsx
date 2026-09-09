import { createStyles, onMount, ref, h } from 'flint'

const styles = createStyles({
  hero: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '100px 24px 80px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: '800px',
    height: '800px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, var(--accent-subtle) 0%, transparent 70%)',
    top: '45%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    filter: 'blur(60px)',
  },
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
    backgroundSize: '60px 60px',
    maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
    pointerEvents: 'none',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 6px 6px 14px',
    borderRadius: '9999px',
    border: '1px solid var(--accent-border)',
    background: 'var(--accent-subtle)',
    color: 'var(--accent)',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '32px',
    textDecoration: 'none',
  },
  badgeTag: {
    padding: '3px 10px',
    background: 'var(--accent)',
    color: '#fff',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 600,
  },
  title: {
    fontSize: 'clamp(44px, 7.5vw, 88px)',
    fontWeight: 800,
    lineHeight: 1.05,
    letterSpacing: '-0.04em',
    marginBottom: '24px',
    maxWidth: '860px',
  },
  accent: {
    background: 'linear-gradient(135deg, var(--accent), #ff9a6c)',
    backgroundSize: '200% 200%',
    animation: 'gradientShift 4s ease infinite',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: 'clamp(16px, 1.8vw, 19px)',
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    marginBottom: '40px',
    maxWidth: '560px',
  },
  buttons: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  btnPrimary: {
    padding: '13px 28px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.15s',
  },
  btnGhost: {
    padding: '13px 28px',
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.15s',
  },
  codeWrap: {
    marginTop: '64px',
    padding: '4px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, var(--accent-border), transparent 50%)',
  },
  codeInner: {
    background: 'var(--code-bg)',
    borderRadius: '12px',
    padding: '20px 24px',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    lineHeight: 1.8,
    color: 'var(--text-secondary)',
    textAlign: 'left',
    maxWidth: '520px',
    overflowX: 'auto',
    whiteSpace: 'pre',
  },
})

const codeText = `import { render, state, computed } from 'flint'

function Counter() {
  const count = state(0)
  const doubled = computed(() => count() * 2)

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(c => c + 1)}>
        +1
      </button>
    </div>
  )
}

render(Counter, '#app')`

function Hero() {
  const glowRef = ref()

  onMount(() => {
    const hero = document.querySelector('[data-hero]')
    const glow = glowRef.current

    if (hero && glow) {
      const handleMouseMove = (e) => {
        const rect = hero.getBoundingClientRect()
        glow.style.left = (e.clientX - rect.left) + 'px'
        glow.style.top = (e.clientY - rect.top) + 'px'
      }
      hero.addEventListener('mousemove', handleMouseMove)
      return () => hero.removeEventListener('mousemove', handleMouseMove)
    }
  })

  return h('section', { className: styles.classNames.hero, 'data-hero': true }, [
    h('div', { className: styles.classNames.glow, ref: glowRef }),
    h('div', { className: styles.classNames.grid }),
    h('a', { href: 'https://github.com/salzcill-cmd/flint/releases', className: styles.classNames.badge, target: '_blank' }, [
      h('span', { className: styles.classNames.badgeTag }, 'v4.0'),
      ' Now available',
    ]),
    h('h1', { className: styles.classNames.title }, [
      'Write less.',
      h('br'),
      h('span', { className: styles.classNames.accent }, 'Ship faster.'),
    ]),
    h('p', { className: styles.classNames.subtitle }, 'Fine-grained signals replace the virtual DOM. Only the exact nodes that depend on changed state update. No diffing, no wasted work.'),
    h('div', { className: styles.classNames.buttons }, [
      h('a', { href: 'https://www.npmjs.com/package/flint', className: styles.classNames.btnPrimary, target: '_blank' }, 'Get Started →'),
      h('a', { href: 'https://github.com/salzcill-cmd/flint', className: styles.classNames.btnGhost, target: '_blank' }, 'View on GitHub'),
    ]),
    h('div', { className: styles.classNames.codeWrap }, [
      h('pre', { className: styles.classNames.codeInner }, codeText),
    ]),
  ])
}

export default Hero