import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { Document } from './document-types';
import { validateDocumentEditPermission } from './document-permissions';
import { updateDocumentSchema } from './document-validation';
import { logDocumentAction } from './audit';

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

    // Placeholder for fetching document
    const document: Document | null = null;

    if (!document) {
      throw new Error('Document not found');
    }

    // Verify clinic access for multi-tenancy
    if (document.clinicId !== clinicId) {
      throw new Error('Access denied');
    }

    const updatedDocument: Document = {
      ...document,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
    };

    // Placeholder for database update
    await logDocumentAction(documentId, 'edit', updates);

    logger.info('Document updated', { documentId, updates, clinicId, userId: user.id });
    return updatedDocument;
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

  try {
    await validateDocumentEditPermission(documentId);

    // Placeholder for fetching document
    const document: Document | null = null;

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.clinicId !== clinicId) {
      throw new Error('Access denied');
    }

    const updatedDocument: Document = {
      ...document,
      folderId,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
    };

    // Placeholder for database update
    await logDocumentAction(documentId, 'edit', { folderId });

    logger.info('Document moved to folder', { documentId, folderId, clinicId, userId: user.id });
    return updatedDocument;
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

  try {
    await validateDocumentEditPermission(documentId);

    // Placeholder for fetching document
    const document: Document | null = null;

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.clinicId !== clinicId) {
      throw new Error('Access denied');
    }

    const updatedDocument: Document = {
      ...document,
      status: status as any,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
    };

    // Placeholder for database update
    await logDocumentAction(documentId, 'edit', { status });

    logger.info('Document status updated', { documentId, status, clinicId, userId: user.id });
    return updatedDocument;
  } catch (error) {
    logger.error('Failed to update document status', { error, documentId, status, clinicId, userId: user.id });
    throw error;
  }
}
