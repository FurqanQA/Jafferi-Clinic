import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateUpdateNotificationPermission } from './notification-permissions';
import { validateNotificationAttachment } from './notification-validation';
import { NotificationAttachment } from './notification-types';

// ============================================================================
// Attachments
// Manages file attachments for notifications
// ============================================================================

/**
 * Upload attachment
 */
export async function uploadAttachment(
  file: File,
  notificationId?: string
): Promise<NotificationAttachment> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();

    // Validate file
    validateNotificationAttachment({
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    });

    // Placeholder for file upload
    // In production, this would use Supabase Storage or another storage provider
    const storagePath = `notifications/${clinicId}/${Date.now()}_${file.name}`;
    const fileUrl = `https://storage.example.com/${storagePath}`;

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('notification_attachments')
      .insert({
        notification_id: notificationId || null,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: fileUrl,
        storage_provider: 'supabase',
        created_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to upload attachment', { error, fileName: file.name });
      throw new DatabaseError('Failed to upload attachment', { error });
    }

    logger.info('Attachment uploaded', { attachmentId: data.id, fileName: file.name });
    return data as NotificationAttachment;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error uploading attachment', { error, fileName: file.name });
    throw new DatabaseError('Failed to upload attachment', { error });
  }
}

/**
 * Get attachment by ID
 */
export async function getAttachment(attachmentId: string): Promise<NotificationAttachment> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Attachment not found');
      }
      logger.error('Failed to fetch attachment', { error, attachmentId });
      throw new DatabaseError('Failed to fetch attachment', { error });
    }

    return data as NotificationAttachment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching attachment', { error, attachmentId });
    throw new DatabaseError('Failed to fetch attachment', { error });
  }
}

/**
 * Get attachments for notification
 */
export async function getNotificationAttachments(notificationId: string): Promise<NotificationAttachment[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_attachments')
      .select('*')
      .eq('notification_id', notificationId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch notification attachments', { error, notificationId });
      throw new DatabaseError('Failed to fetch notification attachments', { error });
    }

    return (data || []) as NotificationAttachment[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching notification attachments', { error, notificationId });
    throw new DatabaseError('Failed to fetch notification attachments', { error });
  }
}

/**
 * Delete attachment
 */
export async function deleteAttachment(attachmentId: string): Promise<void> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();

    // Get attachment info for file deletion
    const attachment = await getAttachment(attachmentId);

    // Placeholder for file deletion from storage
    // In production, this would delete the file from Supabase Storage
    logger.info('File deletion from storage requested', { fileUrl: attachment.file_url });

    const { error } = await supabase
      .from('notification_attachments')
      .delete()
      .eq('id', attachmentId)
      .eq('clinic_id', clinicId);

    if (error) {
      logger.error('Failed to delete attachment', { error, attachmentId });
      throw new DatabaseError('Failed to delete attachment', { error });
    }

    logger.info('Attachment deleted', { attachmentId });
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting attachment', { error, attachmentId });
    throw new DatabaseError('Failed to delete attachment', { error });
  }
}

/**
 * Link attachment to notification
 */
export async function linkAttachmentToNotification(
  attachmentId: string,
  notificationId: string
): Promise<NotificationAttachment> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();

    const { data, error } = await supabase
      .from('notification_attachments')
      .update({
        notification_id: notificationId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', attachmentId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to link attachment to notification', { error, attachmentId, notificationId });
      throw new DatabaseError('Failed to link attachment to notification', { error });
    }

    logger.info('Attachment linked to notification', { attachmentId, notificationId });
    return data as NotificationAttachment;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error linking attachment to notification', { error, attachmentId, notificationId });
    throw new DatabaseError('Failed to link attachment to notification', { error });
  }
}

/**
 * Unlink attachment from notification
 */
export async function unlinkAttachmentFromNotification(attachmentId: string): Promise<NotificationAttachment> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    await validateUpdateNotificationPermission();

    const { data, error } = await supabase
      .from('notification_attachments')
      .update({
        notification_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', attachmentId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to unlink attachment from notification', { error, attachmentId });
      throw new DatabaseError('Failed to unlink attachment from notification', { error });
    }

    logger.info('Attachment unlinked from notification', { attachmentId });
    return data as NotificationAttachment;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error unlinking attachment from notification', { error, attachmentId });
    throw new DatabaseError('Failed to unlink attachment from notification', { error });
  }
}

/**
 * Get attachment statistics
 */
export async function getAttachmentStatistics(): Promise<{
  totalAttachments: number;
  totalSize: number;
  byType: Record<string, number>;
}> {
  await validateUpdateNotificationPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_attachments')
      .select('file_size, file_type');

    if (error) {
      logger.error('Failed to fetch attachment statistics', { error });
      throw new DatabaseError('Failed to fetch attachment statistics', { error });
    }

    const attachments = data || [];

    const byType: Record<string, number> = {};
    let totalSize = 0;

    attachments.forEach((att: any) => {
      byType[att.file_type] = (byType[att.file_type] || 0) + 1;
      totalSize += att.file_size || 0;
    });

    return {
      totalAttachments: attachments.length,
      totalSize,
      byType,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching attachment statistics', { error });
    throw new DatabaseError('Failed to fetch attachment statistics', { error });
  }
}

/**
 * Delete old attachments
 */
export async function deleteOldAttachments(daysOld: number = 30): Promise<number> {
  await validateUpdateNotificationPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Get attachments to delete
    const { data: attachments, error: fetchError } = await supabase
      .from('notification_attachments')
      .select('id, file_url')
      .lt('created_at', cutoffDate)
      .is('notification_id', null);

    if (fetchError) {
      logger.error('Failed to fetch old attachments', { error: fetchError });
      throw new DatabaseError('Failed to fetch old attachments', { error: fetchError });
    }

    // Delete files from storage (placeholder)
    for (const att of attachments || []) {
      logger.info('File deletion from storage requested', { fileUrl: att.file_url });
    }

    // Delete database records
    const { data, error } = await supabase
      .from('notification_attachments')
      .delete()
      .lt('created_at', cutoffDate)
      .is('notification_id', null)
      .select('id');

    if (error) {
      logger.error('Failed to delete old attachments', { error });
      throw new DatabaseError('Failed to delete old attachments', { error });
    }

    const deleted = (data || []).length;
    logger.info('Old attachments deleted', { deleted, daysOld });
    return deleted;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting old attachments', { error });
    throw new DatabaseError('Failed to delete old attachments', { error });
  }
}

/**
 * Validate file for upload
 */
export function validateFileForUpload(file: File): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!file) {
    errors.push('File is required');
    return { valid: false, errors };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('File size exceeds maximum of 10MB');
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not allowed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get file extension from file name
 */
export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return '';
  }
  return fileName.slice(lastDotIndex + 1).toLowerCase();
}

/**
 * Generate safe file name
 */
export function generateSafeFileName(fileName: string): string {
  // Remove special characters and spaces
  const safeName = fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase();

  // Add timestamp prefix
  const timestamp = Date.now();
  return `${timestamp}_${safeName}`;
}
