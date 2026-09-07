// Flint Utility Functions v4.1
// Common utilities for everyday coding

// ─── Number Utilities ───────────────────────────────────────────

/**
 * Clamp a number between min and max.
 *
 * @example
 * clamp(15, 0, 10) // 10
 * clamp(-5, 0, 10) // 0
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Linear interpolation between two values.
 *
 * @example
 * lerp(0, 100, 0.5) // 50
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

/**
 * Map a value from one range to another.
 *
 * @example
 * mapRange(5, 0, 10, 0, 100) // 50
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin
}

/**
 * Check if a number is in range.
 *
 * @example
 * inRange(5, 0, 10) // true
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

/**
 * Round to decimal places.
 *
 * @example
 * roundTo(3.14159, 2) // 3.14
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Random number between min and max.
 *
 * @example
 * random(1, 10) // 5.123...
 */
export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/**
 * Random integer between min and max (inclusive).
 *
 * @example
 * randomInt(1, 10) // 7
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ─── String Utilities ───────────────────────────────────────────

/**
 * Capitalize first letter.
 *
 * @example
 * capitalize('hello') // 'Hello'
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Convert to camelCase.
 *
 * @example
 * camelCase('hello-world') // 'helloWorld'
 */
export function camelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
    .replace(/^[A-Z]/, (c) => c.toLowerCase())
}

/**
 * Convert to kebab-case.
 *
 * @example
 * kebabCase('helloWorld') // 'hello-world'
 */
export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * Convert to snake_case.
 *
 * @example
 * snakeCase('helloWorld') // 'hello_world'
 */
export function snakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

/**
 * Convert to PascalCase.
 *
 * @example
 * pascalCase('hello-world') // 'HelloWorld'
 */
export function pascalCase(str: string): string {
  return capitalize(camelCase(str))
}

/**
 * Truncate string with ellipsis.
 *
 * @example
 * truncate('Hello World', 5) // 'Hello...'
 */
export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - suffix.length) + suffix
}

/**
 * Generate slug from string.
 *
 * @example
 * slug('Hello World!') // 'hello-world'
 */
export function slug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Escape HTML special characters.
 *
 * @example
 * escapeHtml('<script>alert("xss")</script>') // '&lt;script&gt;...'
 */
export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return str.replace(/[&<>"']/g, (c) => map[c])
}

/**
 * Unescape HTML special characters.
 */
export function unescapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
  }
  return str.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, (c) => map[c])
}

/**
 * Strip HTML tags.
 *
 * @example
 * stripHtml('<p>Hello</p>') // 'Hello'
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '')
}

/**
 * Get initials from name.
 *
 * @example
 * getInitials('John Doe') // 'JD'
 */
export function getInitials(name: string, maxInitials = 2): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, maxInitials)
    .join('')
}

// ─── Array Utilities ────────────────────────────────────────────

/**
 * Remove duplicates from array.
 *
 * @example
 * unique([1, 2, 2, 3]) // [1, 2, 3]
 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

/**
 * Chunk array into groups.
 *
 * @example
 * chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

/**
 * Flatten nested arrays.
 *
 * @example
 * flatten([[1, 2], [3, [4, 5]]]) // [1, 2, 3, 4, 5]
 */
export function flatten<T>(arr: any[]): T[] {
  return arr.flat(Infinity) as T[]
}

