import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { randomString } from '../shared/helpers';
import { validateCreateAppointment } from './appointment-validation';
import { validateCreateAppointmentPermission } from './appointment-permissions';
import { validateSchedulingRules } from './scheduling';
import { scheduleAppointmentReminders } from './reminders';
import { CreateAppointmentInput, Appointment } from './appointment-types';

/**
 * Create a new appointment
 */
export async function createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
  // Validate permissions
  await validateCreateAppointmentPermission();

  // Validate input
  const validatedInput = validateCreateAppointment(input);

  // Get clinic ID and user
  const clinicId = await getUserClinicId();
  const user = await getCurrentUser();

  // Validate scheduling rules
  await validateSchedulingRules(
    validatedInput.doctor_id,
    validatedInput.patient_id,
    validatedInput.appointment_date,
    validatedInput.start_time,
    validatedInput.end_time
  );

  // Generate appointment number
  const appointmentNumber = generateAppointmentNumber();

  const supabase = getSupabaseClient();

  try {
    // Create appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        clinic_id: clinicId,
        patient_id: validatedInput.patient_id,
        doctor_id: validatedInput.doctor_id,
        department_id: validatedInput.department_id || null,
        appointment_number: appointmentNumber,
        appointment_date: validatedInput.appointment_date,
        start_time: validatedInput.start_time,
        end_time: validatedInput.end_time,
        duration: validatedInput.duration,
        appointment_type: validatedInput.appointment_type,
        visit_type: validatedInput.visit_type,
        priority: validatedInput.priority,
        status: 'scheduled',
        reason_for_visit: validatedInput.reason_for_visit || null,
        symptoms: validatedInput.symptoms || null,
        notes: validatedInput.notes || null,
        internal_notes: validatedInput.internal_notes || null,
        color_tag: validatedInput.color_tag || null,
        source: validatedInput.source || 'web',
        created_by: user.id,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create appointment', { error, clinicId });
      throw new DatabaseError('Failed to create appointment', { error });
    }

    logger.info('Appointment created successfully', { appointmentId: data.id, clinicId });

    // Schedule reminders for the appointment
    await scheduleAppointmentReminders(data.id);

    return data as Appointment;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating appointment', { error, clinicId });
    throw new DatabaseError('Failed to create appointment', { error });
  }
}

/**
 * Generate a unique appointment number
 */
function generateAppointmentNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = randomString(6).toUpperCase();
  return `APT-${timestamp}-${random}`;
}
