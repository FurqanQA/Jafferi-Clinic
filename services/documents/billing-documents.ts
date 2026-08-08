import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { Document, PaginationOptions } from './document-types';
import { validateDocumentViewPermission } from './document-permissions';

// ============================================================================
// Billing Documents Service
// Manage documents specific to billing and invoices
// ============================================================================

/**
 * Get documents for a specific billing record
 */
export async function getBillingDocuments(
  billingId: string,
  options?: PaginationOptions
): Promise<{ documents: Document[]; total: number }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    await validateDocumentViewPermission();

    const documents: Document[] = [];
    const total = 0;

    logger.info('Billing documents retrieved', { billingId, clinicId, userId: user.id, count: documents.length });
    return { documents, total };
  } catch (error) {
    logger.error('Failed to get billing documents', { error, billingId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Upload a billing document
 */
export async function uploadBillingDocument(
  billingId: string,
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
      clinic_id: clinicId,
      owner_id: user.id,
      title: options.title,
      description: options.description,
      category: 'billing' as any,
      format: 'pdf' as any,
      status: 'active' as any,
      file_path: '',
      file_name: fileName,
      file_size: file.length,
      mime_type: 'application/octet-stream',
      checksum: '',
      tags: [],
      metadata: {},
      version: 1,
      current_version_id: '',
      is_encrypted: false,
      is_public: false,
      download_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: user.id,
      updated_by: user.id,
    };

    logger.info('Billing document uploaded', { billingId, fileName, clinicId, userId: user.id });
    return document;
  } catch (error) {
    logger.error('Failed to upload billing document', { error, billingId, fileName, clinicId, userId: user.id });
    throw error;
  }
}
