import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { calculatePagination, createPaginationMetadata } from '../core/pagination';
import { applySorting, parseSortParams } from '../core/sorting';
import { buildTextSearch, applyQueryFilters } from '../core/search-builder';
import { logger } from '../shared/logger';
import { validateReadAppointmentPermission } from './appointment-permissions';
import { Appointment, AppointmentSearchParams, AppointmentSearchResult } from './appointment-types';

/**
 * Search appointments with text query and filters
 */
export async function searchAppointments(
  params: AppointmentSearchParams
): Promise<AppointmentSearchResult> {
  // Validate permissions
  await validateReadAppointmentPermission();

  const clinicId = await getUserClinicId();
  const {
    query,
    filters = {},
    sortBy = 'appointment_date',
    sortOrder = 'asc',
    page = 1,
    pageSize = 20,
  } = params;

  const supabase = getSupabaseClient();

  try {
    let dbQuery = supabase
      .from('appointments')
      .select(`
        *,
        patients!inner(first_name, last_name, phone, email),
        doctors!inner(first_name, last_name),
        departments!inner(name)
      `, { count: 'exact' })
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Apply text search if query provided
    if (query) {
      const searchFields = [
        'appointment_number',
        'patients.first_name',
        'patients.last_name',
        'patients.phone',
        'patients.email',
        'doctors.first_name',
        'doctors.last_name',
        'departments.name',
        'reason_for_visit',
      ];
      dbQuery = buildTextSearch(dbQuery, query, searchFields);
    }

    // Apply filters
    const filterMap: Record<string, unknown> = {};

    if (filters.status) {
      filterMap.status = filters.status;
    }

    if (filters.appointment_type) {
      filterMap.appointment_type = filters.appointment_type;
    }

    if (filters.visit_type) {
      filterMap.visit_type = filters.visit_type;
    }

    if (filters.priority) {
      filterMap.priority = filters.priority;
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
      filterMap.appointment_date_gte = filters.date_from;
    }

    if (filters.date_to) {
      filterMap.appointment_date_lte = filters.date_to;
    }

    // Apply date range filters
    if (filters.today) {
      const today = new Date().toISOString().split('T')[0];
      filterMap.appointment_date = today;
    }

    if (filters.tomorrow) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      filterMap.appointment_date = tomorrowStr;
    }

    if (filters.this_week) {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      filterMap.appointment_date_gte = startOfWeek.toISOString().split('T')[0];
      filterMap.appointment_date_lte = endOfWeek.toISOString().split('T')[0];
    }

    if (filters.this_month) {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      filterMap.appointment_date_gte = startOfMonth.toISOString().split('T')[0];
      filterMap.appointment_date_lte = endOfMonth.toISOString().split('T')[0];
    }

    if (filters.upcoming) {
      const today = new Date().toISOString().split('T')[0];
      filterMap.appointment_date_gte = today;
    }

    if (filters.past) {
      const today = new Date().toISOString().split('T')[0];
      filterMap.appointment_date_lt = today;
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
      logger.error('Failed to search appointments', { error, params });
      throw new DatabaseError('Failed to search appointments', { error });
    }

    const total = count || 0;
    const paginationMetadata = createPaginationMetadata(total, pagination);

    return {
      data: (data || []) as Appointment[],
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
    logger.error('Unexpected error searching appointments', { error, params });
    throw new DatabaseError('Failed to search appointments', { error });
  }
}
