import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReadLabOrderPermission } from './laboratory-permissions';
import { LabOrder, LabSearchParams } from './laboratory-types';

/**
 * Search laboratory orders with text search and filtering
 */
export async function searchLabOrders(params: LabSearchParams): Promise<{
  data: LabOrder[];
  total: number;
}> {
  await validateReadLabOrderPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('lab_orders')
      .select('*', { count: 'exact' })
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Apply text search if provided
    if (params.query) {
      query = query.or(
        `order_number.ilike.%${params.query}%,clinical_notes.ilike.%${params.query}%,diagnosis.ilike.%${params.query}%,reason_for_test.ilike.%${params.query}%`
      );
    }

    // Apply filters from filters object
    const filters = params.filters || {};

    if (filters.patient_id) {
      query = query.eq('patient_id', filters.patient_id);
    }

    if (filters.doctor_id) {
      query = query.eq('doctor_id', filters.doctor_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.department) {
      query = query.eq('department', filters.department);
    }

    if (filters.specimen_type) {
      query = query.eq('specimen.specimen_type', filters.specimen_type);
    }

    if (filters.date_from) {
      query = query.gte('order_date', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('order_date', filters.date_to);
    }

    if (filters.collection_date_from) {
      query = query.gte('collection_date', filters.collection_date_from);
    }

    if (filters.collection_date_to) {
      query = query.lte('collection_date', filters.collection_date_to);
    }

    if (filters.completion_date_from) {
      query = query.gte('completion_date', filters.completion_date_from);
    }

    if (filters.completion_date_to) {
      query = query.lte('completion_date', filters.completion_date_to);
    }

    // Get total count
    const { count, error: countError } = await query;

    if (countError) {
      logger.error('Failed to count search results', { error: countError });
      throw new DatabaseError('Failed to count search results', { error: countError });
    }

    // Apply pagination
    const page = params.page || 1;
    const limit = params.pageSize || 50;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    // Apply sorting
    const sortBy = params.sortBy || 'order_date';
    const sortOrder = params.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to search lab orders', { error });
      throw new DatabaseError('Failed to search lab orders', { error });
    }

    return {
      data: (data || []) as LabOrder[],
      total: count || 0,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error searching lab orders', { error });
    throw new DatabaseError('Failed to search lab orders', { error });
  }
}
