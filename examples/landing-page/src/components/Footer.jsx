import { createStyles } from 'flint'

const styles = createStyles({
  footer: {
    borderTop: '1px solid var(--border)',
    padding: '64px 24px 40px',
  },
  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '48px',
  },
  logo: {
    fontSize: '20px',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    color: 'inherit',
  },
  logoMark: {
    width: '28px',
    height: '28px',
    background: 'var(--accent)',
    borderRadius: '7px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    color: '#fff',
  },
  brandDesc: {
    fontSize: '14px',
    color: 'var(--text-tertiary)',
    lineHeight: 1.7,
    marginTop: '12px',
    maxWidth: '280px',
  },
  colTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '16px',
  },
  links: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  link: {
    fontSize: '14px',
    color: 'var(--text-tertiary)',
    textDecoration: 'none',
    transition: 'color 0.15s',
  },
  bottom: {
    maxWidth: '1200px',
    margin: '48px auto 0',
    paddingTop: '24px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    color: 'var(--text-tertiary)',
  },
  socials: {
    display: 'flex',
    gap: '16px',
  },
  socialLink: {
    color: 'var(--text-tertiary)',
    textDecoration: 'none',
    transition: 'color 0.15s',
  },
})

const productLinks = [
  { href: '#features', label: 'Features' },
  { href: '#code', label: 'Code' },
  { href: '#pricing', label: 'Pricing' },
]

const resourceLinks = [
  { href: 'https://github.com/salzcill-cmd/flint', label: 'Documentation' },
  { href: 'https://github.com/salzcill-cmd/flint/tree/main/examples', label: 'Examples' },
  { href: 'https://www.npmjs.com/package/flint', label: 'NPM' },
]

const communityLinks = [
  { href: 'https://github.com/salzcill-cmd/flint', label: 'GitHub' },
  { href: 'https://discord.gg/flint', label: 'Discord' },
  { href: 'https://twitter.com/flintjs', label: 'Twitter' },
]

function Footer() {
  return (
    <footer className={styles.classNames.footer}>
      <div className={styles.classNames.inner}>
        <div>
          <a href="/" className={styles.classNames.logo}>
            <span className={styles.classNames.logoMark}>F</span>
            Flint
          </a>
          <p className={styles.classNames.brandDesc}>
            Write less. Ship faster. Build beautifully.
          </p>
        </div>

        <div>
          <div className={styles.classNames.colTitle}>Product</div>
          <ul className={styles.classNames.links}>
            {productLinks.map(link => (
              <li key={link.href}>
                <a href={link.href} className={styles.classNames.link}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className={styles.classNames.colTitle}>Resources</div>
          <ul className={styles.classNames.links}>
            {resourceLinks.map(link => (
              <li key={link.href}>
                <a href={link.href} className={styles.classNames.link} target="_blank">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className={styles.classNames.colTitle}>Community</div>
          <ul className={styles.classNames.links}>
            {communityLinks.map(link => (
              <li key={link.href}>
                <a href={link.href} className={styles.classNames.link} target="_blank">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.classNames.bottom}>
        <span>© 2024 Flint. MIT License.</span>
        <div className={styles.classNames.socials}>
          <a
            href="https://github.com/salzcill-cmd/flint"
            className={styles.classNames.socialLink}
            target="_blank"
          >
            GitHub
          </a>
          <a
            href="https://twitter.com/flintjs"
            className={styles.classNames.socialLink}
            target="_blank"
          >
            Twitter
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer