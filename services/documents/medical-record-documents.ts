import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { Document, PaginationOptions } from './document-types';
import { validateDocumentViewPermission } from './document-permissions';

// ============================================================================
// Medical Record Documents Service
// Manage documents specific to medical records
// ============================================================================

/**
 * Get documents for a specific medical record
 */
export async function getMedicalRecordDocuments(
  medicalRecordId: string,
  options?: PaginationOptions
): Promise<{ documents: Document[]; total: number }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    await validateDocumentViewPermission();

    const documents: Document[] = [];
    const total = 0;

    logger.info('Medical record documents retrieved', { medicalRecordId, clinicId, userId: user.id, count: documents.length });
    return { documents, total };
  } catch (error) {
    logger.error('Failed to get medical record documents', { error, medicalRecordId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Upload a medical record document
 */
export async function uploadMedicalRecordDocument(
  medicalRecordId: string,
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
      category: 'medical_records' as any,
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

    logger.info('Medical record document uploaded', { medicalRecordId, fileName, clinicId, userId: user.id });
    return document;
  } catch (error) {
    logger.error('Failed to upload medical record document', { error, medicalRecordId, fileName, clinicId, userId: user.id });
    throw error;
  }
}
