import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateManageTemplatePermission } from './laboratory-permissions';
import { ReferenceRange, ReferenceRangeType } from './laboratory-types';

/**
 * Get reference range by test ID
 */
export async function getReferenceRangeByTestId(testId: string): Promise<ReferenceRange[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('reference_ranges')
      .select('*')
      .eq('test_id', testId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .order('range_type', { ascending: true });

    if (error) {
      logger.error('Failed to fetch reference ranges by test ID', { error, testId });
      throw new DatabaseError('Failed to fetch reference ranges by test ID', { error });
    }

    return (data || []) as ReferenceRange[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching reference ranges by test ID', { error, testId });
    throw new DatabaseError('Failed to fetch reference ranges by test ID', { error });
  }
}

/**
 * Get reference range by ID
 */
export async function getReferenceRangeById(rangeId: string): Promise<ReferenceRange> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('reference_ranges')
      .select('*')
      .eq('id', rangeId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Failed to fetch reference range', { error, rangeId });
      throw new DatabaseError('Failed to fetch reference range', { error });
    }

    if (!data) {
      throw new NotFoundError('Reference range not found');
    }

    return data as ReferenceRange;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching reference range', { error, rangeId });
    throw new DatabaseError('Failed to fetch reference range', { error });
  }
}

/**
 * Get reference range for patient (age, gender, pregnancy status)
 */
export async function getReferenceRangeForPatient(
  testId: string,
  age: number,
  gender: 'male' | 'female',
  isPregnant: boolean = false
): Promise<ReferenceRange | null> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('reference_ranges')
      .select('*')
      .eq('test_id', testId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Filter by gender if specified
    if (gender) {
      query = query.or(`gender.eq.${gender},gender.is.null`);
    }

    const { data, error } = await query.order('range_type', { ascending: true });

    if (error) {
      logger.error('Failed to fetch reference range for patient', { error, testId, age, gender });
      throw new DatabaseError('Failed to fetch reference range for patient', { error });
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Find the most specific matching range
    const ranges = data as ReferenceRange[];
    
    // Priority: pregnancy > age-specific > adult > custom
    let matchingRange = ranges.find(r => r.range_type === 'pregnancy' && isPregnant);
    
    if (!matchingRange) {
      matchingRange = ranges.find(r => 
        r.range_type === 'child' && 
        r.age_min !== undefined && 
        r.age_max !== undefined &&
        age >= r.age_min && 
        age <= r.age_max
      );
    }
    
    if (!matchingRange) {
      matchingRange = ranges.find(r => r.range_type === 'neonate' && age < 1);
    }
    
    if (!matchingRange) {
      matchingRange = ranges.find(r => r.range_type === 'adult');
    }
    
    if (!matchingRange) {
      matchingRange = ranges.find(r => r.range_type === 'custom');
    }

    return matchingRange || null;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching reference range for patient', { error, testId, age, gender });
    throw new DatabaseError('Failed to fetch reference range for patient', { error });
  }
}

/**
 * Create reference range
 */
export async function createReferenceRange(input: any): Promise<ReferenceRange> {
  await validateManageTemplatePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('reference_ranges')
      .insert({
        clinic_id: clinicId,
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create reference range', { error, input });
      throw new DatabaseError('Failed to create reference range', { error });
    }

    logger.info('Reference range created successfully', { rangeId: data.id });
    return data as ReferenceRange;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating reference range', { error, input });
    throw new DatabaseError('Failed to create reference range', { error });
  }
}

/**
 * Update reference range
 */
export async function updateReferenceRange(rangeId: string, input: any): Promise<ReferenceRange> {
  await validateManageTemplatePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('reference_ranges')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rangeId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update reference range', { error, rangeId });
      throw new DatabaseError('Failed to update reference range', { error });
    }

    if (!data) {
      throw new NotFoundError('Reference range not found');
    }

    logger.info('Reference range updated successfully', { rangeId });
    return data as ReferenceRange;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating reference range', { error, rangeId });
    throw new DatabaseError('Failed to update reference range', { error });
  }
}

/**
 * Delete reference range (soft delete)
 */
export async function deleteReferenceRange(rangeId: string): Promise<void> {
  await validateManageTemplatePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('reference_ranges')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', rangeId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    if (error) {
      logger.error('Failed to delete reference range', { error, rangeId });
      throw new DatabaseError('Failed to delete reference range', { error });
    }

    logger.info('Reference range deleted successfully', { rangeId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting reference range', { error, rangeId });
    throw new DatabaseError('Failed to delete reference range', { error });
  }
}

/**
 * Get reference ranges by type
 */
export async function getReferenceRangesByType(rangeType: ReferenceRangeType): Promise<ReferenceRange[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('reference_ranges')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('range_type', rangeType)
      .is('deleted_at', null)
      .order('test_id', { ascending: true });

    if (error) {
      logger.error('Failed to fetch reference ranges by type', { error, rangeType });
      throw new DatabaseError('Failed to fetch reference ranges by type', { error });
    }

    return (data || []) as ReferenceRange[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching reference ranges by type', { error, rangeType });
    throw new DatabaseError('Failed to fetch reference ranges by type', { error });
  }
}

/**
 * Validate result against reference range
 */
export function validateResultAgainstReferenceRange(
  resultValue: number,
  referenceRange: ReferenceRange
): { isValid: boolean; flag: 'normal' | 'abnormal_high' | 'abnormal_low' | 'critical_high' | 'critical_low' } {
  // Check critical ranges first
  if (referenceRange.critical_low !== undefined && resultValue < referenceRange.critical_low) {
    return { isValid: false, flag: 'critical_low' };
  }

  if (referenceRange.critical_high !== undefined && resultValue > referenceRange.critical_high) {
    return { isValid: false, flag: 'critical_high' };
  }

  // Check normal ranges
  if (referenceRange.normal_low !== undefined && resultValue < referenceRange.normal_low) {
    return { isValid: false, flag: 'abnormal_low' };
  }

  if (referenceRange.normal_high !== undefined && resultValue > referenceRange.normal_high) {
    return { isValid: false, flag: 'abnormal_high' };
  }

  return { isValid: true, flag: 'normal' };
}

/**
 * Get all reference ranges for clinic
 */
export async function getAllReferenceRanges(): Promise<ReferenceRange[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('reference_ranges')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .order('test_id', { ascending: true });

    if (error) {
      logger.error('Failed to fetch all reference ranges', { error });
      throw new DatabaseError('Failed to fetch all reference ranges', { error });
    }

    return (data || []) as ReferenceRange[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching all reference ranges', { error });
    throw new DatabaseError('Failed to fetch all reference ranges', { error });
  }
}

/**
 * Placeholder for LOINC integration
 */
export async function syncWithLOINC(): Promise<void> {
  // TODO: Implement LOINC (Logical Observation Identifiers Names and Codes) integration
  logger.info('LOINC integration placeholder');
}

/**
 * Placeholder for SNOMED CT integration
 */
export async function syncWithSNOMED(): Promise<void> {
  // TODO: Implement SNOMED CT (Systematized Nomenclature of Medicine -- Clinical Terms) integration
  logger.info('SNOMED CT integration placeholder');
}
