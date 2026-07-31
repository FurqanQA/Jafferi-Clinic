import { softDelete } from '../core/base-crud';
import { logger } from '../shared/logger';
import { validateAppointmentId } from './appointment-validation';
import { validateDeleteAppointmentPermission, validateAppointmentClinicAccess } from './appointment-permissions';
import { cancelAppointmentReminders } from './reminders';
import { Appointment } from './appointment-types';

/**
 * Soft delete an appointment
 */
export async function deleteAppointment(appointmentId: string): Promise<Appointment> {
  // Validate permissions
  await validateDeleteAppointmentPermission();

  // Validate appointment ID
  const validatedAppointmentId = validateAppointmentId(appointmentId);

  // Validate clinic access
  await validateAppointmentClinicAccess(validatedAppointmentId);

  // Cancel pending reminders before deletion
  await cancelAppointmentReminders(validatedAppointmentId);

  const data = await softDelete('appointments', validatedAppointmentId);
  logger.info('Appointment deleted successfully', { appointmentId: validatedAppointmentId });
  return data as Appointment;
}
