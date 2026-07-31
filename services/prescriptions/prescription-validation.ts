import { z } from 'zod';
import { PrescriptionStatus, PrescriptionPriority, DosageForm, Route, Frequency, VALID_STATUS_TRANSITIONS } from './prescription-types';

/**
 * Zod schema for medicine validation
 */
const medicineSchema = z.object({
  medicine_name: z.string().min(1, 'Medicine name is required'),
  generic_name: z.string().optional(),
  brand_name: z.string().optional(),
  strength: z.string().optional(),
  dosage_form: z.enum(['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'patch', 'suppository', 'powder', 'solution', 'suspension', 'gel', 'spray', 'lozenge']),
  route: z.enum(['oral', 'intravenous', 'intramuscular', 'subcutaneous', 'topical', 'inhalation', 'nasal', 'ophthalmic', 'otic', 'rectal', 'vaginal', 'sublingual', 'buccal', 'transdermal']),
  dose: z.string().min(1, 'Dose is required'),
  frequency: z.enum(['once', 'daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'every_8_hours', 'every_6_hours', 'every_4_hours', 'weekly', 'biweekly', 'monthly', 'as_needed', 'before_meals', 'after_meals', 'with_meals', 'at_bedtime']),
  duration: z.string().min(1, 'Duration is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  instructions: z.string().optional(),
  morning: z.boolean().optional(),
  afternoon: z.boolean().optional(),
  evening: z.boolean().optional(),
  night: z.boolean().optional(),
  before_food: z.boolean().optional(),
  after_food: z.boolean().optional(),
  with_food: z.boolean().optional(),
  as_needed: z.boolean().optional(),
  max_daily_dose: z.string().optional(),
});

/**
 * Zod schema for creating a prescription
 */
export const createPrescriptionSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID'),
  doctor_id: z.string().uuid('Invalid doctor ID'),
  appointment_id: z.string().uuid('Invalid appointment ID'),
  medical_record_id: z.string().uuid('Invalid medical record ID'),
  prescription_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  priority: z.enum(['routine', 'urgent', 'emergency']).optional(),
  medicines: z.array(medicineSchema).min(1, 'At least one medicine is required'),
  notes: z.string().max(2000).optional(),
  instructions: z.string().max(2000).optional(),
  internal_notes: z.string().max(2000).optional(),
  follow_up_required: z.boolean().optional(),
  refill_allowed: z.boolean().optional(),
  refill_count: z.number().int().min(0).optional(),
});

/**
 * Zod schema for updating a prescription
 */
export const updatePrescriptionSchema = z.object({
  prescription_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  priority: z.enum(['routine', 'urgent', 'emergency']).optional(),
  medicines: z.array(medicineSchema).optional(),
  notes: z.string().max(2000).optional(),
  instructions: z.string().max(2000).optional(),
  internal_notes: z.string().max(2000).optional(),
  follow_up_required: z.boolean().optional(),
  refill_allowed: z.boolean().optional(),
  refill_count: z.number().int().min(0).optional(),
});

/**
 * Zod schema for creating a prescription template
 */
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  medicines: z.array(medicineSchema).min(1, 'At least one medicine is required'),
  instructions: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * Zod schema for updating a prescription template
 */
export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  medicines: z.array(medicineSchema).optional(),
  instructions: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  is_active: z.boolean().optional(),
});

/**
 * Validate prescription ID
 */
export function validatePrescriptionId(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error('Invalid prescription ID format');
  }
  return id;
}

/**
 * Validate prescription status transition
 */
export function validatePrescriptionStatusTransition(
  currentStatus: PrescriptionStatus,
  newStatus: PrescriptionStatus
): void {
  const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
  
  if (!validTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
      `Valid transitions: ${validTransitions.join(', ')}`
    );
  }
}

/**
 * Validate prescription date is not in the past
 */
export function validatePrescriptionDateNotPast(date: string): void {
  const prescriptionDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (prescriptionDate < today) {
    throw new Error('Prescription date cannot be in the past');
  }
}

/**
 * Validate expiry date is after issue date
 */
export function validateExpiryDateAfterIssueDate(issueDate: string, expiryDate: string): void {
  const issue = new Date(issueDate);
  const expiry = new Date(expiryDate);

  if (expiry <= issue) {
    throw new Error('Expiry date must be after issue date');
  }
}

/**
 * Validate medicine data
 */
export function validateMedicine(medicine: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!medicine.medicine_name || medicine.medicine_name.trim().length === 0) {
    errors.push('Medicine name is required');
  }

  if (!medicine.dose || medicine.dose.trim().length === 0) {
    errors.push('Dose is required');
  }

  if (!medicine.frequency || medicine.frequency.trim().length === 0) {
    errors.push('Frequency is required');
  }

  if (!medicine.duration || medicine.duration.trim().length === 0) {
    errors.push('Duration is required');
  }

  if (!medicine.quantity || medicine.quantity <= 0) {
    errors.push('Quantity must be positive');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate refill count
 */
export function validateRefillCount(refillCount: number, refillAllowed: boolean): void {
  if (refillAllowed && refillCount < 0) {
    throw new Error('Refill count must be non-negative when refills are allowed');
  }

  if (!refillAllowed && refillCount > 0) {
    throw new Error('Refill count must be 0 when refills are not allowed');
  }
}

/**
 * Validate prescription can be signed
 */
export function validateCanSignPrescription(status: PrescriptionStatus): void {
  if (status !== 'reviewed') {
    throw new Error('Only reviewed prescriptions can be signed');
  }
}

/**
 * Validate prescription can be completed
 */
export function validateCanCompletePrescription(status: PrescriptionStatus): void {
  if (status !== 'dispensed') {
    throw new Error('Only dispensed prescriptions can be completed');
  }
}

/**
 * Validate prescription can be cancelled
 */
export function validateCanCancelPrescription(status: PrescriptionStatus): void {
  const cancellableStatuses: PrescriptionStatus[] = ['draft', 'prepared', 'reviewed', 'signed', 'dispensed'];
  
  if (!cancellableStatuses.includes(status)) {
    throw new Error(`Prescription with status ${status} cannot be cancelled`);
  }
}

/**
 * Validate prescription can be archived
 */
export function validateCanArchivePrescription(status: PrescriptionStatus): void {
  const archivableStatuses: PrescriptionStatus[] = ['completed', 'cancelled', 'expired'];
  
  if (!archivableStatuses.includes(status)) {
    throw new Error(`Prescription with status ${status} cannot be archived`);
  }
}

/**
 * Validate prescription is not expired
 */
export function validatePrescriptionNotExpired(expiryDate: string): void {
  const expiry = new Date(expiryDate);
  const today = new Date();

  if (expiry < today) {
    throw new Error('Prescription has expired');
  }
}

/**
 * Validate create prescription input
 */
export function validateCreatePrescription(input: any): any {
  return createPrescriptionSchema.parse(input);
}

/**
 * Validate update prescription input
 */
export function validateUpdatePrescription(input: any): any {
  return updatePrescriptionSchema.parse(input);
}

/**
 * Validate create template input
 */
export function validateCreateTemplate(input: any): any {
  return createTemplateSchema.parse(input);
}

/**
 * Validate update template input
 */
export function validateUpdateTemplate(input: any): any {
  return updateTemplateSchema.parse(input);
}
