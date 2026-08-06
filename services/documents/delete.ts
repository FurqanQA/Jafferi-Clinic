import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { Document, DocumentStatus } from './document-types';
import { validateDocumentDeletePermission } from './document-permissions';
import { deleteFromStorage, moveInStorage } from './storage';

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

  try {
    // Check permissions
    await validateDocumentDeletePermission(documentId);

    // Placeholder for fetching document
    const document: Document | null = null;

    if (!document) {
      throw new Error('Document not found');
    }

    // Verify clinic access for multi-tenancy
    if (document.clinicId !== clinicId) {
      throw new Error('Access denied');
    }

    if (document.status === DocumentStatus.DELETED) {
      throw new Error('Document is already in trash');
    }

    // Move file to trash storage
    await moveInStorage(document.filePath, `trash/${document.filePath}`, 'private' as any);

    const updatedDocument: Document = {
      ...document,
      status: DocumentStatus.DELETED,
      filePath: `trash/${document.filePath}`,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
    };

    // Placeholder for database update
    logger.info('Document deleted (moved to trash)', { documentId, clinicId, userId: user.id });
    return updatedDocument;
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

  try {
    // Check permissions
    await validateDocumentDeletePermission(documentId);

    // Placeholder for fetching document
    const document: Document | null = null;

    if (!document) {
      throw new Error('Document not found');
    }

    // Verify clinic access for multi-tenancy
    if (document.clinicId !== clinicId) {
      throw new Error('Access denied');
    }

    // Delete file from storage
    await deleteFromStorage(document.filePath, 'private' as any);

    // Placeholder for database deletion
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
