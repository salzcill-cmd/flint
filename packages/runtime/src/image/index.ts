// Flint Runtime — Image Component
// Lazy loading, optimization, and responsive images

import { state, computed, effect } from '@flint/reactivity'
import type { Signal } from '@flint/reactivity'
import { h } from '../renderer/index.js'
import type { Child } from '../renderer/index.js'

// ─── Types ──────────────────────────────────────────────────────

export interface ImageOptions {
  /** Image source URL */
  src: string
  /** Alt text */
  alt: string
  /** Width */
  width?: number
  /** Height */
  height?: number
  /** Loading strategy */
  loading?: 'lazy' | 'eager'
  /** Placeholder while loading */
  placeholder?: string
  /** Fallback image on error */
  fallback?: string
  /** Object fit */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  /** Object position */
  objectPosition?: string
  /** Sizes for responsive images */
  sizes?: string
  /** SrcSet for responsive images */
  srcSet?: string
  /** Callback when image loads */
  onLoad?: (event: Event) => void
  /** Callback when image errors */
  onError?: (event: Event) => void
}

// ─── Image State ────────────────────────────────────────────────

export interface ImageState {
  isLoaded: Signal<boolean>
  isError: Signal<boolean>
  isLoading: Signal<boolean>
}

// ─── Image Observer ─────────────────────────────────────────────

const imageObserver: IntersectionObserver | null = null
const observedImages = new WeakMap<Element, () => void>()

function getObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null

  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const callback = observedImages.get(entry.target)
          if (callback) {
            callback()
            observedImages.delete(entry.target)
          }
        }
      })
    },
    { rootMargin: '200px' }
  )
}

// ─── Image Component ────────────────────────────────────────────

export function Image(options: ImageOptions): Child {
  const {
    src,
    alt,
    width,
    height,
    loading = 'lazy',
    placeholder,
    fallback,
    objectFit,
    objectPosition,
    sizes,
    srcSet,
    onLoad,
    onError,
  } = options

  const isLoaded = state(false)
  const isError = state(false)
  const isLoading = state(true)
  const currentSrc = state(placeholder || '')

  // Handle image load
  const handleLoad = (event: Event) => {
    isLoaded.set(true)
    isLoading.set(false)
    isError.set(false)
    onLoad?.(event)
  }

  // Handle image error
  const handleError = (event: Event) => {
    isError.set(true)
    isLoading.set(false)
    isLoaded.set(false)

    if (fallback) {
      currentSrc.set(fallback)
    }

    onError?.(event)
  }

  // Load image when in viewport (if lazy)
  const loadInViewport = () => {
    currentSrc.set(src)
  }

  // Set up lazy loading
  if (loading === 'lazy' && typeof IntersectionObserver !== 'undefined') {
    // Will be loaded when element is in viewport
    currentSrc.set(placeholder || '')
  } else {
    // Load immediately
    currentSrc.set(src)
  }

  // Build styles
  const styles: Record<string, any> = {}
  if (objectFit) styles.objectFit = objectFit
  if (objectPosition) styles.objectPosition = objectPosition

  // Create img element
  const img = h('img', {
    src: currentSrc(),
    alt,
    width,
    height,
    loading,
    sizes,
    srcSet,
    style: Object.keys(styles).length > 0 ? styles : undefined,
    onLoad: handleLoad,
    onError: handleError,
    ref: (el: HTMLImageElement) => {
      if (loading === 'lazy' && el) {
        const observer = getObserver()
        if (observer) {
          observedImages.set(el, loadInViewport)
          observer.observe(el)
        } else {
          loadInViewport()
        }
      }
    },
  })

  return img
}

// ─── Responsive Image Component ─────────────────────────────────

export interface ResponsiveImageOptions extends ImageOptions {
  /** Breakpoints */
  breakpoints?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  /** Quality (1-100) */
  quality?: number
  /** Format */
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto'
}

export function ResponsiveImage(options: ResponsiveImageOptions): Child {
  const {
    src,
    alt,
    breakpoints = { mobile: 480, tablet: 768, desktop: 1024 },
    quality = 80,
    format = 'auto',
    sizes: userSizes,
    ...rest
  } = options

  // Generate srcSet
  const srcSet = generateSrcSet(src, breakpoints, quality, format)

  // Generate sizes attribute
  const sizes = userSizes || generateSizes(breakpoints)

  return Image({
    src,
    alt,
    srcSet,
    sizes,
    loading: 'lazy',
    ...rest,
  })
}

// ─── Utility Functions ──────────────────────────────────────────

function generateSrcSet(
  src: string,
  breakpoints: { mobile?: number; tablet?: number; desktop?: number },
  quality: number,
  format: string
): string {
  const entries: string[] = []

  // This is a placeholder - real implementation would transform the URL
  // based on the image service being used (Cloudinary, imgix, etc.)
  Object.entries(breakpoints).forEach(([, width]) => {
    if (width) {
      entries.push(`${src}?w=${width}&q=${quality}&fm=${format} ${width}w`)
    }
  })

  return entries.join(', ')
}

function generateSizes(
  breakpoints: { mobile?: number; tablet?: number; desktop?: number }
): string {
  const sizes: string[] = []

  if (breakpoints.mobile) {
    sizes.push(`(max-width: ${breakpoints.mobile}px) 100vw`)
  }
  if (breakpoints.tablet) {
    sizes.push(`(max-width: ${breakpoints.tablet}px) 50vw`)
  }
  sizes.push('33vw')

  return sizes.join(', ')
}

// ─── Image Preloader ────────────────────────────────────────────

const preloadedImages = new Set<string>()

export function preloadImage(src: string): Promise<void> {
  if (preloadedImages.has(src)) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const img = new (window.Image)()
    img.onload = () => {
      preloadedImages.add(src)
      resolve()
    }
    img.onerror = reject
    img.src = src
  })
}

export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage))
}

// ─── Image Error Handler ────────────────────────────────────────

export function createImageFallback(fallbackSrc: string) {
  return (event: Event) => {
    const img = event.target as HTMLImageElement
    if (img && img.src !== fallbackSrc) {
      img.src = fallbackSrc
    }
  }
}
