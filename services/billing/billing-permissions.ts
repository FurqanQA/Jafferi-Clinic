import { createPermissionCheckers } from '../core/base-permissions';
import { getUserRole } from '../core/auth';

/**
 * Billing permission checkers
 * Reuses the base permission infrastructure
 */
const billingCheckers = createPermissionCheckers('billing');

/**
 * Validate create invoice permission
 * Accountants can create invoices
 */
export async function validateCreateInvoicePermission(): Promise<void> {
  await billingCheckers.canCreate();
}

/**
 * Validate update invoice permission
 * Accountants can update invoices
 */
export async function validateUpdateInvoicePermission(): Promise<void> {
  await billingCheckers.canUpdate();
}

/**
 * Validate issue invoice permission
 * Accountants can issue invoices
 */
export async function validateIssueInvoicePermission(): Promise<void> {
  await billingCheckers.canUpdate();
}

/**
 * Validate cancel invoice permission
 * Accountants can cancel invoices
 */
export async function validateCancelInvoicePermission(): Promise<void> {
  await billingCheckers.canUpdate();
}

/**
 * Validate archive invoice permission
 * Accountants can archive invoices
 */
export async function validateArchiveInvoicePermission(): Promise<void> {
  await billingCheckers.canUpdate();
}

/**
 * Validate restore invoice permission
 * Accountants can restore invoices
 */
export async function validateRestoreInvoicePermission(): Promise<void> {
  await billingCheckers.canUpdate();
}

/**
 * Validate delete invoice permission
 * Only owners and administrators can delete invoices
 */
export async function validateDeleteInvoicePermission(): Promise<void> {
  const role = await getUserRole();
  if (role !== 'owner' && role !== 'administrator') {
    throw new Error('Only owners and administrators can delete invoices');
  }
}

/**
 * Validate read invoice permission
 * All roles with billing access can read invoices
 */
export async function validateReadInvoicePermission(): Promise<void> {
  await billingCheckers.canRead();
}

/**
 * Validate export invoice permission
 * Accountants can export invoices
 */
export async function validateExportInvoicePermission(): Promise<void> {
  await billingCheckers.canRead();
}

/**
 * Validate manage invoice access
 * Ensures user has write access to billing
 */
export async function validateManageInvoiceAccess(invoiceId: string): Promise<void> {
  await billingCheckers.canUpdate();
}

/**
 * Validate pricing management permission
 * Only owners and administrators can manage pricing
 */
export async function validateManagePricingPermission(): Promise<void> {
  const role = await getUserRole();
  if (role !== 'owner' && role !== 'administrator') {
    throw new Error('Only owners and administrators can manage pricing');
  }
}

/**
 * Validate discount management permission
 * Only owners and administrators can manage discounts
 */
export async function validateManageDiscountPermission(): Promise<void> {
  const role = await getUserRole();
  if (role !== 'owner' && role !== 'administrator') {
    throw new Error('Only owners and administrators can manage discounts');
  }
}

/**
 * Validate tax management permission
 * Only owners and administrators can manage tax rules
 */
export async function validateManageTaxPermission(): Promise<void> {
  const role = await getUserRole();
  if (role !== 'owner' && role !== 'administrator') {
    throw new Error('Only owners and administrators can manage tax rules');
  }
}

/**
 * Validate credit note permission
 * Accountants can create credit notes
 */
export async function validateCreditNotePermission(): Promise<void> {
  await billingCheckers.canUpdate();
}

/**
 * Validate recurring billing permission
 * Only owners and administrators can manage recurring billing
 */
export async function validateRecurringBillingPermission(): Promise<void> {
  const role = await getUserRole();
  if (role !== 'owner' && role !== 'administrator') {
    throw new Error('Only owners and administrators can manage recurring billing');
  }
}

/**
 * Validate receipt permission
 * Accountants can generate receipts
 */
export async function validateReceiptPermission(): Promise<void> {
  await billingCheckers.canRead();
}

/**
 * Validate insurance claim permission
 * Accountants can manage insurance claims
 */
export async function validateInsuranceClaimPermission(): Promise<void> {
  await billingCheckers.canUpdate();
}

/**
 * Validate draft invoice permission
 * Receptionists can generate draft invoices
 */
export async function validateDraftInvoicePermission(): Promise<void> {
  const role = await getUserRole();
  if (role !== 'owner' && role !== 'administrator' && role !== 'accountant' && role !== 'receptionist') {
    throw new Error('Only owners, administrators, accountants, and receptionists can create draft invoices');
  }
}
