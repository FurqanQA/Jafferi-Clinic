import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { calculatePagination, createPaginationMetadata } from '../core/pagination';
import { applySorting, parseSortParams } from '../core/sorting';
import { logger } from '../shared/logger';
import { validateReadMedicalRecordPermission } from './medical-record-permissions';
import { MedicalRecord, MedicalRecordFilters, MedicalRecordSortBy } from './medical-record-types';

/**
 * Get paginated list of medical records with filtering and sorting
 */
export async function getMedicalRecords(params: {
  filters?: MedicalRecordFilters;
  sortBy?: MedicalRecordSortBy;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  includeDeleted?: boolean;
}): Promise<{
  data: MedicalRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}> {
  // Validate permissions
  await validateReadMedicalRecordPermission();

  const clinicId = await getUserClinicId();
  const {
    filters = {},
    sortBy = 'visit_date',
    sortOrder = 'desc',
    page = 1,
    pageSize = 20,
    includeDeleted = false,
  } = params;

  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('medical_records')
      .select('*', { count: 'exact' })
      .eq('clinic_id', clinicId);

    // Apply soft delete filter
    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.visit_type) {
      query = query.eq('visit_type', filters.visit_type);
    }

    if (filters.doctor_id) {
      query = query.eq('doctor_id', filters.doctor_id);
    }

    if (filters.patient_id) {
      query = query.eq('patient_id', filters.patient_id);
    }

    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id);
    }

    if (filters.appointment_id) {
      query = query.eq('appointment_id', filters.appointment_id);
    }

    if (filters.date_from) {
      query = query.gte('visit_date', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('visit_date', filters.date_to);
    }

    // Apply date range filters
    if (filters.today) {
      const today = new Date().toISOString().split('T')[0];
      query = query.eq('visit_date', today);
    }

    if (filters.this_week) {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      query = query.gte('visit_date', startOfWeek.toISOString().split('T')[0])
                 .lte('visit_date', endOfWeek.toISOString().split('T')[0]);
    }

    if (filters.this_month) {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      query = query.gte('visit_date', startOfMonth.toISOString().split('T')[0])
                 .lte('visit_date', endOfMonth.toISOString().split('T')[0]);
    }

    // Apply diagnosis filter (JSONB)
    if (filters.diagnosis) {
      query = query.contains('diagnosis', { primary_diagnosis: filters.diagnosis });
    }

    // Apply sorting
    const sortFields = parseSortParams({ sortBy, sortOrder });
    query = applySorting(query, sortFields);

    // Calculate pagination
    const pagination = calculatePagination({ page, pageSize });
    const { offset, limit } = pagination;

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch medical records', { error, filters });
      throw new DatabaseError('Failed to fetch medical records', { error });
    }

    const total = count || 0;
    const paginationMetadata = createPaginationMetadata(total, pagination);

    return {
      data: (data || []) as MedicalRecord[],
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
    logger.error('Unexpected error fetching medical records', { error, filters });
    throw new DatabaseError('Failed to fetch medical records', { error });
  }
}
