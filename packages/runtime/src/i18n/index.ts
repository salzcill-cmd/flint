// Flint Runtime — Internationalization (i18n)
// Multi-language support with lazy loading and pluralization

import { state, computed, effect } from '@flint/reactivity'
import type { Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export type TranslationKeys = Record<string, any>
export type Locale = string

export interface I18nOptions {
  /** Default locale */
  defaultLocale: Locale
  /** Available locales */
  locales: Locale[]
  /** Translation files */
  messages: Record<Locale, TranslationKeys>
  /** Fallback locale */
  fallbackLocale?: Locale
  /** Enable lazy loading */
  lazy?: boolean
  /** Cache translations */
  cache?: boolean
}

export interface I18nContext {
  /** Current locale signal */
  locale: Signal<Locale>
  /** Available locales */
  locales: Locale[]
  /** Translate function */
  t: (key: string, params?: Record<string, any>) => string
  /** Translate with pluralization */
  tc: (key: string, count: number, params?: Record<string, any>) => string
  /** Change locale */
  setLocale: (locale: Locale) => void
  /** Check if locale is current */
  isCurrentLocale: (locale: Locale) => boolean
}

// ─── Translation Loader ─────────────────────────────────────────

const translationCache = new Map<Locale, TranslationKeys>()

async function loadTranslations(
  locale: Locale,
  loader: (locale: Locale) => Promise<TranslationKeys>
): Promise<TranslationKeys> {
  if (translationCache.has(locale)) {
    return translationCache.get(locale)!
  }

  const translations = await loader(locale)
  translationCache.set(locale, translations)
  return translations
}

// ─── Interpolation ──────────────────────────────────────────────

function interpolate(
  template: string,
  params: Record<string, any> = {}
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{${key}}`
  })
}

// ─── Pluralization ──────────────────────────────────────────────

function pluralize(
  key: string,
  count: number,
  translations: TranslationKeys
): string {
  const pluralRules = new Intl.PluralRules()

  // Try to find plural form
  const pluralKey = `${key}_${pluralRules.select(count)}`
  if (translations[pluralKey]) {
    return translations[pluralKey]
  }

  // Fallback to key with count
  const countKey = `${key}_${count}`
  if (translations[countKey]) {
    return translations[countKey]
  }

  // Fallback to simple key
  return translations[key] || key
}

// ─── I18n Manager ───────────────────────────────────────────────

export class I18n {
  private options: Required<I18nOptions>
  private messages: Record<Locale, TranslationKeys>
  private _locale!: Signal<Locale>
  private _translations!: Signal<TranslationKeys>
  private loaders = new Map<Locale, () => Promise<TranslationKeys>>()

  constructor(options: I18nOptions) {
    this.options = {
      fallbackLocale: 'en',
      lazy: false,
      cache: true,
      ...options,
    }

    this.messages = { ...options.messages }
    this._locale = state(options.defaultLocale)
    this._translations = state(options.messages[options.defaultLocale] || {})

    // Watch for locale changes
    effect(() => {
      const locale = this._locale()
      this.loadLocale(locale)
    })
  }

  get locale(): Signal<Locale> {
    return this._locale
  }

  get locales(): Locale[] {
    return this.options.locales
  }

  /**
   * Register lazy loader for a locale
   */
  registerLoader(locale: Locale, loader: () => Promise<TranslationKeys>): void {
    this.loaders.set(locale, loader)
  }

  /**
   * Load translations for a locale
   */
  async loadLocale(locale: Locale): Promise<void> {
    // Check if already loaded
    if (this.messages[locale]) {
      this._translations.set(this.messages[locale])
      return
    }

    // Try lazy loader
    const loader = this.loaders.get(locale)
    if (loader) {
      const translations = await loader()
      this.messages[locale] = translations
      this._translations.set(translations)
      return
    }

    // Fallback to fallback locale
    if (locale !== this.options.fallbackLocale) {
      console.warn(`[Flint i18n] Missing translations for locale: ${locale}`)
      this._locale.set(this.options.fallbackLocale)
    }
  }

  /**
   * Set current locale
   */
  setLocale(locale: Locale): void {
    if (this.options.locales.includes(locale)) {
      this._locale.set(locale)
      // Synchronously update translations
      if (this.messages[locale]) {
        this._translations.set(this.messages[locale])
      }
    } else {
      console.warn(`[Flint i18n] Unknown locale: ${locale}`)
    }
  }

  /**
   * Translate a key
   */
  t(key: string, params?: Record<string, any>): string {
    const translations = this._translations()
    const value = getNestedValue(translations, key)

    if (typeof value === 'string') {
      return interpolate(value, params)
    }

    // Fallback to key
    console.warn(`[Flint i18n] Missing translation: ${key}`)
    return key
  }

  /**
   * Translate with pluralization
   */
  tc(key: string, count: number, params?: Record<string, any>): string {
    const translations = this._translations()
    const pluralized = pluralize(key, count, translations)
    return interpolate(pluralized, { count, ...params })
  }

  /**
   * Check if locale is current
   */
  isCurrentLocale(locale: Locale): boolean {
    return this._locale() === locale
  }

  /**
   * Get i18n context for components
   */
  getContext(): I18nContext {
    return {
      locale: this._locale,
      locales: this.locales,
      t: this.t.bind(this),
      tc: this.tc.bind(this),
      setLocale: this.setLocale.bind(this),
      isCurrentLocale: this.isCurrentLocale.bind(this),
    }
  }
}

// ─── Utility Functions ──────────────────────────────────────────

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

// ─── createI18n Factory ─────────────────────────────────────────

export function createI18n(options: I18nOptions): I18n {
  return new I18n(options)
}

// ─── Built-in Locales ───────────────────────────────────────────

export const LOCALES = {
  EN: 'en',
  ID: 'id',
  JA: 'ja',
  KO: 'ko',
  ZH: 'zh',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
  PT: 'pt',
  AR: 'ar',
} as const

// ─── Number & Date Formatting ───────────────────────────────────

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

export function formatDate(
  date: Date,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale, options).format(date)
}

export function formatRelativeTime(
  date: Date,
  locale: Locale
): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (Math.abs(days) < 1) {
    const hours = Math.ceil(diff / (1000 * 60 * 60))
    return rtf.format(hours, 'hour')
  }

  return rtf.format(days, 'day')
}
