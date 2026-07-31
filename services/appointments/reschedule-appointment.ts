import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateAppointmentId, validateStatusTransition } from './appointment-validation';
import { validateUpdateAppointmentPermission, validateAppointmentClinicAccess } from './appointment-permissions';
import { validateSchedulingRules } from './scheduling';
import { cancelAppointmentReminders, scheduleAppointmentReminders } from './reminders';
import { Appointment, AppointmentStatus } from './appointment-types';

/**
 * Reschedule an appointment to a new date/time
 */
export async function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string
): Promise<Appointment> {
  // Validate permissions
  await validateUpdateAppointmentPermission();

  // Validate appointment ID
  const validatedAppointmentId = validateAppointmentId(appointmentId);

  // Validate clinic access
  await validateAppointmentClinicAccess(validatedAppointmentId);

  // Get user
  const user = await getCurrentUser();

  const supabase = getSupabaseClient();

  try {
    // Fetch current appointment
    const { data: currentAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('doctor_id, patient_id, status, appointment_date, start_time, end_time')
      .eq('id', validatedAppointmentId)
      .single();

    if (fetchError || !currentAppointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Validate status transition (can only reschedule from scheduled or confirmed)
    validateStatusTransition(currentAppointment.status as AppointmentStatus, 'rescheduled');

    // Validate new scheduling
    await validateSchedulingRules(
      currentAppointment.doctor_id,
      currentAppointment.patient_id,
      newDate,
      newStartTime,
      newEndTime,
      validatedAppointmentId
    );

    // Create new appointment with rescheduled data
    const { data: newAppointment, error: createError } = await supabase
      .from('appointments')
      .insert({
        clinic_id: await getUserClinicId(),
        patient_id: currentAppointment.patient_id,
        doctor_id: currentAppointment.doctor_id,
        appointment_date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
        duration: calculateDuration(newStartTime, newEndTime),
        status: 'scheduled',
        rescheduled_from_id: validatedAppointmentId,
        created_by: user.id,
        is_active: true,
      })
      .select()
      .single();

    if (createError || !newAppointment) {
      throw new DatabaseError('Failed to create rescheduled appointment', { error: createError });
    }

    // Update original appointment to rescheduled status
    const { data: updatedOriginal, error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'rescheduled',
        rescheduled_to_id: newAppointment.id,
      })
      .eq('id', validatedAppointmentId)
      .select()
      .single();

    if (updateError || !updatedOriginal) {
      throw new DatabaseError('Failed to update original appointment', { error: updateError });
    }

    logger.info('Appointment rescheduled successfully', { 
      originalId: validatedAppointmentId, 
      newId: newAppointment.id 
    });

    // Cancel reminders for original appointment
    await cancelAppointmentReminders(validatedAppointmentId);

    // Schedule reminders for new appointment
    await scheduleAppointmentReminders(newAppointment.id);

    return newAppointment as Appointment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error rescheduling appointment', { error, appointmentId: validatedAppointmentId });
    throw new DatabaseError('Failed to reschedule appointment', { error });
  }
}

/**
 * Calculate duration from start and end time
 */
function calculateDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;
  return endTotal - startTotal;
}
