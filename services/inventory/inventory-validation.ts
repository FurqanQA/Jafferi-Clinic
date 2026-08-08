/**
 * Inventory Validation
 * Validation functions for inventory module using core infrastructure
 */

import { z } from 'zod';
import { validateData, commonSchemas } from '../core/validation';
import { ValidationError } from '../core/errors';

/**
 * Batch validation schema
 */
export const batchSchema = z.object({
  clinicId: commonSchemas.uuid.optional(),
  itemId: commonSchemas.uuid,
  batchNumber: z.string().min(1, 'Batch number is required'),
  manufacturingDate: z.string().datetime('Invalid manufacturing date'),
  expiryDate: z.string().datetime('Invalid expiry date'),
  quantity: commonSchemas.positiveNumber,
  remainingQuantity: commonSchemas.nonNegativeNumber,
  isActive: z.boolean().optional().default(true),
});

/**
 * Brand validation schema
 */
export const brandSchema = z.object({
  clinicId: commonSchemas.uuid.optional(),
  name: z.string().min(1, 'Brand name is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  country: z.string().min(1, 'Country is required'),
  website: commonSchemas.url.optional(),
  logo: commonSchemas.url.optional(),
  isActive: z.boolean().optional().default(true),
});

/**
 * Supplier validation schema
 */
export const supplierSchema = z.object({
  clinicId: commonSchemas.uuid.optional(),
  name: z.string().min(1, 'Supplier name is required'),
  contact: z.string().min(1, 'Contact is required'),
  email: commonSchemas.email.optional(),
  phone: commonSchemas.phone.optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

/**
 * Warehouse validation schema
 */
export const warehouseSchema = z.object({
  clinicId: commonSchemas.uuid.optional(),
  name: z.string().min(1, 'Warehouse name is required'),
  location: z.string().min(1, 'Location is required'),
  type: z.enum(['MAIN', 'BRANCH', 'PHARMACY', 'STORAGE']),
  isActive: z.boolean().optional().default(true),
});

/**
 * Validate batch data
 */
export function validateBatch(data: unknown) {
  return validateData(batchSchema, data);
}

/**
 * Validate brand data
 */
export function validateBrand(data: unknown) {
  return validateData(brandSchema, data);
}

/**
 * Validate supplier data
 */
export function validateSupplier(data: unknown) {
  return validateData(supplierSchema, data);
}

/**
 * Validate warehouse data
 */
export function validateWarehouse(data: unknown) {
  return validateData(warehouseSchema, data);
}
