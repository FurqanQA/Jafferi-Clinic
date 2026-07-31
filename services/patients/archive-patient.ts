import { archiveRecord } from '../core/base-crud';
import { logger } from '../shared/logger';
import { validatePatientId } from './patient-validation';
import { validateArchivePatientPermission, validatePatientClinicAccess } from './patient-permissions';
import { Patient } from './patient-types';

/**
 * Archive a patient (set status to archived)
 */
export async function archivePatient(patientId: string): Promise<Patient> {
  // Validate permissions
  await validateArchivePatientPermission();

  // Validate patient ID
  validatePatientId(patientId);

  // Validate clinic access
  await validatePatientClinicAccess(patientId);

  const data = await archiveRecord('patients', patientId);
  logger.info('Patient archived successfully', { patientId });
  return data as Patient;
}
