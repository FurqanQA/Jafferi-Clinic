import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { calculatePagination, createPaginationMetadata } from '../core/pagination';
import { applySorting } from '../core/sorting';
import { logger } from '../shared/logger';
import { validateReadPatientPermission } from './patient-permissions';
import { PatientSearchParams, PatientSearchResult, Patient } from './patient-types';

/**
 * Search patients with filters, sorting, and pagination
 */
export async function searchPatients(params: PatientSearchParams): Promise<PatientSearchResult> {
  // Validate permissions
  await validateReadPatientPermission();

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
      .from('patients')
      .select('*', { count: 'exact' })
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Apply text search if query provided
    if (params.query) {
      const searchTerm = `%${params.query}%`;
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},phone.ilike.${searchTerm},email.ilike.${searchTerm},medical_record_number.ilike.${searchTerm},national_id.ilike.${searchTerm}`);
    }

    // Apply filters
    if (params.filters) {
      const filters = params.filters;

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.gender) {
        query = query.eq('gender', filters.gender);
      }

      if (filters.blood_group) {
        query = query.eq('blood_group', filters.blood_group);
      }

      if (filters.created_from) {
        query = query.gte('created_at', filters.created_from);
      }

      if (filters.created_to) {
        query = query.lte('created_at', filters.created_to);
      }

      // Age filtering (calculated from date_of_birth)
      if (filters.age_min !== undefined || filters.age_max !== undefined) {
        const now = new Date();
        if (filters.age_min !== undefined) {
          const maxDob = new Date(now.getFullYear() - filters.age_min, now.getMonth(), now.getDate()).toISOString();
          query = query.lte('date_of_birth', maxDob);
        }
        if (filters.age_max !== undefined) {
          const minDob = new Date(now.getFullYear() - filters.age_max, now.getMonth(), now.getDate()).toISOString();
          query = query.gte('date_of_birth', minDob);
        }
      }

      // Filter by doctor (requires join with appointments)
      if (filters.doctor_id) {
        // This would require a more complex query with joins
        // For now, we'll skip this or implement via RPC
        logger.warn('Doctor filter not implemented in basic search', { doctorId: filters.doctor_id });
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
      last_visit: 'created_at', // Would need join with appointments
      age: 'date_of_birth',
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
      logger.error('Failed to search patients', { error, clinicId, params });
      throw new DatabaseError('Failed to search patients', { error });
    }

    const total = count || 0;
    const paginationMetadata = createPaginationMetadata(total, pagination);

    return {
      data: (data || []) as Patient[],
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
    logger.error('Unexpected error searching patients', { error, clinicId, params });
    throw new DatabaseError('Failed to search patients', { error });
  }
}
