import { restoreRecord } from '../core/base-crud';
import { validatePrescriptionId } from './prescription-validation';
import { validateRestorePrescriptionPermission } from './prescription-permissions';
import { Prescription } from './prescription-types';

/**
 * Restore a soft-deleted prescription
 */
export async function restorePrescription(prescriptionId: string): Promise<Prescription> {
  // Validate permissions
  await validateRestorePrescriptionPermission();

  // Validate prescription ID
  const validatedId = validatePrescriptionId(prescriptionId);

  // Restore the record using base-crud utility
  return restoreRecord('prescriptions', validatedId) as Promise<Prescription>;
}
