import { getUserClinicId, getCurrentUser } from '../core/auth';
import { NotFoundError, AuthorizationError, DatabaseError, ConflictError } from '../core/errors';
import { logger } from '../shared/logger';
import { Document, DocumentStatus, StorageBucket } from './document-types';
import { validateDocumentEditPermission } from './document-permissions';
import { moveInStorage } from './storage';
import { getSupabaseClient } from '../core/client';

// ============================================================================
// Restore Service
// Restore deleted documents from trash
// ============================================================================

/**
 * Restore a single document from trash
 */
export async function restoreDocument(documentId: string): Promise<Document> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentEditPermission(documentId);

    // Fetch document
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('clinic_id', clinicId)
      .single();

    if (fetchError || !document) {
      throw new NotFoundError('Document not found');
    }

    // Verify clinic access for multi-tenancy
    if (document.clinic_id !== clinicId) {
      throw new AuthorizationError('Access denied');
    }

    if (document.status !== DocumentStatus.DELETED) {
      throw new ConflictError('Document is not in trash');
    }

    // Move file back from trash storage
    const originalPath = document.file_path.replace('trash/', '');
    await moveInStorage(document.file_path, originalPath, StorageBucket.PRIVATE);

    // Update document in database
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({
        status: DocumentStatus.ACTIVE,
        file_path: originalPath,
        deleted_at: null,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to restore document', { error: updateError });
    }

    logger.info('Document restored', { documentId, clinicId, userId: user.id });
    return updatedDocument as Document;
  } catch (error) {
    logger.error('Failed to restore document', { error, documentId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Restore multiple documents from trash
 */
export async function restoreDocuments(documentIds: string[]): Promise<{
  restored: number;
  failed: string[];
}> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    let restored = 0;
    const failed: string[] = [];

    for (const documentId of documentIds) {
      try {
        await restoreDocument(documentId);
        restored++;
      } catch (error) {
        failed.push(documentId);
      }
    }

    logger.info('Batch restore completed', { 
      clinicId, 
      userId: user.id, 
      restored, 
      failed: failed.length 
    });

    return { restored, failed };
  } catch (error) {
    logger.error('Failed to restore documents', { error, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Get documents in trash
 */
export async function getTrashedDocuments(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ documents: Document[]; total: number }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for database query
    const documents: Document[] = [];
    const total = 0;

    logger.info('Trashed documents retrieved', { 
      clinicId, 
      userId: user.id, 
      count: documents.length 
    });

    return { documents, total };
  } catch (error) {
    logger.error('Failed to get trashed documents', { error, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Empty trash - permanently delete all trashed documents
 */
export async function emptyTrash(): Promise<{ deleted: number }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for getting all trashed documents and permanently deleting them
    const deleted = 0;

    logger.info('Trash emptied', { clinicId, userId: user.id, deleted });
    return { deleted };
  } catch (error) {
    logger.error('Failed to empty trash', { error, clinicId, userId: user.id });
    throw error;
  }
}
