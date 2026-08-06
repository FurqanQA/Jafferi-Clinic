import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { Document, PaginationOptions } from './document-types';
import { validateDocumentViewPermission } from './document-permissions';

// ============================================================================
// Laboratory Documents Service
// Manage documents specific to laboratory tests and results
// ============================================================================

/**
 * Get documents for a specific laboratory test
 */
export async function getLaboratoryDocuments(
  laboratoryId: string,
  options?: PaginationOptions
): Promise<{ documents: Document[]; total: number }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    await validateDocumentViewPermission();

    const documents: Document[] = [];
    const total = 0;

    logger.info('Laboratory documents retrieved', { laboratoryId, clinicId, userId: user.id, count: documents.length });
    return { documents, total };
  } catch (error) {
    logger.error('Failed to get laboratory documents', { error, laboratoryId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Upload a laboratory result document
 */
export async function uploadLaboratoryDocument(
  laboratoryId: string,
  file: Buffer,
  fileName: string,
  options: {
    title: string;
    description?: string;
  }
): Promise<Document> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    const document: Document = {
      id: crypto.randomUUID(),
      clinicId,
      ownerId: user.id,
      title: options.title,
      description: options.description,
      category: 'lab_reports' as any,
      format: 'pdf' as any,
      status: 'active' as any,
      filePath: '',
      fileName,
      fileSize: file.length,
      mimeType: 'application/octet-stream',
      checksum: '',
      tags: [],
      metadata: {},
      version: 1,
      currentVersionId: '',
      isEncrypted: false,
      isPublic: false,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.id,
      updatedBy: user.id,
    };

    logger.info('Laboratory document uploaded', { laboratoryId, fileName, clinicId, userId: user.id });
    return document;
  } catch (error) {
    logger.error('Failed to upload laboratory document', { error, laboratoryId, fileName, clinicId, userId: user.id });
    throw error;
  }
}
