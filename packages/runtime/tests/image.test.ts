import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Image, ResponsiveImage, preloadImage, preloadImages, createImageFallback } from '../src/image/index.js'
import { h } from '../src/renderer/index.js'

describe('Image', () => {
  describe('Image Component', () => {
    it('should create image element', () => {
      const img = Image({
        src: '/test.jpg',
        alt: 'Test image',
      })
      
      expect(img).toBeDefined()
    })

    it('should create image with all options', () => {
      const img = Image({
        src: '/test.jpg',
        alt: 'Test image',
        width: 100,
        height: 100,
        loading: 'lazy',
        placeholder: '/placeholder.jpg',
        fallback: '/fallback.jpg',
        objectFit: 'cover',
        objectPosition: 'center',
        sizes: '(max-width: 600px) 100vw, 50vw',
        srcSet: '/small.jpg 300w, /large.jpg 600w',
      })
      
      expect(img).toBeDefined()
    })

    it('should handle load callback', () => {
      const onLoad = vi.fn()
      
      const img = Image({
        src: '/test.jpg',
        alt: 'Test',
        onLoad,
      })
      
      expect(img).toBeDefined()
    })

    it('should handle error callback', () => {
      const onError = vi.fn()
      
      const img = Image({
        src: '/test.jpg',
        alt: 'Test',
        onError,
      })
      
      expect(img).toBeDefined()
    })
  })

  describe('ResponsiveImage', () => {
    it('should create responsive image', () => {
      const img = ResponsiveImage({
        src: '/test.jpg',
        alt: 'Test image',
        widths: [300, 600, 900],
        sizes: '(max-width: 600px) 100vw, 50vw',
      })
      
      expect(img).toBeDefined()
    })
  })

  describe('Image Preloading', () => {
    it('should preload single image', async () => {
      // Mock Image constructor
      const mockImg = {
        onload: null as any,
        onerror: null as any,
        src: '',
      }
      
      vi.stubGlobal('Image', vi.fn(() => mockImg))
      
      const promise = preloadImage('/test.jpg')
      
      // Simulate load
      mockImg.onload()
      
      await promise
      
      expect(mockImg.src).toBe('/test.jpg')
      
      vi.unstubAllGlobals()
    })

    it('should handle preload error', async () => {
      const mockImg = {
        onload: null as any,
        onerror: null as any,
        src: '',
      }
      
      vi.stubGlobal('Image', vi.fn(() => mockImg))
      
      const promise = preloadImage('/bad.jpg')
      
      // Simulate error
      mockImg.onerror(new Error('Load failed'))
      
      await expect(promise).rejects.toBeDefined()
      
      vi.unstubAllGlobals()
    })

    it('should preload multiple images', async () => {
      const mockImgs: any[] = []
      
      vi.stubGlobal('Image', vi.fn(() => {
        const mockImg = {
          onload: null as any,
          onerror: null as any,
          src: '',
        }
        mockImgs.push(mockImg)
        return mockImg
      }))
      
      const promise = preloadImages(['/1.jpg', '/2.jpg', '/3.jpg'])
      
      // Wait for Image constructors to be called
      await vi.waitFor(() => {
        expect(mockImgs.length).toBe(3)
      })
      
      // Simulate loads for each image
      mockImgs.forEach(img => img.onload())
      
      await promise
      
      vi.unstubAllGlobals()
    })
  })

  describe('Image Fallback', () => {
    it('should create fallback element', () => {
      const fallback = createImageFallback({
        width: 100,
        height: 100,
        backgroundColor: '#ccc',
      })
      
      expect(fallback).toBeDefined()
    })

    it('should create fallback with custom content', () => {
      const fallback = createImageFallback({
        width: 200,
        height: 200,
        backgroundColor: '#eee',
        content: h('span', null, 'No image'),
      })
      
      expect(fallback).toBeDefined()
    })
  })
})
