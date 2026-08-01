import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReadLabOrderPermission } from './laboratory-permissions';
import { LabOrder, LabOrderFilters, LabOrderStatus, LabPriority } from './laboratory-types';

/**
 * Get laboratory orders with filtering and pagination
 */
export async function getLabOrders(filters: LabOrderFilters = {}): Promise<{
  data: LabOrder[];
  total: number;
  page: number;
  limit: number;
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

    // Apply filters
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
      logger.error('Failed to count lab orders', { error: countError });
      throw new DatabaseError('Failed to count lab orders', { error: countError });
    }

    // Apply pagination
    const page = 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    // Apply sorting
    const sortBy = 'order_date';
    const sortOrder = 'desc';
    query = query.order(sortBy, { ascending: false });

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch lab orders', { error });
      throw new DatabaseError('Failed to fetch lab orders', { error });
    }

    return {
      data: (data || []) as LabOrder[],
      total: count || 0,
      page,
      limit,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching lab orders', { error });
    throw new DatabaseError('Failed to fetch lab orders', { error });
  }
}

/**
 * Get laboratory orders by patient
 */
export async function getLabOrdersByPatient(patientId: string): Promise<LabOrder[]> {
  await validateReadLabOrderPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_orders')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('order_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch lab orders by patient', { error, patientId });
      throw new DatabaseError('Failed to fetch lab orders by patient', { error });
    }

    return (data || []) as LabOrder[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching lab orders by patient', { error, patientId });
    throw new DatabaseError('Failed to fetch lab orders by patient', { error });
  }
}

/**
 * Get laboratory orders by doctor
 */
export async function getLabOrdersByDoctor(doctorId: string): Promise<LabOrder[]> {
  await validateReadLabOrderPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_orders')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('doctor_id', doctorId)
      .is('deleted_at', null)
      .order('order_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch lab orders by doctor', { error, doctorId });
      throw new DatabaseError('Failed to fetch lab orders by doctor', { error });
    }

    return (data || []) as LabOrder[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching lab orders by doctor', { error, doctorId });
    throw new DatabaseError('Failed to fetch lab orders by doctor', { error });
  }
}

/**
 * Get laboratory orders by status
 */
export async function getLabOrdersByStatus(status: LabOrderStatus): Promise<LabOrder[]> {
  await validateReadLabOrderPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_orders')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('status', status)
      .is('deleted_at', null)
      .order('order_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch lab orders by status', { error, status });
      throw new DatabaseError('Failed to fetch lab orders by status', { error });
    }

    return (data || []) as LabOrder[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching lab orders by status', { error, status });
    throw new DatabaseError('Failed to fetch lab orders by status', { error });
  }
}

/**
 * Get laboratory orders by priority
 */
export async function getLabOrdersByPriority(priority: LabPriority): Promise<LabOrder[]> {
  await validateReadLabOrderPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_orders')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('priority', priority)
      .is('deleted_at', null)
      .order('order_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch lab orders by priority', { error, priority });
      throw new DatabaseError('Failed to fetch lab orders by priority', { error });
    }

    return (data || []) as LabOrder[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching lab orders by priority', { error, priority });
    throw new DatabaseError('Failed to fetch lab orders by priority', { error });
  }
}
