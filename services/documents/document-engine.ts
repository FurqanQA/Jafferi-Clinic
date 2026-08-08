import { getUserClinicId, getCurrentUser } from '../core/auth';
import { NotFoundError, AuthorizationError } from '../core/errors';
import { logger } from '../shared/logger';
import { Document, DocumentStatus, DocumentCategory, FileFormat } from './document-types';
import { validateDocumentViewPermission, validateDocumentEditPermission } from './document-permissions';
import { getSupabaseClient } from '../core/client';

// ============================================================================
// Document Engine
// Central document orchestration service
// Coordinates storage, upload, download, preview, versioning, sharing, audit, analytics
// ============================================================================

/**
 * Document execution context
 */
export interface DocumentExecutionContext {
  documentId: string;
  userId: string;
  clinicId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Document operation result
 */
export interface DocumentOperationResult {
  success: boolean;
  documentId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Execute document workflow
 * Orchestrates the complete document lifecycle
 */
export async function executeDocumentWorkflow(
  operation: 'upload' | 'download' | 'preview' | 'share' | 'archive' | 'delete',
  context: DocumentExecutionContext
): Promise<DocumentOperationResult> {
  try {
    const clinicId = await getUserClinicId();
    const user = await getCurrentUser();

    logger.info('Document workflow started', { operation, documentId: context.documentId, clinicId, userId: user.id });

    // Placeholder for workflow execution
    // This would coordinate with storage, versioning, sharing, audit, and analytics services
    
    const result: DocumentOperationResult = {
      success: true,
      documentId: context.documentId,
      metadata: { operation, timestamp: new Date().toISOString() },
    };

    logger.info('Document workflow completed', { operation, documentId: context.documentId, success: true });
    return result;
  } catch (error) {
    logger.error('Document workflow failed', { error, operation, documentId: context.documentId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get document with full context
 * Includes metadata, versioning info, sharing settings, and access permissions
 */
export async function getDocumentWithContext(documentId: string): Promise<{
  document: Document;
  canView: boolean;
  canDownload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  versionCount: number;
  downloadCount: number;
  lastAccessedAt?: string;
}> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentViewPermission(documentId);

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

    // Placeholder for permission checks
    const canView = true;
    const canDownload = true;
    const canEdit = true;
    const canDelete = true;
    const canShare = true;

    // Placeholder for version and access counts
    const versionCount = 1;
    const downloadCount = document.download_count;

    logger.info('Document context retrieved', { documentId, clinicId, userId: user.id });
    return {
      document,
      canView,
      canDownload,
      canEdit,
      canDelete,
      canShare,
      versionCount,
      downloadCount,
      lastAccessedAt: document.last_accessed_at,
    };
  } catch (error) {
    logger.error('Failed to get document context', { error, documentId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Validate document before operation
 * Checks permissions, ownership, clinic isolation, and document status
 */
export async function validateDocumentForOperation(
  documentId: string,
  operation: 'view' | 'download' | 'edit' | 'delete' | 'share'
): Promise<{ valid: boolean; reason?: string }> {
  try {
    const clinicId = await getUserClinicId();
    const supabase = getSupabaseClient();

    // Fetch document
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('clinic_id, status, expires_at')
      .eq('id', documentId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !document) {
      return { valid: false, reason: 'Document not found' };
    }

    // Check clinic isolation
    if (document.clinic_id !== clinicId) {
      return { valid: false, reason: 'Access denied: clinic mismatch' };
    }

    // Check document status
    if (document.status === DocumentStatus.DELETED) {
      return { valid: false, reason: 'Document has been deleted' };
    }

    if (document.status === DocumentStatus.ARCHIVED && operation !== 'view') {
      return { valid: false, reason: 'Document is archived and cannot be modified' };
    }

    // Check expiration
    if (document.expires_at && new Date(document.expires_at) < new Date()) {
      return { valid: false, reason: 'Document has expired' };
    }

    // Check operation-specific permissions
    switch (operation) {
      case 'view':
        await validateDocumentViewPermission(documentId);
        break;
      case 'download':
        await validateDocumentViewPermission(documentId);
        break;
      case 'edit':
        await validateDocumentEditPermission(documentId);
        break;
      case 'delete':
        await validateDocumentEditPermission(documentId);
        break;
      case 'share':
        await validateDocumentEditPermission(documentId);
        break;
    }

    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      reason: error instanceof Error ? error.message : 'Validation failed' 
    };
  }
}

/**
 * Update document access tracking
 * Records last accessed time and increments download count
 */
export async function updateDocumentAccessTracking(
  documentId: string,
  accessType: 'view' | 'download'
): Promise<void> {
  try {
    const user = await getCurrentUser();
    const clinicId = await getUserClinicId();
    const supabase = getSupabaseClient();

    // Update access tracking in database
    const updateData: any = {
      last_accessed_at: new Date().toISOString(),
    };

    if (accessType === 'download') {
      updateData.download_count = (await supabase
        .from('documents')
        .select('download_count')
        .eq('id', documentId)
        .single()).data?.download_count || 0 + 1;
      updateData.last_downloaded_at = new Date().toISOString();
    }

    await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
      .eq('clinic_id', clinicId);

    logger.info('Document access tracking updated', { 
      documentId, 
      accessType, 
      clinicId, 
      userId: user.id 
    });
  } catch (error) {
    logger.error('Failed to update document access tracking', { 
      error, 
      documentId, 
      accessType 
    });
  }
}

/**
 * Get document statistics
 * Returns aggregated statistics for a document
 */
export async function getDocumentStatistics(documentId: string): Promise<{
  totalViews: number;
  totalDownloads: number;
  uniqueViewers: number;
  lastAccessedAt?: string;
  mostActiveDay?: string;
  averageAccessPerDay: number;
}> {
  try {
    const clinicId = await getUserClinicId();

    // Placeholder for fetching statistics
    const statistics = {
      totalViews: 0,
      totalDownloads: 0,
      uniqueViewers: 0,
      lastAccessedAt: undefined as string | undefined,
      mostActiveDay: undefined as string | undefined,
      averageAccessPerDay: 0,
    };

    logger.info('Document statistics retrieved', { documentId, clinicId });
    return statistics;
  } catch (error) {
    logger.error('Failed to get document statistics', { error, documentId });
    throw error;
  }
}

/**
 * Batch document operation
 * Execute an operation on multiple documents
 */
export async function batchDocumentOperation(
  documentIds: string[],
  operation: 'archive' | 'delete' | 'share' | 'tag'
): Promise<{ success: number; failed: number; errors: string[] }> {
  try {
    const user = await getCurrentUser();
    const clinicId = await getUserClinicId();

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // Placeholder for batch operation
    for (const documentId of documentIds) {
      try {
        // Placeholder for individual operation
        success++;
      } catch (error) {
        failed++;
        errors.push(`${documentId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    logger.info('Batch document operation completed', { 
      operation, 
      clinicId, 
      userId: user.id, 
      success, 
      failed 
    });

    return { success, failed, errors };
  } catch (error) {
    logger.error('Batch document operation failed', { error, operation });
    throw error;
  }
}
