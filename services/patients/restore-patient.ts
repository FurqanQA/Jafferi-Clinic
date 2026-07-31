import { restoreRecord } from '../core/base-crud';
import { logger } from '../shared/logger';
import { validatePatientId } from './patient-validation';
import { validateRestorePatientPermission, validatePatientClinicAccess } from './patient-permissions';
import { Patient } from './patient-types';

/**
 * Restore a soft-deleted patient
 */
export async function restorePatient(patientId: string): Promise<Patient> {
  // Validate permissions
  await validateRestorePatientPermission();

  // Validate patient ID
  validatePatientId(patientId);

  // Validate clinic access
  await validatePatientClinicAccess(patientId);

  const data = await restoreRecord('patients', patientId);
  logger.info('Patient restored successfully', { patientId });
  return data as Patient;
}
