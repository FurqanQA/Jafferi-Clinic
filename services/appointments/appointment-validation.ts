import { z } from 'zod';
import { 
  AppointmentType, 
  VisitType, 
  Priority, 
  AppointmentSource, 
  AppointmentStatus 
} from './appointment-types';
import { ValidationError } from '../core/errors';

/**
 * Zod schema for creating an appointment
 */
export const createAppointmentSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID'),
  doctor_id: z.string().uuid('Invalid doctor ID'),
  department_id: z.string().uuid('Invalid department ID').optional(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  duration: z.number().int().positive('Duration must be positive').min(5, 'Minimum duration is 5 minutes').max(480, 'Maximum duration is 8 hours'),
  appointment_type: z.enum(['general_consultation', 'follow_up', 'emergency', 'procedure', 'vaccination', 'laboratory', 'telemedicine', 'walk_in', 'routine_checkup', 'specialist_consultation']),
  visit_type: z.enum(['new_patient', 'existing_patient', 'returning_patient']),
  priority: z.enum(['low', 'normal', 'high', 'urgent', 'emergency']),
  reason_for_visit: z.string().max(500, 'Reason for visit must be less than 500 characters').optional(),
  symptoms: z.string().max(1000, 'Symptoms must be less than 1000 characters').optional(),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
  internal_notes: z.string().max(2000, 'Internal notes must be less than 2000 characters').optional(),
  color_tag: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (hex)').optional(),
  source: z.enum(['web', 'phone', 'walk_in', 'referral', 'admin']).default('web'),
}).refine(
  (data) => {
    const start = parseTime(data.start_time);
    const end = parseTime(data.end_time);
    return end > start;
  },
  { message: 'End time must be after start time', path: ['end_time'] }
).refine(
  (data) => {
    const start = parseTime(data.start_time);
    const end = parseTime(data.end_time);
    const durationMinutes = (end - start);
    return durationMinutes === data.duration;
  },
  { message: 'Duration must match the time difference between start and end time', path: ['duration'] }
);

/**
 * Zod schema for updating an appointment
 */
export const updateAppointmentSchema = z.object({
  doctor_id: z.string().uuid('Invalid doctor ID').optional(),
  department_id: z.string().uuid('Invalid department ID').optional(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)').optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)').optional(),
  duration: z.number().int().positive('Duration must be positive').min(5, 'Minimum duration is 5 minutes').max(480, 'Maximum duration is 8 hours').optional(),
  appointment_type: z.enum(['general_consultation', 'follow_up', 'emergency', 'procedure', 'vaccination', 'laboratory', 'telemedicine', 'walk_in', 'routine_checkup', 'specialist_consultation']).optional(),
  visit_type: z.enum(['new_patient', 'existing_patient', 'returning_patient']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent', 'emergency']).optional(),
  reason_for_visit: z.string().max(500, 'Reason for visit must be less than 500 characters').optional(),
  symptoms: z.string().max(1000, 'Symptoms must be less than 1000 characters').optional(),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
  internal_notes: z.string().max(2000, 'Internal notes must be less than 2000 characters').optional(),
  color_tag: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (hex)').optional(),
}).refine(
  (data) => {
    if (data.start_time && data.end_time) {
      const start = parseTime(data.start_time);
      const end = parseTime(data.end_time);
      return end > start;
    }
    return true;
  },
  { message: 'End time must be after start time', path: ['end_time'] }
).refine(
  (data) => {
    if (data.start_time && data.end_time && data.duration) {
      const start = parseTime(data.start_time);
      const end = parseTime(data.end_time);
      const durationMinutes = (end - start);
      return durationMinutes === data.duration;
    }
    return true;
  },
  { message: 'Duration must match the time difference between start and end time', path: ['duration'] }
);

/**
 * Validate appointment ID
 */
export function validateAppointmentId(appointmentId: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(appointmentId)) {
    throw new ValidationError('Invalid appointment ID format');
  }
  return appointmentId;
}

/**
 * Validate create appointment input
 */
export function validateCreateAppointment(input: unknown) {
  return createAppointmentSchema.parse(input);
}

/**
 * Validate update appointment input
 */
export function validateUpdateAppointment(input: unknown) {
  return updateAppointmentSchema.parse(input);
}

/**
 * Validate status transition
 */
export function validateStatusTransition(
  currentStatus: AppointmentStatus,
  newStatus: AppointmentStatus
): void {
  const { VALID_STATUS_TRANSITIONS } = require('./appointment-types');
  const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  
  if (!validTransitions.includes(newStatus)) {
    throw new ValidationError(
      `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
      `Valid transitions: ${validTransitions.join(', ')}`
    );
  }
}

/**
 * Parse time string to minutes since midnight
 */
function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Validate appointment date is in the future
 */
export function validateAppointmentDateInFuture(appointmentDate: string): void {
  const appointment = new Date(appointmentDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  if (appointment < now) {
    throw new ValidationError('Appointment date must be in the future');
  }
}

/**
 * Validate working hours
 */
export function validateWorkingHours(startTime: string, endTime: string): void {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  
  // Assuming clinic hours are 8:00 AM to 8:00 PM (can be customized per clinic)
  const clinicOpen = 8 * 60; // 8:00 AM
  const clinicClose = 20 * 60; // 8:00 PM
  
  if (start < clinicOpen || end > clinicClose) {
    throw new ValidationError('Appointment must be within clinic working hours (8:00 AM - 8:00 PM)');
  }
}
