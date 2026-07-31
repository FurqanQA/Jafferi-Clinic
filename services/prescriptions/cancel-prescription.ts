import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validatePrescriptionId, validateCanCancelPrescription, validatePrescriptionStatusTransition } from './prescription-validation';
import { validateUpdatePrescriptionPermission, validatePrescriptionClinicAccess } from './prescription-permissions';
import { Prescription } from './prescription-types';

/**
 * Cancel a prescription
 */
export async function cancelPrescription(prescriptionId: string): Promise<Prescription> {
  // Validate permissions
  await validateUpdatePrescriptionPermission();

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

    // Validate that prescription can be cancelled
    validateCanCancelPrescription(currentPrescription.status);

    // Update prescription to cancelled status
    const { data, error } = await supabase
      .from('prescriptions')
      .update({
        status: 'cancelled',
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to cancel prescription', { error, prescriptionId: validatedId });
      throw new DatabaseError('Failed to cancel prescription', { error });
    }

    logger.info('Prescription cancelled successfully', { prescriptionId: validatedId });
    return data as Prescription;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error cancelling prescription', { error, prescriptionId: validatedId });
    throw new DatabaseError('Failed to cancel prescription', { error });
  }
}
