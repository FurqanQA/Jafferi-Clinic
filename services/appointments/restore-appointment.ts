import { restoreRecord } from '../core/base-crud';
import { logger } from '../shared/logger';
import { validateAppointmentId } from './appointment-validation';
import { validateRestoreAppointmentPermission, validateAppointmentClinicAccess } from './appointment-permissions';
import { Appointment } from './appointment-types';

/**
 * Restore a soft-deleted appointment
 */
export async function restoreAppointment(appointmentId: string): Promise<Appointment> {
  // Validate permissions
  await validateRestoreAppointmentPermission();

  // Validate appointment ID
  const validatedAppointmentId = validateAppointmentId(appointmentId);

  // Validate clinic access
  await validateAppointmentClinicAccess(validatedAppointmentId);

  const data = await restoreRecord('appointments', validatedAppointmentId);
  logger.info('Appointment restored successfully', { appointmentId: validatedAppointmentId });
  return data as Appointment;
}
