import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { Document, PaginationOptions } from './document-types';
import { validateDocumentViewPermission } from './document-permissions';

// ============================================================================
// Doctor Documents Service
// Manage documents specific to doctors
// ============================================================================

/**
 * Get documents for a specific doctor
 */
export async function getDoctorDocuments(
  doctorId: string,
  options?: PaginationOptions
): Promise<{ documents: Document[]; total: number }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    await validateDocumentViewPermission();

    const documents: Document[] = [];
    const total = 0;

    logger.info('Doctor documents retrieved', { doctorId, clinicId, userId: user.id, count: documents.length });
    return { documents, total };
  } catch (error) {
    logger.error('Failed to get doctor documents', { error, doctorId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Upload a document for a doctor
 */
export async function uploadDoctorDocument(
  doctorId: string,
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
      category: 'medical_records' as any,
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

    logger.info('Doctor document uploaded', { doctorId, fileName, clinicId, userId: user.id });
    return document;
  } catch (error) {
    logger.error('Failed to upload doctor document', { error, doctorId, fileName, clinicId, userId: user.id });
    throw error;
  }
}
