// Flint Runtime — Forms & Validation
// Form state management, validation, and field bindings

import { state, computed, batch } from '@flint/reactivity'
import type { Signal, Computed } from '@flint/reactivity'

// ─── Types ──────────────────────────────────────────────────────

export type Validator<T = any> = (value: T, allValues?: any) => string | null | Promise<string | null>
export type Validators<T> = { [K in keyof T]?: Validator<T[K]> | Validator<T[K]>[] }
export type FormErrors<T> = { [K in keyof T]?: string | null }
export type FormTouched<T> = { [K in keyof T]?: boolean }
export type FormDirty<T> = { [K in keyof T]?: boolean }

export interface FieldState {
  value: Computed<any>
  error: Computed<string | null>
  touched: Computed<boolean>
  dirty: Computed<boolean>
  validating: Signal<boolean>
}

export interface FormState<T> {
  values: Signal<T>
  errors: Signal<FormErrors<T>>
  touched: Signal<FormTouched<T>>
  dirty: Signal<FormDirty<T>>
  isValid: Computed<boolean>
  isDirty: Computed<boolean>
  isTouched: Computed<boolean>
  isSubmitting: Signal<boolean>
}

export interface FieldBinding {
  value: any
  onChange: (e: Event) => void
  onBlur: () => void
  name: string
}

export interface FormOptions<T> {
  initialValues: T
  validators?: Validators<T>
  onSubmit: (values: T) => void | Promise<void>
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

export interface FormHelpers<T> {
  state: FormState<T>
  field: (name: keyof T) => FieldBinding
  setValue: (name: keyof T, value: any) => void
  setValues: (values: Partial<T>) => void
  getValue: (name: keyof T) => any
  setError: (name: keyof T, error: string | null) => void
  validate: () => Promise<boolean>
  validateField: (name: keyof T) => Promise<string | null>
  reset: () => void
  submit: () => Promise<void>
  getFieldState: (name: keyof T) => FieldState
}

// ─── Built-in Validators ────────────────────────────────────────

export const validators = {
  required(message?: string): Validator {
    return (value) => {
      if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
        return message ?? 'This field is required'
      }
      return null
    }
  },

  email(message?: string): Validator<string> {
    return (value) => {
      if (!value) return null
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return message ?? 'Invalid email address'
      }
      return null
    }
  },

  minLength(min: number, message?: string): Validator<string> {
    return (value) => {
      if (!value) return null
      if (value.length < min) {
        return message ?? `Must be at least ${min} characters`
      }
      return null
    }
  },

  maxLength(max: number, message?: string): Validator<string> {
    return (value) => {
      if (!value) return null
      if (value.length > max) {
        return message ?? `Must be at most ${max} characters`
      }
      return null
    }
  },

  min(min: number, message?: string): Validator<number> {
    return (value) => {
      if (value == null) return null
      if (value < min) {
        return message ?? `Must be at least ${min}`
      }
      return null
    }
  },

  max(max: number, message?: string): Validator<number> {
    return (value) => {
      if (value == null) return null
      if (value > max) {
        return message ?? `Must be at most ${max}`
      }
      return null
    }
  },

  pattern(regex: RegExp, message?: string): Validator<string> {
    return (value) => {
      if (!value) return null
      if (!regex.test(value)) {
        return message ?? 'Invalid format'
      }
      return null
    }
  },

  custom<T>(fn: (value: T) => boolean, message?: string): Validator<T> {
    return (value) => {
      if (!fn(value)) {
        return message ?? 'Validation failed'
      }
      return null
    }
  },

  matches(fieldName: string, message?: string): Validator {
    return (value, allValues) => {
      if (allValues && value !== allValues[fieldName]) {
        return message ?? `Must match ${fieldName}`
      }
      return null
    }
  },

  url(message?: string): Validator<string> {
    return (value) => {
      if (!value) return null
      try {
        new URL(value)
        return null
      } catch {
        return message ?? 'Invalid URL'
      }
    }
  },

  phone(message?: string): Validator<string> {
    return (value) => {
      if (!value) return null
      const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
      if (!phoneRegex.test(value)) {
        return message ?? 'Invalid phone number'
      }
      return null
    }
  },
}

// ─── createForm ─────────────────────────────────────────────────

