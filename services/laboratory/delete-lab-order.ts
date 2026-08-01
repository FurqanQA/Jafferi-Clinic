import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateDeleteLabOrderPermission, validateManageLabOrderAccess } from './laboratory-permissions';
import { LabOrder } from './laboratory-types';

/**
 * Delete laboratory order (soft delete)
 */
export async function deleteLabOrder(labOrderId: string): Promise<void> {
  await validateDeleteLabOrderPermission();
  await validateManageLabOrderAccess(labOrderId);

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('lab_orders')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    if (error) {
      logger.error('Failed to delete lab order', { error, labOrderId });
      throw new DatabaseError('Failed to delete lab order', { error });
    }

    logger.info('Lab order deleted successfully', { labOrderId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting lab order', { error, labOrderId });
    throw new DatabaseError('Failed to delete lab order', { error });
  }
}
