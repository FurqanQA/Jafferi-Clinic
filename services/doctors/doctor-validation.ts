import { z } from 'zod';
import { validateData } from '../core/validation';
import { DoctorGender, DoctorStatus, DoctorAvailability, CreateDoctorInput, UpdateDoctorInput } from './doctor-types';

/**
 * Zod schema for creating a doctor
 */
export const createDoctorSchema = z.object({
  first_name: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  last_name: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must not exceed 100 characters'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must not exceed 20 characters')
    .regex(/^\+?[\d\s-()]+$/, 'Phone number can only contain digits, spaces, hyphens, parentheses, and optional + prefix'),
  license_number: z.string()
    .min(5, 'License number must be at least 5 characters')
    .max(50, 'License number must not exceed 50 characters'),
  specialization: z.string()
    .min(2, 'Specialization must be at least 2 characters')
    .max(100, 'Specialization must not exceed 100 characters'),
  department: z.string().max(100, 'Department must not exceed 100 characters').optional(),
  qualification: z.string().max(100, 'Qualification must not exceed 100 characters').optional(),
  experience_years: z.number()
    .int('Experience years must be an integer')
    .min(0, 'Experience years must be at least 0')
    .max(70, 'Experience years must not exceed 70')
    .optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  date_of_birth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
    .refine(date => {
      const dob = new Date(date);
      const now = new Date();
      const minAge = new Date(now.getFullYear() - 80, now.getMonth(), now.getDate());
      const maxAge = new Date(now.getFullYear() - 21, now.getMonth(), now.getDate());
      return dob <= maxAge && dob >= minAge;
    }, 'Date of birth must be a valid date between 21 and 80 years ago')
    .optional(),
  consultation_fee: z.number()
    .min(0, 'Consultation fee must be at least 0')
    .max(10000, 'Consultation fee must not exceed 10000')
    .optional(),
  biography: z.string().max(2000, 'Biography must not exceed 2000 characters').optional(),
  languages_spoken: z.array(z.string().max(50, 'Language must not exceed 50 characters')).optional(),
  working_hours: z.object({
    monday: z.string().max(20, 'Working hours format invalid').optional(),
    tuesday: z.string().max(20, 'Working hours format invalid').optional(),
    wednesday: z.string().max(20, 'Working hours format invalid').optional(),
    thursday: z.string().max(20, 'Working hours format invalid').optional(),
    friday: z.string().max(20, 'Working hours format invalid').optional(),
    saturday: z.string().max(20, 'Working hours format invalid').optional(),
    sunday: z.string().max(20, 'Working hours format invalid').optional(),
  }).optional(),
}).refine(data => {
  // If experience_years is provided, validate it's reasonable
  if (data.experience_years !== undefined && data.date_of_birth) {
    const dob = new Date(data.date_of_birth);
    const now = new Date();
    const age = now.getFullYear() - dob.getFullYear();
    if (data.experience_years >= age - 18) {
      return false;
    }
  }
  return true;
}, {
  message: 'Experience years must be less than age minus 18 years',
});

/**
 * Zod schema for updating a doctor
 */
export const updateDoctorSchema = z.object({
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
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must not exceed 100 characters')
    .optional(),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must not exceed 20 characters')
    .regex(/^\+?[\d\s-()]+$/, 'Phone number can only contain digits, spaces, hyphens, parentheses, and optional + prefix')
    .optional(),
  license_number: z.string()
    .min(5, 'License number must be at least 5 characters')
    .max(50, 'License number must not exceed 50 characters')
    .optional(),
  specialization: z.string()
    .min(2, 'Specialization must be at least 2 characters')
    .max(100, 'Specialization must not exceed 100 characters')
    .optional(),
  department: z.string().max(100, 'Department must not exceed 100 characters').optional(),
  qualification: z.string().max(100, 'Qualification must not exceed 100 characters').optional(),
  experience_years: z.number()
    .int('Experience years must be an integer')
    .min(0, 'Experience years must be at least 0')
    .max(70, 'Experience years must not exceed 70')
    .optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  date_of_birth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
    .refine(date => {
      const dob = new Date(date);
      const now = new Date();
      const minAge = new Date(now.getFullYear() - 80, now.getMonth(), now.getDate());
      const maxAge = new Date(now.getFullYear() - 21, now.getMonth(), now.getDate());
      return dob <= maxAge && dob >= minAge;
    }, 'Date of birth must be a valid date between 21 and 80 years ago')
    .optional(),
  consultation_fee: z.number()
    .min(0, 'Consultation fee must be at least 0')
    .max(10000, 'Consultation fee must not exceed 10000')
    .optional(),
  biography: z.string().max(2000, 'Biography must not exceed 2000 characters').optional(),
  languages_spoken: z.array(z.string().max(50, 'Language must not exceed 50 characters')).optional(),
  working_hours: z.object({
    monday: z.string().max(20, 'Working hours format invalid').optional(),
    tuesday: z.string().max(20, 'Working hours format invalid').optional(),
    wednesday: z.string().max(20, 'Working hours format invalid').optional(),
    thursday: z.string().max(20, 'Working hours format invalid').optional(),
    friday: z.string().max(20, 'Working hours format invalid').optional(),
    saturday: z.string().max(20, 'Working hours format invalid').optional(),
    sunday: z.string().max(20, 'Working hours format invalid').optional(),
  }).optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional(),
  status: z.enum(['active', 'inactive', 'on_leave', 'suspended']).optional(),
  availability: z.enum(['available', 'busy', 'unavailable', 'on_vacation']).optional(),
}).refine(data => {
  // If experience_years is provided, validate it's reasonable
  if (data.experience_years !== undefined && data.date_of_birth) {
    const dob = new Date(data.date_of_birth);
    const now = new Date();
    const age = now.getFullYear() - dob.getFullYear();
    if (data.experience_years >= age - 18) {
      return false;
    }
  }
  return true;
}, {
  message: 'Experience years must be less than age minus 18 years',
});

/**
 * Validate create doctor input
 */
export function validateCreateDoctor(data: unknown): CreateDoctorInput {
  return validateData(createDoctorSchema, data);
}

/**
 * Validate update doctor input
 */
export function validateUpdateDoctor(data: unknown): UpdateDoctorInput {
  return validateData(updateDoctorSchema, data);
}

/**
 * Validate doctor ID
 */
export function validateDoctorId(id: string): string {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid doctor ID');
  }
  return id;
}
