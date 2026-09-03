import { describe, it, expect, vi, beforeEach } from 'vitest'
import { I18n, createI18n, formatNumber, formatDate, formatRelativeTime } from '../src/i18n/index.js'

describe('I18n', () => {
  const messages = {
    en: {
      greeting: 'Hello',
      goodbye: 'Goodbye',
      items: '{count} items',
      item_one: '1 item',
      item_other: '{count} items',
    },
    id: {
      greeting: 'Halo',
      goodbye: 'Selamat tinggal',
      items: '{count} item',
      item_one: '1 item',
      item_other: '{count} item',
    },
  }

  describe('createI18n', () => {
    it('should create i18n instance', () => {
      const i18n = createI18n({
        defaultLocale: 'en',
        locales: ['en', 'id'],
        messages,
      })
      expect(i18n).toBeDefined()
    })

    it('should have default locale', () => {
      const i18n = createI18n({
        defaultLocale: 'en',
        locales: ['en', 'id'],
        messages,
      })
      // locale is a Signal (callable function), call it to get value
      expect(i18n.locale()).toBe('en')
    })
  })

  describe('Translation', () => {
    let i18n: I18n

    beforeEach(() => {
      i18n = createI18n({
        defaultLocale: 'en',
        locales: ['en', 'id'],
        messages,
      })
    })

    it('should translate simple key', () => {
      expect(i18n.t('greeting')).toBe('Hello')
    })

    it('should translate with interpolation', () => {
      expect(i18n.t('items', { count: 5 })).toBe('5 items')
    })

    it('should return key if not found', () => {
      expect(i18n.t('nonexistent')).toBe('nonexistent')
    })

    it('should change locale', () => {
      i18n.setLocale('id')
      expect(i18n.locale()).toBe('id')
      expect(i18n.t('greeting')).toBe('Halo')
    })

    it('should check current locale', () => {
      expect(i18n.isCurrentLocale('en')).toBe(true)
      expect(i18n.isCurrentLocale('id')).toBe(false)
    })
  })

  describe('Pluralization', () => {
    let i18n: I18n

    beforeEach(() => {
      i18n = createI18n({
        defaultLocale: 'en',
        locales: ['en'],
        messages: {
          en: {
            item_one: '1 item',
            item_other: '{count} items',
          },
        },
      })
    })

    it('should pluralize correctly', () => {
      expect(i18n.tc('item', 1)).toBe('1 item')
      expect(i18n.tc('item', 5)).toBe('5 items')
    })
  })

  describe('Locale List', () => {
    it('should list available locales', () => {
      const i18n = createI18n({
        defaultLocale: 'en',
        locales: ['en', 'id', 'ja'],
        messages,
      })
      expect(i18n.locales).toEqual(['en', 'id', 'ja'])
    })
  })
})

describe('Number Formatting', () => {
  it('should format number', () => {
    const result = formatNumber(1234567.89, 'en-US')
    expect(result).toContain('1')
    expect(result).toContain('234')
    expect(result).toContain('567')
  })

  it('should format currency', () => {
    const result = formatNumber(1234.56, 'en-US', { style: 'currency', currency: 'USD' })
    expect(result).toContain('$')
  })
})

describe('Date Formatting', () => {
  it('should format date', () => {
    const date = new Date('2024-01-15')
    const result = formatDate(date, 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    expect(result).toContain('January')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })
})

describe('Relative Time Formatting', () => {
  it('should format relative time', () => {
    const now = new Date()
    const past = new Date(now.getTime() - 60000) // 1 minute ago
    const result = formatRelativeTime(past, 'en-US')
    expect(result).toBeDefined()
  })
})
