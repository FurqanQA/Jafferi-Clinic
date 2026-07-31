import { z } from 'zod';
import {
  VisitType,
  SeverityLevel,
  DiagnosisStatus,
  BMICategory,
  PainScale,
  AttachmentType,
  MedicalRecordStatus,
  VALID_MEDICAL_RECORD_STATUS_TRANSITIONS,
} from './medical-record-types';

/**
 * Zod schema for creating a medical record
 */
export const createMedicalRecordSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID'),
  doctor_id: z.string().uuid('Invalid doctor ID'),
  appointment_id: z.string().uuid('Invalid appointment ID').optional(),
  visit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  visit_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  visit_type: z.enum(['new_patient', 'follow_up', 'emergency', 'routine', 'consultation', 'procedure'], {
    message: 'Invalid visit type',
  }),
  department_id: z.string().uuid('Invalid department ID').optional(),
  chief_complaint: z.object({
    primary_complaint: z.string().min(1, 'Primary complaint is required'),
    duration: z.string().optional(),
    severity: z.enum(['mild', 'moderate', 'severe', 'critical']).optional(),
    location: z.string().optional(),
    onset: z.string().optional(),
    aggravating_factors: z.string().optional(),
    relieving_factors: z.string().optional(),
    associated_symptoms: z.string().optional(),
  }).optional(),
  reason_for_visit: z.string().optional(),
  duration: z.number().int().positive().optional(),
  history: z.object({
    history_of_present_illness: z.string().optional(),
    past_medical_history: z.string().optional(),
    past_surgical_history: z.string().optional(),
    family_history: z.string().optional(),
    social_history: z.string().optional(),
    smoking_history: z.string().optional(),
    alcohol_use: z.string().optional(),
    drug_use: z.string().optional(),
    occupation: z.string().optional(),
    exercise: z.string().optional(),
    diet: z.string().optional(),
    known_allergies: z.array(z.string()).optional(),
    current_medications: z.array(z.string()).optional(),
  }).optional(),
  vitals: z.object({
    height_cm: z.number().min(30).max(250).optional(),
    weight_kg: z.number().min(1).max(300).optional(),
    bmi: z.number().min(10).max(60).optional(),
    bmi_category: z.enum(['underweight', 'normal', 'overweight', 'obese', 'severely_obese']).optional(),
    blood_pressure_systolic: z.number().min(50).max(250).optional(),
    blood_pressure_diastolic: z.number().min(30).max(150).optional(),
    heart_rate: z.number().min(30).max(220).optional(),
    respiratory_rate: z.number().min(5).max(60).optional(),
    temperature_celsius: z.number().min(30).max(45).optional(),
    oxygen_saturation: z.number().min(50).max(100).optional(),
    blood_sugar: z.number().min(20).max(600).optional(),
    pain_scale: z.number().int().min(0).max(10).optional(),
    waist_circumference: z.number().min(40).max(200).optional(),
    head_circumference: z.number().min(20).max(60).optional(),
  }).optional(),
  physical_examination: z.object({
    general_examination: z.string().optional(),
    head: z.string().optional(),
    eyes: z.string().optional(),
    ent: z.string().optional(),
    chest: z.string().optional(),
    cardiovascular: z.string().optional(),
    respiratory: z.string().optional(),
    abdomen: z.string().optional(),
    skin: z.string().optional(),
    neurological: z.string().optional(),
    musculoskeletal: z.string().optional(),
    psychiatric: z.string().optional(),
    additional_notes: z.string().optional(),
  }).optional(),
  soap_notes: z.object({
    subjective: z.string().optional(),
    objective: z.string().optional(),
    assessment: z.string().optional(),
    plan: z.string().optional(),
  }).optional(),
  diagnosis: z.object({
    primary_diagnosis: z.string().optional(),
    secondary_diagnoses: z.array(z.string()).optional(),
    differential_diagnosis: z.array(z.string()).optional(),
    clinical_impression: z.string().optional(),
    icd_10_code: z.string().optional(),
    snomed_code: z.string().optional(),
    status: z.enum(['acute', 'chronic', 'resolved', 'confirmed', 'provisional']).optional(),
  }).optional(),
  treatment_plan: z.object({
    medicines: z.array(z.string()).optional(),
    procedures: z.array(z.string()).optional(),
    laboratory_tests: z.array(z.string()).optional(),
    radiology: z.array(z.string()).optional(),
    lifestyle_advice: z.string().optional(),
    diet_advice: z.string().optional(),
    exercise_advice: z.string().optional(),
    patient_instructions: z.string().optional(),
  }).optional(),
  follow_up: z.object({
    follow_up_required: z.boolean(),
    follow_up_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
    follow_up_interval: z.string().optional(),
    follow_up_reason: z.string().optional(),
    next_department: z.string().optional(),
    next_doctor: z.string().optional(),
  }).optional(),
}).refine(
  (data) => {
    // If follow_up is required, follow_up_date must be provided
    if (data.follow_up?.follow_up_required && !data.follow_up.follow_up_date) {
      return false;
    }
    return true;
  },
  {
    message: 'Follow-up date is required when follow-up is required',
    path: ['follow_up'],
  }
);

