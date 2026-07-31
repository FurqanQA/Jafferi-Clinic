import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { buildUpdateObject } from '../core/base-crud';
import { logger } from '../shared/logger';
import { validateUpdateAppointment, validateAppointmentId } from './appointment-validation';
import { validateUpdateAppointmentPermission, validateAppointmentClinicAccess } from './appointment-permissions';
import { validateSchedulingRules } from './scheduling';
import { cancelAppointmentReminders, scheduleAppointmentReminders } from './reminders';
import { UpdateAppointmentInput, Appointment } from './appointment-types';

/**
 * Update an existing appointment
 */
export async function updateAppointment(
  appointmentId: string,
  input: UpdateAppointmentInput
): Promise<Appointment> {
  // Validate permissions
  await validateUpdateAppointmentPermission();

  // Validate appointment ID
  const validatedAppointmentId = validateAppointmentId(appointmentId);

  // Validate clinic access
  await validateAppointmentClinicAccess(validatedAppointmentId);

  // Validate input
  const validatedInput = validateUpdateAppointment(input);

  // Get user
  const user = await getCurrentUser();

  const supabase = getSupabaseClient();

  try {
    // Fetch current appointment to check if date/time is changing
    const { data: currentAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('doctor_id, patient_id, appointment_date, start_time, end_time, status')
      .eq('id', validatedAppointmentId)
      .single();

    if (fetchError || !currentAppointment) {
      throw new NotFoundError('Appointment not found');
    }

    // If date, time, or doctor is changing, validate scheduling rules
    const needsSchedulingValidation =
      validatedInput.appointment_date !== undefined ||
      validatedInput.start_time !== undefined ||
      validatedInput.end_time !== undefined ||
      validatedInput.doctor_id !== undefined;

    if (needsSchedulingValidation) {
      const newDate = validatedInput.appointment_date || currentAppointment.appointment_date;
      const newStartTime = validatedInput.start_time || currentAppointment.start_time;
      const newEndTime = validatedInput.end_time || currentAppointment.end_time;
      const newDoctorId = validatedInput.doctor_id || currentAppointment.doctor_id;
      const patientId = currentAppointment.patient_id;

      await validateSchedulingRules(
        newDoctorId,
        patientId,
        newDate,
        newStartTime,
        newEndTime,
        validatedAppointmentId
      );
    }

    // Build update object with only provided fields
    const updateData = buildUpdateObject(validatedInput as Record<string, unknown>, [
      'doctor_id',
      'department_id',
      'appointment_date',
      'start_time',
      'end_time',
      'duration',
      'appointment_type',
      'visit_type',
      'priority',
      'reason_for_visit',
      'symptoms',
      'notes',
      'internal_notes',
      'color_tag',
    ]);

    // Add updated_by
    updateData.updated_by = user.id;

    // Update appointment
    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', validatedAppointmentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update appointment', { error, appointmentId: validatedAppointmentId });
      throw new DatabaseError('Failed to update appointment', { error });
    }

    if (!data) {
      throw new NotFoundError('Appointment not found');
    }

    logger.info('Appointment updated successfully', { appointmentId: validatedAppointmentId });

    // If scheduling changed, reschedule reminders
    if (needsSchedulingValidation) {
      await cancelAppointmentReminders(validatedAppointmentId);
      await scheduleAppointmentReminders(validatedAppointmentId);
    }

    return data as Appointment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating appointment', { error, appointmentId: validatedAppointmentId });
    throw new DatabaseError('Failed to update appointment', { error });
  }
}
