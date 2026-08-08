import { getUserClinicId, getCurrentUser } from '../core/auth';
import { NotFoundError, AuthorizationError, DatabaseError, ValidationError } from '../core/errors';
import { logger } from '../shared/logger';
import { Document } from './document-types';
import { validateDocumentEditPermission } from './document-permissions';
import { getSupabaseClient } from '../core/client';

// ============================================================================
// File Tags Service
// Manage document tags for organization and categorization
// ============================================================================

/**
 * Add tags to a document
 */
export async function addDocumentTags(
  documentId: string,
  tags: string[]
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

    // Merge tags, avoiding duplicates
    const existingTags = document.tags || [];
    const newTags = tags.filter(tag => !existingTags.includes(tag));
    const updatedTags = [...existingTags, ...newTags];

    if (updatedTags.length > 20) {
      throw new ValidationError('Maximum 20 tags allowed per document');
    }

    // Update document in database
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({
        tags: updatedTags,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to add tags to document', { error: updateError });
    }

    logger.info('Tags added to document', { 
      documentId, 
      tagsAdded: newTags.length, 
      totalTags: updatedTags.length, 
      clinicId, 
      userId: user.id 
    });

    return updatedDocument as Document;
  } catch (error) {
    logger.error('Failed to add tags to document', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Remove tags from a document
 */
export async function removeDocumentTags(
  documentId: string,
  tags: string[]
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

    // Remove specified tags
    const updatedTags = (document.tags || []).filter((tag: string) => !tags.includes(tag));

    // Update document in database
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({
        tags: updatedTags,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to remove tags from document', { error: updateError });
    }

    logger.info('Tags removed from document', { 
      documentId, 
      tagsRemoved: tags.length, 
      remainingTags: updatedTags.length, 
      clinicId, 
      userId: user.id 
    });

    return updatedDocument as Document;
  } catch (error) {
    logger.error('Failed to remove tags from document', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Replace all tags on a document
 */
export async function replaceDocumentTags(
  documentId: string,
  tags: string[]
): Promise<Document> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentEditPermission(documentId);

    if (tags.length > 20) {
      throw new ValidationError('Maximum 20 tags allowed per document');
    }

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

    // Update document in database
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({
        tags,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to replace tags on document', { error: updateError });
    }

    logger.info('Tags replaced on document', { 
      documentId, 
      newTagCount: tags.length, 
      clinicId, 
      userId: user.id 
    });

    return updatedDocument as Document;
  } catch (error) {
    logger.error('Failed to replace tags on document', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Get all tags for a document
 */
export async function getDocumentTags(documentId: string): Promise<string[]> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch document
    const { data: document, error } = await supabase
      .from('documents')
      .select('tags')
      .eq('id', documentId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error || !document) {
      throw new NotFoundError('Document not found');
    }

    logger.info('Document tags retrieved', { documentId, clinicId, userId: user.id });
    return document.tags || [];
  } catch (error) {
    logger.error('Failed to get document tags', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Get all tags used in the clinic
 */
export async function getClinicTags(): Promise<Array<{ tag: string; count: number }>> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for database query
    const tags: Array<{ tag: string; count: number }> = [];

    logger.info('Clinic tags retrieved', { clinicId, userId: user.id, count: tags.length });
    return tags;
  } catch (error) {
    logger.error('Failed to get clinic tags', { error, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Search documents by tag
 */
export async function searchDocumentsByTag(
  tag: string,
  options?: { limit?: number; offset?: number }
): Promise<{ documents: Document[]; total: number }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for database query
    const documents: Document[] = [];
    const total = 0;

    logger.info('Documents searched by tag', { 
      tag, 
      clinicId, 
      userId: user.id, 
      count: documents.length 
    });

    return { documents, total };
  } catch (error) {
    logger.error('Failed to search documents by tag', { 
      error, 
      tag, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Get popular tags
 */
export async function getPopularTags(limit: number = 10): Promise<Array<{ tag: string; count: number }>> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for database query
    const tags: Array<{ tag: string; count: number }> = [];

    logger.info('Popular tags retrieved', { clinicId, userId: user.id, limit, count: tags.length });
    return tags;
  } catch (error) {
    logger.error('Failed to get popular tags', { error, clinicId, userId: user.id });
    throw error;
  }
}
