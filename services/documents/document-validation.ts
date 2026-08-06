import { z } from 'zod';
import { DocumentCategory, FileFormat, DocumentStatus, StorageBucket, SharingType } from './document-types';

// ============================================================================
// Document Validation
// Zod schemas for document validation
// ============================================================================

/**
 * Allowed file extensions by format
 */
const ALLOWED_EXTENSIONS: Record<FileFormat, string[]> = {
  [FileFormat.PDF]: ['.pdf'],
  [FileFormat.PNG]: ['.png'],
  [FileFormat.JPG]: ['.jpg', '.jpeg'],
  [FileFormat.JPEG]: ['.jpeg', '.jpg'],
  [FileFormat.WEBP]: ['.webp'],
  [FileFormat.DOCX]: ['.docx'],
  [FileFormat.XLSX]: ['.xlsx'],
  [FileFormat.CSV]: ['.csv'],
  [FileFormat.TXT]: ['.txt'],
  [FileFormat.JSON]: ['.json'],
  [FileFormat.ZIP]: ['.zip'],
  [FileFormat.DICOM]: ['.dcm', '.dicom'],
};

/**
 * Maximum file sizes by format (in bytes)
 */
const MAX_FILE_SIZES: Record<FileFormat, number> = {
  [FileFormat.PDF]: 50 * 1024 * 1024, // 50MB
  [FileFormat.PNG]: 20 * 1024 * 1024, // 20MB
  [FileFormat.JPG]: 20 * 1024 * 1024, // 20MB
  [FileFormat.JPEG]: 20 * 1024 * 1024, // 20MB
  [FileFormat.WEBP]: 20 * 1024 * 1024, // 20MB
  [FileFormat.DOCX]: 25 * 1024 * 1024, // 25MB
  [FileFormat.XLSX]: 25 * 1024 * 1024, // 25MB
  [FileFormat.CSV]: 10 * 1024 * 1024, // 10MB
  [FileFormat.TXT]: 5 * 1024 * 1024, // 5MB
  [FileFormat.JSON]: 10 * 1024 * 1024, // 10MB
  [FileFormat.ZIP]: 100 * 1024 * 1024, // 100MB
  [FileFormat.DICOM]: 500 * 1024 * 1024, // 500MB
};

/**
 * MIME types by format
 */
const MIME_TYPES: Record<FileFormat, string> = {
  [FileFormat.PDF]: 'application/pdf',
  [FileFormat.PNG]: 'image/png',
  [FileFormat.JPG]: 'image/jpeg',
  [FileFormat.JPEG]: 'image/jpeg',
  [FileFormat.WEBP]: 'image/webp',
  [FileFormat.DOCX]: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  [FileFormat.XLSX]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  [FileFormat.CSV]: 'text/csv',
  [FileFormat.TXT]: 'text/plain',
  [FileFormat.JSON]: 'application/json',
  [FileFormat.ZIP]: 'application/zip',
  [FileFormat.DICOM]: 'application/dicom',
};

/**
 * Document metadata schema
 */
export const documentMetadataSchema = z.object({
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  appointmentId: z.string().optional(),
  invoiceId: z.string().optional(),
  prescriptionId: z.string().optional(),
  medicalRecordId: z.string().optional(),
  laboratoryTestId: z.string().optional(),
  department: z.string().optional(),
  encounterDate: z.string().optional(),
  documentDate: z.string().optional(),
  customFields: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

/**
 * Document sharing schema
 */
export const documentSharingSchema = z.object({
  type: z.nativeEnum(SharingType),
  sharedWith: z.array(z.string()).optional(),
  sharedRoles: z.array(z.string()).optional(),
  shareLink: z.string().url().optional(),
  shareLinkExpiry: z.string().optional(),
  passwordProtected: z.boolean().optional(),
  downloadLimit: z.number().int().positive().optional(),
  accessCount: z.number().int().default(0),
});

/**
 * Retention policy schema
 */
export const retentionPolicySchema = z.object({
  enabled: z.boolean(),
  retainUntil: z.string().optional(),
  retainDays: z.number().int().positive().optional(),
  autoArchive: z.boolean(),
  autoDelete: z.boolean(),
});

/**
 * Document schema for creation
 */
export const createDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  category: z.nativeEnum(DocumentCategory),
  format: z.nativeEnum(FileFormat),
  folderId: z.string().optional(),
  tags: z.array(z.string()).max(20).default([]),
  metadata: documentMetadataSchema.optional(),
  sharing: documentSharingSchema.optional(),
  retention: retentionPolicySchema.optional(),
  isEncrypted: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  expiresAt: z.string().optional(),
});

/**
 * Document schema for update
 */
export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  category: z.nativeEnum(DocumentCategory).optional(),
  folderId: z.string().optional(),
  tags: z.array(z.string()).max(20).optional(),
  metadata: documentMetadataSchema.optional(),
  sharing: documentSharingSchema.optional(),
  retention: retentionPolicySchema.optional(),
  expiresAt: z.string().optional(),
});

/**
 * Folder schema
 */
export const folderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().optional(),
  description: z.string().max(500).optional(),
});

/**
 * Validate file extension
 */
export function validateFileExtension(fileName: string, format: FileFormat): boolean {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  const allowedExtensions = ALLOWED_EXTENSIONS[format] || [];
  return allowedExtensions.includes(extension);
}

/**
 * Validate file size
 */
export function validateFileSize(fileSize: number, format: FileFormat): boolean {
  const maxSize = MAX_FILE_SIZES[format] || 50 * 1024 * 1024;
  return fileSize <= maxSize;
}

/**
 * Validate MIME type
 */
export function validateMimeType(mimeType: string, format: FileFormat): boolean {
  const expectedMimeType = MIME_TYPES[format];
  return mimeType === expectedMimeType;
}

/**
 * Get MIME type for format
 */
export function getMimeType(format: FileFormat): string {
  return MIME_TYPES[format] || 'application/octet-stream';
}

/**
 * Get allowed extensions for format
 */
export function getAllowedExtensions(format: FileFormat): string[] {
  return ALLOWED_EXTENSIONS[format] || [];
}

/**
 * Get max file size for format
 */
export function getMaxFileSize(format: FileFormat): number {
  return MAX_FILE_SIZES[format] || 50 * 1024 * 1024;
}

/**
 * Validate document category access based on role
 */
export function validateCategoryAccess(category: DocumentCategory, role: string): boolean {
  const medicalCategories = [
    DocumentCategory.MEDICAL_RECORD,
    DocumentCategory.LAB_REPORT,
    DocumentCategory.PRESCRIPTION,
    DocumentCategory.DOCTOR_NOTE,
    DocumentCategory.CONSENT_FORM,
    DocumentCategory.RADIOLOGY,
    DocumentCategory.XRAY,
    DocumentCategory.MRI,
    DocumentCategory.CT_SCAN,
    DocumentCategory.ULTRASOUND,
    DocumentCategory.PATIENT_PHOTO,
  ];

  const adminRoles = ['Owner', 'Administrator'];
  const medicalRoles = ['Doctor', 'Laboratory Staff'];
  const clinicalRoles = ['Receptionist', 'Staff'];

  if (adminRoles.includes(role)) {
    return true;
  }

  if (medicalCategories.includes(category)) {
    return medicalRoles.includes(role);
  }

  return clinicalRoles.includes(role) || role === 'Accountant';
}
