import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateUploadResultsPermission } from './laboratory-permissions';
import { LabResult, ResultType, ResultFlag } from './laboratory-types';
import { getReferenceRangeForPatient, validateResultAgainstReferenceRange } from './reference-ranges';

/**
 * Create lab result
 */
export async function createLabResult(input: LabResult, labOrderId: string, patientAge?: number, patientGender?: 'male' | 'female', isPregnant?: boolean): Promise<LabResult> {
  await validateUploadResultsPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Get reference range for the test
    let referenceRange = null;
    if (patientAge !== undefined && patientGender) {
      referenceRange = await getReferenceRangeForPatient(input.test_id, patientAge, patientGender, isPregnant);
    }

    // Validate result against reference range if numeric
    let resultFlag: ResultFlag | undefined;
    let isAbnormal = false;
    let isCritical = false;

    if (referenceRange && typeof input.result_value === 'number') {
      const validation = validateResultAgainstReferenceRange(input.result_value as number, referenceRange);
      resultFlag = validation.flag;
      isAbnormal = !validation.isValid;
      isCritical = validation.flag === 'critical_high' || validation.flag === 'critical_low';
    }

    const { data, error } = await supabase
      .from('lab_results')
      .insert({
        lab_order_id: labOrderId,
        clinic_id: clinicId,
        ...input,
        reference_range: referenceRange ? `${referenceRange.normal_low || '-'} - ${referenceRange.normal_high || '-'}` : undefined,
        result_flag: resultFlag,
        is_abnormal: isAbnormal,
        is_critical: isCritical,
        performed_by: user.id,
        performed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create lab result', { error, input });
      throw new DatabaseError('Failed to create lab result', { error });
    }

    logger.info('Lab result created successfully', { resultId: data.id });
    return data as LabResult;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating lab result', { error, input });
    throw new DatabaseError('Failed to create lab result', { error });
  }
}

/**
 * Get lab results by lab order ID
 */
export async function getLabResultsByLabOrder(labOrderId: string): Promise<LabResult[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_results')
      .select('*')
      .eq('lab_order_id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .order('test_name', { ascending: true });

    if (error) {
      logger.error('Failed to fetch lab results by lab order', { error, labOrderId });
      throw new DatabaseError('Failed to fetch lab results by lab order', { error });
    }

    return (data || []) as LabResult[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching lab results by lab order', { error, labOrderId });
    throw new DatabaseError('Failed to fetch lab results by lab order', { error });
  }
}

/**
 * Get lab result by ID
 */
export async function getLabResultById(resultId: string): Promise<LabResult> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_results')
      .select('*')
      .eq('id', resultId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Failed to fetch lab result', { error, resultId });
      throw new DatabaseError('Failed to fetch lab result', { error });
    }

    if (!data) {
      throw new NotFoundError('Lab result not found');
    }

    return data as LabResult;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching lab result', { error, resultId });
    throw new DatabaseError('Failed to fetch lab result', { error });
  }
}

/**
 * Update lab result
 */
export async function updateLabResult(resultId: string, input: Partial<LabResult>): Promise<LabResult> {
  await validateUploadResultsPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_results')
      .update({
        ...input,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resultId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update lab result', { error, resultId });
      throw new DatabaseError('Failed to update lab result', { error });
    }

    if (!data) {
      throw new NotFoundError('Lab result not found');
    }

    logger.info('Lab result updated successfully', { resultId });
    return data as LabResult;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating lab result', { error, resultId });
    throw new DatabaseError('Failed to update lab result', { error });
  }
}

/**
 * Verify lab result
 */
export async function verifyLabResult(resultId: string): Promise<LabResult> {
  await validateUploadResultsPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_results')
      .update({
        verified: true,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resultId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to verify lab result', { error, resultId });
      throw new DatabaseError('Failed to verify lab result', { error });
    }

    if (!data) {
      throw new NotFoundError('Lab result not found');
    }

    logger.info('Lab result verified successfully', { resultId });
    return data as LabResult;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error verifying lab result', { error, resultId });
    throw new DatabaseError('Failed to verify lab result', { error });
  }
}

/**
 * Get lab results by patient
 */
export async function getLabResultsByPatient(patientId: string): Promise<LabResult[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_results')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('performed_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch lab results by patient', { error, patientId });
      throw new DatabaseError('Failed to fetch lab results by patient', { error });
    }

    return (data || []) as LabResult[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching lab results by patient', { error, patientId });
    throw new DatabaseError('Failed to fetch lab results by patient', { error });
  }
}

/**
 * Get abnormal lab results
 */
export async function getAbnormalLabResults(patientId?: string): Promise<LabResult[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('lab_results')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_abnormal', true)
      .is('deleted_at', null);

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query.order('performed_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch abnormal lab results', { error, patientId });
      throw new DatabaseError('Failed to fetch abnormal lab results', { error });
    }

    return (data || []) as LabResult[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching abnormal lab results', { error, patientId });
    throw new DatabaseError('Failed to fetch abnormal lab results', { error });
  }
}

/**
 * Get critical lab results
 */
export async function getCriticalLabResults(patientId?: string): Promise<LabResult[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('lab_results')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_critical', true)
      .is('deleted_at', null);

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query.order('performed_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch critical lab results', { error, patientId });
      throw new DatabaseError('Failed to fetch critical lab results', { error });
    }

    return (data || []) as LabResult[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching critical lab results', { error, patientId });
    throw new DatabaseError('Failed to fetch critical lab results', { error });
  }
}

/**
 * Get lab results by type
 */
export async function getLabResultsByType(resultType: ResultType): Promise<LabResult[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_results')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('result_type', resultType)
      .is('deleted_at', null)
      .order('performed_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch lab results by type', { error, resultType });
      throw new DatabaseError('Failed to fetch lab results by type', { error });
    }

    return (data || []) as LabResult[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching lab results by type', { error, resultType });
    throw new DatabaseError('Failed to fetch lab results by type', { error });
  }
}

/**
 * Calculate derived result (placeholder for calculated fields)
 */
export function calculateDerivedResult(formula: string, inputValues: Record<string, number>): number {
  // TODO: Implement safe formula evaluation for calculated results
  // This should use a safe math expression evaluator
  logger.info('Derived result calculation placeholder', { formula, inputValues });
  return 0;
}

/**
 * Format result for display
 */
export function formatResultForDisplay(result: LabResult): string {
  if (result.result_type === 'boolean') {
    return result.result_value === true ? 'Positive' : 'Negative';
  }

  if (result.result_type === 'positive' || result.result_type === 'negative') {
    return result.result_value as string;
  }

  if (typeof result.result_value === 'number') {
    return `${result.result_value} ${result.unit || ''}`;
  }

  return result.result_value as string;
}

/**
 * Get result trend for patient over time
 */
export async function getResultTrend(patientId: string, testId: string, days: number = 30): Promise<Array<{ date: string; value: number }>> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('lab_results')
      .select('performed_at, result_value')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .eq('test_id', testId)
      .gte('performed_at', startDate.toISOString())
      .is('deleted_at', null)
      .order('performed_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch result trend', { error, patientId, testId });
      throw new DatabaseError('Failed to fetch result trend', { error });
    }

    return (data || [])
      .filter((r: any) => typeof r.result_value === 'number')
      .map((r: any) => ({
        date: r.performed_at,
        value: r.result_value,
      }));
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching result trend', { error, patientId, testId });
    throw new DatabaseError('Failed to fetch result trend', { error });
  }
}
