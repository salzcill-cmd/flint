// Flint Runtime — Class Name Utility
// cn() for merging class names (like clsx/tailwind-merge)

export type ClassValue = string | number | boolean | null | undefined | ClassValue[] | Record<string, boolean | null | undefined>

/**
 * Merge class names into a single string.
 * Handles strings, objects, arrays, and falsy values.
 *
 * @example
 * cn('base', condition && 'active', { disabled: isDisabled })
 * // "base active disabled" (if condition and isDisabled are true)
 *
 * cn('px-4', 'py-2', undefined, 'text-white')
 * // "px-4 py-2 text-white"
 *
 * cn(['a', 'b'], { c: true, d: false })
 * // "a b c"
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = []

  for (const input of inputs) {
    if (!input) continue

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input))
    } else if (Array.isArray(input)) {
      const merged = cn(...input)
      if (merged) classes.push(merged)
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key)
      }
    }
  }

  return classes.join(' ')
}

/**
 * Merge class names with Tailwind CSS conflict resolution.
 * Later classes override earlier ones for the same utility.
 *
 * @example
 * cnMerge('px-4 py-2', 'py-4')
 * // "px-4 py-4" (py-4 overrides py-2)
 */
export function cnMerge(...inputs: ClassValue[]): string {
  const merged = cn(...inputs)

  // Simple Tailwind conflict resolution:
  // Group classes by their prefix (e.g., "px", "py", "text")
  const groups = new Map<string, string[]>()

  for (const cls of merged.split(' ')) {
    if (!cls) continue

    // Extract prefix (everything before the first number or dash)
    const match = cls.match(/^([a-z]+)-/)
    const prefix = match ? match[1] : cls

    if (!groups.has(prefix)) {
      groups.set(prefix, [])
    }
    groups.get(prefix)!.push(cls)
  }

  // For each group, keep only the last class
  const result: string[] = []
  for (const classes of groups.values()) {
    result.push(classes[classes.length - 1])
  }

  return result.join(' ')
}

/**
 * Conditional class name utility.
 *
 * @example
 * ifClass(isActive, 'bg-blue-500 text-white', 'bg-gray-200')
 * // Returns first set if isActive, second set otherwise
 */
export function ifClass(
  condition: boolean,
  trueClasses: ClassValue,
  falseClasses?: ClassValue
): string {
  return cn(condition ? trueClasses : falseClasses)
}

/**
 * Create a class name resolver with defaults.
 *
 * @example
 * const classes = createClassNameResolver({
 *   base: 'px-4 py-2 rounded',
 *   active: 'bg-blue-500 text-white',
 *   disabled: 'opacity-50 cursor-not-allowed',
 * })
 *
 * classes({ active: true, disabled: false })
 * // "px-4 py-2 rounded bg-blue-500 text-white"
 */
export function createClassNameResolver<T extends Record<string, ClassValue>>(
  variants: T
): (options: Partial<Record<keyof T, boolean>>) => string {
  return (options) => {
    const classes: ClassValue[] = []

    for (const [key, value] of Object.entries(options)) {
      if (value && variants[key]) {
        classes.push(variants[key])
      }
    }

    return cn(...classes)
  }
}