/**
 * Zod schema for updating a medical record
 */
export const updateMedicalRecordSchema = z.object({
  visit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  visit_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  visit_type: z.enum(['new_patient', 'follow_up', 'emergency', 'routine', 'consultation', 'procedure']).optional(),
  department_id: z.string().uuid('Invalid department ID').optional(),
  chief_complaint: z.object({
    primary_complaint: z.string().min(1).optional(),
    duration: z.string().optional(),
    severity: z.enum(['mild', 'moderate', 'severe', 'critical']).optional(),
    location: z.string().optional(),
    onset: z.string().optional(),
    aggravating_factors: z.string().optional(),
    relieving_factors: z.string().optional(),
    associated_symptoms: z.string().optional(),
  }).optional(),
  reason_for_visit: z.string().optional(),
  duration: z.number().int().positive().optional(),
  history: z.object({
    history_of_present_illness: z.string().optional(),
    past_medical_history: z.string().optional(),
    past_surgical_history: z.string().optional(),
    family_history: z.string().optional(),
    social_history: z.string().optional(),
    smoking_history: z.string().optional(),
    alcohol_use: z.string().optional(),
    drug_use: z.string().optional(),
    occupation: z.string().optional(),
    exercise: z.string().optional(),
    diet: z.string().optional(),
    known_allergies: z.array(z.string()).optional(),
    current_medications: z.array(z.string()).optional(),
  }).optional(),
  vitals: z.object({
    height_cm: z.number().min(30).max(250).optional(),
    weight_kg: z.number().min(1).max(300).optional(),
    bmi: z.number().min(10).max(60).optional(),
    bmi_category: z.enum(['underweight', 'normal', 'overweight', 'obese', 'severely_obese']).optional(),
    blood_pressure_systolic: z.number().min(50).max(250).optional(),
    blood_pressure_diastolic: z.number().min(30).max(150).optional(),
    heart_rate: z.number().min(30).max(220).optional(),
    respiratory_rate: z.number().min(5).max(60).optional(),
    temperature_celsius: z.number().min(30).max(45).optional(),
    oxygen_saturation: z.number().min(50).max(100).optional(),
    blood_sugar: z.number().min(20).max(600).optional(),
    pain_scale: z.number().int().min(0).max(10).optional(),
    waist_circumference: z.number().min(40).max(200).optional(),
    head_circumference: z.number().min(20).max(60).optional(),
  }).optional(),
  physical_examination: z.object({
    general_examination: z.string().optional(),
    head: z.string().optional(),
    eyes: z.string().optional(),
    ent: z.string().optional(),
    chest: z.string().optional(),
    cardiovascular: z.string().optional(),
    respiratory: z.string().optional(),
    abdomen: z.string().optional(),
    skin: z.string().optional(),
    neurological: z.string().optional(),
    musculoskeletal: z.string().optional(),
    psychiatric: z.string().optional(),
    additional_notes: z.string().optional(),
  }).optional(),
  soap_notes: z.object({
    subjective: z.string().optional(),
    objective: z.string().optional(),
    assessment: z.string().optional(),
    plan: z.string().optional(),
  }).optional(),
  diagnosis: z.object({
    primary_diagnosis: z.string().optional(),
    secondary_diagnoses: z.array(z.string()).optional(),
    differential_diagnosis: z.array(z.string()).optional(),
    clinical_impression: z.string().optional(),
    icd_10_code: z.string().optional(),
    snomed_code: z.string().optional(),
    status: z.enum(['acute', 'chronic', 'resolved', 'confirmed', 'provisional']).optional(),
  }).optional(),
  treatment_plan: z.object({
    medicines: z.array(z.string()).optional(),
    procedures: z.array(z.string()).optional(),
    laboratory_tests: z.array(z.string()).optional(),
    radiology: z.array(z.string()).optional(),
    lifestyle_advice: z.string().optional(),
    diet_advice: z.string().optional(),
    exercise_advice: z.string().optional(),
    patient_instructions: z.string().optional(),
  }).optional(),
  follow_up: z.object({
    follow_up_required: z.boolean().optional(),
    follow_up_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
    follow_up_interval: z.string().optional(),
    follow_up_reason: z.string().optional(),
    next_department: z.string().optional(),
    next_doctor: z.string().optional(),
  }).optional(),
});

