import { getUserClinicId, getCurrentUser } from '../core/auth';
import { NotFoundError, AuthorizationError } from '../core/errors';
import { logger } from '../shared/logger';
import { Document, FileFormat, StorageBucket } from './document-types';
import { validateDocumentViewPermission } from './document-permissions';
import { generateSignedUrl } from './storage';
import { updateDocumentAccessTracking } from './document-engine';
import { getSupabaseClient } from '../core/client';

// ============================================================================
// File Preview Service
// Generate preview URLs and thumbnails for document viewing
// ============================================================================

/**
 * Get preview URL for a document
 */
export async function getPreviewUrl(documentId: string): Promise<{
  previewUrl: string;
  expiresAt: string;
  mimeType: string;
}> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentViewPermission(documentId);

    // Fetch document
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error || !document) {
      throw new NotFoundError('Document not found');
    }

    // Verify clinic access for multi-tenancy
    if (document.clinic_id !== clinicId) {
      throw new AuthorizationError('Access denied');
    }

    // Generate signed URL for preview
    const previewUrl = await generateSignedUrl(document.file_path, 3600, StorageBucket.PRIVATE);
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    // Update access tracking
    await updateDocumentAccessTracking(documentId, 'view');

    logger.info('Preview URL generated', { 
      documentId, 
      clinicId, 
      userId: user.id 
    });

    return {
      previewUrl,
      expiresAt,
      mimeType: document.mime_type,
    };
  } catch (error) {
    logger.error('Failed to generate preview URL', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Check if document supports preview
 */
export function supportsPreview(format: FileFormat): boolean {
  const previewableFormats = [
    FileFormat.PDF,
    FileFormat.PNG,
    FileFormat.JPG,
    FileFormat.JPEG,
    FileFormat.WEBP,
    FileFormat.TXT,
  ];
  return previewableFormats.includes(format);
}

/**
 * Get thumbnail URL
 */
export async function generateThumbnailUrl(
  document_id: string,
  size: 'small' | 'medium' | 'large' = 'medium'
): Promise<string> {
  const user = await getCurrentUser();
  const clinic_id = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentViewPermission(document_id);

    // Fetch document
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .eq('clinic_id', clinic_id)
      .is('deleted_at', null)
      .single();

    if (error || !document) {
      throw new NotFoundError('Document not found');
    }

    // Verify clinic access for multi-tenancy
    if (document.clinic_id !== clinic_id) {
      throw new AuthorizationError('Access denied');
    }

    // Placeholder for thumbnail URL generation
    const thumbnail_path = `thumbnails/${document_id}_${size}.jpg`;
    const thumbnail_url = await generateSignedUrl(thumbnail_path, 3600, StorageBucket.PRIVATE);

    logger.info('Thumbnail URL generated', { 
      document_id, 
      size, 
      clinic_id, 
      user_id: user.id 
    });

    return thumbnail_url;
  } catch (error) {
    logger.error('Failed to generate thumbnail URL', { 
      error, 
      document_id, 
      size, 
      clinic_id, 
      user_id: user.id 
    });
    throw error;
  }
}

/**
 * Generate preview for document
 * Placeholder for actual preview generation
 */
export async function generatePreview(documentId: string): Promise<void> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch document
    const { data: document, error } = await supabase
      .from('documents')
      .select('format')
      .eq('id', documentId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error || !document) {
      throw new NotFoundError('Document not found');
    }

    // Placeholder for preview generation
    logger.info('Preview generation started', { 
      documentId, 
      format: document.format, 
      clinicId, 
      userId: user.id 
    });
  } catch (error) {
    logger.error('Failed to generate preview', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Get preview status
 */
export async function getPreviewStatus(documentId: string): Promise<{
  hasPreview: boolean;
  hasThumbnail: boolean;
  previewGeneratedAt?: string;
}> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for status check
    const status = {
      hasPreview: false,
      hasThumbnail: false,
      previewGeneratedAt: undefined as string | undefined,
    };

    logger.info('Preview status retrieved', { documentId, clinicId, userId: user.id });
    return status;
  } catch (error) {
    logger.error('Failed to get preview status', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Delete preview
 */
export async function deletePreview(documentId: string): Promise<void> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for preview deletion
    logger.info('Preview deleted', { documentId, clinicId, userId: user.id });
  } catch (error) {
    logger.error('Failed to delete preview', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}
