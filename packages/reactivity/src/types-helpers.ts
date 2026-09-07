// Flint TypeScript Type Helpers v4.1
// Advanced type inference and utility types

import type { Signal, Computed, Writable, Readable } from './types.js'

// ─── Signal Type Helpers ────────────────────────────────────────

/**
 * Infer the inner type of a Signal.
 *
 * @example
 * const count = state(0)
 * type Count = InferSignal<typeof count> // number
 */
export type InferSignal<T> = T extends Signal<infer V> ? V : never

/**
 * Infer the inner type of a Computed.
 *
 * @example
 * const doubled = computed(() => count() * 2)
 * type Doubled = InferComputed<typeof doubled> // number
 */
export type InferComputed<T> = T extends Computed<infer V> ? V : never

/**
 * Infer the inner type of a Writable.
 */
export type InferWritable<T> = T extends Writable<infer V> ? V : never

/**
 * Infer the inner type of a Readable.
 */
export type InferReadable<T> = T extends Readable<infer V> ? V : never

// ─── Component Type Helpers ─────────────────────────────────────

/**
 * Extract props type from a component function.
 *
 * @example
 * function Greeting({ name, age }: { name: string; age: number }) { ... }
 * type Props = ComponentProps<typeof Greeting> // { name: string; age: number }
 */
export type ComponentProps<T> = T extends (props: infer P) => any ? P : never

/**
 * Extract return type from a component function.
 */
export type ComponentReturn<T> = T extends (props: any) => infer R ? R : never

/**
 * Make all props optional except required ones.
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

/**
 * Make all props required except optional ones.
 */
export type RequiredExcept<T, K extends keyof T> = Required<T> & Partial<Pick<T, K>>

// ─── Form Type Helpers ──────────────────────────────────────────

/**
 * Infer form values type from a form configuration.
 *
 * @example
 * const form = useForm({ email: '', password: '' }, ...)
 * type Values = InferFormValues<typeof form> // { email: string; password: string }
 */
export type InferFormValues<T> = T extends { state: { values: Signal<infer V> } } ? V : never

/**
 * Infer form errors type from a form configuration.
 */
export type InferFormErrors<T> = T extends { state: { errors: Signal<infer E> } } ? E : never

/**
 * Create a validator type from a value type.
 */
export type Validator<T> = (value: T, allValues?: any) => string | null | Promise<string | null>

/**
 * Create validators type for a form values object.
 */
export type Validators<T> = {
  [K in keyof T]?: Validator<T[K]> | Validator<T[K]>[]
}

// ─── Store Type Helpers ─────────────────────────────────────────

/**
 * Infer state type from a store.
 */
export type InferStoreState<T> = T extends { state: infer S } ? S : never

/**
 * Infer actions type from a store.
 */
export type InferStoreActions<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never
}

// ─── Utility Types ──────────────────────────────────────────────

/**
 * Make a type nullable.
 */
export type Nullable<T> = T | null

/**
 * Make a type undefined.
 */
export type Optional<T> = T | undefined

/**
 * Make a type nullable or undefined.
 */
export type Maybe<T> = T | null | undefined

/**
 * Deep readonly type.
 */
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K]
}

/**
 * Deep mutable type.
 */
export type DeepMutable<T> = {
  -readonly [K in keyof T]: T[K] extends object ? DeepMutable<T[K]> : T[K]
}

/**
 * Extract only function keys from an object.
 */
export type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T]

/**
 * Extract only non-function keys from an object.
 */
export type NonFunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K
}[keyof T]

/**
 * Pick only function properties.
 */
export type PickFunctions<T> = Pick<T, FunctionKeys<T>>

/**
 * Pick only non-function properties.
 */
export type PickState<T> = Pick<T, NonFunctionKeys<T>>

/**
 * Create a union of all method parameter types.
 */
export type MethodParams<T> = {
  [K in keyof T]: T[K] extends (...args: infer P) => any ? P : never
}[keyof T]

/**
 * Create a union of all method return types.
 */
export type MethodReturns<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : never
}[keyof T]

// ─── Event Type Helpers ─────────────────────────────────────────

/**
 * Extract event handler type from a props object.
 *
 * @example
 * type ClickHandler = EventHandler<'onClick'> // (e: MouseEvent) => void
 */
