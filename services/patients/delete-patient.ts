import { softDelete } from '../core/base-crud';
import { logger } from '../shared/logger';
import { validatePatientId } from './patient-validation';
import { validateDeletePatientPermission, validatePatientClinicAccess } from './patient-permissions';
import { Patient } from './patient-types';

/**
 * Soft delete a patient
 */
export async function deletePatient(patientId: string): Promise<Patient> {
  // Validate permissions
  await validateDeletePatientPermission();

  // Validate patient ID
  validatePatientId(patientId);

  // Validate clinic access
  await validatePatientClinicAccess(patientId);

  const data = await softDelete('patients', patientId);
  logger.info('Patient deleted successfully', { patientId });
  return data as Patient;
}
