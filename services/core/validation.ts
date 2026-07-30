import { z } from 'zod';
import { ValidationError } from './errors';

/**
 * Validate data against a Zod schema
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    throw new ValidationError('Validation failed', { errors });
  }
  
  return result.data;
}

/**
 * Create a validation error from Zod error
 */
export function createValidationError(error: z.ZodError): ValidationError {
  const errors = error.flatten().fieldErrors;
  return new ValidationError('Validation failed', { errors });
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  uuid: z.string().uuid('Invalid UUID format'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone format'),
  url: z.string().url('Invalid URL format'),
  
  date: z.string().or(z.date()),
  datetime: z.string().datetime(),
  
  positiveNumber: z.number().positive('Must be a positive number'),
  nonNegativeNumber: z.number().nonnegative('Must be a non-negative number'),
  
  pagination: z.object({
    page: z.number().int().positive().optional().default(1),
    pageSize: z.number().int().positive().max(100).optional().default(20),
  }),
  
  sorting: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
};

/**
 * Validate UUID
 */
export function validateUuid(value: string): string {
  return commonSchemas.uuid.parse(value);
}

/**
 * Validate email
 */
export function validateEmail(value: string): string {
  return commonSchemas.email.parse(value);
}

/**
 * Validate phone number
 */
export function validatePhone(value: string): string {
  return commonSchemas.phone.parse(value);
}
