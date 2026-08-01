import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateRestoreLabOrderPermission, validateManageLabOrderAccess } from './laboratory-permissions';
import { LabOrder } from './laboratory-types';

/**
 * Restore archived laboratory order
 */
export async function restoreLabOrder(labOrderId: string): Promise<LabOrder> {
  await validateRestoreLabOrderPermission();
  await validateManageLabOrderAccess(labOrderId);

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch current lab order (including archived)
    const { data: currentOrder, error: fetchError } = await supabase
      .from('lab_orders')
      .select('*')
      .eq('id', labOrderId)
      .eq('clinic_id', clinicId)
      .single();

    if (fetchError || !currentOrder) {
      throw new NotFoundError('Laboratory order not found');
    }

    // Update lab order to restore
    const { data, error } = await supabase
      .from('lab_orders')
      .update({
        status: 'approved',
        is_active: true,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        version_number: (currentOrder.version_number || 0) + 1,
      })
      .eq('id', labOrderId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to restore lab order', { error, labOrderId });
      throw new DatabaseError('Failed to restore lab order', { error });
    }

    logger.info('Lab order restored successfully', { labOrderId });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error restoring lab order', { error, labOrderId });
    throw new DatabaseError('Failed to restore lab order', { error });
  }
}