/**
 * Zod schema for creating a medical record template
 */
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255),
  description: z.string().max(1000).optional(),
  visit_type: z.enum(['new_patient', 'follow_up', 'emergency', 'routine', 'consultation', 'procedure']).optional(),
  department_id: z.string().uuid('Invalid department ID').optional(),
  template_data: z.object({}).passthrough(),
});

/**
 * Zod schema for updating a medical record template
 */
export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  visit_type: z.enum(['new_patient', 'follow_up', 'emergency', 'routine', 'consultation', 'procedure']).optional(),
  department_id: z.string().uuid('Invalid department ID').optional(),
  template_data: z.object({}).passthrough().optional(),
  is_active: z.boolean().optional(),
});

/**
 * Validate medical record ID
 */
export function validateMedicalRecordId(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error('Invalid medical record ID format');
  }
  return id;
}

/**
 * Validate template ID
 */
export function validateTemplateId(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error('Invalid template ID format');
  }
  return id;
}

/**
 * Validate medical record status transition
 */
export function validateMedicalRecordStatusTransition(
  currentStatus: MedicalRecordStatus,
  newStatus: MedicalRecordStatus
): void {
  const validTransitions = VALID_MEDICAL_RECORD_STATUS_TRANSITIONS[currentStatus] || [];
  if (!validTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
      `Valid transitions: ${validTransitions.join(', ')}`
    );
  }
}

/**
 * Validate that a record can be signed
 */
export function validateCanSignRecord(status: MedicalRecordStatus): void {
  if (status !== 'in_progress') {
    throw new Error(`Cannot sign medical record in status: ${status}. Only records in 'in_progress' can be signed.`);
  }
}

/**
 * Validate BMI calculation
 */
export function validateBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  
  if (bmi < 10 || bmi > 60) {
    throw new Error('Calculated BMI is outside valid range (10-60)');
  }
  
  return Math.round(bmi * 10) / 10; // Round to 1 decimal place
}

/**
 * Determine BMI category from BMI value
 */
export function determineBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  if (bmi < 35) return 'obese';
  return 'severely_obese';
}

/**
 * Validate blood pressure values
 */
export function validateBloodPressure(systolic: number, diastolic: number): void {
  if (systolic <= diastolic) {
    throw new Error('Systolic blood pressure must be greater than diastolic');
  }
  
  if (systolic < 50 || systolic > 250) {
    throw new Error('Systolic blood pressure must be between 50 and 250 mmHg');
  }
  
  if (diastolic < 30 || diastolic > 150) {
    throw new Error('Diastolic blood pressure must be between 30 and 150 mmHg');
  }
}

/**
 * Validate visit date is not in the future (for completed records)
 */
export function validateVisitDateNotFuture(visitDate: string, allowFuture: boolean = false): void {
  const visitDateObj = new Date(visitDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!allowFuture && visitDateObj > today) {
    throw new Error('Visit date cannot be in the future');
  }
}

/**
 * Validate create medical record input
 */
export function validateCreateMedicalRecord(input: unknown): unknown {
  return createMedicalRecordSchema.parse(input);
}

/**
 * Validate update medical record input
 */
export function validateUpdateMedicalRecord(input: unknown): unknown {
  return updateMedicalRecordSchema.parse(input);
}

/**
 * Validate create template input
 */
export function validateCreateTemplate(input: unknown): unknown {
  return createTemplateSchema.parse(input);
}

/**
 * Validate update template input
 */
export function validateUpdateTemplate(input: unknown): unknown {
  return updateTemplateSchema.parse(input);
}
