import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { calculatePagination, createPaginationMetadata } from '../core/pagination';
import { applySorting } from '../core/sorting';
import { logger } from '../shared/logger';
import { validateReadDoctorPermission } from './doctor-permissions';
import { DoctorSearchParams, DoctorSearchResult, Doctor } from './doctor-types';

/**
 * Search doctors with filters, sorting, and pagination
 */
export async function searchDoctors(params: DoctorSearchParams): Promise<DoctorSearchResult> {
  // Validate permissions
  await validateReadDoctorPermission();

  // Calculate pagination
  const pagination = calculatePagination({
    page: params.page,
    pageSize: params.pageSize,
  });

  // Get clinic ID
  const clinicId = await getUserClinicId();

  const supabase = getSupabaseClient();

  try {
    // Build query
    let query = supabase
      .from('doctors')
      .select('*', { count: 'exact' })
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Apply text search if query provided
    if (params.query) {
      const searchTerm = `%${params.query}%`;
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},license_number.ilike.${searchTerm},specialization.ilike.${searchTerm},department.ilike.${searchTerm},doctor_number.ilike.${searchTerm}`);
    }

    // Apply filters
    if (params.filters) {
      const filters = params.filters;

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.availability) {
        query = query.eq('availability', filters.availability);
      }

      if (filters.specialization) {
        query = query.ilike('specialization', `%${filters.specialization}%`);
      }

      if (filters.department) {
        query = query.ilike('department', `%${filters.department}%`);
      }

      if (filters.gender) {
        query = query.eq('gender', filters.gender);
      }

      // Experience filtering
      if (filters.experience_min !== undefined) {
        query = query.gte('experience_years', filters.experience_min);
      }

      if (filters.experience_max !== undefined) {
        query = query.lte('experience_years', filters.experience_max);
      }

      // Date range filtering
      if (filters.created_from) {
        query = query.gte('created_at', filters.created_from);
      }

      if (filters.created_to) {
        query = query.lte('created_at', filters.created_to);
      }
    }

    // Apply sorting
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder || 'desc';

    // Map sort field to database column
    const sortFieldMap: Record<string, string> = {
      name: 'first_name',
      newest: 'created_at',
      oldest: 'created_at',
      experience: 'experience_years',
      consultation_fee: 'consultation_fee',
      specialization: 'specialization',
    };

    const dbField = sortFieldMap[sortBy] || sortBy;
    query = applySorting(query, [{
      field: dbField,
      direction: sortOrder,
    }]);

    // Apply pagination
    query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to search doctors', { error, clinicId, params });
      throw new DatabaseError('Failed to search doctors', { error });
    }

    const total = count || 0;
    const paginationMetadata = createPaginationMetadata(total, pagination);

    return {
      data: (data || []) as Doctor[],
      total,
      page: paginationMetadata.page,
      pageSize: paginationMetadata.pageSize,
      totalPages: paginationMetadata.totalPages,
      hasNext: paginationMetadata.hasNext,
      hasPrevious: paginationMetadata.hasPrevious,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error searching doctors', { error, clinicId, params });
    throw new DatabaseError('Failed to search doctors', { error });
  }
}
