import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateRestoreInvoicePermission } from './billing-permissions';
import { Invoice } from './billing-types';

/**
 * Restore archived invoice
 */
export async function restoreInvoice(invoiceId: string): Promise<Invoice> {
  await validateRestoreInvoicePermission();

  const user = await getCurrentUser();
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

    // Check if invoice is archived
    if (existingInvoice.status !== 'archived') {
      throw new Error(`Cannot restore invoice with status: ${existingInvoice.status}. Only archived invoices can be restored.`);
    }

    // Determine the appropriate status to restore to based on payment status
    let restoreStatus = 'issued';
    if (existingInvoice.paid_amount >= existingInvoice.grand_total) {
      restoreStatus = 'paid';
    } else if (existingInvoice.paid_amount > 0) {
      restoreStatus = 'partially_paid';
    }

    // Restore invoice status
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: restoreStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to restore invoice', { error: updateError, invoiceId });
      throw new DatabaseError('Failed to restore invoice', { error: updateError });
    }

    logger.info('Invoice restored successfully', { invoiceId, restoreStatus });
    return updatedInvoice as Invoice;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error restoring invoice', { error, invoiceId });
    throw new DatabaseError('Failed to restore invoice', { error });
  }
}

/**
 * Bulk restore invoices
 */
export async function bulkRestoreInvoices(invoiceIds: string[]): Promise<{
  success: string[];
  failed: Array<{ invoiceId: string; error: string }>;
}> {
  const success: string[] = [];
  const failed: Array<{ invoiceId: string; error: string }> = [];

  for (const invoiceId of invoiceIds) {
    try {
      await restoreInvoice(invoiceId);
      success.push(invoiceId);
    } catch (error) {
      failed.push({
        invoiceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  logger.info('Bulk invoice restoration completed', { successCount: success.length, failedCount: failed.length });
  return { success, failed };
}
