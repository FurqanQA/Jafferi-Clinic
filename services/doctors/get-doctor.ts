import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { logger } from '../shared/logger';
import { validateDoctorId } from './doctor-validation';
import { validateReadDoctorPermission, validateDoctorClinicAccess } from './doctor-permissions';
import { Doctor } from './doctor-types';

/**
 * Get a single doctor by ID
 */
export async function getDoctor(doctorId: string, includeDeleted: boolean = false): Promise<Doctor> {
  // Validate permissions
  await validateReadDoctorPermission();

  // Validate doctor ID
  const validatedDoctorId = validateDoctorId(doctorId);

  // Validate clinic access
  await validateDoctorClinicAccess(validatedDoctorId);

  const supabase = getSupabaseClient();

  try {
    // Build query
    let query = supabase
      .from('doctors')
      .select('*')
      .eq('id', validatedDoctorId);

    // Filter out deleted doctors unless explicitly requested
    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query.single();

    if (error) {
      logger.error('Failed to fetch doctor', { error, doctorId: validatedDoctorId });
      throw new DatabaseError('Failed to fetch doctor', { error });
    }

    if (!data) {
      throw new NotFoundError('Doctor not found');
    }

    return data as Doctor;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching doctor', { error, doctorId: validatedDoctorId });
    throw new DatabaseError('Failed to fetch doctor', { error });
  }
}
