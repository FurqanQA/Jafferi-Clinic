import { getSupabaseClient } from '../core/client';
import { getUserClinicId } from '../core/auth';
import { DatabaseError } from '../core/errors';
import { logger } from '../shared/logger';
import { TimeSlot, DailyAvailability } from './appointment-types';

/**
 * Get doctor availability for a specific date
 */
export async function getDoctorAvailability(
  doctorId: string,
  date: string
): Promise<DailyAvailability> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Get doctor's working hours
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('working_hours, availability')
      .eq('id', doctorId)
      .eq('clinic_id', clinicId)
      .single();

    if (doctorError || !doctor) {
      throw new DatabaseError('Doctor not found', { error: doctorError });
    }

    // Check if doctor is available
    if (doctor.availability !== 'available') {
      return { date, slots: [] };
    }

    // Get existing appointments for the doctor on this date
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('start_time, end_time, status')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .eq('clinic_id', clinicId)
      .in('status', ['scheduled', 'confirmed', 'checked_in', 'in_progress'])
      .is('deleted_at', null);

    if (appointmentsError) {
      throw new DatabaseError('Failed to fetch appointments', { error: appointmentsError });
    }

    // Parse working hours
    const workingHours = doctor.working_hours as Record<string, { start: string; end: string }>;
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const schedule = workingHours[dayOfWeek];

    if (!schedule) {
      return { date, slots: [] };
    }

    // Generate available slots
    const slots = generateAvailableSlots(
      schedule.start,
      schedule.end,
      appointments || [],
      30 // Default slot duration in minutes
    );

    return { date, slots };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching doctor availability', { error, doctorId, date });
    throw new DatabaseError('Failed to fetch doctor availability', { error });
  }
}

/**
 * Get clinic availability for a specific date
 */
export async function getClinicAvailability(date: string): Promise<DailyAvailability> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Get clinic working hours
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('working_hours')
      .eq('id', clinicId)
      .single();

    if (clinicError || !clinic) {
      throw new DatabaseError('Clinic not found', { error: clinicError });
    }

    // Parse working hours
    const workingHours = clinic.working_hours as Record<string, { start: string; end: string }>;
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const schedule = workingHours[dayOfWeek];

    if (!schedule) {
      return { date, slots: [] };
    }

    // Generate slots based on clinic hours
    const slots = generateAvailableSlots(
      schedule.start,
      schedule.end,
      [],
      30 // Default slot duration
    );

    return { date, slots };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching clinic availability', { error, date });
    throw new DatabaseError('Failed to fetch clinic availability', { error });
  }
}

/**
 * Get available slots for a doctor on a specific date
 */
export async function getAvailableSlots(
  doctorId: string,
  date: string,
  duration: number = 30
): Promise<TimeSlot[]> {
  const availability = await getDoctorAvailability(doctorId, date);
  
  // Filter slots that can accommodate the requested duration
  return availability.slots.filter(slot => {
    const start = parseTimeToMinutes(slot.start);
    const end = parseTimeToMinutes(slot.end);
    return (end - start) >= duration;
  });
}

/**
 * Check if doctor is available at a specific time
 */
export async function isDoctorAvailable(
  doctorId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check for overlapping appointments
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .eq('clinic_id', clinicId)
      .in('status', ['scheduled', 'confirmed', 'checked_in', 'in_progress'])
      .is('deleted_at', null)
      .or(`and(start_time.lte.${endTime},end_time.gte.${startTime})`);

    if (error) {
      throw new DatabaseError('Failed to check availability', { error });
    }

    return !appointments || appointments.length === 0;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error checking doctor availability', { error, doctorId, date });
    throw new DatabaseError('Failed to check doctor availability', { error });
  }
}

/**
 * Check if clinic is open on a specific date and time
 */
export async function isClinicOpen(date: string, time: string): Promise<boolean> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Get clinic working hours
    const { data: clinic, error } = await supabase
      .from('clinics')
      .select('working_hours')
      .eq('id', clinicId)
      .single();

    if (error || !clinic) {
      throw new DatabaseError('Clinic not found', { error });
    }

    const workingHours = clinic.working_hours as Record<string, { start: string; end: string }>;
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const schedule = workingHours[dayOfWeek];

    if (!schedule) {
      return false;
    }

    const timeMinutes = parseTimeToMinutes(time);
    const startMinutes = parseTimeToMinutes(schedule.start);
    const endMinutes = parseTimeToMinutes(schedule.end);

    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error checking clinic hours', { error, date });
    throw new DatabaseError('Failed to check clinic hours', { error });
  }
}

/**
 * Check if a specific slot is available
 */
export async function isSlotAvailable(
  doctorId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const clinicOpen = await isClinicOpen(date, startTime);
  if (!clinicOpen) {
    return false;
  }

  const doctorAvailable = await isDoctorAvailable(doctorId, date, startTime, endTime);
  return doctorAvailable;
}

/**
 * Generate available slots based on working hours and existing appointments
 */
export function generateAvailableSlots(
  startTime: string,
  endTime: string,
  existingAppointments: Array<{ start_time: string; end_time: string; status: string }>,
  slotDuration: number = 30
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  const bufferMinutes = 5; // Buffer time between appointments

  // Create a list of blocked time ranges
  const blockedRanges = existingAppointments.map(apt => ({
    start: parseTimeToMinutes(apt.start_time) - bufferMinutes,
    end: parseTimeToMinutes(apt.end_time) + bufferMinutes,
  }));

  let currentStart = startMinutes;

  while (currentStart + slotDuration <= endMinutes) {
    const currentEnd = currentStart + slotDuration;

    // Check if this slot overlaps with any blocked range
    const isBlocked = blockedRanges.some(range => {
      return (currentStart < range.end && currentEnd > range.start);
    });

    if (!isBlocked) {
      slots.push({
        start: formatMinutesToTime(currentStart),
        end: formatMinutesToTime(currentEnd),
        available: true,
      });
    }

    currentStart += slotDuration;
  }

  return slots;
}

/**
 * Parse time string (HH:mm) to minutes since midnight
 */
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Format minutes since midnight to time string (HH:mm)
 */
function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
