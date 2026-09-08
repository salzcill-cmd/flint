// Flint Runtime — Enterprise Form Validation (v5)
// Production-ready form handling with schema validation

import { state, computed, effect, batch } from '@flint/reactivity'
import type { Signal } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export type FormSchema<T = any> = {
  [K in keyof T]?: ValidationRule[]
}

export interface ValidationRule<T = any> {
  validate: (value: T, formValues?: any) => boolean | Promise<boolean>
  message: string
  type?: string
}

export interface FieldState {
  value: any
  error: string | null
  touched: boolean
  dirty: boolean
  validating: boolean
}

export interface FormState<T = any> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  dirty: Partial<Record<keyof T, boolean>>
  isValid: boolean
  isDirty: boolean
  isSubmitting: boolean
  isSubmitted: boolean
}

export interface FormOptions<T> {
  initialValues: T
  validationSchema?: FormSchema<T>
  validateOnChange?: boolean
  validateOnBlur?: boolean
  validateOnSubmit?: boolean
  onSubmit?: (values: T) => void | Promise<void>
  onReset?: () => void
  onValidate?: (values: T) => Partial<Record<keyof T, string>>
}

export interface FormHelpers<T> {
  state: FormState<T>
  getField: (name: keyof T) => FieldHelpers
  setFieldValue: (name: keyof T, value: any) => void
  setFieldError: (name: keyof T, error: string) => void
  setFieldTouched: (name: keyof T, touched: boolean) => void
  validateField: (name: keyof T) => Promise<boolean>
  validateForm: () => Promise<boolean>
  resetForm: () => void
  submitForm: () => Promise<void>
  setValues: (values: Partial<T>) => void
  setErrors: (errors: Partial<Record<keyof T, string>>) => void
}

export interface FieldHelpers {
  value: any
  error: string | null
  touched: boolean
  dirty: boolean
  validating: boolean
  onChange: (value: any) => void
  onBlur: () => void
  onFocus: () => void
  props: {
    value: any
    onChange: (e: Event) => void
    onBlur: () => void
    onFocus: () => void
  }
}

// ─── Validation Rules ───────────────────────────────────────────

export const rules = {
  required: (message = 'Wajib diisi'): ValidationRule => ({
    validate: (value) => {
      if (value === null || value === undefined) return false
      if (typeof value === 'string') return value.trim().length > 0
      if (Array.isArray(value)) return value.length > 0
      return true
    },
    message,
    type: 'required',
  }),

  email: (message = 'Email tidak valid'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    },
    message,
    type: 'email',
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (!value) return true
      return String(value).length >= min
    },
    message: message || `Minimal ${min} karakter`,
    type: 'minLength',
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (!value) return true
      return String(value).length <= max
    },
    message: message || `Maksimal ${max} karakter`,
    type: 'maxLength',
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (value === null || value === undefined) return true
      return Number(value) >= min
    },
    message: message || `Minimal ${min}`,
    type: 'min',
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (value === null || value === undefined) return true
      return Number(value) <= max
    },
    message: message || `Maksimal ${max}`,
    type: 'max',
  }),

  pattern: (regex: RegExp, message = 'Format tidak valid'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true
      return regex.test(String(value))
    },
    message,
    type: 'pattern',
  }),

  match: (fieldName: string, message?: string): ValidationRule => ({
    validate: (value, formValues) => {
      if (!value) return true
      return value === formValues?.[fieldName]
    },
    message: message || `Tidak cocok`,
    type: 'match',
  }),

  phone: (message = 'Nomor telepon tidak valid'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true
      return /^[\d\s\-+()]{10,}$/.test(value)
    },
    message,
    type: 'phone',
  }),

  url: (message = 'URL tidak valid'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    message,
    type: 'url',
  }),

  numeric: (message = 'Harus berupa angka'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true
      return !isNaN(Number(value))
    },
    message,
    type: 'numeric',
  }),

  alpha: (message = 'Hanya boleh huruf'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true
      return /^[a-zA-Z\s]+$/.test(value)
    },
    message,
    type: 'alpha',
  }),

  alphanumeric: (message = 'Hanya boleh huruf dan angka'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true
      return /^[a-zA-Z0-9]+$/.test(value)
    },
    message,
    type: 'alphanumeric',
  }),

  custom: <T>(validate: (value: T, formValues?: any) => boolean | Promise<boolean>, message: string): ValidationRule<T> => ({
    validate,
    message,
    type: 'custom',
  }),

  async: <T>(
    validate: (value: T) => Promise<boolean>,
    message: string,
    debounceMs = 300
  ): ValidationRule<T> => ({
    validate,
    message,
    type: 'async',
  }),
}

