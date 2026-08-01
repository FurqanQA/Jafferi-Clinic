import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateArchiveInvoicePermission } from './billing-permissions';
import { validateCanArchiveInvoice } from './billing-validation';
import { Invoice } from './billing-types';

/**
 * Archive invoice
 */
export async function archiveInvoice(invoiceId: string): Promise<Invoice> {
  await validateArchiveInvoicePermission();

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

    // Validate invoice can be archived
    validateCanArchiveInvoice(existingInvoice.status);

    // Update invoice status to archived
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to archive invoice', { error: updateError, invoiceId });
      throw new DatabaseError('Failed to archive invoice', { error: updateError });
    }

    logger.info('Invoice archived successfully', { invoiceId });
    return updatedInvoice as Invoice;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error archiving invoice', { error, invoiceId });
    throw new DatabaseError('Failed to archive invoice', { error });
  }
}

/**
 * Bulk archive invoices
 */
export async function bulkArchiveInvoices(invoiceIds: string[]): Promise<{
  success: string[];
  failed: Array<{ invoiceId: string; error: string }>;
}> {
  const success: string[] = [];
  const failed: Array<{ invoiceId: string; error: string }> = [];

  for (const invoiceId of invoiceIds) {
    try {
      await archiveInvoice(invoiceId);
      success.push(invoiceId);
    } catch (error) {
      failed.push({
        invoiceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  logger.info('Bulk invoice archiving completed', { successCount: success.length, failedCount: failed.length });
  return { success, failed };
}

/**
 * Auto-archive overdue paid invoices
 * Placeholder for automation
 */
export async function autoArchivePaidInvoices(daysAfterPayment: number = 30): Promise<{
  archivedCount: number;
}> {
  // Placeholder for auto-archiving logic
  logger.info('Auto-archiving paid invoices requested', { daysAfterPayment });

  return {
    archivedCount: 0,
  };
}
