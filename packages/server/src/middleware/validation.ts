// @flint/server — Validation Middleware
// Request validation with Zod

import { z } from 'zod'

// ─── Types ──────────────────────────────────────────────────────

export interface ValidationSchema {
  body?: z.ZodType<any>
  query?: z.ZodType<any>
  params?: z.ZodType<any>
  headers?: z.ZodType<any>
}

export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface ValidationResult {
  success: boolean
  data?: any
  errors?: ValidationError[]
}

// ─── Validation Middleware ──────────────────────────────────────

export function validate(schema: ValidationSchema) {
  return async (c: any, next: () => Promise<void>) => {
    const errors: ValidationError[] = []

    // Validate body
    if (schema.body) {
      try {
        const body = await c.req.json()
        const result = schema.body.safeParse(body)
        if (!result.success) {
          result.error.issues.forEach((err: any) => {
            errors.push({
              field: `body.${err.path.join('.')}`,
              message: err.message,
              code: err.code,
            })
          })
        } else {
          c.set('validatedBody', result.data)
        }
      } catch (error) {
        errors.push({
          field: 'body',
          message: 'Invalid JSON body',
          code: 'INVALID_JSON',
        })
      }
    }

    // Validate query
    if (schema.query) {
      const query = Object.fromEntries(new URL(c.req.url).searchParams)
      const result = schema.query.safeParse(query)
      if (!result.success) {
        result.error.issues.forEach((err: any) => {
          errors.push({
            field: `query.${err.path.join('.')}`,
            message: err.message,
            code: err.code,
          })
        })
      } else {
        c.set('validatedQuery', result.data)
      }
    }

    // Validate params
    if (schema.params) {
      const params = c.req.param()
      const result = schema.params.safeParse(params)
      if (!result.success) {
        result.error.issues.forEach((err: any) => {
          errors.push({
            field: `params.${err.path.join('.')}`,
            message: err.message,
            code: err.code,
          })
        })
      } else {
        c.set('validatedParams', result.data)
      }
    }

    // Return errors if any
    if (errors.length > 0) {
      return c.json({
        error: 'Validation failed',
        errors,
      }, 400)
    }

    return next()
  }
}

// ─── Schema Helpers ─────────────────────────────────────────────

/** Create a validation schema */
export function createSchema(schema: ValidationSchema): ValidationSchema {
  return schema
}

/** Validate data against a schema */
export function validateData<T>(data: any, schema: z.ZodType<T>): ValidationResult {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    errors: result.error.issues.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    })),
  }
}

// ─── Common Schemas ─────────────────────────────────────────────

/** Email validation */
export const emailSchema = z.string().email('Email tidak valid')

/** Password validation (min 8 chars, 1 uppercase, 1 number) */
export const passwordSchema = z.string()
  .min(8, 'Password minimal 8 karakter')
  .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
  .regex(/[0-9]/, 'Password harus mengandung angka')

/** Phone number validation (Indonesian format) */
export const phoneSchema = z.string()
  .regex(/^(\+62|62|0)8[1-9][0-9]{6,9}$/, 'Nomor telepon tidak valid')

/** URL validation */
export const urlSchema = z.string().url('URL tidak valid')

/** Pagination query schema */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort: z.enum(['asc', 'desc']).default('asc'),
})

/** Search query schema */
export const searchSchema = z.object({
  q: z.string().min(1).max(100),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

// ─── Re-export Zod ──────────────────────────────────────────────

export { z }