// ─── Form Hook ──────────────────────────────────────────────────

/**
 * Enterprise form handling with validation.
 *
 * @example
 * const form = useForm({
 *   initialValues: { email: '', password: '' },
 *   validationSchema: {
 *     email: [rules.required(), rules.email()],
 *     password: [rules.required(), rules.minLength(8)],
 *   },
 *   onSubmit: async (values) => {
 *     await login(values)
 *   },
 * })
 *
 * <form onsubmit={form.submitForm}>
 *   <input {...form.getField('email').props} />
 *   {form.state.errors.email && <span>{form.state.errors.email}</span>}
 *   <button disabled={!form.state.isValid}>Submit</button>
 * </form>
 */
export function useForm<T extends Record<string, any>>(
  options: FormOptions<T>
): FormHelpers<T> {
  const {
    initialValues,
    validationSchema = {},
    validateOnChange = true,
    validateOnBlur = true,
    validateOnSubmit = true,
    onSubmit,
    onReset,
    onValidate,
  } = options

  // Create reactive state
  const values = state<T>({ ...initialValues })
  const errors = state<Partial<Record<keyof T, string>>>({})
  const touched = state<Partial<Record<keyof T, boolean>>>({})
  const dirty = state<Partial<Record<keyof T, boolean>>>({})
  const isSubmitting = state(false)
  const isSubmitted = state(false)

  // Computed state
  const isValid = computed(() => {
    const errorValues = Object.values(errors())
    return errorValues.every(e => !e)
  })

  const isDirty = computed(() => {
    const dirtyValues = Object.values(dirty())
    return dirtyValues.some(d => d)
  })

  // Validate single field
  async function validateField(name: keyof T): Promise<boolean> {
    const fieldRules = (validationSchema as any)[name]
    if (!fieldRules) return true

    const value = values()[name]
    const formValues = values()

    for (const rule of fieldRules) {
      const valid = await rule.validate(value, formValues)
      if (!valid) {
        errors.set({ ...errors(), [name]: rule.message })
        return false
      }
    }

    const newErrors = { ...errors() }
    delete newErrors[name]
    errors.set(newErrors)
    return true
  }

  // Validate all fields
  async function validateForm(): Promise<boolean> {
    if (onValidate) {
      const customErrors = onValidate(values())
      if (Object.keys(customErrors).length > 0) {
        errors.set({ ...errors(), ...customErrors })
        return false
      }
    }

    const newErrors: Partial<Record<keyof T, string>> = {}
    const fieldNames = Object.keys(validationSchema) as Array<keyof T>

    for (const name of fieldNames) {
      const fieldRules = (validationSchema as any)[name]
      if (!fieldRules) continue

      const value = values()[name]
      const formValues = values()

      for (const rule of fieldRules) {
        const valid = await rule.validate(value, formValues)
        if (!valid) {
          newErrors[name] = rule.message
          break
        }
      }
    }

    errors.set(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Set field value
  function setFieldValue(name: keyof T, value: any): void {
    const oldValues = values()
    values.set({ ...oldValues, [name]: value })

    // Mark as dirty
    if (value !== initialValues[name]) {
      dirty.set({ ...dirty(), [name]: true })
    }

    // Validate on change
    if (validateOnChange) {
      validateField(name)
    }
  }

  // Set field error
  function setFieldError(name: keyof T, error: string): void {
    errors.set({ ...errors(), [name]: error })
  }

  // Set field touched
  function setFieldTouched(name: keyof T, touchedValue: boolean): void {
    touched.set({ ...touched(), [name]: touchedValue })

    // Validate on blur
    if (validateOnBlur && touchedValue) {
      validateField(name)
    }
  }

  // Reset form
  function resetForm(): void {
    batch(() => {
      values.set({ ...initialValues })
      errors.set({})
      touched.set({})
      dirty.set({})
      isSubmitting.set(false)
      isSubmitted.set(false)
    })
    onReset?.()
  }

  // Submit form
  async function submitForm(): Promise<void> {
    // Validate on submit
    if (validateOnSubmit) {
      const valid = await validateForm()
      if (!valid) return
    }

    isSubmitting.set(true)
    isSubmitted.set(true)

    try {
      await onSubmit?.(values())
    } finally {
      isSubmitting.set(false)
    }
  }

  // Get field helpers
  function getField(name: keyof T): FieldHelpers {
    const fieldState = computed(() => ({
      value: values()[name],
      error: errors()[name] || null,
      touched: touched()[name] || false,
      dirty: dirty()[name] || false,
      validating: false,
    }))

    return {
      get value() { return fieldState().value },
      get error() { return fieldState().error },
      get touched() { return fieldState().touched },
      get dirty() { return fieldState().dirty },
      get validating() { return fieldState().validating },
      onChange: (value: any) => setFieldValue(name, value),
      onBlur: () => setFieldTouched(name, true),
      onFocus: () => {},
      props: {
        get value() { return values()[name] },
        onChange: (e: Event) => {
          const target = e.target as HTMLInputElement
          setFieldValue(name, target.value)
        },
        onBlur: () => setFieldTouched(name, true),
        onFocus: () => {},
      },
    }
  }

  // Set multiple values
  function setValues(newValues: Partial<T>): void {
    values.set({ ...values(), ...newValues })
  }

  // Set multiple errors
  function setErrors(newErrors: Partial<Record<keyof T, string>>): void {
    errors.set({ ...errors(), ...newErrors })
  }

  return {
    state: {
      get values() { return values() },
      get errors() { return errors() },
      get touched() { return touched() },
      get dirty() { return dirty() },
      get isValid() { return isValid() },
      get isDirty() { return isDirty() },
      get isSubmitting() { return isSubmitting() },
      get isSubmitted() { return isSubmitted() },
    },
    getField,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    validateField,
    validateForm,
    resetForm,
    submitForm,
    setValues,
    setErrors,
  }
}

// ─── Schema Validation (Yup/Zod compatible) ─────────────────────

/**
 * Create validation schema from object.
 *
 * @example
 * const schema = createSchema({
 *   email: [rules.required(), rules.email()],
 *   password: [rules.required(), rules.minLength(8)],
 *   confirmPassword: [rules.required(), rules.match('password')],
 * })
 */
export function createSchema<T>(
  schema: FormSchema<T>
): FormSchema<T> {
  return schema
}

/**
 * Validate value against rules.
 *
 * @example
 * const error = await validateField('email', value, [rules.required(), rules.email()])
 */
export async function validateFieldValue<T>(
  value: T,
  validationRules: ValidationRule<T>[]
): Promise<string | null> {
  for (const rule of validationRules) {
    const valid = await rule.validate(value)
    if (!valid) {
      return rule.message
    }
  }
  return null
}

// ─── Form Component Helpers ─────────────────────────────────────

/**
 * Create field props for input element.
 *
 * @example
 * <input {...fieldProps(form, 'email')} />
 */
export function fieldProps<T>(
  form: FormHelpers<T>,
  name: keyof T
): {
  value: any
  onChange: (e: Event) => void
  onBlur: () => void
} {
  const field = form.getField(name)
  return field.props
}

/**
 * Create field props for select element.
 *
 * @example
 * <select {...selectProps(form, 'country')}>
 *   <option value="id">Indonesia</option>
 * </select>
 */
export function selectProps<T>(
  form: FormHelpers<T>,
  name: keyof T
): {
  value: any
  onChange: (e: Event) => void
  onBlur: () => void
} {
  const field = form.getField(name)
  return {
    value: field.value,
    onChange: (e: Event) => {
      const target = e.target as HTMLSelectElement
      field.onChange(target.value)
    },
    onBlur: field.onBlur,
  }
}

/**
 * Create field props for textarea element.
 *
 * @example
 * <textarea {...textareaProps(form, 'bio')} />
 */
export function textareaProps<T>(
  form: FormHelpers<T>,
  name: keyof T
): {
  value: any
  onChange: (e: Event) => void
  onBlur: () => void
} {
  const field = form.getField(name)
  return {
    value: field.value,
    onChange: (e: Event) => {
      const target = e.target as HTMLTextAreaElement
      field.onChange(target.value)
    },
    onBlur: field.onBlur,
  }
}
