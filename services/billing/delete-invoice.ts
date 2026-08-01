import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateDeleteInvoicePermission } from './billing-permissions';
import { Invoice } from './billing-types';

/**
 * Delete invoice (soft delete)
 */
export async function deleteInvoice(invoiceId: string): Promise<void> {
  await validateDeleteInvoicePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch existing invoice
    const { data: existingInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('clinic_id', clinicId)
      .single();

    if (fetchError || !existingInvoice) {
      throw new NotFoundError('Invoice not found or does not belong to this clinic');
    }

    // Check if invoice can be deleted (only draft and cancelled invoices can be deleted)
    if (existingInvoice.status !== 'draft' && existingInvoice.status !== 'cancelled' && existingInvoice.status !== 'archived') {
      throw new Error(`Cannot delete invoice with status: ${existingInvoice.status}. Only draft, cancelled, and archived invoices can be deleted.`);
    }

    // Soft delete invoice
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'deleted',
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .eq('clinic_id', clinicId);

    if (updateError) {
      logger.error('Failed to delete invoice', { error: updateError, invoiceId });
      throw new DatabaseError('Failed to delete invoice', { error: updateError });
    }

    logger.info('Invoice deleted successfully', { invoiceId });
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting invoice', { error, invoiceId });
    throw new DatabaseError('Failed to delete invoice', { error });
  }
}

/**
 * Bulk delete invoices
 */
export async function bulkDeleteInvoices(invoiceIds: string[]): Promise<{
  success: string[];
  failed: Array<{ invoiceId: string; error: string }>;
}> {
  const success: string[] = [];
  const failed: Array<{ invoiceId: string; error: string }> = [];

  for (const invoiceId of invoiceIds) {
    try {
      await deleteInvoice(invoiceId);
      success.push(invoiceId);
    } catch (error) {
      failed.push({
        invoiceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  logger.info('Bulk invoice deletion completed', { successCount: success.length, failedCount: failed.length });
  return { success, failed };
}

/**
 * Permanently delete invoice (hard delete)
 * Use with caution - this cannot be undone
 */
export async function permanentlyDeleteInvoice(invoiceId: string): Promise<void> {
  await validateDeleteInvoicePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch existing invoice
    const { data: existingInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', invoiceId)
      .eq('clinic_id', clinicId)
      .single();

    if (fetchError || !existingInvoice) {
      throw new NotFoundError('Invoice not found or does not belong to this clinic');
    }

    // Only allow permanent deletion of already deleted invoices
    if (existingInvoice.status !== 'deleted') {
      throw new Error(`Cannot permanently delete invoice with status: ${existingInvoice.status}. Invoice must be in deleted status first.`);
    }

    // Hard delete invoice
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('clinic_id', clinicId);

    if (deleteError) {
      logger.error('Failed to permanently delete invoice', { error: deleteError, invoiceId });
      throw new DatabaseError('Failed to permanently delete invoice', { error: deleteError });
    }

    logger.info('Invoice permanently deleted', { invoiceId });
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error permanently deleting invoice', { error, invoiceId });
    throw new DatabaseError('Failed to permanently delete invoice', { error });
  }
}
