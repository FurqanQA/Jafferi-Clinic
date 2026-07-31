import { restoreRecord } from '../core/base-crud';
import { validateMedicalRecordId } from './medical-record-validation';
import { validateRestoreMedicalRecordPermission } from './medical-record-permissions';
import { MedicalRecord } from './medical-record-types';

/**
 * Restore a soft-deleted medical record
 */
export async function restoreMedicalRecord(medicalRecordId: string): Promise<MedicalRecord> {
  // Validate permissions
  await validateRestoreMedicalRecordPermission();

  // Validate medical record ID
  const validatedId = validateMedicalRecordId(medicalRecordId);

  // Restore the record using base-crud utility
  return restoreRecord('medical_records', validatedId) as Promise<MedicalRecord>;
}
