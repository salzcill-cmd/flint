import { createStyles, For, Show } from 'flint'

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
    alignItems: 'start',
  },
  card: {
    padding: '32px',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    position: 'relative',
  },
  cardPopular: {
    borderColor: 'var(--accent)',
    background: 'linear-gradient(180deg, var(--accent-subtle), var(--bg-card) 40%)',
    boxShadow: '0 0 40px rgba(255,107,53,0.1)',
  },
  popularTag: {
    position: 'absolute',
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '4px 14px',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 700,
    borderRadius: '9999px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  name: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '4px',
  },
  cardDesc: {
    fontSize: '13px',
    color: 'var(--text-tertiary)',
    marginBottom: '24px',
  },
  price: {
    fontSize: '40px',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    marginBottom: '4px',
  },
  period: {
    fontSize: '13px',
    color: 'var(--text-tertiary)',
    marginBottom: '24px',
  },
  features: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '28px',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  check: {
    color: 'var(--accent)',
    fontSize: '16px',
    flexShrink: 0,
  },
  btn: {
    width: '100%',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'center',
  },
  btnOutline: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  },
  btnFill: {
    background: 'var(--accent)',
    border: '1px solid var(--accent)',
    color: '#fff',
  },
})

const plans = [
  {
    name: 'Starter',
    desc: 'For personal projects',
    price: 'Free',
    period: 'Open source, MIT license',
    features: ['Core framework', 'Reactive signals', 'Router & store', 'Community support'],
    popular: false,
  },
  {
    name: 'Team',
    desc: 'For growing teams',
    price: 'Free',
    period: 'Open source, MIT license',
    features: ['Everything in Starter', 'Devtools browser extension', 'SSR & streaming', 'Priority GitHub support', 'Team collaboration docs'],
    popular: true,
  },
  {
    name: 'Enterprise',
    desc: 'For large organizations',
    price: 'Custom',
    period: 'Dedicated support & training',
    features: ['Everything in Team', 'Dedicated support channel', 'Custom integrations', 'On-site training workshops', 'SLA guarantee'],
    popular: false,
  },
]

function Pricing() {
  return (
    <section id="pricing" className={styles.classNames.section}>
      <div className={styles.classNames.header}>
        <p className={styles.classNames.label}>Pricing</p>
        <h2 className={styles.classNames.title}>Simple, transparent pricing</h2>
        <p className={styles.classNames.desc}>
          Flint is free and open source. Use it for anything.
        </p>
      </div>

      <div className={styles.classNames.grid}>
        <For each={plans}>
          {(plan) => (
            <div
              className={`${styles.classNames.card} ${plan.popular ? styles.classNames.cardPopular : ''}`}
            >
              <Show when={plan.popular}>
                <div className={styles.classNames.popularTag}>Most Popular</div>
              </Show>

              <div className={styles.classNames.name}>{plan.name}</div>
              <div className={styles.classNames.cardDesc}>{plan.desc}</div>
              <div className={styles.classNames.price}>{plan.price}</div>
              <div className={styles.classNames.period}>{plan.period}</div>

              <ul className={styles.classNames.features}>
                <For each={plan.features}>
                  {(f) => (
                    <li className={styles.classNames.feature}>
                      <span className={styles.classNames.check}>✓</span>
                      {f}
                    </li>
                  )}
                </For>
              </ul>

              <button
                className={`${styles.classNames.btn} ${plan.popular ? styles.classNames.btnFill : styles.classNames.btnOutline}`}
              >
                Get Started
              </button>
            </div>
          )}
        </For>
      </div>
    </section>
  )
}

export default Pricing