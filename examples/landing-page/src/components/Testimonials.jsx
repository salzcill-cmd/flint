import { createStyles, For } from 'flint'

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
    gap: '20px',
  },
  card: {
    padding: '28px',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    display: 'flex',
    flexDirection: 'column',
  },
  stars: {
    display: 'flex',
    gap: '2px',
    marginBottom: '16px',
    color: '#f59e0b',
    fontSize: '14px',
  },
  text: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    flex: 1,
    marginBottom: '20px',
  },
  author: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'var(--accent-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--accent)',
  },
  name: {
    fontSize: '13px',
    fontWeight: 600,
  },
  role: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
  },
})

const testimonials = [
  {
    name: 'Alex Chen',
    role: 'Senior Frontend Engineer',
    initial: 'A',
    text: '"Flint completely changed how I think about state management. No more dependency arrays, no more stale closures. It just works."',
  },
  {
    name: 'Sarah Kim',
    role: 'CTO at DevStack',
    initial: 'S',
    text: '"Our bundle size dropped by 40% after migrating from React. Performance improved immediately — Lighthouse score went from 72 to 98."',
  },
  {
    name: 'Marco Rivera',
    role: 'Indie Developer',
    initial: 'M',
    text: '"The model() API is a game changer. I built an entire dashboard in half the time it usually takes. The DX is unmatched."',
  },
]

function Testimonials() {
  return (
    <section id="testimonials" className={styles.classNames.section}>
      <div className={styles.classNames.header}>
        <p className={styles.classNames.label}>Testimonials</p>
        <h2 className={styles.classNames.title}>Loved by developers</h2>
        <p className={styles.classNames.desc}>
          Hear from the community building with Flint.
        </p>
      </div>

      <div className={styles.classNames.grid}>
        <For each={testimonials}>
          {(item) => (
            <div className={styles.classNames.card}>
              <div className={styles.classNames.stars}>★★★★★</div>
              <p className={styles.classNames.text}>{item.text}</p>
              <div className={styles.classNames.author}>
                <div className={styles.classNames.avatar}>{item.initial}</div>
                <div>
                  <div className={styles.classNames.name}>{item.name}</div>
                  <div className={styles.classNames.role}>{item.role}</div>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
    </section>
  )
}

export default Testimonials