import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { Document, DocumentStatus } from './document-types';
import { validateDocumentEditPermission } from './document-permissions';
import { moveInStorage } from './storage';

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

  try {
    // Check permissions
    await validateDocumentEditPermission(documentId);

    // Placeholder for fetching document
    const document: Document | null = null;

    if (!document) {
      throw new Error('Document not found');
    }

    // Verify clinic access for multi-tenancy
    if (document.clinicId !== clinicId) {
      throw new Error('Access denied');
    }

    if (document.status === DocumentStatus.ARCHIVED) {
      throw new Error('Document is already archived');
    }

    // Move file to archive storage
    await moveInStorage(document.filePath, `archive/${document.filePath}`, 'private' as any);

    const updatedDocument: Document = {
      ...document,
      status: DocumentStatus.ARCHIVED,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
    };

    // Placeholder for database update
    logger.info('Document archived', { documentId, clinicId, userId: user.id });
    return updatedDocument;
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

  try {
    // Check permissions
    await validateDocumentEditPermission(documentId);

    // Placeholder for fetching document
    const document: Document | null = null;

    if (!document) {
      throw new Error('Document not found');
    }

    // Verify clinic access for multi-tenancy
    if (document.clinicId !== clinicId) {
      throw new Error('Access denied');
    }

    if (document.status !== DocumentStatus.ARCHIVED) {
      throw new Error('Document is not archived');
    }

    // Move file back from archive storage
    const originalPath = document.filePath.replace('archive/', '');
    await moveInStorage(document.filePath, originalPath, 'private' as any);

    const updatedDocument: Document = {
      ...document,
      status: DocumentStatus.ACTIVE,
      filePath: originalPath,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
    };

    // Placeholder for database update
    logger.info('Document unarchived', { documentId, clinicId, userId: user.id });
    return updatedDocument;
  } catch (error) {
    logger.error('Failed to unarchive document', { error, documentId, clinicId, userId: user.id });
    throw error;
  }
}
