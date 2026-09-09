import { createStyles, state, effect, h } from 'flint'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import CodeExample from './components/CodeExample'
import Comparison from './components/Comparison'
import Testimonials from './components/Testimonials'
import Pricing from './components/Pricing'
import FAQ from './components/FAQ'
import CTA from './components/CTA'
import Footer from './components/Footer'

const styles = createStyles({
  app: {
    minHeight: '100dvh',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    transition: 'background-color 0.3s, color 0.3s',
  },
})

function App() {
  const theme = state(localStorage.getItem('flint-theme') || 'dark')

  effect(() => {
    document.documentElement.dataset.theme = theme()
    localStorage.setItem('flint-theme', theme())
  })

  const toggleTheme = () => {
    theme.set(t => t === 'dark' ? 'light' : 'dark')
  }

  const el = h('div', { className: styles.classNames.app }, [
    h(Navbar, { theme: theme(), onToggleTheme: toggleTheme }),
    h(Hero, null),
    h(Features, null),
    h(CodeExample, null),
    h(Comparison, null),
    h(Testimonials, null),
    h(Pricing, null),
    h(FAQ, null),
    h(CTA, null),
    h(Footer, null),
  ])

  return el
}

export default App