export type EventHandler<K extends string> = K extends `on${infer E}`
  ? (event: Lowercase<E> extends 'click' ? MouseEvent
    : Lowercase<E> extends 'change' ? Event
    : Lowercase<E> extends 'input' ? Event
    : Lowercase<E> extends 'submit' ? Event
    : Lowercase<E> extends 'keydown' ? KeyboardEvent
    : Lowercase<E> extends 'keyup' ? KeyboardEvent
    : Lowercase<E> extends 'focus' ? FocusEvent
    : Lowercase<E> extends 'blur' ? FocusEvent
    : Lowercase<E> extends 'scroll' ? Event
    : Lowercase<E> extends 'resize' ? UIEvent
    : Event) => void
  : never

/**
 * Create event handlers type for common events.
 */
export type EventHandlers = {
  onClick?: (e: MouseEvent) => void
  onInput?: (e: Event) => void
  onChange?: (e: Event) => void
  onSubmit?: (e: Event) => void
  onKeydown?: (e: KeyboardEvent) => void
  onKeyup?: (e: KeyboardEvent) => void
  onFocus?: (e: FocusEvent) => void
  onBlur?: (e: FocusEvent) => void
  onScroll?: (e: Event) => void
  onResize?: (e: UIEvent) => void
}

// ─── Promise Type Helpers ───────────────────────────────────────

/**
 * Unwrap a Promise type.
 */
export type UnwrapPromise<T> = T extends Promise<infer V> ? V : T

/**
 * Make a function return a Promise.
 */
export type Async<T> = T extends (...args: infer P) => infer R
  ? (...args: P) => Promise<R>
  : never

/**
 * Await a Promise and get its type.
 */
export type Await<T> = T extends Promise<infer V> ? V : T

// ─── Array Type Helpers ─────────────────────────────────────────

/**
 * Extract element type from an array.
 */
export type ArrayElement<T> = T extends (infer E)[] ? E : never

/**
 * Create a tuple type.
 */
export type Tuple<T extends any[]> = [...T]

/**
 * Create a type with N elements.
 */
export type TupleOf<T, N extends number> = N extends 0
  ? []
  : N extends 1
  ? [T]
  : N extends 2
  ? [T, T]
  : N extends 3
  ? [T, T, T]
  : T[]

// ─── String Type Helpers ────────────────────────────────────────

/**
 * Capitalize a string type.
 */
export type Capitalize<S extends string> = S extends `${infer First}${infer Rest}`
  ? `${Uppercase<First>}${Rest}`
  : S

/**
 * Uncapitalize a string type.
 */
export type Uncapitalize<S extends string> = S extends `${infer First}${infer Rest}`
  ? `${Lowercase<First>}${Rest}`
  : S

/**
 * CamelCase a string type.
 */
export type CamelCase<S extends string> = S extends `${infer First}-${infer Rest}`
  ? `${First}${Capitalize<CamelCase<Rest>>}`
  : S

/**
 * KebabCase a string type.
 */
export type KebabCase<S extends string> = S extends `${infer First}${infer Rest}`
  ? First extends Uppercase<First>
    ? `-${Lowercase<First>}${KebabCase<Rest>}`
    : `${First}${KebabCase<Rest>}`
  : S

// ─── Conditional Type Helpers ───────────────────────────────────

/**
 * If type is true, return T, else return F.
 */
export type If<C extends boolean, T, F> = C extends true ? T : F

/**
 * And type for two boolean types.
 */
export type And<A extends boolean, B extends boolean> = A extends true
  ? B extends true
    ? true
    : false
  : false

/**
 * Or type for two boolean types.
 */
export type Or<A extends boolean, B extends boolean> = A extends true
  ? true
  : B extends true
  ? true
  : false

/**
 * Not type for a boolean type.
 */
export type Not<T extends boolean> = T extends true ? false : true

/**
 * Equals type for two types.
 */
export type Equals<A, B> = A extends B ? (B extends A ? true : false) : false

/**
 * IsNever type.
 */
export type IsNever<T> = [T] extends [never] ? true : false

/**
 * IsAny type.
 */
export type IsAny<T> = 0 extends (1 & T) ? true : false

/**
 * IsUnknown type.
 */
export type IsUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? true : false
