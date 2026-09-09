import { createStyles } from 'flint'

const styles = createStyles({
  wrap: {
    maxWidth: '1200px',
    margin: '0 auto 120px',
    padding: '0 24px',
  },
  inner: {
    padding: '64px 48px',
    borderRadius: '24px',
    background: 'linear-gradient(135deg, var(--accent), #ff9a6c)',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    pointerEvents: 'none',
  },
  title: {
    fontSize: 'clamp(28px, 4vw, 40px)',
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.03em',
    marginBottom: '16px',
    position: 'relative',
  },
  desc: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: '32px',
    maxWidth: '480px',
    marginLeft: 'auto',
    marginRight: 'auto',
    position: 'relative',
  },
  buttons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    position: 'relative',
  },
  btnPrimary: {
    padding: '14px 32px',
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--accent)',
    background: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.15s',
  },
  btnSecondary: {
    padding: '14px 32px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: '10px',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.15s',
  },
})

function CTA() {
  return (
    <div className={styles.classNames.wrap}>
      <div className={styles.classNames.inner}>
        <div className={styles.classNames.grid}></div>
        <h2 className={styles.classNames.title}>Ready to build faster?</h2>
        <p className={styles.classNames.desc}>
          Join thousands of developers who ship beautiful apps with less code.
        </p>
        <div className={styles.classNames.buttons}>
          <a
            href="https://www.npmjs.com/package/flint"
            className={styles.classNames.btnPrimary}
            target="_blank"
          >
            Get Started — It's Free
          </a>
          <a
            href="https://github.com/salzcill-cmd/flint"
            className={styles.classNames.btnSecondary}
            target="_blank"
          >
            Star on GitHub
          </a>
        </div>
      </div>
    </div>
  )
}

export default CTA