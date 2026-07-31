import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validatePrescriptionId, validateUpdatePrescription, validateExpiryDateAfterIssueDate, validateRefillCount } from './prescription-validation';
import { validateUpdatePrescriptionPermission, validatePrescriptionClinicAccess, validateManagePrescriptionAccess } from './prescription-permissions';
import { calculateDosage } from './dosage';
import { validateMedicationAllergies } from './allergies';
import { UpdatePrescriptionInput, Prescription } from './prescription-types';

/**
 * Update an existing prescription
 */
export async function updatePrescription(
  prescriptionId: string,
  input: UpdatePrescriptionInput
): Promise<Prescription> {
  // Validate permissions
  await validateUpdatePrescriptionPermission();

  // Validate prescription ID
  const validatedId = validatePrescriptionId(prescriptionId);

  // Validate clinic access
  await validatePrescriptionClinicAccess(validatedId);

  // Validate user can manage this specific prescription
  await validateManagePrescriptionAccess(validatedId);

  // Validate input
  const validatedInput = validateUpdatePrescription(input) as UpdatePrescriptionInput;

  // Get user
  const user = await getCurrentUser();

  const supabase = getSupabaseClient();

  try {
    // Get current prescription
    const { data: currentPrescription, error: fetchError } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', validatedId)
      .single();

    if (fetchError || !currentPrescription) {
      throw new NotFoundError('Prescription not found');
    }

    // Check if prescription can be updated (signed prescriptions cannot be updated)
    if (currentPrescription.status === 'signed' || currentPrescription.status === 'dispensed' || currentPrescription.status === 'completed') {
      throw new Error('Cannot update signed, dispensed, or completed prescriptions');
    }

    // Validate dates if provided
    if (validatedInput.prescription_date) {
      const { validatePrescriptionDateNotPast } = await import('./prescription-validation');
      validatePrescriptionDateNotPast(validatedInput.prescription_date);
    }

    if (validatedInput.issue_date && validatedInput.expiry_date) {
      validateExpiryDateAfterIssueDate(validatedInput.issue_date, validatedInput.expiry_date);
    }

    // Validate refill settings if provided
    if (validatedInput.refill_allowed !== undefined || validatedInput.refill_count !== undefined) {
      const refillAllowed = validatedInput.refill_allowed ?? currentPrescription.refill_allowed;
      const refillCount = validatedInput.refill_count ?? currentPrescription.refill_count;
      validateRefillCount(refillCount, refillAllowed);
    }

    // Validate medicines if provided
    if (validatedInput.medicines) {
      for (const medicine of validatedInput.medicines) {
        const dosageCalc = calculateDosage(medicine);
        if (!dosageCalc.is_valid) {
          throw new Error(`Invalid dosage for ${medicine.medicine_name}: ${dosageCalc.errors?.join(', ')}`);
        }
      }

      // Check allergies for new medicines
      const medicineNames = validatedInput.medicines.map(m => m.medicine_name);
      const allergyCheck = await validateMedicationAllergies(medicineNames, currentPrescription.patient_id);
      if (allergyCheck.hasAllergies) {
        const warnings = allergyCheck.warnings.map(w => `${w.medicine} - ${w.allergen} (${w.severity})`).join(', ');
        throw new Error(`Allergy conflicts detected: ${warnings}`);
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      ...validatedInput,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    // Update refill remaining if refill settings changed
    if (validatedInput.refill_allowed !== undefined || validatedInput.refill_count !== undefined) {
      const refillAllowed = validatedInput.refill_allowed ?? currentPrescription.refill_allowed;
      const refillCount = validatedInput.refill_count ?? currentPrescription.refill_count;
      updateData.refill_remaining = refillAllowed ? refillCount : 0;
    }

    // Update prescription
    const { data, error } = await supabase
      .from('prescriptions')
      .update(updateData)
      .eq('id', validatedId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update prescription', { error, prescriptionId: validatedId });
      throw new DatabaseError('Failed to update prescription', { error });
    }

    logger.info('Prescription updated successfully', { prescriptionId: validatedId });
    return data as Prescription;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating prescription', { error, prescriptionId: validatedId });
    throw new DatabaseError('Failed to update prescription', { error });
  }
}
