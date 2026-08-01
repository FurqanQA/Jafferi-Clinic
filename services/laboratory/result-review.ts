import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReviewResultsPermission, validateApproveResultsPermission } from './laboratory-permissions';
import { ResultReview } from './laboratory-types';

/**
 * Create result review record
 */
export async function createResultReview(labOrderId: string, reviewNotes?: string): Promise<ResultReview> {
  await validateReviewResultsPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('result_reviews')
      .insert({
        lab_order_id: labOrderId,
        clinic_id: clinicId,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes,
        verification_status: 'verified',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create result review', { error, labOrderId });
      throw new DatabaseError('Failed to create result review', { error });
    }

    logger.info('Result review created successfully', { reviewId: data.id });
    return data as ResultReview;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating result review', { error, labOrderId });
    throw new DatabaseError('Failed to create result review', { error });
  }
}

/**
 * Get result review by lab order ID
 */
export async function getResultReviewByLabOrder(labOrderId: string): Promise<ResultReview> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('result_reviews')
      .select('*')
      .eq('lab_order_id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Failed to fetch result review by lab order', { error, labOrderId });
      throw new DatabaseError('Failed to fetch result review by lab order', { error });
    }

    if (!data) {
      throw new NotFoundError('Result review not found');
    }

    return data as ResultReview;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching result review by lab order', { error, labOrderId });
    throw new DatabaseError('Failed to fetch result review by lab order', { error });
  }
}

/**
 * Get result review by ID
 */
export async function getResultReviewById(reviewId: string): Promise<ResultReview> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('result_reviews')
      .select('*')
      .eq('id', reviewId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Failed to fetch result review', { error, reviewId });
      throw new DatabaseError('Failed to fetch result review', { error });
    }

    if (!data) {
      throw new NotFoundError('Result review not found');
    }

    return data as ResultReview;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching result review', { error, reviewId });
    throw new DatabaseError('Failed to fetch result review', { error });
  }
}

/**
 * Update result review
 */
export async function updateResultReview(reviewId: string, reviewNotes?: string): Promise<ResultReview> {
  await validateReviewResultsPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('result_reviews')
      .update({
        review_notes: reviewNotes,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update result review', { error, reviewId });
      throw new DatabaseError('Failed to update result review', { error });
    }

    if (!data) {
      throw new NotFoundError('Result review not found');
    }

    logger.info('Result review updated successfully', { reviewId });
    return data as ResultReview;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating result review', { error, reviewId });
    throw new DatabaseError('Failed to update result review', { error });
  }
}

/**
 * Approve result review
 */
export async function approveResultReview(reviewId: string, electronicSignature?: string): Promise<ResultReview> {
  await validateApproveResultsPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('result_reviews')
      .update({
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        electronic_signature: electronicSignature,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to approve result review', { error, reviewId });
      throw new DatabaseError('Failed to approve result review', { error });
    }

    if (!data) {
      throw new NotFoundError('Result review not found');
    }

    logger.info('Result review approved successfully', { reviewId });
    return data as ResultReview;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error approving result review', { error, reviewId });
    throw new DatabaseError('Failed to approve result review', { error });
  }
}

/**
 * Reject result review
 */
export async function rejectResultReview(reviewId: string, reviewNotes: string): Promise<ResultReview> {
  await validateReviewResultsPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('result_reviews')
      .update({
        verification_status: 'rejected',
        review_notes: reviewNotes,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to reject result review', { error, reviewId });
      throw new DatabaseError('Failed to reject result review', { error });
    }

    if (!data) {
      throw new NotFoundError('Result review not found');
    }

    logger.info('Result review rejected successfully', { reviewId });
    return data as ResultReview;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error rejecting result review', { error, reviewId });
    throw new DatabaseError('Failed to reject result review', { error });
  }
}

/**
 * Get pending result reviews
 */
export async function getPendingResultReviews(): Promise<ResultReview[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('result_reviews')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('verification_status', 'pending')
      .is('deleted_at', null)
      .order('reviewed_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch pending result reviews', { error });
      throw new DatabaseError('Failed to fetch pending result reviews', { error });
    }

    return (data || []) as ResultReview[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching pending result reviews', { error });
    throw new DatabaseError('Failed to fetch pending result reviews', { error });
  }
}

/**
 * Get result reviews by reviewer
 */
export async function getResultReviewsByReviewer(reviewerId: string): Promise<ResultReview[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('result_reviews')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('reviewed_by', reviewerId)
      .is('deleted_at', null)
      .order('reviewed_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch result reviews by reviewer', { error, reviewerId });
      throw new DatabaseError('Failed to fetch result reviews by reviewer', { error });
    }

    return (data || []) as ResultReview[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching result reviews by reviewer', { error, reviewerId });
    throw new DatabaseError('Failed to fetch result reviews by reviewer', { error });
  }
}

/**
 * Get result reviews by patient
 */
export async function getResultReviewsByPatient(patientId: string): Promise<ResultReview[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('result_reviews')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('reviewed_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch result reviews by patient', { error, patientId });
      throw new DatabaseError('Failed to fetch result reviews by patient', { error });
    }

    return (data || []) as ResultReview[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching result reviews by patient', { error, patientId });
    throw new DatabaseError('Failed to fetch result reviews by patient', { error });
  }
}

/**
 * Generate electronic signature placeholder
 */
export function generateElectronicSignature(userId: string): string {
  // TODO: Implement secure electronic signature generation
  return `SIG-${Date.now()}-${userId.substring(0, 8)}`;
}

/**
 * Verify electronic signature placeholder
 */
export function verifyElectronicSignature(signature: string): boolean {
  // TODO: Implement secure electronic signature verification
  logger.info('Electronic signature verification placeholder', { signature });
  return true;
}
