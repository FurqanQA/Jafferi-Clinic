import { getUserClinicId, getCurrentUser } from '../core/auth';
import { NotFoundError, AuthorizationError } from '../core/errors';
import { logger } from '../shared/logger';
import { Document } from './document-types';
import { validateDocumentViewPermission } from './document-permissions';
import { logDocumentAction } from './audit';
import { getSupabaseClient } from '../core/client';

// ============================================================================
// Get Document Service
// High-level document retrieval orchestrator
// ============================================================================

/**
 * Get a single document by ID
 */
export async function getDocument(documentId: string): Promise<Document> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentViewPermission(documentId);

    // Query database for document
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Database error fetching document', { error, documentId });
      throw new NotFoundError('Document not found');
    }

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Verify clinic access for multi-tenancy
    if (document.clinic_id !== clinicId) {
      throw new AuthorizationError('Access denied');
    }

    // Log view action
    await logDocumentAction(documentId, 'view');

    logger.info('Document retrieved', { documentId, clinicId, userId: user.id });
    return document as Document;
  } catch (error) {
    logger.error('Failed to get document', { error, documentId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Get document with full context including versions and sharing
 */
export async function getDocumentWithContext(documentId: string): Promise<{
  document: Document;
  versions?: Document[];
  sharing?: Record<string, unknown>;
  auditLogs?: Record<string, unknown>[];
}> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    await validateDocumentViewPermission(documentId);

    const document = await getDocument(documentId);

    // Fetch related data
    const supabase = getSupabaseClient();
    const { data: versions } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    const { data: sharing } = await supabase
      .from('document_sharing')
      .select('*')
      .eq('document_id', documentId)
      .single();

    const { data: auditLogs } = await supabase
      .from('document_audit_logs')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(50);

    const context = {
      document,
      versions: versions as Document[] || [],
      sharing: sharing as Record<string, unknown> || null,
      auditLogs: auditLogs as Record<string, unknown>[] || [],
    };

    logger.info('Document context retrieved', { documentId, clinicId, userId: user.id });
    return context;
  } catch (error) {
    logger.error('Failed to get document context', { error, documentId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Check if document exists
 */
export async function documentExists(documentId: string): Promise<boolean> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id')
      .eq('id', documentId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Database error checking document existence', { error, documentId });
      return false;
    }

    const exists = !!data;
    logger.info('Document existence checked', { documentId, exists, clinicId, userId: user.id });
    return exists;
  } catch (error) {
    logger.error('Failed to check document existence', { error, documentId, clinicId, userId: user.id });
    return false;
  }
}
