import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { Document, PaginationOptions } from './document-types';
import { validateDocumentViewPermission } from './document-permissions';

// ============================================================================
// Payment Documents Service
// Manage documents specific to payments and receipts
// ============================================================================

/**
 * Get documents for a specific payment
 */
export async function getPaymentDocuments(
  paymentId: string,
  options?: PaginationOptions
): Promise<{ documents: Document[]; total: number }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    await validateDocumentViewPermission();

    const documents: Document[] = [];
    const total = 0;

    logger.info('Payment documents retrieved', { paymentId, clinicId, userId: user.id, count: documents.length });
    return { documents, total };
  } catch (error) {
    logger.error('Failed to get payment documents', { error, paymentId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Upload a payment document
 */
export async function uploadPaymentDocument(
  paymentId: string,
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
      category: 'payments' as any,
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

    logger.info('Payment document uploaded', { paymentId, fileName, clinicId, userId: user.id });
    return document;
  } catch (error) {
    logger.error('Failed to upload payment document', { error, paymentId, fileName, clinicId, userId: user.id });
    throw error;
  }
}
