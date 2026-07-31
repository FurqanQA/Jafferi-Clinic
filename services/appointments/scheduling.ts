import { getSupabaseClient } from '../core/client';
import { getUserClinicId } from '../core/auth';
import { DatabaseError, ConflictError } from '../core/errors';
import { logger } from '../shared/logger';
import { isSlotAvailable, isClinicOpen } from './availability';
import { validateWorkingHours } from './appointment-validation';

/**
 * Scheduling conflict result
 */
export interface SchedulingConflict {
  hasConflict: boolean;
  conflicts: Array<{
    appointmentId: string;
    doctorId: string;
    startTime: string;
    endTime: string;
    reason: string;
  }>;
}

/**
 * Check for scheduling conflicts
 */
export async function checkSchedulingConflicts(
  doctorId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string
): Promise<SchedulingConflict> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('appointments')
      .select('id, doctor_id, start_time, end_time, status')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .eq('clinic_id', clinicId)
      .in('status', ['scheduled', 'confirmed', 'checked_in', 'in_progress'])
      .is('deleted_at', null)
      .or(`and(start_time.lte.${endTime},end_time.gte.${startTime})`);

    // Exclude current appointment when updating
    if (excludeAppointmentId) {
      query = query.neq('id', excludeAppointmentId);
    }

    const { data: conflicts, error } = await query;

    if (error) {
      throw new DatabaseError('Failed to check conflicts', { error });
    }

    if (!conflicts || conflicts.length === 0) {
      return { hasConflict: false, conflicts: [] };
    }

    return {
      hasConflict: true,
      conflicts: conflicts.map(conflict => ({
        appointmentId: conflict.id,
        doctorId: conflict.doctor_id,
        startTime: conflict.start_time,
        endTime: conflict.end_time,
        reason: 'Overlapping appointment',
      })),
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error checking scheduling conflicts', { error, doctorId, date });
    throw new DatabaseError('Failed to check scheduling conflicts', { error });
  }
}

/**
 * Validate appointment scheduling
 */
export async function validateAppointmentScheduling(
  doctorId: string,
  patientId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string
): Promise<void> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  // Validate working hours
  validateWorkingHours(startTime, endTime);

  // Check if clinic is open
  const clinicOpen = await isClinicOpen(date, startTime);
  if (!clinicOpen) {
    throw new ConflictError('Clinic is not open at the requested time');
  }

  // Check if doctor exists and belongs to clinic
  const { data: doctor, error: doctorError } = await supabase
    .from('doctors')
    .select('id, availability')
    .eq('id', doctorId)
    .eq('clinic_id', clinicId)
    .single();

  if (doctorError || !doctor) {
    throw new ConflictError('Doctor not found or does not belong to this clinic');
  }

  if (doctor.availability !== 'available') {
    throw new ConflictError('Doctor is not available for scheduling');
  }

  // Check if patient exists and belongs to clinic
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('clinic_id', clinicId)
    .single();

  if (patientError || !patient) {
    throw new ConflictError('Patient not found or does not belong to this clinic');
  }

  // Check for scheduling conflicts
  const conflictCheck = await checkSchedulingConflicts(
    doctorId,
    date,
    startTime,
    endTime,
    excludeAppointmentId
  );

  if (conflictCheck.hasConflict) {
    throw new ConflictError('Scheduling conflict: Doctor has overlapping appointments');
  }

  // Check if slot is available
  const slotAvailable = await isSlotAvailable(doctorId, date, startTime, endTime);
  if (!slotAvailable) {
    throw new ConflictError('Requested time slot is not available');
  }
}

/**
 * Calculate appointment end time based on start time and duration
 */
export function calculateEndTime(startTime: string, duration: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

/**
 * Calculate appointment duration based on start and end time
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;
  return endTotal - startTotal;
}

/**
 * Validate appointment date is not in the past
 */
export function validateAppointmentNotInPast(date: string, startTime: string): void {
  const appointmentDateTime = new Date(`${date}T${startTime}`);
  const now = new Date();

  if (appointmentDateTime < now) {
    throw new ConflictError('Cannot schedule appointments in the past');
  }
}

/**
 * Validate minimum advance booking time
 */
export function validateAdvanceBooking(date: string, minimumHours: number = 2): void {
  const appointmentDateTime = new Date(date);
  const now = new Date();
  const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilAppointment < minimumHours) {
    throw new ConflictError(`Appointments must be booked at least ${minimumHours} hours in advance`);
  }
}

/**
 * Validate maximum advance booking time
 */
export function validateMaxAdvanceBooking(date: string, maximumDays: number = 90): void {
  const appointmentDateTime = new Date(date);
  const now = new Date();
  const daysUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (daysUntilAppointment > maximumDays) {
    throw new ConflictError(`Appointments cannot be booked more than ${maximumDays} days in advance`);
  }
}

/**
 * Check for doctor vacation or blocked dates
 */
export async function checkDoctorBlockedDates(
  doctorId: string,
  date: string
): Promise<boolean> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check if doctor has blocked dates (assuming a doctor_blocked_dates table)
    const { data: blockedDates, error } = await supabase
      .from('doctor_blocked_dates')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('clinic_id', clinicId)
      .eq('date', date)
      .single();

    if (error) {
      // If table doesn't exist or no blocked dates, assume available
      return false;
    }

    return !!blockedDates;
  } catch (error) {
    // If blocked dates check fails, assume available
    return false;
  }
}

/**
 * Check for clinic holidays
 */
export async function checkClinicHolidays(date: string): Promise<boolean> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check if date is a clinic holiday (assuming a clinic_holidays table)
    const { data: holiday, error } = await supabase
      .from('clinic_holidays')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('date', date)
      .single();

    if (error) {
      // If table doesn't exist or no holidays, assume available
      return false;
    }

    return !!holiday;
  } catch (error) {
    // If holiday check fails, assume available
    return false;
  }
}

/**
 * Comprehensive scheduling validation
 */
export async function validateSchedulingRules(
  doctorId: string,
  patientId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string
): Promise<void> {
  // Validate date is not in past
  validateAppointmentNotInPast(date, startTime);

  // Validate advance booking limits
  validateAdvanceBooking(date, 2);
  validateMaxAdvanceBooking(date, 90);

  // Check for blocked dates and holidays
  const isBlocked = await checkDoctorBlockedDates(doctorId, date);
  if (isBlocked) {
    throw new ConflictError('Doctor is not available on this date');
  }

  const isHoliday = await checkClinicHolidays(date);
  if (isHoliday) {
    throw new ConflictError('Clinic is closed on this date (holiday)');
  }

  // Validate basic scheduling
  await validateAppointmentScheduling(
    doctorId,
    patientId,
    date,
    startTime,
    endTime,
    excludeAppointmentId
  );
}
