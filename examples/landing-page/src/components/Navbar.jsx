import { createStyles, state, Show, onMount } from 'flint'

const styles = createStyles({
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: '64px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 clamp(16px, 4vw, 32px)',
    backdropFilter: 'blur(16px) saturate(180%)',
    backgroundColor: 'var(--nav-bg)',
    borderBottom: '1px solid var(--border)',
    transition: 'transform 0.25s, background-color 0.3s',
  },
  navHidden: {
    transform: 'translateY(-100%)',
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
  links: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  link: {
    padding: '6px 14px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    borderRadius: '6px',
    textDecoration: 'none',
    transition: 'color 0.15s, background 0.15s',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  themeBtn: {
    width: '36px',
    height: '36px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    background: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    transition: 'all 0.15s',
  },
  ctaBtn: {
    padding: '7px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.15s',
  },
  mobileBtn: {
    display: 'none',
    width: '36px',
    height: '36px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    background: 'transparent',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
  },
  mobileMenu: {
    position: 'fixed',
    top: '64px',
    left: 0,
    right: 0,
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    zIndex: 99,
  },
})

const links = [
  { href: '#features', label: 'Features' },
  { href: '#code', label: 'Code' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

function Navbar({ theme, onToggleTheme }) {
  const isHidden = state(false)
  const isMobileOpen = state(false)
  let lastScrollY = 0

  onMount(() => {
    const handleScroll = () => {
      const y = window.scrollY
      if (y > 80 && y > lastScrollY) {
        isHidden.set(true)
      } else {
        isHidden.set(false)
      }
      lastScrollY = y
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  })

  const handleLinkClick = () => {
    isMobileOpen.set(false)
  }

  return (
    <>
      <nav
        className={`${styles.classNames.nav} ${isHidden() ? styles.classNames.navHidden : ''}`}
      >
        <a href="/" className={styles.classNames.logo}>
          <span className={styles.classNames.logoMark}>F</span>
          Flint
        </a>

        <div className={styles.classNames.links}>
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={styles.classNames.link}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className={styles.classNames.actions}>
          <button
            className={styles.classNames.themeBtn}
            onClick={onToggleTheme}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <a
            href="https://www.npmjs.com/package/flint"
            className={styles.classNames.ctaBtn}
            target="_blank"
          >
            Get Started
          </a>
          <button
            className={styles.classNames.mobileBtn}
            onClick={() => isMobileOpen.set(o => !o)}
          >
            {isMobileOpen() ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      <Show when={isMobileOpen()}>
        <div className={styles.classNames.mobileMenu}>
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={styles.classNames.link}
              onClick={handleLinkClick}
            >
              {link.label}
            </a>
          ))}
        </div>
      </Show>
    </>
  )
}

export default Navbar