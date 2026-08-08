import { getUserClinicId, getCurrentUser } from '../core/auth';
import { NotFoundError, AuthorizationError, DatabaseError } from '../core/errors';
import { logger } from '../shared/logger';
import { Document, DocumentSharing, SharingType } from './document-types';
import { validateDocumentSharePermission } from './document-permissions';
import { getSupabaseClient } from '../core/client';

// ============================================================================
// File Sharing Service
// Manage document sharing with internal users, secure links, and access control
// ============================================================================

/**
 * Share a document with internal users
 */
export async function shareDocumentInternally(
  documentId: string,
  sharedWith: string[],
  sharedRoles: string[]
): Promise<DocumentSharing> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentSharePermission(documentId);

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

    const sharing: DocumentSharing = {
      type: SharingType.INTERNAL,
      sharedWith,
      sharedRoles,
      accessCount: 0,
    };

    // Update document in database
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({ sharing, updated_at: new Date().toISOString(), updated_by: user.id })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to share document internally', { error: updateError });
    }

    logger.info('Document shared internally', { 
      documentId, 
      sharedWithCount: sharedWith.length, 
      sharedRolesCount: sharedRoles.length, 
      clinicId, 
      userId: user.id 
    });

    return sharing;
  } catch (error) {
    logger.error('Failed to share document internally', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Generate a secure share link
 */
export async function generateSecureShareLink(
  documentId: string,
  options: {
    expiresIn?: number;
    passwordProtected?: boolean;
    downloadLimit?: number;
  } = {}
): Promise<{ shareLink: string; sharing: DocumentSharing }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentSharePermission(documentId);

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

    // Generate share link token
    const shareToken = crypto.randomUUID();
    const shareLink = `${process.env.APP_URL}/share/${shareToken}`;

    const expiresIn = options.expiresIn || 7 * 24 * 60 * 60; // 7 days default
    const shareLinkExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

    const sharing: DocumentSharing = {
      type: SharingType.SECURE_LINK,
      sharedWith: [],
      sharedRoles: [],
      shareLink,
      shareLinkExpiry,
      passwordProtected: options.passwordProtected,
      downloadLimit: options.downloadLimit,
      accessCount: 0,
    };

    // Update document in database
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({ sharing, updated_at: new Date().toISOString(), updated_by: user.id })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to generate secure share link', { error: updateError });
    }

    logger.info('Secure share link generated', { 
      documentId, 
      shareLink, 
      expiresIn, 
      clinicId, 
      userId: user.id 
    });

    return { shareLink, sharing };
  } catch (error) {
    logger.error('Failed to generate secure share link', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Revoke document sharing
 */
export async function revokeDocumentSharing(documentId: string): Promise<void> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentSharePermission(documentId);

    // Update document in database to remove sharing
    const { error: updateError } = await supabase
      .from('documents')
      .update({ sharing: null, updated_at: new Date().toISOString(), updated_by: user.id })
      .eq('id', documentId)
      .eq('clinic_id', clinicId);

    if (updateError) {
      throw new DatabaseError('Failed to revoke document sharing', { error: updateError });
    }

    logger.info('Document sharing revoked', { documentId, clinicId, userId: user.id });
  } catch (error) {
    logger.error('Failed to revoke document sharing', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Get document sharing settings
 */
export async function getDocumentSharing(documentId: string): Promise<DocumentSharing> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentSharePermission(documentId);

    // Fetch document
    const { data: document, error } = await supabase
      .from('documents')
      .select('sharing')
      .eq('id', documentId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error || !document) {
      throw new NotFoundError('Document not found');
    }

    const sharing = document.sharing || {
      type: SharingType.INTERNAL,
      sharedWith: [],
      sharedRoles: [],
      accessCount: 0,
    };

    logger.info('Document sharing retrieved', { documentId, clinicId, userId: user.id });
    return sharing;
  } catch (error) {
    logger.error('Failed to get document sharing', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Update document sharing settings
 */
export async function updateDocumentSharing(
  documentId: string,
  updates: Partial<DocumentSharing>
): Promise<DocumentSharing> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentSharePermission(documentId);

    // Fetch document
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('sharing')
      .eq('id', documentId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !document) {
      throw new NotFoundError('Document not found');
    }

    const sharing = document.sharing || {
      type: SharingType.INTERNAL,
      sharedWith: [],
      sharedRoles: [],
      accessCount: 0,
    };

    const updatedSharing = { ...sharing, ...updates };

    // Update document in database
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({ sharing: updatedSharing, updated_at: new Date().toISOString(), updated_by: user.id })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw new DatabaseError('Failed to update document sharing', { error: updateError });
    }

    logger.info('Document sharing updated', { documentId, clinicId, userId: user.id });
    return updatedSharing;
  } catch (error) {
    logger.error('Failed to update document sharing', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Access shared document via link
 */
export async function incrementShareAccessCount(shareToken: string): Promise<void> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch document by share token
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('id, sharing')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    if (fetchError) {
      throw new DatabaseError('Failed to fetch document', { error: fetchError });
    }

    const document = (documents || []).find(doc => 
      doc.sharing?.shareLink?.includes(shareToken)
    );

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    if (document.sharing) {
      document.sharing.accessCount = (document.sharing.accessCount || 0) + 1;
      
      // Update document in database
      const { error: updateError } = await supabase
        .from('documents')
        .update({ sharing: document.sharing, updated_at: new Date().toISOString() })
        .eq('id', document.id);

      if (updateError) {
        throw new DatabaseError('Failed to increment share access count', { error: updateError });
      }
    }

    logger.info('Shared document accessed', { shareToken, documentId: document.id });
  } catch (error) {
    logger.error('Failed to increment share access count', { 
      error, 
      shareToken, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Get documents shared with current user
 */
export async function getSharedWithMe(): Promise<Document[]> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for database query
    const documents: Document[] = [];

    logger.info('Shared documents retrieved', { clinicId, userId: user.id, count: documents.length });
    return documents;
  } catch (error) {
    logger.error('Failed to get shared documents', { error, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Get documents shared by current user
 */
export async function getSharedByMe(): Promise<Document[]> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for database query
    const documents: Document[] = [];

    logger.info('Documents shared by me retrieved', { clinicId, userId: user.id, count: documents.length });
    return documents;
  } catch (error) {
    logger.error('Failed to get documents shared by me', { error, clinicId, userId: user.id });
    throw error;
  }
}
