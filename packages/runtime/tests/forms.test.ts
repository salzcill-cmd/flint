/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createForm, validators } from '../src/forms/index.js'

describe('validators', () => {
  describe('required', () => {
    it('returns error for empty value', async () => {
      const validate = validators.required()
      expect(validate('')).toBe('This field is required')
      expect(validate(null)).toBe('This field is required')
      expect(validate(undefined)).toBe('This field is required')
    })

    it('returns null for valid value', async () => {
      const validate = validators.required()
      expect(validate('hello')).toBeNull()
      expect(validate(0)).toBeNull()
      expect(validate(false)).toBeNull()
    })

    it('uses custom message', async () => {
      const validate = validators.required('Name is required')
      expect(validate('')).toBe('Name is required')
    })
  })

  describe('email', () => {
    it('returns error for invalid email', async () => {
      const validate = validators.email()
      expect(validate('invalid')).toBe('Invalid email address')
      expect(validate('test@')).toBe('Invalid email address')
    })

    it('returns null for valid email', async () => {
      const validate = validators.email()
      expect(validate('test@example.com')).toBeNull()
    })

    it('returns null for empty value', async () => {
      const validate = validators.email()
      expect(validate('')).toBeNull()
    })
  })

  describe('minLength', () => {
    it('returns error for short string', async () => {
      const validate = validators.minLength(3)
      expect(validate('ab')).toBe('Must be at least 3 characters')
    })

    it('returns null for valid string', async () => {
      const validate = validators.minLength(3)
      expect(validate('abc')).toBeNull()
    })
  })

  describe('maxLength', () => {
    it('returns error for long string', async () => {
      const validate = validators.maxLength(5)
      expect(validate('abcdef')).toBe('Must be at most 5 characters')
    })

    it('returns null for valid string', async () => {
      const validate = validators.maxLength(5)
      expect(validate('abc')).toBeNull()
    })
  })

  describe('min', () => {
    it('returns error for small number', async () => {
      const validate = validators.min(5)
      expect(validate(3)).toBe('Must be at least 5')
    })

    it('returns null for valid number', async () => {
      const validate = validators.min(5)
      expect(validate(5)).toBeNull()
      expect(validate(10)).toBeNull()
    })
  })

  describe('max', () => {
    it('returns error for large number', async () => {
      const validate = validators.max(10)
      expect(validate(15)).toBe('Must be at most 10')
    })

    it('returns null for valid number', async () => {
      const validate = validators.max(10)
      expect(validate(10)).toBeNull()
      expect(validate(5)).toBeNull()
    })
  })

  describe('pattern', () => {
    it('returns error for non-matching pattern', async () => {
      const validate = validators.pattern(/^\d+$/)
      expect(validate('abc')).toBe('Invalid format')
    })

    it('returns null for matching pattern', async () => {
      const validate = validators.pattern(/^\d+$/)
      expect(validate('123')).toBeNull()
    })
  })

  describe('custom', () => {
    it('returns error when custom validation fails', async () => {
      const validate = validators.custom(
        (value: number) => value % 2 === 0,
        'Must be even'
      )
      expect(validate(3)).toBe('Must be even')
    })

    it('returns null when custom validation passes', async () => {
      const validate = validators.custom(
        (value: number) => value % 2 === 0,
        'Must be even'
      )
      expect(validate(4)).toBeNull()
    })
  })

  describe('url', () => {
    it('returns error for invalid URL', async () => {
      const validate = validators.url()
      expect(validate('not-a-url')).toBe('Invalid URL')
    })

    it('returns null for valid URL', async () => {
      const validate = validators.url()
      expect(validate('https://example.com')).toBeNull()
    })
  })
})