export function createForm<T extends Record<string, any>>(
  options: FormOptions<T>
): FormHelpers<T> {
  const {
    initialValues,
    validators: fieldValidators = {},
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true,
  } = options

  const values = state<T>({ ...initialValues })
  const errors = state<FormErrors<T>>({})
  const touched = state<FormTouched<T>>({})
  const dirty = state<FormDirty<T>>({})
  const isSubmitting = state(false)

  const isValid = computed(() => {
    const errs = errors()
    return Object.values(errs).every((err) => err == null)
  })

  const isDirty = computed(() => {
    const d = dirty()
    return Object.values(d).some((v) => v === true)
  })

  const isTouched = computed(() => {
    const t = touched()
    return Object.values(t).some((v) => v === true)
  })

  const validateField = async (name: keyof T): Promise<string | null> => {
    const validator = (fieldValidators as Record<string, any>)[name as string]
    if (!validator) return null

    const value = values()[name]
    const allValues = values()

    let error: string | null = null
    if (Array.isArray(validator)) {
      for (const v of validator) {
        error = await v(value, allValues)
        if (error) break
      }
    } else {
      error = await validator(value, allValues)
    }

    errors.set({ ...errors(), [name]: error })
    return error
  }

  const validate = async (): Promise<boolean> => {
    const newErrors: FormErrors<T> = {}
    let valid = true

    for (const key of Object.keys(fieldValidators) as (keyof T)[]) {
      const error = await validateField(key)
      newErrors[key] = error
      if (error) valid = false
    }

    errors.set(newErrors)
    return valid
  }

  const fieldStates = new Map<keyof T, FieldState>()

  const getFieldState = (name: keyof T): FieldState => {
    if (!fieldStates.has(name)) {
      fieldStates.set(name, {
        value: computed(() => values()[name]),
        error: computed(() => errors()[name] ?? null),
        touched: computed(() => touched()[name] ?? false),
        dirty: computed(() => dirty()[name] ?? false),
        validating: state(false),
      })
    }
    return fieldStates.get(name)!
  }

  const field = (name: keyof T): FieldBinding => {
    const fieldState = getFieldState(name)

    return {
      get value() {
        return fieldState.value()
      },
      onChange: async (e: Event) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        let newValue: any = target.value

        if (target.type === 'checkbox') {
          newValue = (target as HTMLInputElement).checked
        } else if (target.type === 'number') {
          newValue = target.value === '' ? '' : Number(target.value)
        }

        values.set({ ...values(), [name]: newValue })
        dirty.set({ ...dirty(), [name]: true })

        if (validateOnChange) {
          await validateField(name)
        }
      },
      onBlur: async () => {
        touched.set({ ...touched(), [name]: true })

        if (validateOnBlur) {
          await validateField(name)
        }
      },
      name: String(name),
    }
  }

  const setValue = (name: keyof T, value: any) => {
    values.set({ ...values(), [name]: value })
    dirty.set({ ...dirty(), [name]: true })

    if (validateOnChange) {
      validateField(name)
    }
  }

  const setValues = (newValues: Partial<T>) => {
    values.set({ ...values(), ...newValues })
    for (const key of Object.keys(newValues) as (keyof T)[]) {
      dirty.set({ ...dirty(), [key]: true })
    }

    if (validateOnChange) {
      validate()
    }
  }

  const getValue = (name: keyof T) => {
    return values()[name]
  }

  const setError = (name: keyof T, error: string | null) => {
    errors.set({ ...errors(), [name]: error })
  }

  const reset = () => {
    values.set({ ...initialValues })
    errors.set({})
    touched.set({})
    dirty.set({})
    isSubmitting.set(false)
  }

  const submit = async () => {
    const allTouched: FormTouched<T> = {}
    for (const key of Object.keys(values()) as (keyof T)[]) {
      allTouched[key] = true
    }
    touched.set(allTouched)

    const valid = await validate()
    if (!valid) return

    isSubmitting.set(true)
    try {
      await onSubmit(values())
    } finally {
      isSubmitting.set(false)
    }
  }

  return {
    state: {
      values,
      errors,
      touched,
      dirty,
      isValid,
      isDirty,
      isTouched,
      isSubmitting,
    },
    field,
    setValue,
    setValues,
    getValue,
    setError,
    validate,
    validateField,
    reset,
    submit,
    getFieldState,
  }
}
