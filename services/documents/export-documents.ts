import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { Document } from './document-types';
import { validateDocumentViewPermission } from './document-permissions';
import { logDocumentAction } from './audit';

// ============================================================================
// Export Documents Service
// High-level document export orchestrator
// ============================================================================

/**
 * Export a single document
 */
export async function exportDocument(
  documentId: string,
  format: 'pdf' | 'zip' | 'original'
): Promise<Buffer> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    await validateDocumentViewPermission(documentId);

    // Placeholder for document export
    const exportBuffer = Buffer.alloc(0);

    await logDocumentAction(documentId, 'download', { format });

    logger.info('Document exported', { documentId, format, clinicId, userId: user.id });
    return exportBuffer;
  } catch (error) {
    logger.error('Failed to export document', { error, documentId, format, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Export multiple documents
 */
export async function exportDocuments(
  documentIds: string[],
  format: 'pdf' | 'zip'
): Promise<Buffer> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    await validateDocumentViewPermission();

    // Placeholder for batch export
    const exportBuffer = Buffer.alloc(0);

    for (const documentId of documentIds) {
      await logDocumentAction(documentId, 'download', { format, batch: true });
    }

    logger.info('Documents exported in batch', { count: documentIds.length, format, clinicId, userId: user.id });
    return exportBuffer;
  } catch (error) {
    logger.error('Failed to export documents in batch', { error, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Export documents by category
 */
export async function exportDocumentsByCategory(
  category: string,
  format: 'pdf' | 'zip'
): Promise<Buffer> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    await validateDocumentViewPermission();

    // Placeholder for category export
    const exportBuffer = Buffer.alloc(0);

    logger.info('Documents exported by category', { category, format, clinicId, userId: user.id });
    return exportBuffer;
  } catch (error) {
    logger.error('Failed to export documents by category', { error, category, format, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Get export history
 */
export async function getExportHistory(limit: number = 20): Promise<Array<{
  id: string;
  documentIds: string[];
  format: string;
  exportedAt: string;
  exportedBy: string;
}>> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    const history: Array<{
      id: string;
      documentIds: string[];
      format: string;
      exportedAt: string;
      exportedBy: string;
    }> = [];

    logger.info('Export history retrieved', { clinicId, userId: user.id, count: history.length });
    return history;
  } catch (error) {
    logger.error('Failed to get export history', { error, clinicId, userId: user.id });
    throw error;
  }
}
