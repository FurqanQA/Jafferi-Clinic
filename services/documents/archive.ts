import { getUserClinicId, getCurrentUser } from '../core/auth';
import { NotFoundError, AuthorizationError, DatabaseError, ConflictError } from '../core/errors';
import { logger } from '../shared/logger';
import { Document, DocumentStatus, StorageBucket } from './document-types';
import { validateDocumentEditPermission } from './document-permissions';
import { moveInStorage } from './storage';
import { getSupabaseClient } from '../core/client';

// ============================================================================
// Archive Service
// Archive documents for long-term storage
// ============================================================================

/**
 * Archive a single document
 */
export async function archiveDocument(documentId: string): Promise<Document> {
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
      .is('deleted_at', null)
      .single();

    if (fetchError || !document) {
      throw new NotFoundError('Document not found');
    }

    // Verify clinic access for multi-tenancy
    if (document.clinic_id !== clinicId) {
      throw new AuthorizationError('Access denied');
    }

    if (document.status === DocumentStatus.ARCHIVED) {
      throw new ConflictError('Document is already archived');
    }

    // Move file to archive storage
    await moveInStorage(document.file_path, `archive/${document.file_path}`, StorageBucket.PRIVATE);

    // Update document in database
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({
        status: DocumentStatus.ARCHIVED,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to archive document', { error: updateError });
    }

    logger.info('Document archived', { documentId, clinicId, userId: user.id });
    return updatedDocument as Document;
  } catch (error) {
    logger.error('Failed to archive document', { error, documentId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Archive multiple documents
 */
export async function archiveDocuments(documentIds: string[]): Promise<{
  archived: number;
  failed: string[];
}> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    let archived = 0;
    const failed: string[] = [];

    for (const documentId of documentIds) {
      try {
        await archiveDocument(documentId);
        archived++;
      } catch (error) {
        failed.push(documentId);
      }
    }

    logger.info('Batch archive completed', { 
      clinicId, 
      userId: user.id, 
      archived, 
      failed: failed.length 
    });

    return { archived, failed };
  } catch (error) {
    logger.error('Failed to archive documents', { error, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Get archived documents
 */
export async function getArchivedDocuments(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ documents: Document[]; total: number }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for database query
    const documents: Document[] = [];
    const total = 0;

    logger.info('Archived documents retrieved', { 
      clinicId, 
      userId: user.id, 
      count: documents.length 
    });

    return { documents, total };
  } catch (error) {
    logger.error('Failed to get archived documents', { error, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Unarchive a document
 */
export async function unarchiveDocument(documentId: string): Promise<Document> {
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
      .is('deleted_at', null)
      .single();

    if (fetchError || !document) {
      throw new NotFoundError('Document not found');
    }

    // Verify clinic access for multi-tenancy
    if (document.clinic_id !== clinicId) {
      throw new AuthorizationError('Access denied');
    }

    if (document.status !== DocumentStatus.ARCHIVED) {
      throw new ConflictError('Document is not archived');
    }

    // Move file back from archive storage
    const originalPath = document.file_path.replace('archive/', '');
    await moveInStorage(document.file_path, originalPath, StorageBucket.PRIVATE);

    // Update document in database
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({
        status: DocumentStatus.ACTIVE,
        file_path: originalPath,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to unarchive document', { error: updateError });
    }

    logger.info('Document unarchived', { documentId, clinicId, userId: user.id });
    return updatedDocument as Document;
  } catch (error) {
    logger.error('Failed to unarchive document', { error, documentId, clinicId, userId: user.id });
    throw error;
  }
}
