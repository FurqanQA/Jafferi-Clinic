import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateArchiveLabOrderPermission, validateManageLabOrderAccess } from './laboratory-permissions';
import { validateStatusTransition } from './laboratory-validation';
import { LabOrder, LAB_ORDER_STATUS } from './laboratory-types';

/**
 * Archive laboratory order
 */
export async function archiveLabOrder(labOrderId: string): Promise<LabOrder> {
  await validateArchiveLabOrderPermission();
  await validateManageLabOrderAccess(labOrderId);

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch current lab order
    const { data: currentOrder, error: fetchError } = await supabase
      .from('lab_orders')
      .select('*')
      .eq('id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !currentOrder) {
      throw new NotFoundError('Laboratory order not found');
    }

    // Validate status transition
    validateStatusTransition(currentOrder.status, LAB_ORDER_STATUS.ARCHIVED);

    // Update lab order
    const { data, error } = await supabase
      .from('lab_orders')
      .update({
        status: LAB_ORDER_STATUS.ARCHIVED,
        is_active: false,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        version_number: (currentOrder.version_number || 0) + 1,
      })
      .eq('id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to archive lab order', { error, labOrderId });
      throw new DatabaseError('Failed to archive lab order', { error });
    }

    logger.info('Lab order archived successfully', { labOrderId });
    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error archiving lab order', { error, labOrderId });
    throw new DatabaseError('Failed to archive lab order', { error });
  }
}
