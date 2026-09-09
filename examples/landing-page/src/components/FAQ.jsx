import { createStyles, state, For } from 'flint'

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
  },
  list: {
    maxWidth: '720px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  item: {
    border: '1px solid var(--border)',
    borderRadius: '10px',
    background: 'var(--bg-card)',
    overflow: 'hidden',
  },
  itemOpen: {
    borderColor: 'var(--border-hover)',
  },
  question: {
    width: '100%',
    padding: '18px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '15px',
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',
  },
  chevron: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    flexShrink: 0,
    transition: 'transform 0.3s',
  },
  chevronOpen: {
    transform: 'rotate(180deg)',
  },
  answer: {
    overflow: 'hidden',
    maxHeight: '0',
    transition: 'max-height 0.3s ease, padding 0.3s ease',
  },
  answerOpen: {
    maxHeight: '200px',
  },
  answerInner: {
    padding: '0 20px 18px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
  },
})

const faqs = [
  {
    q: 'How is Flint different from React or Vue?',
    a: 'Flint uses fine-grained signals instead of a virtual DOM. When state changes, only the exact DOM nodes that depend on that state update — no diffing, no reconciliation. This means O(1) updates regardless of app size.',
  },
  {
    q: 'Can I use Flint with my existing project?',
    a: 'Yes. Flint can be adopted incrementally. You can start using Flint components alongside your existing React or Vue codebase, then migrate as you go.',
  },
  {
    q: 'Does Flint support TypeScript?',
    a: 'Absolutely. Flint is written in TypeScript and provides full type inference for signals, computed values, stores, and component props. Everything is inferred — no extra annotations needed.',
  },
  {
    q: 'Is Flint production-ready?',
    a: 'Flint v4.0 is stable and used in production. The core reactivity system, router, store, and form handling are all battle-tested. The framework follows semver and maintains backward compatibility.',
  },
  {
    q: 'How do I get started?',
    a: 'Run npx create-flint my-app to scaffold a new project, pick a template, and you\'re coding in seconds. You can also install Flint manually into an existing Vite project.',
  },
]

function FAQ() {
  const openIndex = state(-1)

  const toggle = (index) => {
    openIndex.set(i => i === index ? -1 : index)
  }

  return (
    <section id="faq" className={styles.classNames.section}>
      <div className={styles.classNames.header}>
        <p className={styles.classNames.label}>FAQ</p>
        <h2 className={styles.classNames.title}>Frequently asked questions</h2>
      </div>

      <div className={styles.classNames.list}>
        <For each={faqs}>
          {(faq, index) => {
            const isOpen = () => openIndex() === index()
            return (
              <div
                className={`${styles.classNames.item} ${isOpen() ? styles.classNames.itemOpen : ''}`}
              >
                <button
                  className={styles.classNames.question}
                  onClick={() => toggle(index())}
                >
                  {faq.q}
                  <span
                    className={`${styles.classNames.chevron} ${isOpen() ? styles.classNames.chevronOpen : ''}`}
                  >
                    ▼
                  </span>
                </button>
                <div
                  className={`${styles.classNames.answer} ${isOpen() ? styles.classNames.answerOpen : ''}`}
                >
                  <div className={styles.classNames.answerInner}>
                    {faq.a}
                  </div>
                </div>
              </div>
            )
          }}
        </For>
      </div>
    </section>
  )
}

export default FAQ