import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { calculatePagination, createPaginationMetadata } from '../core/pagination';
import { applySorting, parseSortParams } from '../core/sorting';
import { validateReadPrescriptionPermission } from './prescription-permissions';
import { PrescriptionFilters, PrescriptionSortBy, PrescriptionSearchParams, PrescriptionSearchResult } from './prescription-types';

/**
 * Search prescriptions with text search, filtering, pagination, and sorting
 */
export async function searchPrescriptions(params: PrescriptionSearchParams): Promise<PrescriptionSearchResult> {
  // Validate permissions
  await validateReadPrescriptionPermission();

  // Get clinic ID
  const clinicId = await getUserClinicId();

  const {
    query,
    filters,
    sortBy = 'prescription_date',
    sortOrder = 'desc',
    page = 1,
    pageSize = 20,
  } = params;

  const supabase = getSupabaseClient();

  try {
    // Build base query with text search
    let dbQuery = supabase
      .from('prescriptions')
      .select(`
        *,
        patients!inner(first_name, last_name),
        doctors!inner(first_name, last_name)
      `, { count: 'exact' })
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Apply text search if query provided
    if (query) {
      dbQuery = dbQuery.or(`prescription_number.ilike.%${query}%,notes.ilike.%${query}%,instructions.ilike.%${query}%`);
    }

    // Apply filters
    if (filters?.status) {
      dbQuery = dbQuery.eq('status', filters.status);
    }

    if (filters?.priority) {
      dbQuery = dbQuery.eq('priority', filters.priority);
    }

    if (filters?.doctor_id) {
      dbQuery = dbQuery.eq('doctor_id', filters.doctor_id);
    }

    if (filters?.patient_id) {
      dbQuery = dbQuery.eq('patient_id', filters.patient_id);
    }

    if (filters?.medical_record_id) {
      dbQuery = dbQuery.eq('medical_record_id', filters.medical_record_id);
    }

    if (filters?.appointment_id) {
      dbQuery = dbQuery.eq('appointment_id', filters.appointment_id);
    }

    if (filters?.date_from) {
      dbQuery = dbQuery.gte('prescription_date', filters.date_from);
    }

    if (filters?.date_to) {
      dbQuery = dbQuery.lte('prescription_date', filters.date_to);
    }

    if (filters?.expiry_from) {
      dbQuery = dbQuery.gte('expiry_date', filters.expiry_from);
    }

    if (filters?.expiry_to) {
      dbQuery = dbQuery.lte('expiry_date', filters.expiry_to);
    }

    if (filters?.refill_allowed !== undefined) {
      dbQuery = dbQuery.eq('refill_allowed', filters.refill_allowed);
    }

    if (filters?.follow_up_required !== undefined) {
      dbQuery = dbQuery.eq('follow_up_required', filters.follow_up_required);
    }

    // Calculate pagination
    const { offset, limit } = calculatePagination({ page, pageSize });

    // Apply sorting
    const sortParams = parseSortParams({ sortBy, sortOrder });
    dbQuery = applySorting(dbQuery, sortParams);

    // Apply pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to search prescriptions', { error, params });
      throw new DatabaseError('Failed to search prescriptions', { error });
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
    logger.error('Unexpected error searching prescriptions', { error, params });
    throw new DatabaseError('Failed to search prescriptions', { error });
  }
}
