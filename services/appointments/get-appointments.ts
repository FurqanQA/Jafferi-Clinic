import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { calculatePagination, createPaginationMetadata } from '../core/pagination';
import { applySorting, parseSortParams } from '../core/sorting';
import { logger } from '../shared/logger';
import { validateReadAppointmentPermission } from './appointment-permissions';
import { Appointment, AppointmentFilters, AppointmentSortBy } from './appointment-types';

/**
 * Get paginated list of appointments with filtering and sorting
 */
export async function getAppointments(params: {
  filters?: AppointmentFilters;
  sortBy?: AppointmentSortBy;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  includeDeleted?: boolean;
}): Promise<{
  data: Appointment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}> {
  // Validate permissions
  await validateReadAppointmentPermission();

  const clinicId = await getUserClinicId();
  const {
    filters = {},
    sortBy = 'appointment_date',
    sortOrder = 'asc',
    page = 1,
    pageSize = 20,
    includeDeleted = false,
  } = params;

  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('appointments')
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

    if (filters.appointment_type) {
      query = query.eq('appointment_type', filters.appointment_type);
    }

    if (filters.visit_type) {
      query = query.eq('visit_type', filters.visit_type);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
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

    if (filters.date_from) {
      query = query.gte('appointment_date', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('appointment_date', filters.date_to);
    }

    // Apply date range filters
    if (filters.today) {
      const today = new Date().toISOString().split('T')[0];
      query = query.eq('appointment_date', today);
    }

    if (filters.tomorrow) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      query = query.eq('appointment_date', tomorrowStr);
    }

    if (filters.this_week) {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      query = query.gte('appointment_date', startOfWeek.toISOString().split('T')[0])
                 .lte('appointment_date', endOfWeek.toISOString().split('T')[0]);
    }

    if (filters.this_month) {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      query = query.gte('appointment_date', startOfMonth.toISOString().split('T')[0])
                 .lte('appointment_date', endOfMonth.toISOString().split('T')[0]);
    }

    if (filters.upcoming) {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('appointment_date', today);
    }

    if (filters.past) {
      const today = new Date().toISOString().split('T')[0];
      query = query.lt('appointment_date', today);
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
      logger.error('Failed to fetch appointments', { error, filters });
      throw new DatabaseError('Failed to fetch appointments', { error });
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
    logger.error('Unexpected error fetching appointments', { error, filters });
    throw new DatabaseError('Failed to fetch appointments', { error });
  }
}
