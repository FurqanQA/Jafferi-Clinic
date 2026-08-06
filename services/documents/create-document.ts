import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { Document, DocumentCategory, FileFormat } from './document-types';
import { createDocumentSchema, getMimeType } from './document-validation';
import { uploadFile } from './file-upload';
import { logDocumentAction } from './audit';

// ============================================================================
// Create Document Service
// High-level document creation orchestrator
// ============================================================================

/**
 * Create a new document
 */
export async function createDocument(data: {
  title: string;
  description?: string;
  category: DocumentCategory;
  format: FileFormat;
  file: Buffer;
  fileName: string;
  folderId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}): Promise<Document> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Validate document data
    createDocumentSchema.parse({
      title: data.title,
      description: data.description,
      category: data.category,
      format: data.format,
    });

    // Upload the file
    const uploadResult = await uploadFile(data.file, data.fileName, {
      title: data.title,
      category: data.category,
      format: data.format,
      description: data.description,
      folderId: data.folderId,
      tags: data.tags,
      metadata: data.metadata,
    });

    // Get MIME type
    const mimeType = getMimeType(data.format);

    // Create document record
    const document: Document = {
      id: uploadResult.documentId,
      clinicId,
      ownerId: user.id,
      title: data.title,
      description: data.description,
      category: data.category,
      format: data.format,
      status: 'active' as any,
      filePath: uploadResult.filePath,
      fileName: data.fileName,
      fileSize: data.file.length,
      mimeType,
      checksum: uploadResult.checksum,
      tags: data.tags || [],
      metadata: data.metadata || {},
      version: uploadResult.version,
      currentVersionId: uploadResult.documentId,
      isEncrypted: false,
      isPublic: false,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.id,
      updatedBy: user.id,
    };

    // Placeholder for database insertion
    await logDocumentAction(document.id, 'upload', {
      fileName: data.fileName,
      fileSize: data.file.length,
    });

    logger.info('Document created', { 
      documentId: document.id, 
      title: data.title, 
      clinicId, 
      userId: user.id 
    });

    return document;
  } catch (error) {
    logger.error('Failed to create document', { 
      error, 
      title: data.title, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Create multiple documents in batch
 */
export async function createDocuments(
  documents: Array<{
    title: string;
    description?: string;
    category: DocumentCategory;
    format: FileFormat;
    file: Buffer;
    fileName: string;
    folderId?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }>
): Promise<{ created: Document[]; failed: Array<{ title: string; error: string }> }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    const created: Document[] = [];
    const failed: Array<{ title: string; error: string }> = [];

    for (const docData of documents) {
      try {
        const document = await createDocument(docData);
        created.push(document);
      } catch (error) {
        failed.push({
          title: docData.title,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('Batch document creation completed', { 
      clinicId, 
      userId: user.id, 
      created: created.length, 
      failed: failed.length 
    });

    return { created, failed };
  } catch (error) {
    logger.error('Failed to create documents in batch', { error, clinicId, userId: user.id });
    throw error;
  }
}
