import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateUpdateInvoicePermission } from './billing-permissions';
import { updateInvoiceSchema, validateDueDateAfterInvoiceDate } from './billing-validation';
import { calculateInvoice } from './invoice-calculator';
import { Invoice, UpdateInvoiceInput } from './billing-types';

/**
 * Update invoice
 */
export async function updateInvoice(invoiceId: string, input: UpdateInvoiceInput): Promise<Invoice> {
  await validateUpdateInvoicePermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Validate input using Zod schema
    const validatedInput = updateInvoiceSchema.parse(input);

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

    // Check if invoice can be updated (only draft and pending invoices can be updated)
    if (existingInvoice.status !== 'draft' && existingInvoice.status !== 'pending') {
      throw new Error(`Cannot update invoice with status: ${existingInvoice.status}. Only draft and pending invoices can be updated.`);
    }

    // Validate due date if provided
    if (validatedInput.due_date) {
      validateDueDateAfterInvoiceDate(existingInvoice.invoice_date, validatedInput.due_date);
    }

    // Prepare update data
    const updateData: any = {
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    if (validatedInput.due_date) {
      updateData.due_date = validatedInput.due_date;
    }

    if (validatedInput.priority) {
      updateData.priority = validatedInput.priority;
    }

    if (validatedInput.payment_terms) {
      updateData.payment_terms = validatedInput.payment_terms;
    }

    if (validatedInput.billing_notes !== undefined) {
      updateData.billing_notes = validatedInput.billing_notes;
    }

    if (validatedInput.internal_notes !== undefined) {
      updateData.internal_notes = validatedInput.internal_notes;
    }

    if (validatedInput.invoice_reference !== undefined) {
      updateData.invoice_reference = validatedInput.invoice_reference;
    }

    if (validatedInput.insurance_provider !== undefined) {
      updateData.insurance_provider = validatedInput.insurance_provider;
    }

    if (validatedInput.insurance_policy_number !== undefined) {
      updateData.insurance_policy_number = validatedInput.insurance_policy_number;
    }

    if (validatedInput.insurance_authorization_number !== undefined) {
      updateData.insurance_authorization_number = validatedInput.insurance_authorization_number;
    }

    if (validatedInput.insurance_coverage_percentage !== undefined) {
      updateData.insurance_coverage_percentage = validatedInput.insurance_coverage_percentage;
    }

    // Recalculate if items are updated
    if (validatedInput.items) {
      const calculation = calculateInvoice(validatedInput.items, existingInvoice.paid_amount, true);

      updateData.items = calculation.items;
      updateData.subtotal = calculation.subtotal;
      updateData.discount_total = calculation.discount_total;
      updateData.tax_total = calculation.tax_total;
      updateData.grand_total = calculation.grand_total;
      updateData.remaining_balance = calculation.grand_total - existingInvoice.paid_amount;
      updateData.round_off = calculation.round_off;

      // Recalculate insurance coverage if provided
      if (validatedInput.insurance_coverage_percentage) {
        const insuranceCoveredAmount = (calculation.grand_total * validatedInput.insurance_coverage_percentage) / 100;
        updateData.insurance_covered_amount = insuranceCoveredAmount;
        updateData.patient_responsibility = calculation.grand_total - insuranceCoveredAmount;
      }
    }

    // Increment version number
    updateData.version_number = (existingInvoice.version_number || 1) + 1;

    // Update invoice
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update invoice', { error: updateError, invoiceId });
      throw new DatabaseError('Failed to update invoice', { error: updateError });
    }

    logger.info('Invoice updated successfully', { invoiceId });
    return updatedInvoice as Invoice;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating invoice', { error, invoiceId });
    throw new DatabaseError('Failed to update invoice', { error });
  }
}
