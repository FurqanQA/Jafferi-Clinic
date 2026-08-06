import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { Document } from './document-types';
import { validateDocumentViewPermission } from './document-permissions';
import { logDocumentAction } from './audit';

// ============================================================================
// Get Document Service
// High-level document retrieval orchestrator
// ============================================================================

/**
 * Get a single document by ID
 */
export async function getDocument(documentId: string): Promise<Document> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Check permissions
    await validateDocumentViewPermission(documentId);

    // Placeholder for database query
    const document: Document | null = null;

    if (!document) {
      throw new Error('Document not found');
    }

    // Verify clinic access for multi-tenancy
    if (document.clinicId !== clinicId) {
      throw new Error('Access denied');
    }

    // Log view action
    await logDocumentAction(documentId, 'view');

    logger.info('Document retrieved', { documentId, clinicId, userId: user.id });
    return document;
  } catch (error) {
    logger.error('Failed to get document', { error, documentId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Get document with full context including versions and sharing
 */
export async function getDocumentWithContext(documentId: string): Promise<{
  document: Document;
  versions?: Document[];
  sharing?: any;
  auditLogs?: any[];
}> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    await validateDocumentViewPermission(documentId);

    const document = await getDocument(documentId);

    // Placeholder for fetching related data
    const context = {
      document,
      versions: [],
      sharing: null,
      auditLogs: [],
    };

    logger.info('Document context retrieved', { documentId, clinicId, userId: user.id });
    return context;
  } catch (error) {
    logger.error('Failed to get document context', { error, documentId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Check if document exists
 */
export async function documentExists(documentId: string): Promise<boolean> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for database check
    const exists = false;

    logger.info('Document existence checked', { documentId, exists, clinicId, userId: user.id });
    return exists;
  } catch (error) {
    logger.error('Failed to check document existence', { error, documentId, clinicId, userId: user.id });
    throw error;
  }
}
