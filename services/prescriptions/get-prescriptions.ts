import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { calculatePagination, createPaginationMetadata } from '../core/pagination';
import { applySorting, parseSortParams } from '../core/sorting';
import { validateReadPrescriptionPermission } from './prescription-permissions';
import { PrescriptionFilters, PrescriptionSortBy, PrescriptionSearchResult } from './prescription-types';

/**
 * Get paginated list of prescriptions with filtering and sorting
 */
export async function getPrescriptions(params: {
  filters?: PrescriptionFilters;
  sortBy?: PrescriptionSortBy;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}): Promise<PrescriptionSearchResult> {
  // Validate permissions
  await validateReadPrescriptionPermission();

  // Get clinic ID
  const clinicId = await getUserClinicId();

  const {
    filters,
    sortBy = 'prescription_date',
    sortOrder = 'desc',
    page = 1,
    pageSize = 20,
  } = params;

  const supabase = getSupabaseClient();

  try {
    // Build query
    let query = supabase
      .from('prescriptions')
      .select('*', { count: 'exact' })
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters?.doctor_id) {
      query = query.eq('doctor_id', filters.doctor_id);
    }

    if (filters?.patient_id) {
      query = query.eq('patient_id', filters.patient_id);
    }

    if (filters?.medical_record_id) {
      query = query.eq('medical_record_id', filters.medical_record_id);
    }

    if (filters?.appointment_id) {
      query = query.eq('appointment_id', filters.appointment_id);
    }

    if (filters?.date_from) {
      query = query.gte('prescription_date', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('prescription_date', filters.date_to);
    }

    if (filters?.expiry_from) {
      query = query.gte('expiry_date', filters.expiry_from);
    }

    if (filters?.expiry_to) {
      query = query.lte('expiry_date', filters.expiry_to);
    }

    if (filters?.refill_allowed !== undefined) {
      query = query.eq('refill_allowed', filters.refill_allowed);
    }

    if (filters?.follow_up_required !== undefined) {
      query = query.eq('follow_up_required', filters.follow_up_required);
    }

    // Today filter
    if (filters?.today) {
      const today = new Date().toISOString().split('T')[0];
      query = query.eq('prescription_date', today);
    }

    // This week filter
    if (filters?.this_week) {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      query = query.gte('prescription_date', startOfWeek.toISOString().split('T')[0])
                .lte('prescription_date', endOfWeek.toISOString().split('T')[0]);
    }

    // This month filter
    if (filters?.this_month) {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      query = query.gte('prescription_date', startOfMonth.toISOString().split('T')[0])
                .lte('prescription_date', endOfMonth.toISOString().split('T')[0]);
    }

    // Calculate pagination
    const { offset, limit } = calculatePagination({ page, pageSize });

    // Apply sorting
    const sortParams = parseSortParams({ sortBy, sortOrder });
    query = applySorting(query, sortParams);

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch prescriptions', { error, filters });
      throw new DatabaseError('Failed to fetch prescriptions', { error });
    }

    const total = count || 0;
    const paginationMetadata = createPaginationMetadata(total, { offset, limit, page, pageSize });

    return {
      data: (data || []) as any[],
      total,
      page,
      pageSize,
      totalPages: paginationMetadata.totalPages,
      hasNext: paginationMetadata.hasNext,
      hasPrevious: paginationMetadata.hasPrevious,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching prescriptions', { error, filters });
    throw new DatabaseError('Failed to fetch prescriptions', { error });
  }
}
