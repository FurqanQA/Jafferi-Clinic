import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateIssueInvoicePermission } from './billing-permissions';
import { validateCanIssueInvoice } from './billing-validation';
import { Invoice } from './billing-types';

/**
 * Issue invoice
 */
export async function issueInvoice(invoiceId: string): Promise<Invoice> {
  await validateIssueInvoicePermission();

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

    // Validate invoice can be issued
    validateCanIssueInvoice(existingInvoice.status);

    // Update invoice status to issued
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'issued',
        issued_by: user.id,
        issued_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to issue invoice', { error: updateError, invoiceId });
      throw new DatabaseError('Failed to issue invoice', { error: updateError });
    }

    logger.info('Invoice issued successfully', { invoiceId });
    return updatedInvoice as Invoice;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error issuing invoice', { error, invoiceId });
    throw new DatabaseError('Failed to issue invoice', { error });
  }
}

/**
 * Bulk issue invoices
 */
export async function bulkIssueInvoices(invoiceIds: string[]): Promise<{
  success: string[];
  failed: Array<{ invoiceId: string; error: string }>;
}> {
  const success: string[] = [];
  const failed: Array<{ invoiceId: string; error: string }> = [];

  for (const invoiceId of invoiceIds) {
    try {
      await issueInvoice(invoiceId);
      success.push(invoiceId);
    } catch (error) {
      failed.push({
        invoiceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  logger.info('Bulk invoice issue completed', { successCount: success.length, failedCount: failed.length });
  return { success, failed };
}
