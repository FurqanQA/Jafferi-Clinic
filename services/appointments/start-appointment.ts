import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { logger } from '../shared/logger';
import { validateAppointmentId, validateStatusTransition } from './appointment-validation';
import { validateUpdateAppointmentPermission, validateAppointmentClinicAccess } from './appointment-permissions';
import { Appointment, AppointmentStatus } from './appointment-types';

/**
 * Start an appointment (transition from checked_in to in_progress)
 */
export async function startAppointment(appointmentId: string): Promise<Appointment> {
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
    validateStatusTransition(currentAppointment.status as AppointmentStatus, 'in_progress');

    // Start appointment
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', validatedAppointmentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to start appointment', { error, appointmentId: validatedAppointmentId });
      throw new DatabaseError('Failed to start appointment', { error });
    }

    if (!data) {
      throw new NotFoundError('Appointment not found');
    }

    logger.info('Appointment started successfully', { appointmentId: validatedAppointmentId });
    return data as Appointment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error starting appointment', { error, appointmentId: validatedAppointmentId });
    throw new DatabaseError('Failed to start appointment', { error });
  }
}
