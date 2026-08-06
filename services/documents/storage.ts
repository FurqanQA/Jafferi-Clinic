import { getSupabaseClient } from '../core/client';
import { logger } from '../shared/logger';
import { StorageBucket, FileFormat } from './document-types';

// ============================================================================
// Storage Service
// Supabase Storage integration for document management
// Supports private buckets, public buckets, folder structure, versioning, metadata, checksums
// ============================================================================

/**
 * Storage configuration
 */
const STORAGE_CONFIG = {
  privateBucket: 'documents-private',
  publicBucket: 'documents-public',
  temporaryBucket: 'documents-temp',
  archiveBucket: 'documents-archive',
};

/**
 * Upload file to storage
 */
export async function uploadToStorage(
  file: Buffer,
  fileName: string,
  bucket: StorageBucket = StorageBucket.PRIVATE,
  folderPath?: string
): Promise<{ path: string; url: string }> {
  try {
    const supabase = getSupabaseClient();
    const bucketName = getBucketName(bucket);
    
    const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fullPath, file, {
        upsert: false,
        contentType: getMimeType(fileName),
      });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fullPath);

    logger.info('File uploaded to storage', { path: fullPath, bucket: bucketName });
    return { path: fullPath, url: publicUrl };
  } catch (error) {
    logger.error('Failed to upload to storage', { error, fileName, bucket });
    throw error;
  }
}

/**
 * Download file from storage
 */
export async function downloadFromStorage(
  path: string,
  bucket: StorageBucket = StorageBucket.PRIVATE
): Promise<Buffer> {
  try {
    const supabase = getSupabaseClient();
    const bucketName = getBucketName(bucket);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(path);

    if (error) {
      throw new Error(`Storage download failed: ${error.message}`);
    }

    logger.info('File downloaded from storage', { path, bucket: bucketName });
    return Buffer.from(await data.arrayBuffer());
  } catch (error) {
    logger.error('Failed to download from storage', { error, path, bucket });
    throw error;
  }
}

/**
 * Delete file from storage
 */
export async function deleteFromStorage(
  path: string,
  bucket: StorageBucket = StorageBucket.PRIVATE
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const bucketName = getBucketName(bucket);

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path]);

    if (error) {
      throw new Error(`Storage deletion failed: ${error.message}`);
    }

    logger.info('File deleted from storage', { path, bucket: bucketName });
  } catch (error) {
    logger.error('Failed to delete from storage', { error, path, bucket });
    throw error;
  }
}

/**
 * Move file within storage
 */
export async function moveInStorage(
  fromPath: string,
  toPath: string,
  bucket: StorageBucket = StorageBucket.PRIVATE
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const bucketName = getBucketName(bucket);

    const { error } = await supabase.storage
      .from(bucketName)
      .move(fromPath, toPath);

    if (error) {
      throw new Error(`Storage move failed: ${error.message}`);
    }

    logger.info('File moved in storage', { fromPath, toPath, bucket: bucketName });
  } catch (error) {
    logger.error('Failed to move in storage', { error, fromPath, toPath, bucket });
    throw error;
  }
}

/**
 * Copy file within storage
 */
export async function copyInStorage(
  fromPath: string,
  toPath: string,
  bucket: StorageBucket = StorageBucket.PRIVATE
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const bucketName = getBucketName(bucket);

    const { error } = await supabase.storage
      .from(bucketName)
      .copy(fromPath, toPath);

    if (error) {
      throw new Error(`Storage copy failed: ${error.message}`);
    }

    logger.info('File copied in storage', { fromPath, toPath, bucket: bucketName });
  } catch (error) {
    logger.error('Failed to copy in storage', { error, fromPath, toPath, bucket });
    throw error;
  }
}

/**
 * Get public URL for file
 */
export async function getPublicUrl(
  path: string,
  bucket: StorageBucket = StorageBucket.PUBLIC
): Promise<string> {
  try {
    const supabase = getSupabaseClient();
    const bucketName = getBucketName(bucket);

    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(path);

    return data.publicUrl;
  } catch (error) {
    logger.error('Failed to get public URL', { error, path, bucket });
    throw error;
  }
}

/**
 * Generate signed URL for temporary access
 */
export async function generateSignedUrl(
  path: string,
  expiresIn: number = 3600,
  bucket: StorageBucket = StorageBucket.PRIVATE
): Promise<string> {
  try {
    const supabase = getSupabaseClient();
    const bucketName = getBucketName(bucket);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }

    logger.info('Signed URL generated', { path, expiresIn, bucket: bucketName });
    return data.signedUrl;
  } catch (error) {
    logger.error('Failed to generate signed URL', { error, path, expiresIn, bucket });
    throw error;
  }
}

/**
 * List files in storage folder
 */
export async function listStorageFiles(
  folderPath?: string,
  bucket: StorageBucket = StorageBucket.PRIVATE
): Promise<Array<{ name: string; size: number; created_at: string }>> {
  try {
    const supabase = getSupabaseClient();
    const bucketName = getBucketName(bucket);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath || '');

    if (error) {
      throw new Error(`Storage list failed: ${error.message}`);
    }

    const files = (data || []).map(file => ({
      name: file.name,
      size: file.metadata?.size || 0,
      created_at: file.created_at || new Date().toISOString(),
    }));

    logger.info('Storage files listed', { folderPath, count: files.length, bucket: bucketName });
    return files;
  } catch (error) {
    logger.error('Failed to list storage files', { error, folderPath, bucket });
    throw error;
  }
}

/**
 * Get file metadata from storage
 */
export async function getFileMetadata(
  path: string,
  bucket: StorageBucket = StorageBucket.PRIVATE
): Promise<{ size: number; created_at: string; updated_at: string }> {
  try {
    const supabase = getSupabaseClient();
    const bucketName = getBucketName(bucket);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(path.substring(0, path.lastIndexOf('/')));

    if (error) {
      throw new Error(`Metadata retrieval failed: ${error.message}`);
    }

    const file = data?.find(f => f.name === path.substring(path.lastIndexOf('/') + 1));
    
    if (!file) {
      throw new Error('File not found');
    }

    return {
      size: file.metadata?.size || 0,
      created_at: file.created_at || new Date().toISOString(),
      updated_at: file.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to get file metadata', { error, path, bucket });
    throw error;
  }
}

/**
 * Calculate file checksum
 */
export async function calculateChecksum(file: Buffer): Promise<string> {
  // Placeholder for checksum calculation
  // In production, use crypto.createHash('sha256').update(file).digest('hex')
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(file).digest('hex');
}

/**
 * Get bucket name for storage type
 */
function getBucketName(bucket: StorageBucket): string {
  switch (bucket) {
    case StorageBucket.PRIVATE:
      return STORAGE_CONFIG.privateBucket;
    case StorageBucket.PUBLIC:
      return STORAGE_CONFIG.publicBucket;
    case StorageBucket.TEMPORARY:
      return STORAGE_CONFIG.temporaryBucket;
    case StorageBucket.ARCHIVE:
      return STORAGE_CONFIG.archiveBucket;
    default:
      return STORAGE_CONFIG.privateBucket;
  }
}

/**
 * Get MIME type from filename
 */
function getMimeType(fileName: string): string {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.zip': 'application/zip',
    '.dcm': 'application/dicom',
    '.dicom': 'application/dicom',
  };
  return mimeTypes[extension] || 'application/octet-stream';
}
