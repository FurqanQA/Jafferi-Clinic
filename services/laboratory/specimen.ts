import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateCollectSamplePermission } from './laboratory-permissions';
import { Specimen, SpecimenType, SpecimenStatus } from './laboratory-types';

/**
 * Create specimen record
 */
export async function createSpecimen(input: Partial<Specimen>, labOrderId: string): Promise<Specimen> {
  await validateCollectSamplePermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('specimens')
      .insert({
        ...input,
        lab_order_id: labOrderId,
        clinic_id: clinicId,
        collected_by: user.id,
        specimen_status: input.specimen_status || 'collected',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create specimen record', { error, input });
      throw new DatabaseError('Failed to create specimen record', { error });
    }

    logger.info('Specimen record created successfully', { specimenId: data.id });
    return data as Specimen;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating specimen record', { error, input });
    throw new DatabaseError('Failed to create specimen record', { error });
  }
}

/**
 * Get specimen by ID
 */
export async function getSpecimenById(specimenId: string): Promise<Specimen> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('specimens')
      .select('*')
      .eq('id', specimenId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Failed to fetch specimen', { error, specimenId });
      throw new DatabaseError('Failed to fetch specimen', { error });
    }

    if (!data) {
      throw new NotFoundError('Specimen not found');
    }

    return data as Specimen;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching specimen', { error, specimenId });
    throw new DatabaseError('Failed to fetch specimen', { error });
  }
}

/**
 * Get specimen by lab order ID
 */
export async function getSpecimenByLabOrder(labOrderId: string): Promise<Specimen> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('specimens')
      .select('*')
      .eq('lab_order_id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Failed to fetch specimen by lab order', { error, labOrderId });
      throw new DatabaseError('Failed to fetch specimen by lab order', { error });
    }

    if (!data) {
      throw new NotFoundError('Specimen not found');
    }

    return data as Specimen;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching specimen by lab order', { error, labOrderId });
    throw new DatabaseError('Failed to fetch specimen by lab order', { error });
  }
}

/**
 * Update specimen record
 */
export async function updateSpecimen(specimenId: string, input: Partial<Specimen>): Promise<Specimen> {
  await validateCollectSamplePermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('specimens')
      .update({
        ...input,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', specimenId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update specimen', { error, specimenId });
      throw new DatabaseError('Failed to update specimen', { error });
    }

    if (!data) {
      throw new NotFoundError('Specimen not found');
    }

    logger.info('Specimen updated successfully', { specimenId });
    return data as Specimen;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating specimen', { error, specimenId });
    throw new DatabaseError('Failed to update specimen', { error });
  }
}

/**
 * Update specimen status
 */
export async function updateSpecimenStatus(specimenId: string, status: SpecimenStatus): Promise<Specimen> {
  await validateCollectSamplePermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('specimens')
      .update({
        specimen_status: status,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', specimenId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update specimen status', { error, specimenId, status });
      throw new DatabaseError('Failed to update specimen status', { error });
    }

    if (!data) {
      throw new NotFoundError('Specimen not found');
    }

    logger.info('Specimen status updated successfully', { specimenId, status });
    return data as Specimen;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating specimen status', { error, specimenId, status });
    throw new DatabaseError('Failed to update specimen status', { error });
  }
}

/**
 * Record specimen collection
 */
export async function recordSpecimenCollection(specimenId: string, collectionTime: string): Promise<Specimen> {
  await validateCollectSamplePermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('specimens')
      .update({
        collection_time: collectionTime,
        collected_by: user.id,
        specimen_status: 'collected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', specimenId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to record specimen collection', { error, specimenId });
      throw new DatabaseError('Failed to record specimen collection', { error });
    }

    if (!data) {
      throw new NotFoundError('Specimen not found');
    }

    logger.info('Specimen collection recorded successfully', { specimenId });
    return data as Specimen;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error recording specimen collection', { error, specimenId });
    throw new DatabaseError('Failed to record specimen collection', { error });
  }
}

/**
 * Record specimen receipt
 */
export async function recordSpecimenReceipt(specimenId: string): Promise<Specimen> {
  await validateCollectSamplePermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('specimens')
      .update({
        specimen_status: 'received',
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', specimenId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to record specimen receipt', { error, specimenId });
      throw new DatabaseError('Failed to record specimen receipt', { error });
    }

    if (!data) {
      throw new NotFoundError('Specimen not found');
    }

    logger.info('Specimen receipt recorded successfully', { specimenId });
    return data as Specimen;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error recording specimen receipt', { error, specimenId });
    throw new DatabaseError('Failed to record specimen receipt', { error });
  }
}

/**
 * Get specimens by type
 */
export async function getSpecimensByType(specimenType: SpecimenType): Promise<Specimen[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('specimens')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('specimen_type', specimenType)
      .is('deleted_at', null)
      .order('collection_time', { ascending: false });

    if (error) {
      logger.error('Failed to fetch specimens by type', { error, specimenType });
      throw new DatabaseError('Failed to fetch specimens by type', { error });
    }

    return (data || []) as Specimen[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching specimens by type', { error, specimenType });
    throw new DatabaseError('Failed to fetch specimens by type', { error });
  }
}

/**
 * Get specimens by status
 */
export async function getSpecimensByStatus(specimenStatus: SpecimenStatus): Promise<Specimen[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('specimens')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('specimen_status', specimenStatus)
      .is('deleted_at', null)
      .order('collection_time', { ascending: false });

    if (error) {
      logger.error('Failed to fetch specimens by status', { error, specimenStatus });
      throw new DatabaseError('Failed to fetch specimens by status', { error });
    }

    return (data || []) as Specimen[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching specimens by status', { error, specimenStatus });
    throw new DatabaseError('Failed to fetch specimens by status', { error });
  }
}

/**
 * Get specimens by patient
 */
export async function getSpecimensByPatient(patientId: string): Promise<Specimen[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('specimens')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('collection_time', { ascending: false });

    if (error) {
      logger.error('Failed to fetch specimens by patient', { error, patientId });
      throw new DatabaseError('Failed to fetch specimens by patient', { error });
    }

    return (data || []) as Specimen[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching specimens by patient', { error, patientId });
    throw new DatabaseError('Failed to fetch specimens by patient', { error });
  }
}

/**
 * Generate specimen barcode
 */
export function generateSpecimenBarcode(): string {
  return `SPEC-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

/**
 * Validate specimen integrity
 */
export function validateSpecimenIntegrity(specimen: Specimen): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check if collection time is set
  if (!specimen.collection_time) {
    issues.push('Collection time not recorded');
  }

  // Check if specimen is expired (24 hours after collection)
  if (specimen.collection_time && specimen.specimen_status === 'collected') {
    const collectionDate = new Date(specimen.collection_time);
    const now = new Date();
    const hoursSinceCollection = (now.getTime() - collectionDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCollection > 24) {
      issues.push('Specimen has expired');
    }
  }

  // Check if specimen is rejected
  if (specimen.specimen_status === 'rejected') {
    issues.push('Specimen was rejected');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
