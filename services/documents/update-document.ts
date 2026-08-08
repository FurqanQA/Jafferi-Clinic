import { getUserClinicId, getCurrentUser } from '../core/auth';
import { NotFoundError, AuthorizationError, DatabaseError } from '../core/errors';
import { logger } from '../shared/logger';
import { Document } from './document-types';
import { validateDocumentEditPermission } from './document-permissions';
import { updateDocumentSchema } from './document-validation';
import { logDocumentAction } from './audit';
import { getSupabaseClient } from '../core/client';

// ============================================================================
// Update Document Service
// High-level document update orchestrator
// ============================================================================

/**
 * Update document metadata
 */
export async function updateDocument(
  documentId: string,
  updates: {
    title?: string;
    description?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }
): Promise<Document> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentEditPermission(documentId);

    // Validate updates
    if (updates.title || updates.description) {
      updateDocumentSchema.parse({
        title: updates.title,
        description: updates.description,
      });
    }

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

    // Update document in database
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({
        title: updates.title,
        description: updates.description,
        tags: updates.tags,
        metadata: updates.metadata,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to update document', { error: updateError });
    }

    await logDocumentAction(documentId, 'edit', updates);

    logger.info('Document updated', { documentId, updates, clinicId, userId: user.id });
    return updatedDocument as Document;
  } catch (error) {
    logger.error('Failed to update document', { error, documentId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Move document to folder
 */
export async function moveDocumentToFolder(
  documentId: string,
  folderId: string
): Promise<Document> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
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

    if (document.clinic_id !== clinicId) {
      throw new AuthorizationError('Access denied');
    }

    // Update document in database
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({
        folder_id: folderId,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to move document to folder', { error: updateError });
    }

    await logDocumentAction(documentId, 'edit', { folderId });

    logger.info('Document moved to folder', { documentId, folderId, clinicId, userId: user.id });
    return updatedDocument as Document;
  } catch (error) {
    logger.error('Failed to move document to folder', { error, documentId, folderId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Update document status
 */
export async function updateDocumentStatus(
  documentId: string,
  status: 'active' | 'archived' | 'deleted'
): Promise<Document> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
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

    if (document.clinic_id !== clinicId) {
      throw new AuthorizationError('Access denied');
    }

    // Update document in database
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({
        status,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to update document status', { error: updateError });
    }

    await logDocumentAction(documentId, 'edit', { status });

    logger.info('Document status updated', { documentId, status, clinicId, userId: user.id });
    return updatedDocument as Document;
  } catch (error) {
    logger.error('Failed to update document status', { error, documentId, status, clinicId, userId: user.id });
    throw error;
  }
}