describe('createForm', () => {
  it('creates a form with initial values', () => {
    const form = createForm({
      initialValues: { name: '', email: '' },
      onSubmit: vi.fn(),
    })

    expect(form.state.values().name).toBe('')
    expect(form.state.values().email).toBe('')
  })

  it('isValid starts as true', () => {
    const form = createForm({
      initialValues: { name: 'test' },
      onSubmit: vi.fn(),
    })

    expect(form.state.isValid()).toBe(true)
  })

  it('isDirty starts as false', () => {
    const form = createForm({
      initialValues: { name: 'test' },
      onSubmit: vi.fn(),
    })

    expect(form.state.isDirty()).toBe(false)
  })

  it('setValue updates field value', () => {
    const form = createForm({
      initialValues: { name: '' },
      onSubmit: vi.fn(),
    })

    form.setValue('name', 'John')
    expect(form.state.values().name).toBe('John')
  })

  it('getValue returns field value', () => {
    const form = createForm({
      initialValues: { name: 'John' },
      onSubmit: vi.fn(),
    })

    expect(form.getValue('name')).toBe('John')
  })

  it('reset resets form to initial values', () => {
    const form = createForm({
      initialValues: { name: '', email: '' },
      onSubmit: vi.fn(),
    })

    form.setValue('name', 'John')
    form.setValue('email', 'john@example.com')
    form.reset()

    expect(form.state.values().name).toBe('')
    expect(form.state.values().email).toBe('')
    expect(form.state.isDirty()).toBe(false)
  })

  it('validateField validates single field', async () => {
    const form = createForm({
      initialValues: { name: '' },
      validators: {
        name: validators.required(),
      },
      onSubmit: vi.fn(),
    })

    const error = await form.validateField('name')
    expect(error).toBe('This field is required')
  })

  it('validate validates all fields', async () => {
    const form = createForm({
      initialValues: { name: '', email: '' },
      validators: {
        name: validators.required(),
        email: validators.required(),
      },
      onSubmit: vi.fn(),
    })

    const isValid = await form.validate()
    expect(isValid).toBe(false)
    expect(form.state.errors().name).toBe('This field is required')
    expect(form.state.errors().email).toBe('This field is required')
  })

  it('submit calls onSubmit when valid', async () => {
    const onSubmit = vi.fn()
    const form = createForm({
      initialValues: { name: 'John' },
      validators: {
        name: validators.required(),
      },
      onSubmit,
    })

    await form.submit()
    expect(onSubmit).toHaveBeenCalledWith({ name: 'John' })
  })

  it('submit does not call onSubmit when invalid', async () => {
    const onSubmit = vi.fn()
    const form = createForm({
      initialValues: { name: '' },
      validators: {
        name: validators.required(),
      },
      onSubmit,
    })

    await form.submit()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('field returns binding object', () => {
    const form = createForm({
      initialValues: { name: '' },
      onSubmit: vi.fn(),
    })

    const binding = form.field('name')
    expect(binding.name).toBe('name')
    expect(typeof binding.onChange).toBe('function')
    expect(typeof binding.onBlur).toBe('function')
  })

  it('field onChange updates value', () => {
    const form = createForm({
      initialValues: { name: '' },
      onSubmit: vi.fn(),
    })

    const binding = form.field('name')
    binding.onChange({ target: { value: 'John' } } as any)

    expect(form.state.values().name).toBe('John')
  })

  it('field onBlur marks field as touched', () => {
    const form = createForm({
      initialValues: { name: '' },
      onSubmit: vi.fn(),
    })

    const binding = form.field('name')
    binding.onBlur()

    expect(form.state.touched().name).toBe(true)
  })

  it('supports multiple validators', async () => {
    const form = createForm({
      initialValues: { email: '' },
      validators: {
        email: [validators.required(), validators.email()],
      },
      onSubmit: vi.fn(),
    })

    await form.validateField('email')
    expect(form.state.errors().email).toBe('This field is required')

    form.setValue('email', 'invalid')
    await form.validateField('email')
    expect(form.state.errors().email).toBe('Invalid email address')

    form.setValue('email', 'test@example.com')
    await form.validateField('email')
    expect(form.state.errors().email).toBeNull()
  })
})
