/**
 * Flint Landing Page — Interactive JavaScript
 * Handles: theme toggle, scroll animations, FAQ accordion,
 * navbar behavior, mobile menu, and micro-interactions
 */

(function () {
  'use strict'

  // ═══════════════════════════════════════════════════════════════
  // THEME TOGGLE
  // ═══════════════════════════════════════════════════════════════
  const html = document.documentElement
  const themeToggle = document.getElementById('themeToggle')

  // Load saved theme or respect system preference
  const savedTheme = localStorage.getItem('flint-theme')
  if (savedTheme) {
    html.dataset.theme = savedTheme
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    html.dataset.theme = 'light'
  }

  function updateToggleIcon() {
    themeToggle.textContent = html.dataset.theme === 'dark' ? '☀' : '☾'
  }
  updateToggleIcon()

  themeToggle.addEventListener('click', () => {
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark'
    html.dataset.theme = next
    localStorage.setItem('flint-theme', next)
    updateToggleIcon()
  })

  // Respect system changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('flint-theme')) {
      html.dataset.theme = e.matches ? 'dark' : 'light'
      updateToggleIcon()
    }
  })

  // ═══════════════════════════════════════════════════════════════
  // SCROLL REVEAL (IntersectionObserver)
  // ═══════════════════════════════════════════════════════════════
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            revealObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el))
  } else {
    // Show everything immediately for reduced motion
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'))
  }

  // ═══════════════════════════════════════════════════════════════
  // NAVBAR — hide on scroll down, show on scroll up
  // ═══════════════════════════════════════════════════════════════
  const nav = document.getElementById('nav')
  let lastScrollY = 0
  let ticking = false

  function onScroll() {
    const y = window.scrollY
    if (y > 80 && y > lastScrollY) {
      nav.classList.add('hidden')
    } else {
      nav.classList.remove('hidden')
    }
    lastScrollY = y
    ticking = false
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(onScroll)
      ticking = true
    }
  }, { passive: true })

  // ═══════════════════════════════════════════════════════════════
  // MOBILE MENU
  // ═══════════════════════════════════════════════════════════════
  const mobileMenuBtn = document.getElementById('mobileMenuBtn')
  const mobileMenu = document.getElementById('mobileMenu')

  mobileMenuBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open')
    mobileMenuBtn.textContent = isOpen ? '✕' : '☰'
  })

  // Close on link click
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open')
      mobileMenuBtn.textContent = '☰'
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // SMOOTH SCROLL — anchor links
  // ═══════════════════════════════════════════════════════════════
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href')
      if (id === '#') return
      const target = document.querySelector(id)
      if (target) {
        e.preventDefault()
        const offset = 80 // nav height
        const top = target.getBoundingClientRect().top + window.scrollY - offset
        window.scrollTo({ top, behavior: 'smooth' })
      }
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // FAQ ACCORDION
  // ═══════════════════════════════════════════════════════════════
  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item')
      const wasOpen = item.classList.contains('open')

      // Close all
      document.querySelectorAll('.faq-item.open').forEach((openItem) => {
        openItem.classList.remove('open')
      })

      // Toggle clicked
      if (!wasOpen) {
        item.classList.add('open')
      }
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // MICRO-INTERACTIONS — button press effect
  // ═══════════════════════════════════════════════════════════════
  if (!prefersReducedMotion) {
    document.querySelectorAll('.btn-primary, .btn-ghost, .btn-nav, .btn-pricing, .btn-cta-primary, .btn-cta-secondary').forEach((btn) => {
      btn.addEventListener('mousedown', () => {
        btn.style.transform = 'scale(0.97)'
      })
      btn.addEventListener('mouseup', () => {
        btn.style.transform = ''
      })
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = ''
      })
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // MAGNETIC HOVER — nav logo
  // ═══════════════════════════════════════════════════════════════
  if (!prefersReducedMotion && window.innerWidth > 768) {
    const logo = document.querySelector('.nav-logo')
    if (logo) {
      logo.addEventListener('mousemove', (e) => {
        const rect = logo.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2
        logo.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`
      })
      logo.addEventListener('mouseleave', () => {
        logo.style.transform = ''
        logo.style.transition = 'transform 0.3s ease'
        setTimeout(() => { logo.style.transition = '' }, 300)
      })
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CODE BLOCK — typing highlight on scroll into view
  // ═══════════════════════════════════════════════════════════════
  const codeBlocks = document.querySelectorAll('.code-block-body, .hero-code-inner, .compare-body')
  if (!prefersReducedMotion && codeBlocks.length) {
    const codeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1'
            codeObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.2 }
    )
    codeBlocks.forEach((block) => {
      block.style.opacity = '0'
      block.style.transition = 'opacity 0.6s ease'
      codeObserver.observe(block)
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // STAT COUNTER — animate numbers on scroll
  // ═══════════════════════════════════════════════════════════════
  const statValues = document.querySelectorAll('.stat-value')
  if (!prefersReducedMotion && statValues.length) {
    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateStat(entry.target)
            statObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.5 }
    )
    statValues.forEach((el) => statObserver.observe(el))

    function animateStat(el) {
      const text = el.textContent.trim()
      const duration = 800
      const start = performance.now()

      // Special values
      if (text === 'O(1)') {
        el.style.opacity = '0'
        el.style.transform = 'translateY(8px)'
        el.style.transition = 'all 0.5s ease'
        requestAnimationFrame(() => {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
        })
        return
      }

      if (text === '100%') {
        let current = 0
        const target = 100
        const step = (timestamp) => {
          const progress = Math.min((timestamp - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3) // ease out cubic
          current = Math.round(eased * target)
          el.textContent = current + '%'
          if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
        return
      }

      // Generic number
      const num = parseInt(text)
      if (!isNaN(num)) {
        let current = 0
        const step = (timestamp) => {
          const progress = Math.min((timestamp - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          current = Math.round(eased * num)
          el.textContent = current
          if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CURSOR GLOW — hero section subtle glow follow
  // ═══════════════════════════════════════════════════════════════
  if (!prefersReducedMotion && window.innerWidth > 768) {
    const hero = document.querySelector('.hero')
    const glow = document.querySelector('.hero-glow')
    if (hero && glow) {
      hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        glow.style.left = x + 'px'
        glow.style.top = y + 'px'
        glow.style.transform = 'translate(-50%, -50%)'
      })
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // LOG
  // ═══════════════════════════════════════════════════════════════
  console.log('%c🔥 Flint Landing Page', 'font-size:16px;font-weight:bold;color:#ff6b35')
  console.log('%cWrite less. Ship faster.', 'font-size:12px;color:#a1a1aa')
  console.log('https://github.com/salzcill-cmd/flint')

})()