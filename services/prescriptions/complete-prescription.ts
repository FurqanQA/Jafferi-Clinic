import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validatePrescriptionId, validateCanCompletePrescription, validatePrescriptionStatusTransition } from './prescription-validation';
import { validateCompletePrescriptionPermission, validatePrescriptionClinicAccess } from './prescription-permissions';
import { Prescription } from './prescription-types';

/**
 * Complete a prescription
 * Transitions status from 'dispensed' to 'completed'
 */
export async function completePrescription(prescriptionId: string): Promise<Prescription> {
  // Validate permissions
  await validateCompletePrescriptionPermission();

  // Validate prescription ID
  const validatedId = validatePrescriptionId(prescriptionId);

  // Validate clinic access
  await validatePrescriptionClinicAccess(validatedId);

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

    // Validate that prescription can be completed
    validateCanCompletePrescription(currentPrescription.status);

    // Update prescription to completed status
    const { data, error } = await supabase
      .from('prescriptions')
      .update({
        status: 'completed',
        completed_by: user.id,
        completed_at: new Date().toISOString(),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to complete prescription', { error, prescriptionId: validatedId });
      throw new DatabaseError('Failed to complete prescription', { error });
    }

    logger.info('Prescription completed successfully', { prescriptionId: validatedId, completedBy: user.id });
    return data as Prescription;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error completing prescription', { error, prescriptionId: validatedId });
    throw new DatabaseError('Failed to complete prescription', { error });
  }
}
