import { z } from 'zod';
import { validateData } from '../core/validation';
import { PatientGender, BloodGroup, CreatePatientInput, UpdatePatientInput } from './patient-types';

/**
 * Zod schema for creating a patient
 */
export const createPatientSchema = z.object({
  first_name: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  last_name: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  date_of_birth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
    .refine(date => {
      const dob = new Date(date);
      const now = new Date();
      const minAge = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
      const maxAge = new Date(now.getFullYear() - 0, now.getMonth(), now.getDate());
      return dob <= maxAge && dob >= minAge;
    }, 'Date of birth must be a valid date between 0 and 120 years ago'),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Gender must be male, female, or other' }),
  }),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must not exceed 20 characters')
    .regex(/^\+?[\d\s-()]+$/, 'Phone number can only contain digits, spaces, hyphens, parentheses, and optional + prefix'),
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must not exceed 100 characters')
    .optional()
    .or(z.literal('')),
  address: z.string().max(200, 'Address must not exceed 200 characters').optional(),
  city: z.string().max(100, 'City must not exceed 100 characters').optional(),
  state: z.string().max(100, 'State must not exceed 100 characters').optional(),
  postal_code: z.string().max(20, 'Postal code must not exceed 20 characters').optional(),
  country: z.string().max(100, 'Country must not exceed 100 characters').optional(),
  national_id: z.string()
    .min(5, 'National ID must be at least 5 characters')
    .max(50, 'National ID must not exceed 50 characters')
    .optional(),
  insurance_provider: z.string().max(100, 'Insurance provider must not exceed 100 characters').optional(),
  insurance_number: z.string().max(50, 'Insurance number must not exceed 50 characters').optional(),
  emergency_contact_name: z.string()
    .min(2, 'Emergency contact name must be at least 2 characters')
    .max(100, 'Emergency contact name must not exceed 100 characters')
    .optional(),
  emergency_contact_phone: z.string()
    .min(10, 'Emergency contact phone must be at least 10 characters')
    .max(20, 'Emergency contact phone must not exceed 20 characters')
    .regex(/^\+?[\d\s-()]+$/, 'Emergency contact phone can only contain digits, spaces, hyphens, parentheses, and optional + prefix')
    .optional(),
  emergency_contact_relationship: z.string().max(50, 'Emergency contact relationship must not exceed 50 characters').optional(),
  allergies: z.array(z.string().max(100, 'Allergy must not exceed 100 characters')).optional(),
  chronic_conditions: z.array(z.string().max(100, 'Condition must not exceed 100 characters')).optional(),
  medications: z.array(z.string().max(100, 'Medication must not exceed 100 characters')).optional(),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
}).refine(data => {
  // If emergency contact phone is provided, emergency contact name must also be provided
  if (data.emergency_contact_phone && !data.emergency_contact_name) {
    return false;
  }
  return true;
}, {
  message: 'Emergency contact name is required when emergency contact phone is provided',
}).refine(data => {
  // If emergency contact name is provided, emergency contact phone must also be provided
  if (data.emergency_contact_name && !data.emergency_contact_phone) {
    return false;
  }
  return true;
}, {
  message: 'Emergency contact phone is required when emergency contact name is provided',
});

/**
 * Zod schema for updating a patient
 */
export const updatePatientSchema = z.object({
  first_name: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  last_name: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  date_of_birth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
    .refine(date => {
      const dob = new Date(date);
      const now = new Date();
      const minAge = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
      const maxAge = new Date(now.getFullYear() - 0, now.getMonth(), now.getDate());
      return dob <= maxAge && dob >= minAge;
    }, 'Date of birth must be a valid date between 0 and 120 years ago')
    .optional(),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Gender must be male, female, or other' }),
  }).optional(),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must not exceed 20 characters')
    .regex(/^\+?[\d\s-()]+$/, 'Phone number can only contain digits, spaces, hyphens, parentheses, and optional + prefix')
    .optional(),
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must not exceed 100 characters')
    .optional()
    .or(z.literal(''))
    .optional(),
  address: z.string().max(200, 'Address must not exceed 200 characters').optional(),
  city: z.string().max(100, 'City must not exceed 100 characters').optional(),
  state: z.string().max(100, 'State must not exceed 100 characters').optional(),
  postal_code: z.string().max(20, 'Postal code must not exceed 20 characters').optional(),
  country: z.string().max(100, 'Country must not exceed 100 characters').optional(),
  national_id: z.string()
    .min(5, 'National ID must be at least 5 characters')
    .max(50, 'National ID must not exceed 50 characters')
    .optional(),
  insurance_provider: z.string().max(100, 'Insurance provider must not exceed 100 characters').optional(),
  insurance_number: z.string().max(50, 'Insurance number must not exceed 50 characters').optional(),
  emergency_contact_name: z.string()
    .min(2, 'Emergency contact name must be at least 2 characters')
    .max(100, 'Emergency contact name must not exceed 100 characters')
    .optional(),
  emergency_contact_phone: z.string()
    .min(10, 'Emergency contact phone must be at least 10 characters')
    .max(20, 'Emergency contact phone must not exceed 20 characters')
    .regex(/^\+?[\d\s-()]+$/, 'Emergency contact phone can only contain digits, spaces, hyphens, parentheses, and optional + prefix')
    .optional(),
  emergency_contact_relationship: z.string().max(50, 'Emergency contact relationship must not exceed 50 characters').optional(),
  allergies: z.array(z.string().max(100, 'Allergy must not exceed 100 characters')).optional(),
  chronic_conditions: z.array(z.string().max(100, 'Condition must not exceed 100 characters')).optional(),
  medications: z.array(z.string().max(100, 'Medication must not exceed 100 characters')).optional(),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional(),
}).refine(data => {
  // If emergency contact phone is provided, emergency contact name must also be provided
  if (data.emergency_contact_phone && !data.emergency_contact_name) {
    return false;
  }
  return true;
}, {
  message: 'Emergency contact name is required when emergency contact phone is provided',
}).refine(data => {
  // If emergency contact name is provided, emergency contact phone must also be provided
  if (data.emergency_contact_name && !data.emergency_contact_phone) {
    return false;
  }
  return true;
}, {
  message: 'Emergency contact phone is required when emergency contact name is provided',
});

/**
 * Validate create patient input
 */
export function validateCreatePatient(data: unknown): CreatePatientInput {
  return validateData(createPatientSchema, data);
}

/**
 * Validate update patient input
 */
export function validateUpdatePatient(data: unknown): UpdatePatientInput {
  return validateData(updatePatientSchema, data);
}

/**
 * Validate patient ID
 */
export function validatePatientId(id: string): string {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid patient ID');
  }
  return id;
}
