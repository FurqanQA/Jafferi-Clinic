import { getUserClinicId, getCurrentUser } from '../core/auth';
import { NotFoundError, AuthorizationError, DatabaseError } from '../core/errors';
import { logger } from '../shared/logger';
import { Document, DocumentVersion, StorageBucket } from './document-types';
import { validateDocumentEditPermission } from './document-permissions';
import { uploadToStorage, copyInStorage, calculateChecksum } from './storage';
import { getSupabaseClient } from '../core/client';

// ============================================================================
// File Versioning Service
// Manage document versions with history, restore, and comparison
// ============================================================================

/**
 * Create a new version of a document
 */
export async function createDocumentVersion(
  documentId: string,
  file: Buffer,
  fileName: string,
  changeDescription?: string
): Promise<DocumentVersion> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentEditPermission(documentId);

    // Fetch document
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !document) {
      throw new NotFoundError('Document not found');
    }

    // Verify clinic access for multi-tenancy
    if (document.clinic_id !== clinicId) {
      throw new AuthorizationError('Access denied');
    }

    // Calculate checksum
    const checksum = await calculateChecksum(file);

    // Generate version file path
    const versionPath = `versions/${documentId}/${document.version + 1}/${fileName}`;

    // Upload version to storage
    const { path } = await uploadToStorage(file, fileName, StorageBucket.PRIVATE, `versions/${documentId}/${document.version + 1}`);

    // Create version record
    const version: DocumentVersion = {
      id: crypto.randomUUID(),
      document_id: documentId,
      version_number: document.version + 1,
      file_path: path,
      file_name: fileName,
      file_size: file.length,
      checksum,
      uploaded_by: user.id,
      uploaded_at: new Date().toISOString(),
      change_description: changeDescription,
    };

    // Insert version into database
    const { data: insertedVersion, error: insertError } = await supabase
      .from('document_versions')
      .insert(version)
      .select()
      .single();

    if (insertError) {
      throw new DatabaseError('Failed to create document version', { error: insertError });
    }

    // Update document version
    await supabase
      .from('documents')
      .update({ version: document.version + 1, current_version_id: insertedVersion.id })
      .eq('id', documentId);

    logger.info('Document version created', { 
      documentId, 
      versionNumber: version.version_number, 
      clinicId, 
      userId: user.id 
    });

    return insertedVersion as DocumentVersion;
  } catch (error) {
    logger.error('Failed to create document version', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Get all versions of a document
 */
export async function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Check permissions
    await validateDocumentEditPermission(documentId);

    // Placeholder for database query
    const versions: DocumentVersion[] = [];

    logger.info('Document versions retrieved', { 
      documentId, 
      clinicId, 
      userId: user.id, 
      count: versions.length 
    });

    return versions;
  } catch (error) {
    logger.error('Failed to get document versions', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Get a specific version of a document
 */
export async function getDocumentVersion(versionId: string): Promise<DocumentVersion> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for database query
    const version: DocumentVersion | null = null;

    if (!version) {
      throw new Error('Version not found');
    }

    logger.info('Document version retrieved', { versionId, clinicId, userId: user.id });
    return version;
  } catch (error) {
    logger.error('Failed to get document version', { 
      error, 
      versionId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Restore a document to a previous version
 */
export async function restoreDocumentVersion(
  documentId: string,
  versionId: string
): Promise<Document> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentEditPermission(documentId);

    // Fetch document and version
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    const { data: version, error: versionError } = await supabase
      .from('document_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (docError || !document) {
      throw new NotFoundError('Document not found');
    }

    if (versionError || !version) {
      throw new NotFoundError('Version not found');
    }

    // Verify clinic access for multi-tenancy
    if (document.clinic_id !== clinicId) {
      throw new AuthorizationError('Access denied');
    }

    // Copy version file to current location
    await copyInStorage(version.file_path, document.file_path, StorageBucket.PRIVATE);

    // Update document with version details
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({
        version: version.version_number,
        current_version_id: versionId,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to restore document version', { error: updateError });
    }

    logger.info('Document version restored', { 
      documentId, 
      versionId, 
      versionNumber: version.version_number, 
      clinicId, 
      userId: user.id 
    });

    return updatedDocument as Document;
  } catch (error) {
    logger.error('Failed to restore document version', { 
      error, 
      documentId, 
      versionId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Compare two document versions
 * Placeholder for actual comparison implementation
 */
export async function compareDocumentVersions(
  versionId1: string,
  versionId2: string
): Promise<{
  version1: DocumentVersion;
  version2: DocumentVersion;
  differences: Array<{ field: string; oldValue: string; newValue: string }>;
}> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for fetching versions
    const version1: DocumentVersion | null = null;
    const version2: DocumentVersion | null = null;

    if (!version1 || !version2) {
      throw new NotFoundError('Version not found');
    }

    // Placeholder for comparison logic
    const differences: Array<{ field: string; oldValue: string; newValue: string }> = [];

    logger.info('Document versions compared', { 
      versionId1, 
      versionId2, 
      clinicId, 
      userId: user.id 
    });

    return { version1, version2, differences };
  } catch (error) {
    logger.error('Failed to compare document versions', { 
      error, 
      versionId1, 
      versionId2, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Delete a document version
 */
export async function deleteDocumentVersion(versionId: string): Promise<void> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for fetching version
    const version: DocumentVersion | null = null;

    if (!version) {
      throw new Error('Version not found');
    }

    // Placeholder for database deletion and storage cleanup
    logger.info('Document version deleted', { versionId, clinicId, userId: user.id });
  } catch (error) {
    logger.error('Failed to delete document version', { 
      error, 
      versionId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Get version history
 */
export async function getVersionHistory(documentId: string): Promise<Array<{
  versionId: string;
  versionNumber: number;
  uploadedBy: string;
  uploadedAt: string;
  changeDescription?: string;
  fileSize: number;
}>> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Check permissions
    await validateDocumentEditPermission(documentId);

    // Placeholder for database query
    const history: Array<{
      versionId: string;
      versionNumber: number;
      uploadedBy: string;
      uploadedAt: string;
      changeDescription?: string;
      fileSize: number;
    }> = [];

    logger.info('Version history retrieved', { documentId, clinicId, userId: user.id });
    return history;
  } catch (error) {
    logger.error('Failed to get version history', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}
