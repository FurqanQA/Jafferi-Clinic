import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateUploadImagingPermission, validateApproveImagingPermission } from './laboratory-permissions';
import { DiagnosticImaging, ImagingType } from './laboratory-types';

/**
 * Create diagnostic imaging record
 */
export async function createDiagnosticImaging(input: Partial<DiagnosticImaging>): Promise<DiagnosticImaging> {
  await validateUploadImagingPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('diagnostic_imaging')
      .insert({
        ...input,
        clinic_id: clinicId,
        performed_by: user.id,
        performed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create diagnostic imaging record', { error, input });
      throw new DatabaseError('Failed to create diagnostic imaging record', { error });
    }

    logger.info('Diagnostic imaging record created successfully', { imagingId: data.id });
    return data as DiagnosticImaging;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating diagnostic imaging record', { error, input });
    throw new DatabaseError('Failed to create diagnostic imaging record', { error });
  }
}

/**
 * Get diagnostic imaging by ID
 */
export async function getDiagnosticImagingById(imagingId: string): Promise<DiagnosticImaging> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('diagnostic_imaging')
      .select('*')
      .eq('id', imagingId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Failed to fetch diagnostic imaging', { error, imagingId });
      throw new DatabaseError('Failed to fetch diagnostic imaging', { error });
    }

    if (!data) {
      throw new NotFoundError('Diagnostic imaging not found');
    }

    return data as DiagnosticImaging;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching diagnostic imaging', { error, imagingId });
    throw new DatabaseError('Failed to fetch diagnostic imaging', { error });
  }
}

/**
 * Get diagnostic imaging by lab order ID
 */
export async function getDiagnosticImagingByLabOrder(labOrderId: string): Promise<DiagnosticImaging> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('diagnostic_imaging')
      .select('*')
      .eq('lab_order_id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Failed to fetch diagnostic imaging by lab order', { error, labOrderId });
      throw new DatabaseError('Failed to fetch diagnostic imaging by lab order', { error });
    }

    if (!data) {
      throw new NotFoundError('Diagnostic imaging not found');
    }

    return data as DiagnosticImaging;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching diagnostic imaging by lab order', { error, labOrderId });
    throw new DatabaseError('Failed to fetch diagnostic imaging by lab order', { error });
  }
}

/**
 * Update diagnostic imaging record
 */
export async function updateDiagnosticImaging(imagingId: string, input: Partial<DiagnosticImaging>): Promise<DiagnosticImaging> {
  await validateUploadImagingPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('diagnostic_imaging')
      .update({
        ...input,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', imagingId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update diagnostic imaging', { error, imagingId });
      throw new DatabaseError('Failed to update diagnostic imaging', { error });
    }

    if (!data) {
      throw new NotFoundError('Diagnostic imaging not found');
    }

    logger.info('Diagnostic imaging updated successfully', { imagingId });
    return data as DiagnosticImaging;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating diagnostic imaging', { error, imagingId });
    throw new DatabaseError('Failed to update diagnostic imaging', { error });
  }
}

/**
 * Add radiologist notes to diagnostic imaging
 */
export async function addRadiologistNotes(imagingId: string, notes: string): Promise<DiagnosticImaging> {
  await validateUploadImagingPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('diagnostic_imaging')
      .update({
        radiologist_notes: notes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', imagingId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to add radiologist notes', { error, imagingId });
      throw new DatabaseError('Failed to add radiologist notes', { error });
    }

    if (!data) {
      throw new NotFoundError('Diagnostic imaging not found');
    }

    logger.info('Radiologist notes added successfully', { imagingId });
    return data as DiagnosticImaging;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error adding radiologist notes', { error, imagingId });
    throw new DatabaseError('Failed to add radiologist notes', { error });
  }
}

/**
 * Approve diagnostic imaging
 */
export async function approveDiagnosticImaging(imagingId: string): Promise<DiagnosticImaging> {
  await validateApproveImagingPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('diagnostic_imaging')
      .update({
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', imagingId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to approve diagnostic imaging', { error, imagingId });
      throw new DatabaseError('Failed to approve diagnostic imaging', { error });
    }

    if (!data) {
      throw new NotFoundError('Diagnostic imaging not found');
    }

    logger.info('Diagnostic imaging approved successfully', { imagingId });
    return data as DiagnosticImaging;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error approving diagnostic imaging', { error, imagingId });
    throw new DatabaseError('Failed to approve diagnostic imaging', { error });
  }
}

/**
 * Get diagnostic imaging by type
 */
export async function getDiagnosticImagingByType(imagingType: ImagingType): Promise<DiagnosticImaging[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('diagnostic_imaging')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('imaging_type', imagingType)
      .is('deleted_at', null)
      .order('performed_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch diagnostic imaging by type', { error, imagingType });
      throw new DatabaseError('Failed to fetch diagnostic imaging by type', { error });
    }

    return (data || []) as DiagnosticImaging[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching diagnostic imaging by type', { error, imagingType });
    throw new DatabaseError('Failed to fetch diagnostic imaging by type', { error });
  }
}

/**
 * Get diagnostic imaging by patient
 */
export async function getDiagnosticImagingByPatient(patientId: string): Promise<DiagnosticImaging[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('diagnostic_imaging')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('performed_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch diagnostic imaging by patient', { error, patientId });
      throw new DatabaseError('Failed to fetch diagnostic imaging by patient', { error });
    }

    return (data || []) as DiagnosticImaging[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching diagnostic imaging by patient', { error, patientId });
    throw new DatabaseError('Failed to fetch diagnostic imaging by patient', { error });
  }
}

/**
 * Placeholder for DICOM integration
 */
export async function integrateWithDICOM(): Promise<void> {
  // TODO: Implement DICOM integration for medical imaging
  logger.info('DICOM integration placeholder');
}

/**
 * Placeholder for PACS integration
 */
export async function integrateWithPACS(): Promise<void> {
  // TODO: Implement PACS (Picture Archiving and Communication System) integration
  logger.info('PACS integration placeholder');
}

/**
 * Placeholder for RIS integration
 */
export async function integrateWithRIS(): Promise<void> {
  // TODO: Implement RIS (Radiology Information System) integration
  logger.info('RIS integration placeholder');
}

/**
 * Placeholder for generating study UID
 */
export function generateStudyUID(): string {
  // TODO: Implement DICOM Study UID generation
  return `STUDY-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Placeholder for generating series UID
 */
export function generateSeriesUID(): string {
  // TODO: Implement DICOM Series UID generation
  return `SERIES-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
