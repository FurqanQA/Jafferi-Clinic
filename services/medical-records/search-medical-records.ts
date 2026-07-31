import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { calculatePagination, createPaginationMetadata } from '../core/pagination';
import { applySorting, parseSortParams } from '../core/sorting';
import { buildTextSearch, applyQueryFilters } from '../core/search-builder';
import { logger } from '../shared/logger';
import { validateReadMedicalRecordPermission } from './medical-record-permissions';
import { MedicalRecord, MedicalRecordSearchParams, MedicalRecordSearchResult } from './medical-record-types';

/**
 * Search medical records with text query and filters
 */
export async function searchMedicalRecords(
  params: MedicalRecordSearchParams
): Promise<MedicalRecordSearchResult> {
  // Validate permissions
  await validateReadMedicalRecordPermission();

  const clinicId = await getUserClinicId();
  const {
    query,
    filters = {},
    sortBy = 'visit_date',
    sortOrder = 'desc',
    page = 1,
    pageSize = 20,
  } = params;

  const supabase = getSupabaseClient();

  try {
    let dbQuery = supabase
      .from('medical_records')
      .select(`
        *,
        patients!inner(first_name, last_name),
        doctors!inner(first_name, last_name),
        departments!inner(name)
      `, { count: 'exact' })
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Apply text search if query provided
    if (query) {
      const searchFields = [
        'medical_record_number',
        'patients.first_name',
        'patients.last_name',
        'doctors.first_name',
        'doctors.last_name',
        'departments.name',
        'chief_complaint->primary_complaint',
        'diagnosis->primary_diagnosis',
        'diagnosis->icd_10_code',
        'reason_for_visit',
      ];
      dbQuery = buildTextSearch(dbQuery, query, searchFields);
    }

    // Apply filters
    const filterMap: Record<string, unknown> = {};

    if (filters.status) {
      filterMap.status = filters.status;
    }

    if (filters.visit_type) {
      filterMap.visit_type = filters.visit_type;
    }

    if (filters.doctor_id) {
      filterMap.doctor_id = filters.doctor_id;
    }

    if (filters.patient_id) {
      filterMap.patient_id = filters.patient_id;
    }

    if (filters.department_id) {
      filterMap.department_id = filters.department_id;
    }

    if (filters.date_from) {
      filterMap.visit_date_gte = filters.date_from;
    }

    if (filters.date_to) {
      filterMap.visit_date_lte = filters.date_to;
    }

    if (filters.diagnosis) {
      filterMap.diagnosis_contains = filters.diagnosis;
    }

    if (Object.keys(filterMap).length > 0) {
      dbQuery = applyQueryFilters(dbQuery, filterMap);
    }

    // Apply sorting
    const sortFields = parseSortParams({ sortBy, sortOrder });
    dbQuery = applySorting(dbQuery, sortFields);

    // Calculate pagination
    const pagination = calculatePagination({ page, pageSize });
    const { offset, limit } = pagination;

    // Apply pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to search medical records', { error, params });
      throw new DatabaseError('Failed to search medical records', { error });
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
    logger.error('Unexpected error searching medical records', { error, params });
    throw new DatabaseError('Failed to search medical records', { error });
  }
}
