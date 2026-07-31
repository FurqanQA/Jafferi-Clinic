import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { logger } from '../shared/logger';
import { validateAppointmentId, validateStatusTransition } from './appointment-validation';
import { validateUpdateAppointmentPermission, validateAppointmentClinicAccess } from './appointment-permissions';
import { Appointment, AppointmentStatus } from './appointment-types';

/**
 * Check in a patient for their appointment (transition from confirmed to checked_in)
 */
export async function checkinAppointment(appointmentId: string): Promise<Appointment> {
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
    validateStatusTransition(currentAppointment.status as AppointmentStatus, 'checked_in');

    // Check in appointment
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'checked_in',
        checked_in_at: new Date().toISOString(),
      })
      .eq('id', validatedAppointmentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to check in appointment', { error, appointmentId: validatedAppointmentId });
      throw new DatabaseError('Failed to check in appointment', { error });
    }

    if (!data) {
      throw new NotFoundError('Appointment not found');
    }

    logger.info('Appointment checked in successfully', { appointmentId: validatedAppointmentId });
    return data as Appointment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error checking in appointment', { error, appointmentId: validatedAppointmentId });
    throw new DatabaseError('Failed to check in appointment', { error });
  }
}
