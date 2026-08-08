import { getUserClinicId, getCurrentUser } from '../core/auth';
import { NotFoundError, AuthorizationError, ValidationError } from '../core/errors';
import { logger } from '../shared/logger';
import { Document, StorageBucket } from './document-types';
import { validateDocumentDownloadPermission } from './document-permissions';
import { downloadFromStorage, generateSignedUrl } from './storage';
import { updateDocumentAccessTracking } from './document-engine';
import { getSupabaseClient } from '../core/client';

interface DownloadSession {
  id: string;
  documentId: string;
  userId: string;
  downloadUrl: string;
  expiresAt: string;
  accessCount: number;
  maxAccess?: number;
  createdAt: string;
}

// ============================================================================
// File Download Service
// Handle file downloads with access control, audit logging, and temporary URLs
// ============================================================================

/**
 * Download a file
 */
export async function downloadFile(documentId: string): Promise<{
  data: Buffer;
  fileName: string;
  mimeType: string;
}> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentDownloadPermission(documentId);

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

    // Download from storage
    const data = await downloadFromStorage(document.file_path, StorageBucket.PRIVATE);

    // Update access tracking
    await updateDocumentAccessTracking(documentId, 'download');

    // Increment download count
    await supabase
      .from('documents')
      .update({ download_count: (document.download_count || 0) + 1, last_downloaded_at: new Date().toISOString() })
      .eq('id', documentId);

    logger.info('File downloaded', { 
      documentId, 
      fileName: document.file_name, 
      fileSize: data.length, 
      clinicId, 
      userId: user.id 
    });

    return {
      data,
      fileName: document.file_name,
      mimeType: document.mime_type,
    };
  } catch (error) {
    logger.error('Failed to download file', { error, documentId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Generate a temporary download link
 */
export async function generateDownloadLink(
  documentId: string,
  expiresIn: number = 3600,
  maxAccess?: number
): Promise<DownloadSession> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentDownloadPermission(documentId);

    // Fetch document
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !document) {
      throw new NotFoundError('Document not found');
    }

    // Generate signed URL
    const downloadUrl = await generateSignedUrl(document.file_path, expiresIn, StorageBucket.PRIVATE);

    // Create download session
    const session: DownloadSession = {
      id: crypto.randomUUID(),
      documentId,
      userId: user.id,
      downloadUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      accessCount: 0,
      maxAccess,
      createdAt: new Date().toISOString(),
    };

    // Placeholder for database insertion
    logger.info('Download link generated', { 
      documentId, 
      sessionId: session.id, 
      expiresIn, 
      clinicId, 
      userId: user.id 
    });

    return session;
  } catch (error) {
    logger.error('Failed to generate download link', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Get download session
 */
export async function getDownloadSession(sessionId: string): Promise<DownloadSession> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Retrieve session from database
    const { data: session, error } = await getSupabaseClient()
      .from('download_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      throw new NotFoundError('Download session not found');
    }

    // Verify ownership
    if (session.userId !== user.id) {
      throw new AuthorizationError('Access denied');
    }

    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      throw new ValidationError('Download link has expired');
    }

    // Check access limit
    if (session.maxAccess && session.accessCount >= session.maxAccess) {
      throw new ValidationError('Download link has reached maximum access limit');
    }

    return session;
  } catch (error) {
    logger.error('Failed to get download session', { 
      error, 
      sessionId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Revoke download link
 */
export async function revokeDownloadLink(sessionId: string): Promise<void> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for session deletion
    logger.info('Download link revoked', { sessionId, clinicId, userId: user.id });
  } catch (error) {
    logger.error('Failed to revoke download link', { 
      error, 
      sessionId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Get download history for a document
 */
export async function getDownloadHistory(documentId: string): Promise<Array<{
  userId: string;
  downloadedAt: string;
  sessionId?: string;
}>> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Check permissions
    await validateDocumentDownloadPermission(documentId);

    // Placeholder for database query
    const history: Array<{
      userId: string;
      downloadedAt: string;
      sessionId?: string;
    }> = [];

    logger.info('Download history retrieved', { documentId, clinicId, userId: user.id });
    return history;
  } catch (error) {
    logger.error('Failed to get download history', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}

/**
 * Stream file download
 * For large files, stream the download instead of loading entirely into memory
 */
export async function streamFileDownload(
  documentId: string,
  onChunk: (chunk: Buffer) => void
): Promise<void> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Check permissions
    await validateDocumentDownloadPermission(documentId);

    // Placeholder for fetching document
    const document: Document | null = null;

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Placeholder for streaming implementation
    logger.info('File download stream started', { 
      documentId, 
      clinicId, 
      userId: user.id 
    });

    // Update access tracking
    await updateDocumentAccessTracking(documentId, 'download');
  } catch (error) {
    logger.error('Failed to stream file download', { 
      error, 
      documentId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}
