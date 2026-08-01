import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReadInvoicePermission } from './billing-permissions';
import { Invoice } from './billing-types';

/**
 * Get invoice by ID
 */
export async function getInvoiceById(invoiceId: string, includeDeleted: boolean = false): Promise<Invoice> {
  await validateReadInvoicePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('clinic_id', clinicId);

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query.single();

    if (error) {
      logger.error('Failed to fetch invoice by ID', { error, invoiceId });
      throw new DatabaseError('Failed to fetch invoice by ID', { error });
    }

    if (!data) {
      throw new NotFoundError('Invoice not found');
    }

    return data as Invoice;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching invoice by ID', { error, invoiceId });
    throw new DatabaseError('Failed to fetch invoice by ID', { error });
  }
}

/**
 * Get invoice by number
 */
export async function getInvoiceByNumber(invoiceNumber: string): Promise<Invoice> {
  await validateReadInvoicePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', invoiceNumber)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Failed to fetch invoice by number', { error, invoiceNumber });
      throw new DatabaseError('Failed to fetch invoice by number', { error });
    }

    if (!data) {
      throw new NotFoundError('Invoice not found');
    }

    return data as Invoice;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching invoice by number', { error, invoiceNumber });
    throw new DatabaseError('Failed to fetch invoice by number', { error });
  }
}

/**
 * Get invoice with items
 */
export async function getInvoiceWithItems(invoiceId: string): Promise<{
  invoice: Invoice;
  items: any[];
}> {
  await validateReadInvoicePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (invoiceError || !invoice) {
      throw new NotFoundError('Invoice not found');
    }

    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true });

    if (itemsError) {
      throw new DatabaseError('Failed to fetch invoice items', { error: itemsError });
    }

    return {
      invoice: invoice as Invoice,
      items: items || [],
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching invoice with items', { error, invoiceId });
    throw new DatabaseError('Failed to fetch invoice with items', { error });
  }
}

/**
 * Get invoice with relations
 */
export async function getInvoiceWithRelations(invoiceId: string): Promise<{
  invoice: Invoice;
  patient: any;
  doctor: any;
  items: any[];
}> {
  await validateReadInvoicePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        patient:patients(id, name, phone, email),
        doctor:doctors(id, name, specialization)
      `)
      .eq('id', invoiceId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (invoiceError || !invoice) {
      throw new NotFoundError('Invoice not found');
    }

    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true });

    if (itemsError) {
      throw new DatabaseError('Failed to fetch invoice items', { error: itemsError });
    }

    return {
      invoice: invoice as Invoice,
      patient: invoice.patient,
      doctor: invoice.doctor,
      items: items || [],
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching invoice with relations', { error, invoiceId });
    throw new DatabaseError('Failed to fetch invoice with relations', { error });
  }
}
