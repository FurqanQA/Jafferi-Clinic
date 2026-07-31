import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validatePrescriptionId, validateCanArchivePrescription, validatePrescriptionStatusTransition } from './prescription-validation';
import { validateArchivePrescriptionPermission, validatePrescriptionClinicAccess } from './prescription-permissions';
import { Prescription } from './prescription-types';

/**
 * Archive a prescription
 * Transitions status from 'completed', 'cancelled', or 'expired' to 'archived'
 */
export async function archivePrescription(prescriptionId: string): Promise<Prescription> {
  // Validate permissions
  await validateArchivePrescriptionPermission();

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

    // Validate that prescription can be archived
    validateCanArchivePrescription(currentPrescription.status);

    // Update prescription to archived status
    const { data, error } = await supabase
      .from('prescriptions')
      .update({
        status: 'archived',
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to archive prescription', { error, prescriptionId: validatedId });
      throw new DatabaseError('Failed to archive prescription', { error });
    }

    logger.info('Prescription archived successfully', { prescriptionId: validatedId });
    return data as Prescription;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error archiving prescription', { error, prescriptionId: validatedId });
    throw new DatabaseError('Failed to archive prescription', { error });
  }
}
