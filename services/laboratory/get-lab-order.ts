import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReadLabOrderPermission } from './laboratory-permissions';
import { LabOrder } from './laboratory-types';

/**
 * Get laboratory order by ID
 */
export async function getLabOrderById(labOrderId: string, includeDeleted: boolean = false): Promise<LabOrder> {
  await validateReadLabOrderPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('lab_orders')
      .select('*')
      .eq('id', labOrderId)
      .eq('clinic_id', clinicId);

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query.single();

    if (error) {
      logger.error('Failed to fetch lab order', { error, labOrderId });
      throw new DatabaseError('Failed to fetch lab order', { error });
    }

    if (!data) {
      throw new NotFoundError('Laboratory order not found');
    }

    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching lab order', { error, labOrderId });
    throw new DatabaseError('Failed to fetch lab order', { error });
  }
}

/**
 * Get laboratory order by order number
 */
export async function getLabOrderByNumber(orderNumber: string): Promise<LabOrder> {
  await validateReadLabOrderPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_orders')
      .select('*')
      .eq('order_number', orderNumber)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Failed to fetch lab order by number', { error, orderNumber });
      throw new DatabaseError('Failed to fetch lab order by number', { error });
    }

    if (!data) {
      throw new NotFoundError('Laboratory order not found');
    }

    return data as LabOrder;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching lab order by number', { error, orderNumber });
    throw new DatabaseError('Failed to fetch lab order by number', { error });
  }
}
