// Flint Runtime — SEO Utilities
// Meta tags, structured data, and SEO helpers

import { state, effect } from '@flint/reactivity'
import type { Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export interface MetaTag {
  name?: string
  property?: string
  content: string
  charset?: string
  httpEquiv?: string
}

export interface SEOMeta {
  title: string
  description: string
  keywords?: string[]
  author?: string
  image?: string
  url?: string
  type?: string
  siteName?: string
  locale?: string
  robots?: string
}

export interface StructuredData {
  '@context': string
  '@type': string
  [key: string]: any
}

// ─── Meta Manager ───────────────────────────────────────────────

export class MetaManager {
  private metaTags = new Map<string, HTMLMetaElement>()
  private titleElement: HTMLTitleElement | null = null

  constructor() {
    if (typeof document !== 'undefined') {
      this.titleElement = document.querySelector('title')
    }
  }

  /**
   * Set page title
   */
  setTitle(title: string): void {
    if (this.titleElement) {
      this.titleElement.textContent = title
    } else if (typeof document !== 'undefined') {
      document.title = title
    }
  }

  /**
   * Set meta tag
   */
  setMeta(tag: MetaTag): void {
    if (typeof document === 'undefined') return

    let element: HTMLMetaElement | null = null
    const key = tag.name || tag.property || tag.httpEquiv

    if (!key) return

    // Check if exists in internal map
    if (this.metaTags.has(key)) {
      element = this.metaTags.get(key)!
    } else {
      // Check DOM first for existing element
      if (tag.name) {
        element = document.querySelector(`meta[name="${tag.name}"]`)
      } else if (tag.property) {
        element = document.querySelector(`meta[property="${tag.property}"]`)
      }

      if (!element) {
        // Create new meta element
        element = document.createElement('meta')

        if (tag.name) {
          element.setAttribute('name', tag.name)
        } else if (tag.property) {
          element.setAttribute('property', tag.property)
        } else if (tag.httpEquiv) {
          element.setAttribute('http-equiv', tag.httpEquiv)
        }

        document.head.appendChild(element)
      }
      this.metaTags.set(key, element)
    }

    element.setAttribute('content', tag.content)
  }

  /**
   * Set multiple meta tags
   */
  setMetaTags(tags: MetaTag[]): void {
    tags.forEach((tag) => this.setMeta(tag))
  }

  /**
   * Set SEO meta tags
   */
  setSEO(seo: SEOMeta): void {
    // Title
    this.setTitle(seo.title)

    // Basic meta tags
    this.setMeta({ name: 'description', content: seo.description })

    if (seo.keywords?.length) {
      this.setMeta({ name: 'keywords', content: seo.keywords.join(', ') })
    }

    if (seo.author) {
      this.setMeta({ name: 'author', content: seo.author })
    }

    if (seo.robots) {
      this.setMeta({ name: 'robots', content: seo.robots })
    }

    // Open Graph
    this.setMeta({ property: 'og:title', content: seo.title })
    this.setMeta({ property: 'og:description', content: seo.description })
    this.setMeta({ property: 'og:type', content: seo.type || 'website' })

    if (seo.image) {
      this.setMeta({ property: 'og:image', content: seo.image })
    }

    if (seo.url) {
      this.setMeta({ property: 'og:url', content: seo.url })
    }

    if (seo.siteName) {
      this.setMeta({ property: 'og:site_name', content: seo.siteName })
    }

    if (seo.locale) {
      this.setMeta({ property: 'og:locale', content: seo.locale })
    }

    // Twitter Card
    this.setMeta({ name: 'twitter:card', content: 'summary_large_image' })
    this.setMeta({ name: 'twitter:title', content: seo.title })
    this.setMeta({ name: 'twitter:description', content: seo.description })

    if (seo.image) {
      this.setMeta({ name: 'twitter:image', content: seo.image })
    }
  }

  /**
   * Set canonical URL
   */
  setCanonical(url: string): void {
    if (typeof document === 'undefined') return

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement

    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }

    link.setAttribute('href', url)
  }

  /**
   * Set structured data
   */
  setStructuredData(data: StructuredData): void {
    if (typeof document === 'undefined') return

    // Remove existing structured data
    const existing = document.querySelector('script[type="application/ld+json"]')
    if (existing) {
      existing.remove()
    }

    // Add new structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
  }

  /**
   * Remove meta tag
   */
  removeMeta(key: string): void {
    const element = this.metaTags.get(key)
    if (element) {
      element.remove()
      this.metaTags.delete(key)
    }
  }

  /**
   * Clear all meta tags
   */
  clear(): void {
    this.metaTags.forEach((element) => element.remove())
    this.metaTags.clear()
  }
}

// ─── Structured Data Helpers ────────────────────────────────────

export function createArticleSchema(data: {
  headline: string
  description: string
  image?: string
  datePublished: string
  dateModified?: string
  author: { name: string; url?: string }
}): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.headline,
    description: data.description,
    image: data.image,
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    author: {
      '@type': 'Person',
      name: data.author.name,
      url: data.author.url,
    },
  }
}

export function createProductSchema(data: {
  name: string
  description: string
  image?: string
  price: number
  priceCurrency: string
  availability?: string
}): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
    image: data.image,
    offers: {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: data.priceCurrency,
      availability: data.availability || 'https://schema.org/InStock',
    },
  }
}

export function createBreadcrumbSchema(items: {
  name: string
  url: string
}[]): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// ─── SEO Hook ───────────────────────────────────────────────────

export function useSEO(seo: SEOMeta): void {
  const manager = new MetaManager()
  manager.setSEO(seo)
}

export function useStructuredData(data: StructuredData): void {
  const manager = new MetaManager()
  manager.setStructuredData(data)
}
