import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { LabAttachment } from './laboratory-types';

/**
 * Create lab attachment
 */
export async function createLabAttachment(
  labOrderId: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  fileUrl: string,
  attachmentType: 'pdf' | 'image' | 'scanned_report' | 'radiology_report' | 'lab_report' | 'dicom',
  description?: string
): Promise<LabAttachment> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_attachments')
      .insert({
        lab_order_id: labOrderId,
        clinic_id: clinicId,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        file_url: fileUrl,
        attachment_type: attachmentType,
        description,
        uploaded_by: user.id,
        uploaded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create lab attachment', { error, labOrderId, fileName });
      throw new DatabaseError('Failed to create lab attachment', { error });
    }

    logger.info('Lab attachment created successfully', { attachmentId: data.id });
    return data as LabAttachment;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating lab attachment', { error, labOrderId, fileName });
    throw new DatabaseError('Failed to create lab attachment', { error });
  }
}

/**
 * Get lab attachment by ID
 */
export async function getLabAttachmentById(attachmentId: string): Promise<LabAttachment> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Failed to fetch lab attachment', { error, attachmentId });
      throw new DatabaseError('Failed to fetch lab attachment', { error });
    }

    if (!data) {
      throw new NotFoundError('Lab attachment not found');
    }

    return data as LabAttachment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching lab attachment', { error, attachmentId });
    throw new DatabaseError('Failed to fetch lab attachment', { error });
  }
}

/**
 * Get lab attachments by lab order ID
 */
export async function getLabAttachmentsByLabOrder(labOrderId: string): Promise<LabAttachment[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_attachments')
      .select('*')
      .eq('lab_order_id', labOrderId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch lab attachments by lab order', { error, labOrderId });
      throw new DatabaseError('Failed to fetch lab attachments by lab order', { error });
    }

    return (data || []) as LabAttachment[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching lab attachments by lab order', { error, labOrderId });
    throw new DatabaseError('Failed to fetch lab attachments by lab order', { error });
  }
}

/**
 * Get lab attachments by type
 */
export async function getLabAttachmentsByType(attachmentType: 'pdf' | 'image' | 'scanned_report' | 'radiology_report' | 'lab_report' | 'dicom'): Promise<LabAttachment[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_attachments')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('attachment_type', attachmentType)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch lab attachments by type', { error, attachmentType });
      throw new DatabaseError('Failed to fetch lab attachments by type', { error });
    }

    return (data || []) as LabAttachment[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching lab attachments by type', { error, attachmentType });
    throw new DatabaseError('Failed to fetch lab attachments by type', { error });
  }
}

/**
 * Update lab attachment
 */
export async function updateLabAttachment(attachmentId: string, description?: string): Promise<LabAttachment> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_attachments')
      .update({
        description,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', attachmentId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update lab attachment', { error, attachmentId });
      throw new DatabaseError('Failed to update lab attachment', { error });
    }

    if (!data) {
      throw new NotFoundError('Lab attachment not found');
    }

    logger.info('Lab attachment updated successfully', { attachmentId });
    return data as LabAttachment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating lab attachment', { error, attachmentId });
    throw new DatabaseError('Failed to update lab attachment', { error });
  }
}

/**
 * Delete lab attachment (soft delete)
 */
export async function deleteLabAttachment(attachmentId: string): Promise<void> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('lab_attachments')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', attachmentId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    if (error) {
      logger.error('Failed to delete lab attachment', { error, attachmentId });
      throw new DatabaseError('Failed to delete lab attachment', { error });
    }

    logger.info('Lab attachment deleted successfully', { attachmentId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting lab attachment', { error, attachmentId });
    throw new DatabaseError('Failed to delete lab attachment', { error });
  }
}

/**
 * Get lab attachments by patient
 */
export async function getLabAttachmentsByPatient(patientId: string): Promise<LabAttachment[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_attachments')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch lab attachments by patient', { error, patientId });
      throw new DatabaseError('Failed to fetch lab attachments by patient', { error });
    }

    return (data || []) as LabAttachment[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching lab attachments by patient', { error, patientId });
    throw new DatabaseError('Failed to fetch lab attachments by patient', { error });
  }
}

/**
 * Upload file to storage (placeholder)
 */
export async function uploadFileToStorage(file: File, path: string): Promise<string> {
  // TODO: Implement file upload to storage (S3, Supabase Storage, etc.)
  logger.info('File upload to storage placeholder', { fileName: file.name, path });
  return `https://storage.example.com/${path}/${file.name}`;
}

/**
 * Delete file from storage (placeholder)
 */
export async function deleteFileFromStorage(fileUrl: string): Promise<void> {
  // TODO: Implement file deletion from storage
  logger.info('File deletion from storage placeholder', { fileUrl });
}

/**
 * Generate signed URL for file download (placeholder)
 */
export async function generateSignedUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
  // TODO: Implement signed URL generation for secure file access
  logger.info('Signed URL generation placeholder', { fileUrl, expiresIn });
  return fileUrl;
}

/**
 * Validate file type
 */
export function validateFileType(fileName: string, allowedTypes: string[]): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return allowedTypes.includes(`.${extension}`) || allowedTypes.includes(extension || '');
}

/**
 * Validate file size
 */
export function validateFileSize(fileSize: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
}
