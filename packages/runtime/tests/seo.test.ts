import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MetaManager, useSEO, useStructuredData, createArticleSchema, createProductSchema, createBreadcrumbSchema } from '../src/seo/index.js'

describe('SEO', () => {
  describe('MetaManager', () => {
    let metaManager: MetaManager

    beforeEach(() => {
      metaManager = new MetaManager()
    })

    it('should create meta manager', () => {
      expect(metaManager).toBeDefined()
    })

    it('should set title', () => {
      metaManager.setTitle('Test Title')
      expect(document.title).toBe('Test Title')
    })

    it('should set meta tag', () => {
      metaManager.setMeta({
        name: 'description',
        content: 'Test description',
      })
      
      const meta = document.querySelector('meta[name="description"]')
      expect(meta).toBeDefined()
      expect(meta?.getAttribute('content')).toBe('Test description')
    })

    it('should set Open Graph meta tag', () => {
      metaManager.setMeta({
        property: 'og:title',
        content: 'OG Title',
      })
      
      const meta = document.querySelector('meta[property="og:title"]')
      expect(meta).toBeDefined()
      expect(meta?.getAttribute('content')).toBe('OG Title')
    })

    it('should update existing meta tag', () => {
      metaManager.setMeta({
        name: 'description',
        content: 'First',
      })
      
      metaManager.setMeta({
        name: 'description',
        content: 'Second',
      })
      
      const meta = document.querySelector('meta[name="description"]')
      expect(meta?.getAttribute('content')).toBe('Second')
    })

    it('should set multiple meta tags', () => {
      metaManager.setMetaTags([
        { name: 'description', content: 'Description' },
        { name: 'keywords', content: 'flint, framework' },
      ])
      
      expect(document.querySelector('meta[name="description"]')).toBeDefined()
      expect(document.querySelector('meta[name="keywords"]')).toBeDefined()
    })
  })

  describe('useSEO', () => {
    it('should set SEO meta tags', () => {
      const seo = useSEO({
        title: 'My Page',
        description: 'Page description',
        keywords: ['flint', 'framework'],
        author: 'Flint Team',
      })

      expect(document.title).toBe('My Page')
      
      const description = document.querySelector('meta[name="description"]')
      expect(description?.getAttribute('content')).toBe('Page description')
    })

    it('should set Open Graph tags', () => {
      useSEO({
        title: 'My Page',
        description: 'Description',
        image: 'https://example.com/image.png',
        url: 'https://example.com',
        type: 'website',
      })

      const ogTitle = document.querySelector('meta[property="og:title"]')
      expect(ogTitle?.getAttribute('content')).toBe('My Page')
      
      const ogImage = document.querySelector('meta[property="og:image"]')
      expect(ogImage?.getAttribute('content')).toBe('https://example.com/image.png')
    })
  })

  describe('Structured Data', () => {
    describe('createArticleSchema', () => {
      it('should create article schema', () => {
        const schema = createArticleSchema({
          headline: 'Test Article',
          description: 'Test description',
          author: { name: 'John Doe' },
          datePublished: '2024-01-15',
          image: 'https://example.com/image.jpg',
        })

        expect(schema['@context']).toBe('https://schema.org')
        expect(schema['@type']).toBe('Article')
        expect(schema.headline).toBe('Test Article')
        expect(schema.author).toEqual({ '@type': 'Person', name: 'John Doe', url: undefined })
      })
    })

    describe('createProductSchema', () => {
      it('should create product schema', () => {
        const schema = createProductSchema({
          name: 'Test Product',
          description: 'Product description',
          image: 'https://example.com/product.jpg',
          price: 99.99,
          priceCurrency: 'USD',
        })

        expect(schema['@context']).toBe('https://schema.org')
        expect(schema['@type']).toBe('Product')
        expect(schema.name).toBe('Test Product')
        expect(schema.offers.price).toBe(99.99)
      })
    })

    describe('createBreadcrumbSchema', () => {
      it('should create breadcrumb schema', () => {
        const schema = createBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Products', url: '/products' },
          { name: 'Item', url: '/products/item' },
        ])

        expect(schema['@context']).toBe('https://schema.org')
        expect(schema['@type']).toBe('BreadcrumbList')
        expect(schema.itemListElement).toHaveLength(3)
        expect(schema.itemListElement[0].position).toBe(1)
      })
    })
  })

  describe('useStructuredData', () => {
    it('should inject structured data', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Test Site',
      }

      useStructuredData(schema)

      const script = document.querySelector('script[type="application/ld+json"]')
      expect(script).toBeDefined()
      expect(JSON.parse(script?.textContent || '{}')).toEqual(schema)
    })
  })
})
