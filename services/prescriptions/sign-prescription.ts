import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validatePrescriptionId, validateCanSignPrescription, validatePrescriptionStatusTransition } from './prescription-validation';
import { validateSignPrescriptionPermission, validatePrescriptionClinicAccess } from './prescription-permissions';
import { Prescription } from './prescription-types';

/**
 * Sign a prescription
 * Transitions status from 'reviewed' to 'signed'
 */
export async function signPrescription(prescriptionId: string): Promise<Prescription> {
  // Validate permissions
  await validateSignPrescriptionPermission();

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

    // Validate that prescription can be signed
    validateCanSignPrescription(currentPrescription.status);

    // Update prescription to signed status
    const { data, error } = await supabase
      .from('prescriptions')
      .update({
        status: 'signed',
        signed_by: user.id,
        signed_at: new Date().toISOString(),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to sign prescription', { error, prescriptionId: validatedId });
      throw new DatabaseError('Failed to sign prescription', { error });
    }

    logger.info('Prescription signed successfully', { prescriptionId: validatedId, signedBy: user.id });
    return data as Prescription;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error signing prescription', { error, prescriptionId: validatedId });
    throw new DatabaseError('Failed to sign prescription', { error });
  }
}
