import { UploadError } from '../core/errors';
import { FILE_SIZE, FILE_TYPES } from './constants';

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Upload options
 */
export interface UploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSize: number = FILE_SIZE.MAX_IMAGE_SIZE): FileValidationResult {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
    };
  }
  return { valid: true };
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[] = FILE_TYPES.IMAGES): FileValidationResult {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }
  return { valid: true };
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): FileValidationResult {
  const sizeValidation = validateFileSize(file, FILE_SIZE.MAX_IMAGE_SIZE);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  const typeValidation = validateFileType(file, FILE_TYPES.IMAGES);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  return { valid: true };
}

/**
 * Validate document file
 */
export function validateDocumentFile(file: File): FileValidationResult {
  const sizeValidation = validateFileSize(file, FILE_SIZE.MAX_DOCUMENT_SIZE);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  const typeValidation = validateFileType(file, FILE_TYPES.DOCUMENTS);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  return { valid: true };
}

/**
 * Validate file with custom options
 */
export function validateFile(file: File, options: UploadOptions): void {
  const maxSize = options.maxSize || FILE_SIZE.MAX_IMAGE_SIZE;
  const allowedTypes = options.allowedTypes || FILE_TYPES.IMAGES;

  const sizeValidation = validateFileSize(file, maxSize);
  if (!sizeValidation.valid) {
    throw new UploadError(sizeValidation.error || 'File size validation failed');
  }

  const typeValidation = validateFileType(file, allowedTypes);
  if (!typeValidation.valid) {
    throw new UploadError(typeValidation.error || 'File type validation failed');
  }
}

/**
 * Generate unique file name
 */
export function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  const nameWithoutExtension = originalName.replace(`.${extension}`, '');
  const sanitizedName = nameWithoutExtension.replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${sanitizedName}_${timestamp}_${random}.${extension}`;
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return FILE_TYPES.IMAGES.includes(file.type);
}

/**
 * Check if file is a document
 */
export function isDocumentFile(file: File): boolean {
  return FILE_TYPES.DOCUMENTS.includes(file.type);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
