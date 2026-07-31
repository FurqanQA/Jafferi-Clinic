import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateUpdateMedicalRecordPermission, validateMedicalRecordClinicAccess } from './medical-record-permissions';
import { Attachment, AttachmentType } from './medical-record-types';

/**
 * Add an attachment to a medical record
 */
export async function addAttachment(
  medicalRecordId: string,
  attachment: {
    type: AttachmentType;
    file_name: string;
    file_url: string;
    file_size?: number;
    mime_type?: string;
    description?: string;
  }
): Promise<Attachment> {
  // Validate permissions
  await validateUpdateMedicalRecordPermission();

  // Validate clinic access
  await validateMedicalRecordClinicAccess(medicalRecordId);

  // Get user
  const user = await getCurrentUser();

  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('medical_record_attachments')
      .insert({
        medical_record_id: medicalRecordId,
        type: attachment.type,
        file_name: attachment.file_name,
        file_url: attachment.file_url,
        file_size: attachment.file_size,
        mime_type: attachment.mime_type,
        description: attachment.description,
        uploaded_by: user.id,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to add attachment', { error, medicalRecordId });
      throw new DatabaseError('Failed to add attachment', { error });
    }

    logger.info('Attachment added successfully', { attachmentId: data.id, medicalRecordId });
    return data as Attachment;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error adding attachment', { error, medicalRecordId });
    throw new DatabaseError('Failed to add attachment', { error });
  }
}

/**
 * Get all attachments for a medical record
 */
export async function getAttachments(medicalRecordId: string): Promise<Attachment[]> {
  // Validate permissions
  await validateUpdateMedicalRecordPermission();

  // Validate clinic access
  await validateMedicalRecordClinicAccess(medicalRecordId);

  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('medical_record_attachments')
      .select('*')
      .eq('medical_record_id', medicalRecordId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch attachments', { error, medicalRecordId });
      throw new DatabaseError('Failed to fetch attachments', { error });
    }

    return (data || []) as Attachment[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching attachments', { error, medicalRecordId });
    throw new DatabaseError('Failed to fetch attachments', { error });
  }
}

/**
 * Get a single attachment by ID
 */
export async function getAttachment(attachmentId: string): Promise<Attachment> {
  // Validate permissions
  await validateUpdateMedicalRecordPermission();

  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('medical_record_attachments')
      .select('*')
      .eq('id', attachmentId)
      .single();

    if (error) {
      logger.error('Failed to fetch attachment', { error, attachmentId });
      throw new DatabaseError('Failed to fetch attachment', { error });
    }

    if (!data) {
      throw new NotFoundError('Attachment not found');
    }

    // Validate clinic access through medical record
    await validateMedicalRecordClinicAccess(data.medical_record_id);

    return data as Attachment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching attachment', { error, attachmentId });
    throw new DatabaseError('Failed to fetch attachment', { error });
  }
}

/**
 * Delete an attachment
 */
export async function deleteAttachment(attachmentId: string): Promise<void> {
  // Validate permissions
  await validateUpdateMedicalRecordPermission();

  const supabase = getSupabaseClient();

  try {
    // First get the attachment to validate clinic access
    const { data: attachment } = await supabase
      .from('medical_record_attachments')
      .select('medical_record_id')
      .eq('id', attachmentId)
      .single();

    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    // Validate clinic access through medical record
    await validateMedicalRecordClinicAccess(attachment.medical_record_id);

    // Delete the attachment
    const { error } = await supabase
      .from('medical_record_attachments')
      .delete()
      .eq('id', attachmentId);

    if (error) {
      logger.error('Failed to delete attachment', { error, attachmentId });
      throw new DatabaseError('Failed to delete attachment', { error });
    }

    logger.info('Attachment deleted successfully', { attachmentId });
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting attachment', { error, attachmentId });
    throw new DatabaseError('Failed to delete attachment', { error });
  }
}

/**
 * Update attachment description
 */
export async function updateAttachmentDescription(
  attachmentId: string,
  description: string
): Promise<Attachment> {
  // Validate permissions
  await validateUpdateMedicalRecordPermission();

  const supabase = getSupabaseClient();

  try {
    // First get the attachment to validate clinic access
    const { data: attachment } = await supabase
      .from('medical_record_attachments')
      .select('medical_record_id')
      .eq('id', attachmentId)
      .single();

    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    // Validate clinic access through medical record
    await validateMedicalRecordClinicAccess(attachment.medical_record_id);

    // Update the attachment
    const { data, error } = await supabase
      .from('medical_record_attachments')
      .update({ description })
      .eq('id', attachmentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update attachment description', { error, attachmentId });
      throw new DatabaseError('Failed to update attachment description', { error });
    }

    logger.info('Attachment description updated successfully', { attachmentId });
    return data as Attachment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating attachment description', { error, attachmentId });
    throw new DatabaseError('Failed to update attachment description', { error });
  }
}

/**
 * Get attachments by type
 */
export async function getAttachmentsByType(
  medicalRecordId: string,
  type: AttachmentType
): Promise<Attachment[]> {
  // Validate permissions
  await validateUpdateMedicalRecordPermission();

  // Validate clinic access
  await validateMedicalRecordClinicAccess(medicalRecordId);

  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('medical_record_attachments')
      .select('*')
      .eq('medical_record_id', medicalRecordId)
      .eq('type', type)
      .order('uploaded_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch attachments by type', { error, medicalRecordId, type });
      throw new DatabaseError('Failed to fetch attachments by type', { error });
    }

    return (data || []) as Attachment[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching attachments by type', { error, medicalRecordId, type });
    throw new DatabaseError('Failed to fetch attachments by type', { error });
  }
}

/**
 * Placeholder for generating signed URL for file upload
 * This function is prepared for future integration with storage services
 */
export async function generateUploadUrl(
  fileName: string,
  mimeType: string,
  fileSize: number
): Promise<{ uploadUrl: string; fileUrl: string }> {
  // TODO: Integrate with storage service (e.g., Supabase Storage, S3)
  // This is a placeholder for future storage integration
  return {
    uploadUrl: '[Storage Service] Upload URL placeholder',
    fileUrl: '[Storage Service] File URL placeholder',
  };
}

/**
 * Placeholder for generating signed URL for file download
 * This function is prepared for future integration with storage services
 */
export async function generateDownloadUrl(fileUrl: string): Promise<string> {
  // TODO: Integrate with storage service for signed URL generation
  // This is a placeholder for future storage integration
  return '[Storage Service] Download URL placeholder';
}
