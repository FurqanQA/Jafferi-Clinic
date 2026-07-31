import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { logger } from '../shared/logger';
import { validateAppointmentId, validateStatusTransition } from './appointment-validation';
import { validateUpdateAppointmentPermission, validateAppointmentClinicAccess } from './appointment-permissions';
import { cancelAppointmentReminders } from './reminders';
import { Appointment, AppointmentStatus } from './appointment-types';

/**
 * Cancel an appointment with optional reason
 */
export async function cancelAppointment(
  appointmentId: string,
  cancellationReason?: string
): Promise<Appointment> {
  // Validate permissions
  await validateUpdateAppointmentPermission();

  // Validate appointment ID
  const validatedAppointmentId = validateAppointmentId(appointmentId);

  // Validate clinic access
  await validateAppointmentClinicAccess(validatedAppointmentId);

  const supabase = getSupabaseClient();

  try {
    // Fetch current appointment
    const { data: currentAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('status')
      .eq('id', validatedAppointmentId)
      .single();

    if (fetchError || !currentAppointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Validate status transition
    validateStatusTransition(currentAppointment.status as AppointmentStatus, 'cancelled');

    // Cancel appointment
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancellationReason || null,
      })
      .eq('id', validatedAppointmentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to cancel appointment', { error, appointmentId: validatedAppointmentId });
      throw new DatabaseError('Failed to cancel appointment', { error });
    }

    if (!data) {
      throw new NotFoundError('Appointment not found');
    }

    logger.info('Appointment cancelled successfully', { appointmentId: validatedAppointmentId });

    // Cancel pending reminders
    await cancelAppointmentReminders(validatedAppointmentId);

    return data as Appointment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error cancelling appointment', { error, appointmentId: validatedAppointmentId });
    throw new DatabaseError('Failed to cancel appointment', { error });
  }
}
