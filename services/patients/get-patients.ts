import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { calculatePagination, createPaginationMetadata } from '../core/pagination';
import { applySorting } from '../core/sorting';
import { logger } from '../shared/logger';
import { validateReadPatientPermission } from './patient-permissions';
import { Patient } from './patient-types';

/**
 * Get paginated list of patients
 */
export async function getPatients(params: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  includeDeleted?: boolean;
}): Promise<{
  data: Patient[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}> {
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
      .eq('clinic_id', clinicId);

    // Filter by status if provided
    if (params.status) {
      query = query.eq('status', params.status);
    }

    // Filter out deleted patients unless explicitly requested
    if (!params.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    // Apply sorting
    if (params.sortBy) {
      query = applySorting(query, [{
        field: params.sortBy,
        direction: params.sortOrder || 'asc',
      }]);
    } else {
      // Default sort by created_at desc
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch patients', { error, clinicId });
      throw new DatabaseError('Failed to fetch patients', { error });
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
    logger.error('Unexpected error fetching patients', { error, clinicId });
    throw new DatabaseError('Failed to fetch patients', { error });
  }
}
