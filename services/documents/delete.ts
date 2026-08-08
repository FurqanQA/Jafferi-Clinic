import { getUserClinicId, getCurrentUser } from '../core/auth';
import { NotFoundError, AuthorizationError, DatabaseError, ConflictError } from '../core/errors';
import { logger } from '../shared/logger';
import { Document, DocumentStatus, StorageBucket } from './document-types';
import { validateDocumentDeletePermission } from './document-permissions';
import { deleteFromStorage, moveInStorage } from './storage';
import { getSupabaseClient } from '../core/client';

// ============================================================================
// Delete Service
// Delete documents (soft delete to trash, permanent delete)
// ============================================================================

/**
 * Delete a document (move to trash)
 */
export async function deleteDocument(documentId: string): Promise<Document> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentDeletePermission(documentId);

    // Fetch document
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !document) {
      throw new NotFoundError('Document not found');
    }

    // Verify clinic access for multi-tenancy
    if (document.clinic_id !== clinicId) {
      throw new AuthorizationError('Access denied');
    }

    if (document.status === DocumentStatus.DELETED) {
      throw new ConflictError('Document is already in trash');
    }

    // Move file to trash storage
    await moveInStorage(document.file_path, `trash/${document.file_path}`, StorageBucket.PRIVATE);

    // Update document in database (soft delete)
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({
        status: DocumentStatus.DELETED,
        file_path: `trash/${document.file_path}`,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to delete document', { error: updateError });
    }

    logger.info('Document deleted (moved to trash)', { documentId, clinicId, userId: user.id });
    return updatedDocument as Document;
  } catch (error) {
    logger.error('Failed to delete document', { error, documentId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Delete multiple documents
 */
export async function deleteDocuments(documentIds: string[]): Promise<{
  deleted: number;
  failed: string[];
}> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    let deleted = 0;
    const failed: string[] = [];

    for (const documentId of documentIds) {
      try {
        await deleteDocument(documentId);
        deleted++;
      } catch (error) {
        failed.push(documentId);
      }
    }

    logger.info('Batch delete completed', { 
      clinicId, 
      userId: user.id, 
      deleted, 
      failed: failed.length 
    });

    return { deleted, failed };
  } catch (error) {
    logger.error('Failed to delete documents', { error, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Permanently delete a document
 */
export async function permanentDeleteDocument(documentId: string): Promise<void> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentDeletePermission(documentId);

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

    // Delete file from storage
    await deleteFromStorage(document.file_path, StorageBucket.PRIVATE);

    // Delete from database
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      throw new DatabaseError('Failed to permanently delete document', { error: deleteError });
    }

    logger.info('Document permanently deleted', { documentId, clinicId, userId: user.id });
  } catch (error) {
    logger.error('Failed to permanently delete document', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Permanently delete multiple documents
 */
export async function permanentDeleteDocuments(documentIds: string[]): Promise<{
  deleted: number;
  failed: string[];
}> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    let deleted = 0;
    const failed: string[] = [];

    for (const documentId of documentIds) {
      try {
        await permanentDeleteDocument(documentId);
        deleted++;
      } catch (error) {
        failed.push(documentId);
      }
    }

    logger.info('Batch permanent delete completed', { 
      clinicId, 
      userId: user.id, 
      deleted, 
      failed: failed.length 
    });

    return { deleted, failed };
  } catch (error) {
    logger.error('Failed to permanently delete documents', { 
      error, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}
