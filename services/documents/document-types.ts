// ============================================================================
// Document Types
// Type definitions for the Enterprise Document & File Management Service
// ============================================================================

/**
 * Document categories
 */
export enum DocumentCategory {
  MEDICAL_RECORD = 'medical_record',
  LAB_REPORT = 'lab_report',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  PRESCRIPTION = 'prescription',
  DOCTOR_NOTE = 'doctor_note',
  CONSENT_FORM = 'consent_form',
  INSURANCE = 'insurance',
  REFERRAL = 'referral',
  RADIOLOGY = 'radiology',
  XRAY = 'xray',
  MRI = 'mri',
  CT_SCAN = 'ct_scan',
  ULTRASOUND = 'ultrasound',
  PATIENT_PHOTO = 'patient_photo',
  IDENTITY = 'identity',
  CLINIC = 'clinic',
  CONTRACT = 'contract',
  CUSTOM = 'custom',
}

/**
 * Document status
 */
export enum DocumentStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
  PROCESSING = 'processing',
  FAILED = 'failed',
}

/**
 * File format types
 */
export enum FileFormat {
  PDF = 'pdf',
  PNG = 'png',
  JPG = 'jpg',
  JPEG = 'jpeg',
  WEBP = 'webp',
  DOCX = 'docx',
  XLSX = 'xlsx',
  CSV = 'csv',
  TXT = 'txt',
  JSON = 'json',
  ZIP = 'zip',
  DICOM = 'dcm',
}

/**
 * Storage bucket types
 */
export enum StorageBucket {
  PRIVATE = 'private',
  PUBLIC = 'public',
  TEMPORARY = 'temporary',
  ARCHIVE = 'archive',
}

/**
 * Document permission levels
 */
export enum DocumentPermission {
  VIEW = 'view',
  DOWNLOAD = 'download',
  EDIT = 'edit',
  DELETE = 'delete',
  SHARE = 'share',
  ADMIN = 'admin',
}

/**
 * Sharing type
 */
export enum SharingType {
  INTERNAL = 'internal',
  SECURE_LINK = 'secure_link',
  PUBLIC = 'public',
}

/**
 * Document interface
 */
export interface Document {
  id: string;
  clinicId: string;
  ownerId: string;
  title: string;
  description?: string;
  category: DocumentCategory;
  format: FileFormat;
  status: DocumentStatus;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  folderId?: string;
  tags: string[];
  metadata: DocumentMetadata;
  sharing?: DocumentSharing;
  retention?: RetentionPolicy;
  version: number;
  currentVersionId: string;
  isEncrypted: boolean;
  isPublic: boolean;
  downloadCount: number;
  lastAccessedAt?: string;
  lastDownloadedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * Document metadata
 */
export interface DocumentMetadata {
  patientId?: string;
  doctorId?: string;
  appointmentId?: string;
  invoiceId?: string;
  prescriptionId?: string;
  medicalRecordId?: string;
  laboratoryTestId?: string;
  department?: string;
  encounterDate?: string;
  documentDate?: string;
  customFields?: Record<string, string | number | boolean>;
}

/**
 * Document sharing settings
 */
export interface DocumentSharing {
  type: SharingType;
  sharedWith: string[];
  sharedRoles: string[];
  shareLink?: string;
  shareLinkExpiry?: string;
  passwordProtected?: boolean;
  downloadLimit?: number;
  accessCount: number;
}

/**
 * Retention policy
 */
export interface RetentionPolicy {
  enabled: boolean;
  retainUntil?: string;
  retainDays?: number;
  autoArchive: boolean;
  autoDelete: boolean;
}

/**
 * Document version
 */
export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  filePath: string;
  fileName: string;
  fileSize: number;
  checksum: string;
  uploadedBy: string;
  uploadedAt: string;
  changeDescription?: string;
}

/**
 * Folder structure
 */
export interface Folder {
  id: string;
  clinicId: string;
  parentId?: string;
  name: string;
  path: string;
  description?: string;
  isSystem: boolean;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * File upload result
 */
export interface UploadResult {
  documentId: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  checksum: string;
  version: number;
  uploadedAt: string;
}

/**
 * Chunked upload session
 */
export interface UploadSession {
  id: string;
  documentId?: string;
  fileName: string;
  fileSize: number;
  chunkSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  createdAt: string;
  expiresAt: string;
}

/**
 * Download session
 */
export interface DownloadSession {
  id: string;
  documentId: string;
  userId: string;
  downloadUrl: string;
  expiresAt: string;
  accessCount: number;
  maxAccess?: number;
  createdAt: string;
}

/**
 * Thumbnail configuration
 */
export interface ThumbnailConfig {
  enabled: boolean;
  sizes: Array<{ width: number; height: number; suffix: string }>;
  format: 'png' | 'webp';
  quality: number;
}

/**
 * Compression settings
 */
export interface CompressionSettings {
  enabled: boolean;
  level: number;
  formats: FileFormat[];
  maxSize: number;
}

/**
 * Encryption settings
 */
export interface EncryptionSettings {
  enabled: boolean;
  algorithm: string;
  keyId: string;
}

/**
 * Virus scan result
 */
export interface VirusScanResult {
  scanned: boolean;
  status: 'clean' | 'infected' | 'pending' | 'failed';
  engine: string;
  scannedAt: string;
  threats?: string[];
}

/**
 * Document audit log
 */
export interface DocumentAuditLog {
  id: string;
  documentId: string;
  userId: string;
  action: 'upload' | 'download' | 'view' | 'edit' | 'delete' | 'share' | 'archive' | 'restore';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Storage analytics
 */
export interface StorageAnalytics {
  totalStorage: number;
  usedStorage: number;
  availableStorage: number;
  documentCount: number;
  folderCount: number;
  storageByFormat: Record<FileFormat, number>;
  storageByCategory: Record<DocumentCategory, number>;
  storageByDepartment: Record<string, number>;
  uploadCount: number;
  downloadCount: number;
  mostAccessedDocuments: Array<{ documentId: string; title: string; accessCount: number }>;
}

/**
 * DICOM metadata
 */
export interface DicomMetadata {
  patientId: string;
  studyId: string;
  seriesId: string;
  instanceId: string;
  modality: string;
  studyDate: string;
  seriesDescription?: string;
  bodyPartExamined?: string;
  institutionName?: string;
  manufacturer?: string;
  manufacturerModel?: string;
  softwareVersions?: string[];
}

/**
 * Imaging study
 */
export interface ImagingStudy {
  id: string;
  patientId: string;
  studyId: string;
  modality: string;
  studyDate: string;
  description: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  seriesCount: number;
  instanceCount: number;
  documentIds: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Search filters
 */
export interface DocumentSearchFilters {
  query?: string;
  category?: DocumentCategory;
  format?: FileFormat;
  status?: DocumentStatus;
  tags?: string[];
  patientId?: string;
  doctorId?: string;
  appointmentId?: string;
  invoiceId?: string;
  prescriptionId?: string;
  medicalRecordId?: string;
  folderId?: string;
  startDate?: string;
  endDate?: string;
  minFileSize?: number;
  maxFileSize?: number;
  isEncrypted?: boolean;
  isPublic?: boolean;
  createdBy?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
