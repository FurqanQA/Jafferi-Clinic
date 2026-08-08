import { getUserClinicId, getCurrentUser } from '../core/auth';
import { NotFoundError, AuthorizationError, DatabaseError } from '../core/errors';
import { logger } from '../shared/logger';
import { Document, DocumentMetadata } from './document-types';
import { validateDocumentEditPermission } from './document-permissions';
import { getSupabaseClient } from '../core/client';

// ============================================================================
// Metadata Service
// Manage document metadata for enhanced organization and searchability
// ============================================================================

/**
 * Update document metadata
 */
export async function updateDocumentMetadata(
  documentId: string,
  metadata: Partial<DocumentMetadata>
): Promise<Document> {
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

    // Merge metadata
    const existingMetadata = (document.metadata as DocumentMetadata) || {};
    const updatedMetadata = { ...existingMetadata, ...metadata };

    // Update document
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to update document metadata', { error: updateError });
    }

    logger.info('Document metadata updated', { 
      documentId, 
      metadataKeys: Object.keys(metadata), 
      clinicId, 
      userId: user.id 
    });

    return updatedDocument as Document;
  } catch (error) {
    logger.error('Failed to update document metadata', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Get document metadata
 */
export async function getDocumentMetadata(documentId: string): Promise<DocumentMetadata> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch document
    const { data: document, error } = await supabase
      .from('documents')
      .select('metadata, clinic_id')
      .eq('id', documentId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error || !document) {
      throw new NotFoundError('Document not found');
    }

    // Verify clinic access for multi-tenancy
    if (document.clinic_id !== clinicId) {
      throw new AuthorizationError('Access denied');
    }

    logger.info('Document metadata retrieved', { documentId, clinicId, userId: user.id });
    return (document.metadata as DocumentMetadata) || {};
  } catch (error) {
    logger.error('Failed to get document metadata', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Extract metadata from file
 * Placeholder for automatic metadata extraction
 */
export async function extractMetadataFromFile(
  file: Buffer,
  format: string
): Promise<Partial<DocumentMetadata>> {
  try {
    // Placeholder for metadata extraction based on file format
    const metadata: Partial<DocumentMetadata> = {};

    logger.info('Metadata extracted from file', { format, fileSize: file.length });
    return metadata;
  } catch (error) {
    logger.error('Failed to extract metadata from file', { error, format });
    throw error;
  }
}

/**
 * Update custom field in metadata
 */
export async function updateCustomField(
  documentId: string,
  fieldName: string,
  fieldValue: string | number | boolean
): Promise<Document> {
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

    const existingMetadata = (document.metadata as DocumentMetadata) || {};
    const customFields = existingMetadata.customFields || {};
    customFields[fieldName] = fieldValue;

    const updatedMetadata = { ...existingMetadata, customFields };

    // Update document
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to update custom field', { error: updateError });
    }

    logger.info('Custom field updated', { 
      documentId, 
      fieldName, 
      clinicId, 
      userId: user.id 
    });

    return updatedDocument as Document;
  } catch (error) {
    logger.error('Failed to update custom field', { 
      error, 
      documentId, 
      fieldName, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Delete custom field from metadata
 */
export async function deleteCustomField(
  documentId: string,
  fieldName: string
): Promise<Document> {
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

    const existingMetadata = (document.metadata as DocumentMetadata) || {};
    const customFields = existingMetadata.customFields || {};
    delete customFields[fieldName];

    const updatedMetadata = { ...existingMetadata, customFields };

    // Update document
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to delete custom field', { error: updateError });
    }

    logger.info('Custom field deleted', { 
      documentId, 
      fieldName, 
      clinicId, 
      userId: user.id 
    });

    return updatedDocument as Document;
  } catch (error) {
    logger.error('Failed to delete custom field', { 
      error, 
      documentId, 
      fieldName, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Get documents by metadata field
 */
export async function getDocumentsByMetadata(
  fieldName: string,
  fieldValue: string | number | boolean
): Promise<Document[]> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Query documents with matching metadata
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .contains('metadata', { [fieldName]: fieldValue });

    if (error) {
      throw new DatabaseError('Failed to query documents by metadata', { error });
    }

    logger.info('Documents retrieved by metadata', { 
      fieldName, 
      fieldValue, 
      clinicId, 
      userId: user.id, 
      count: documents?.length || 0 
    });

    return (documents as Document[]) || [];
  } catch (error) {
    logger.error('Failed to get documents by metadata', { 
      error, 
      fieldName, 
      fieldValue, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}