/**
 * Group array by key.
 *
 * @example
 * groupBy([{ type: 'a', val: 1 }, { type: 'a', val: 2 }], 'type')
 * // { a: [{ type: 'a', val: 1 }, { type: 'a', val: 2 }] }
 */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((groups, item) => {
    const groupKey = String(item[key])
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

/**
 * Sort array by multiple keys.
 *
 * @example
 * sortBy([{ name: 'b', age: 20 }, { name: 'a', age: 30 }], ['name'])
 */
export function sortBy<T>(arr: T[], keys: (keyof T)[]): T[] {
  return [...arr].sort((a, b) => {
    for (const key of keys) {
      const aVal = a[key]
      const bVal = b[key]
      if (aVal < bVal) return -1
      if (aVal > bVal) return 1
    }
    return 0
  })
}

/**
 * Get random item from array.
 *
 * @example
 * randomItem([1, 2, 3]) // 2
 */
export function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Shuffle array.
 *
 * @example
 * shuffle([1, 2, 3]) // [3, 1, 2]
 */
export function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Get last N items from array.
 *
 * @example
 * last([1, 2, 3, 4], 2) // [3, 4]
 */
export function last<T>(arr: T[], n = 1): T[] {
  return arr.slice(-n)
}

/**
 * Get first N items from array.
 *
 * @example
 * first([1, 2, 3, 4], 2) // [1, 2]
 */
export function first<T>(arr: T[], n = 1): T[] {
  return arr.slice(0, n)
}

/**
 * Sum array of numbers.
 *
 * @example
 * sum([1, 2, 3]) // 6
 */
export function sum(arr: number[]): number {
  return arr.reduce((acc, val) => acc + val, 0)
}

/**
 * Average of array.
 *
 * @example
 * average([1, 2, 3]) // 2
 */
export function average(arr: number[]): number {
  return sum(arr) / arr.length
}

/**
 * Min value in array.
 *
 * @example
 * min([1, 2, 3]) // 1
 */
export function min(arr: number[]): number {
  return Math.min(...arr)
}

/**
 * Max value in array.
 *
 * @example
 * max([1, 2, 3]) // 3
 */
export function max(arr: number[]): number {
  return Math.max(...arr)
}

// ─── Object Utilities ───────────────────────────────────────────

/**
 * Deep clone an object.
 *
 * @example
 * const cloned = deepClone({ a: { b: 1 } })
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Deep merge two objects.
 *
 * @example
 * deepMerge({ a: 1 }, { b: 2 }) // { a: 1, b: 2 }
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result: any = { ...target }
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}

/**
 * Pick specified keys from object.
 *
 * @example
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) // { a: 1, c: 3 }
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as any
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result
}

/**
 * Omit specified keys from object.
 *
 * @example
 * omit({ a: 1, b: 2, c: 3 }, ['b']) // { a: 1, c: 3 }
 */
export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj } as any
  for (const key of keys) {
    delete result[key]
  }
  return result
}

/**
 * Check if object is empty.
 *
 * @example
 * isEmpty({}) // true
 * isEmpty({ a: 1 }) // false
 */
export function isEmpty(obj: any): boolean {
  if (obj == null) return true
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0
  if (typeof obj === 'object') return Object.keys(obj).length === 0
  return false
}

/**
 * Get nested value by path.
 *
 * @example
 * get({ a: { b: { c: 1 } } }, 'a.b.c') // 1
 */
export function get(obj: any, path: string, defaultValue?: any): any {
  const keys = path.split('.')
  let result = obj
  for (const key of keys) {
    result = result?.[key]
  }
  return result ?? defaultValue
}

/**
 * Set nested value by path.
 *
 * @example
 * const obj = { a: { b: 1 } }
 * set(obj, 'a.b', 2) // obj.a.b === 2
 */
export function set(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (current[keys[i]] === undefined) {
      current[keys[i]] = {}
    }
    current = current[keys[i]]
  }
  current[keys[keys.length - 1]] = value
}

// ─── Function Utilities ─────────────────────────────────────────

/**
 * Debounce a function.
 *
 * @example
 * const debouncedSearch = debounce(search, 300)
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Throttle a function.
 *
 * @example
 * const throttledScroll = throttle(handleScroll, 100)
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  let lastArgs: Parameters<T> | null = null

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
        if (lastArgs) {
          fn(...lastArgs)
          lastArgs = null
        }
      }, limit)
    } else {
      lastArgs = args
    }
  }
}

/**
 * Memoize a function.
 *
 * @example
 * const memoizedAdd = memoize((a, b) => a + b)
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, any>()

  return ((...args: any[]) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * Create a function that only runs once.
 *
 * @example
 * const init = once(() => console.log('Initialized'))
 * init() // 'Initialized'
 * init() // nothing
 */
