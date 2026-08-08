import { getUserClinicId, getCurrentUser } from '../core/auth';
import { NotFoundError, AuthorizationError, DatabaseError } from '../core/errors';
import { logger } from '../shared/logger';
import { Document, RetentionPolicy } from './document-types';
import { validateDocumentEditPermission } from './document-permissions';
import { getSupabaseClient } from '../core/client';

// ============================================================================
// Retention Service
// Manage document retention policies and automatic cleanup
// ============================================================================

/**
 * Set retention policy for a document
 */
export async function setRetentionPolicy(
  documentId: string,
  policy: RetentionPolicy
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

    // Update document in database
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({
        retention: policy,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to set retention policy', { error: updateError });
    }

    logger.info('Retention policy set', { 
      documentId, 
      policy, 
      clinicId, 
      userId: user.id 
    });

    return updatedDocument as Document;
  } catch (error) {
    logger.error('Failed to set retention policy', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Get retention policy for a document
 */
export async function getRetentionPolicy(documentId: string): Promise<RetentionPolicy> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch document
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
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

    const policy = document.retention || {
      enabled: false,
      retainUntil: undefined,
      retainDays: undefined,
      autoArchive: false,
      autoDelete: false,
    };

    return policy;
  } catch (error) {
    logger.error('Failed to get retention policy', { error, documentId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Apply retention policy to document
 */
export async function applyRetentionPolicy(documentId: string): Promise<{
  archived: boolean;
  deleted: boolean;
  action: string;
}> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const policy = await getRetentionPolicy(documentId);

    if (!policy.enabled) {
      return { archived: false, deleted: false, action: 'none' };
    }

    const now = new Date();
    let action = 'none';
    let archived = false;
    let deleted = false;

    // Fetch document to check creation date
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('created_at')
      .eq('id', documentId)
      .eq('clinic_id', clinicId)
      .single();

    if (fetchError || !document) {
      throw new NotFoundError('Document not found');
    }

    // Check if retention period has expired
    if (policy.retainUntil && new Date(policy.retainUntil) < now) {
      if (policy.autoDelete) {
        // Delete the document
        await supabase
          .from('documents')
          .delete()
          .eq('id', documentId);
        deleted = true;
        action = 'deleted';
      } else if (policy.autoArchive) {
        // Archive the document
        await supabase
          .from('documents')
          .update({ status: 'archived' })
          .eq('id', documentId);
        archived = true;
        action = 'archived';
      }
    } else if (policy.retainDays) {
      const createdDate = new Date(document.created_at);
      const expiryDate = new Date(createdDate.getTime() + policy.retainDays * 24 * 60 * 60 * 1000);
      if (expiryDate < now) {
        if (policy.autoDelete) {
          await supabase
            .from('documents')
            .delete()
            .eq('id', documentId);
          deleted = true;
          action = 'deleted';
        } else if (policy.autoArchive) {
          await supabase
            .from('documents')
            .update({ status: 'archived' })
            .eq('id', documentId);
          archived = true;
          action = 'archived';
        }
      }
    }

    logger.info('Retention policy applied', { 
      documentId, 
      action, 
      clinicId, 
      userId: user.id 
    });

    return { archived, deleted, action };
  } catch (error) {
    logger.error('Failed to apply retention policy', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Get documents due for retention action
 */
export async function getDocumentsDueForRetention(): Promise<Document[]> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch documents with retention policies
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .not('retention', 'is', null);

    if (error) {
      throw new DatabaseError('Failed to fetch documents due for retention', { error });
    }

    const now = new Date();
    const dueDocuments = (documents as Document[]).filter(doc => {
      const policy = doc.retention;
      if (!policy || !policy.enabled) return false;
      
      if (policy.retainUntil && new Date(policy.retainUntil) < now) {
        return true;
      }
      
      if (policy.retainDays) {
        const createdDate = new Date(doc.created_at);
        const expiryDate = new Date(createdDate.getTime() + policy.retainDays * 24 * 60 * 60 * 1000);
        return expiryDate < now;
      }
      
      return false;
    });

    logger.info('Documents due for retention retrieved', { 
      clinicId, 
      userId: user.id, 
      count: dueDocuments.length 
    });

    return dueDocuments;
  } catch (error) {
    logger.error('Failed to get documents due for retention', { 
      error, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}
