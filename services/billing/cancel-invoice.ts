import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateCancelInvoicePermission } from './billing-permissions';
import { validateCanCancelInvoice } from './billing-validation';
import { Invoice } from './billing-types';

/**
 * Cancel invoice
 */
export async function cancelInvoice(invoiceId: string, reason?: string): Promise<Invoice> {
  await validateCancelInvoicePermission();

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

    // Validate invoice can be cancelled
    validateCanCancelInvoice(existingInvoice.status);

    // Update invoice status to cancelled
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'cancelled',
        cancelled_by: user.id,
        cancelled_at: new Date().toISOString(),
        internal_notes: reason ? `${existingInvoice.internal_notes || ''}\nCancellation reason: ${reason}`.trim() : existingInvoice.internal_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to cancel invoice', { error: updateError, invoiceId });
      throw new DatabaseError('Failed to cancel invoice', { error: updateError });
    }

    logger.info('Invoice cancelled successfully', { invoiceId, reason });
    return updatedInvoice as Invoice;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error cancelling invoice', { error, invoiceId });
    throw new DatabaseError('Failed to cancel invoice', { error });
  }
}

/**
 * Bulk cancel invoices
 */
export async function bulkCancelInvoices(invoiceIds: string[], reason?: string): Promise<{
  success: string[];
  failed: Array<{ invoiceId: string; error: string }>;
}> {
  const success: string[] = [];
  const failed: Array<{ invoiceId: string; error: string }> = [];

  for (const invoiceId of invoiceIds) {
    try {
      await cancelInvoice(invoiceId, reason);
      success.push(invoiceId);
    } catch (error) {
      failed.push({
        invoiceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  logger.info('Bulk invoice cancellation completed', { successCount: success.length, failedCount: failed.length });
  return { success, failed };
}
