import { getUserRole, getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { DocumentPermission, DocumentCategory } from './document-types';
import { AuthorizationError } from '../core/errors';

// ============================================================================
// Document Permissions
// Role-based access control for documents
// ============================================================================

/**
 * Document permission levels
 */
export enum DocumentPermissionLevel {
  NONE = 'none',
  VIEW = 'view',
  DOWNLOAD = 'download',
  EDIT = 'edit',
  DELETE = 'delete',
  SHARE = 'share',
  ADMIN = 'admin',
}

/**
 * Role-based document access matrix
 */
const ROLE_DOCUMENT_ACCESS: Record<string, DocumentPermission[]> = {
  Owner: [
    DocumentPermission.VIEW,
    DocumentPermission.DOWNLOAD,
    DocumentPermission.EDIT,
    DocumentPermission.DELETE,
    DocumentPermission.SHARE,
    DocumentPermission.ADMIN,
  ],
  Administrator: [
    DocumentPermission.VIEW,
    DocumentPermission.DOWNLOAD,
    DocumentPermission.EDIT,
    DocumentPermission.DELETE,
    DocumentPermission.SHARE,
    DocumentPermission.ADMIN,
  ],
  Doctor: [
    DocumentPermission.VIEW,
    DocumentPermission.DOWNLOAD,
    DocumentPermission.SHARE,
  ],
  Receptionist: [
    DocumentPermission.VIEW,
    DocumentPermission.DOWNLOAD,
  ],
  'Laboratory Staff': [
    DocumentPermission.VIEW,
    DocumentPermission.DOWNLOAD,
  ],
  Accountant: [
    DocumentPermission.VIEW,
    DocumentPermission.DOWNLOAD,
  ],
  Staff: [
    DocumentPermission.VIEW,
    DocumentPermission.DOWNLOAD,
  ],
  Patient: [
    DocumentPermission.VIEW,
    DocumentPermission.DOWNLOAD,
  ],
};

/**
 * Category-based role restrictions for medical documents
 */
const CATEGORY_ROLE_RESTRICTIONS: Record<string, DocumentCategory[]> = {
  Patient: [
    DocumentCategory.MEDICAL_RECORD,
    DocumentCategory.PRESCRIPTION,
    DocumentCategory.PATIENT_PHOTO,
    DocumentCategory.IDENTITY,
  ],
  Doctor: [
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
  ],
  'Laboratory Staff': [
    DocumentCategory.LAB_REPORT,
    DocumentCategory.RADIOLOGY,
    DocumentCategory.XRAY,
    DocumentCategory.MRI,
    DocumentCategory.CT_SCAN,
    DocumentCategory.ULTRASOUND,
  ],
  Accountant: [
    DocumentCategory.INVOICE,
    DocumentCategory.RECEIPT,
    DocumentCategory.INSURANCE,
    DocumentCategory.CONTRACT,
  ],
  Receptionist: [
    DocumentCategory.MEDICAL_RECORD,
    DocumentCategory.PRESCRIPTION,
    DocumentCategory.INVOICE,
    DocumentCategory.RECEIPT,
    DocumentCategory.IDENTITY,
  ],
  Staff: [
    DocumentCategory.MEDICAL_RECORD,
    DocumentCategory.PRESCRIPTION,
    DocumentCategory.INVOICE,
  ],
  Owner: Object.values(DocumentCategory),
  Administrator: Object.values(DocumentCategory),
};

/**
 * Check if user has permission for document operation
 */
export async function hasDocumentPermission(permission: DocumentPermission): Promise<boolean> {
  const role = await getUserRole();
  const permissions = ROLE_DOCUMENT_ACCESS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if user can access document category
 */
export async function canAccessDocumentCategory(category: DocumentCategory): Promise<boolean> {
  const role = await getUserRole();
  const allowedCategories = CATEGORY_ROLE_RESTRICTIONS[role] || [];
  return allowedCategories.includes(category);
}

/**
 * Validate document view permission
 */
export async function validateDocumentViewPermission(documentId?: string): Promise<void> {
  if (!(await hasDocumentPermission(DocumentPermission.VIEW))) {
    logger.warn('Unauthorized document view attempt', { documentId });
    throw new AuthorizationError('You do not have permission to view documents');
  }
}

/**
 * Validate document download permission
 */
export async function validateDocumentDownloadPermission(documentId?: string): Promise<void> {
  if (!(await hasDocumentPermission(DocumentPermission.DOWNLOAD))) {
    logger.warn('Unauthorized document download attempt', { documentId });
    throw new AuthorizationError('You do not have permission to download documents');
  }
}

/**
 * Validate document edit permission
 */
export async function validateDocumentEditPermission(documentId?: string): Promise<void> {
  if (!(await hasDocumentPermission(DocumentPermission.EDIT))) {
    logger.warn('Unauthorized document edit attempt', { documentId });
    throw new AuthorizationError('You do not have permission to edit documents');
  }
}

/**
 * Validate document delete permission
 */
export async function validateDocumentDeletePermission(documentId?: string): Promise<void> {
  if (!(await hasDocumentPermission(DocumentPermission.DELETE))) {
    logger.warn('Unauthorized document delete attempt', { documentId });
    throw new AuthorizationError('You do not have permission to delete documents');
  }
}

/**
 * Validate document share permission
 */
export async function validateDocumentSharePermission(documentId?: string): Promise<void> {
  if (!(await hasDocumentPermission(DocumentPermission.SHARE))) {
    logger.warn('Unauthorized document share attempt', { documentId });
    throw new AuthorizationError('You do not have permission to share documents');
  }
}

/**
 * Validate document admin permission
 */
export async function validateDocumentAdminPermission(documentId?: string): Promise<void> {
  if (!(await hasDocumentPermission(DocumentPermission.ADMIN))) {
    logger.warn('Unauthorized document admin attempt', { documentId });
    throw new AuthorizationError('You do not have admin permission for documents');
  }
}

/**
 * Validate document category access
 */
export async function validateDocumentCategoryAccess(category: DocumentCategory): Promise<void> {
  if (!(await canAccessDocumentCategory(category))) {
    logger.warn('Unauthorized document category access attempt', { category });
    throw new AuthorizationError('You do not have permission to access this document category');
  }
}

/**
 * Check if user owns the document
 */
export async function isDocumentOwner(documentOwnerId: string): Promise<boolean> {
  const user = await getUserRole();
  const clinicId = await getUserClinicId();
  
  // Owners and administrators can access any document in their clinic
  if (user === 'Owner' || user === 'Administrator') {
    return true;
  }
  
  // For other roles, check if they are the owner
  // This would typically involve fetching the document and comparing IDs
  // Placeholder for actual ownership check
  return false;
}

/**
 * Validate document ownership
 */
export async function validateDocumentOwnership(documentOwnerId: string): Promise<void> {
  if (!(await isDocumentOwner(documentOwnerId))) {
    logger.warn('Unauthorized document ownership access', { documentOwnerId });
    throw new AuthorizationError('You do not have permission to access this document');
  }
}