export function once<T extends (...args: any[]) => any>(fn: T): T {
  let called = false
  let result: any

  return ((...args: any[]) => {
    if (!called) {
      called = true
      result = fn(...args)
    }
    return result
  }) as T
}

/**
 * Create a function with retry logic.
 *
 * @example
 * const fetchWithRetry = retry(fetchData, 3, 1000)
 */
export function retry<T extends (...args: any[]) => any>(
  fn: T,
  retries: number,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>) => {
    let lastError: Error | null = null
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn(...args)
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        if (i < retries) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }
    throw lastError
  }
}

/**
 * Delay execution.
 *
 * @example
 * await delay(1000) // wait 1 second
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Create a sleep utility.
 *
 * @example
 * await sleep(1000)
 */
export const sleep = delay

// ─── Type Utilities ─────────────────────────────────────────────

/**
 * Type guard: is string.
 *
 * @example
 * if (isString(value)) { ... }
 */
export function isString(value: any): value is string {
  return typeof value === 'string'
}

/**
 * Type guard: is number.
 */
export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * Type guard: is boolean.
 */
export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean'
}

/**
 * Type guard: is function.
 */
export function isFunction(value: any): value is Function {
  return typeof value === 'function'
}

/**
 * Type guard: is object.
 */
export function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Type guard: is array.
 */
export function isArray(value: any): value is any[] {
  return Array.isArray(value)
}

/**
 * Type guard: is null or undefined.
 */
export function isNil(value: any): value is null | undefined {
  return value == null
}

/**
 * Type guard: is defined (not null or undefined).
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value != null
}

/**
 * Type guard: is truthy.
 */
export function isTruthy(value: any): boolean {
  return !!value
}

/**
 * Type guard: is falsy.
 */
export function isFalsy(value: any): boolean {
  return !value
}

// ─── Date Utilities ─────────────────────────────────────────────

/**
 * Format date to string.
 *
 * @example
 * formatDate(new Date(), 'YYYY-MM-DD') // '2024-01-15'
 */
export function formatDate(date: Date, format: string): string {
  const map: Record<string, number> = {
    YYYY: date.getFullYear(),
    MM: date.getMonth() + 1,
    DD: date.getDate(),
    HH: date.getHours(),
    mm: date.getMinutes(),
    ss: date.getSeconds(),
  }

  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => {
    return String(map[match]).padStart(2, '0')
  })
}

/**
 * Get relative time string.
 *
 * @example
 * timeAgo(new Date(Date.now() - 3600000)) // '1 hour ago'
 */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`
  return `${Math.floor(seconds / 31536000)} years ago`
}

/**
 * Check if date is today.
 */
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

/**
 * Check if date is yesterday.
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  )
}

/**
 * Add days to date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Subtract days from date.
 */
export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days)
}

/**
 * Get difference in days between two dates.
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diff = Math.abs(date2.getTime() - date1.getTime())
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─── Color Utilities ────────────────────────────────────────────

/**
 * Convert hex to RGB.
 *
 * @example
 * hexToRgb('#ff0000') // { r: 255, g: 0, b: 0 }
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Convert RGB to hex.
 *
 * @example
 * rgbToHex(255, 0, 0) // '#ff0000'
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate random color.
 *
 * @example
 * randomColor() // '#a1b2c3'
 */
export function randomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
}

/**
 * Lighten a color.
 */
export function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const r = Math.min(255, rgb.r + amount)
  const g = Math.min(255, rgb.g + amount)
  const b = Math.min(255, rgb.b + amount)

  return rgbToHex(r, g, b)
}

/**
 * Darken a color.
 */
export function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const r = Math.max(0, rgb.r - amount)
  const g = Math.max(0, rgb.g - amount)
  const b = Math.max(0, rgb.b - amount)

  return rgbToHex(r, g, b)
}
