import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { logger } from '../shared/logger';
import { validateAppointmentId } from './appointment-validation';
import { validateReadAppointmentPermission, validateAppointmentClinicAccess } from './appointment-permissions';
import { Appointment } from './appointment-types';

/**
 * Get a single appointment by ID
 */
export async function getAppointment(
  appointmentId: string,
  includeDeleted: boolean = false
): Promise<Appointment> {
  // Validate permissions
  await validateReadAppointmentPermission();

  // Validate appointment ID
  const validatedAppointmentId = validateAppointmentId(appointmentId);

  // Validate clinic access
  await validateAppointmentClinicAccess(validatedAppointmentId);

  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('appointments')
      .select('*')
      .eq('id', validatedAppointmentId);

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query.single();

    if (error) {
      logger.error('Failed to fetch appointment', { error, appointmentId: validatedAppointmentId });
      throw new DatabaseError('Failed to fetch appointment', { error });
    }

    if (!data) {
      throw new NotFoundError('Appointment not found');
    }

    return data as Appointment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching appointment', { error, appointmentId: validatedAppointmentId });
    throw new DatabaseError('Failed to fetch appointment', { error });
  }
}
