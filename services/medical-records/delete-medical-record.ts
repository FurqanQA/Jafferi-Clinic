import { softDelete } from '../core/base-crud';
import { validateMedicalRecordId } from './medical-record-validation';
import { validateDeleteMedicalRecordPermission } from './medical-record-permissions';

/**
 * Soft delete a medical record
 */
export async function deleteMedicalRecord(medicalRecordId: string): Promise<void> {
  // Validate permissions
  await validateDeleteMedicalRecordPermission();

  // Validate medical record ID
  const validatedId = validateMedicalRecordId(medicalRecordId);

  // Soft delete the record using base-crud utility
  await softDelete('medical_records', validatedId);
}
