import { softDelete } from '../core/base-crud';
import { validatePrescriptionId } from './prescription-validation';
import { validateDeletePrescriptionPermission } from './prescription-permissions';

/**
 * Soft delete a prescription
 */
export async function deletePrescription(prescriptionId: string): Promise<void> {
  // Validate permissions
  await validateDeletePrescriptionPermission();

  // Validate prescription ID
  const validatedId = validatePrescriptionId(prescriptionId);

  // Soft delete the record using base-crud utility
  await softDelete('prescriptions', validatedId);
}
