import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateManageInvoiceAccess } from './billing-permissions';
import { validateInvoiceItem } from './billing-validation';
import { InvoiceItem, InvoiceItemCategory } from './billing-types';

/**
 * Create invoice item
 */
export async function createInvoiceItem(
  invoiceId: string,
  item: Omit<InvoiceItem, 'id' | 'invoice_id' | 'subtotal' | 'tax_amount' | 'total' | 'created_at' | 'updated_at'>
): Promise<InvoiceItem> {
  await validateManageInvoiceAccess(invoiceId);

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Validate invoice item
    validateInvoiceItem(item);

    const { data, error } = await supabase
      .from('invoice_items')
      .insert({
        ...item,
        invoice_id: invoiceId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create invoice item', { error });
      throw new DatabaseError('Failed to create invoice item', { error });
    }

    logger.info('Invoice item created successfully', { invoiceId, category: item.category });
    return data as InvoiceItem;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating invoice item', { error });
    throw new DatabaseError('Failed to create invoice item', { error });
  }
}

/**
 * Get invoice item by ID
 */
export async function getInvoiceItem(itemId: string): Promise<InvoiceItem> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) {
      logger.error('Failed to fetch invoice item', { error, itemId });
      throw new DatabaseError('Failed to fetch invoice item', { error });
    }

    if (!data) {
      throw new NotFoundError('Invoice item not found');
    }

    return data as InvoiceItem;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching invoice item', { error, itemId });
    throw new DatabaseError('Failed to fetch invoice item', { error });
  }
}

/**
 * Get invoice items by invoice
 */
export async function getInvoiceItemsByInvoice(invoiceId: string): Promise<InvoiceItem[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch invoice items by invoice', { error, invoiceId });
      throw new DatabaseError('Failed to fetch invoice items by invoice', { error });
    }

    return (data || []) as InvoiceItem[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching invoice items by invoice', { error, invoiceId });
    throw new DatabaseError('Failed to fetch invoice items by invoice', { error });
  }
}

/**
 * Update invoice item
 */
export async function updateInvoiceItem(
  itemId: string,
  updates: Partial<InvoiceItem>
): Promise<InvoiceItem> {
  await validateManageInvoiceAccess(itemId);

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Validate updated item if it contains fields that need validation
    if (updates.quantity || updates.unit_price || updates.discount || updates.tax_rate) {
      const existingItem = await getInvoiceItem(itemId);
      const itemToValidate = { ...existingItem, ...updates };
      validateInvoiceItem(itemToValidate);
    }

    const { data, error } = await supabase
      .from('invoice_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update invoice item', { error, itemId });
      throw new DatabaseError('Failed to update invoice item', { error });
    }

    if (!data) {
      throw new NotFoundError('Invoice item not found');
    }

    logger.info('Invoice item updated successfully', { itemId });
    return data as InvoiceItem;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating invoice item', { error, itemId });
    throw new DatabaseError('Failed to update invoice item', { error });
  }
}

/**
 * Delete invoice item
 */
export async function deleteInvoiceItem(itemId: string): Promise<void> {
  await validateManageInvoiceAccess(itemId);

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('invoice_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      logger.error('Failed to delete invoice item', { error, itemId });
      throw new DatabaseError('Failed to delete invoice item', { error });
    }

    logger.info('Invoice item deleted successfully', { itemId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting invoice item', { error, itemId });
    throw new DatabaseError('Failed to delete invoice item', { error });
  }
}

/**
 * Get invoice items by category
 */
export async function getInvoiceItemsByCategory(category: InvoiceItemCategory): Promise<InvoiceItem[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*, invoices!inner(clinic_id)')
      .eq('invoices.clinic_id', clinicId)
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch invoice items by category', { error, category });
      throw new DatabaseError('Failed to fetch invoice items by category', { error });
    }

    return (data || []) as InvoiceItem[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching invoice items by category', { error, category });
    throw new DatabaseError('Failed to fetch invoice items by category', { error });
  }
}

/**
 * Get invoice items by reference
 */
export async function getInvoiceItemsByReference(
  referenceId: string,
  referenceType: string
): Promise<InvoiceItem[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*, invoices!inner(clinic_id)')
      .eq('invoices.clinic_id', clinicId)
      .eq('reference_id', referenceId)
      .eq('reference_type', referenceType)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch invoice items by reference', { error, referenceId });
      throw new DatabaseError('Failed to fetch invoice items by reference', { error });
    }

    return (data || []) as InvoiceItem[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching invoice items by reference', { error, referenceId });
    throw new DatabaseError('Failed to fetch invoice items by reference', { error });
  }
}

/**
 * Batch create invoice items
 */
export async function batchCreateInvoiceItems(
  invoiceId: string,
  items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'subtotal' | 'tax_amount' | 'total' | 'created_at' | 'updated_at'>[]
): Promise<InvoiceItem[]> {
  await validateManageInvoiceAccess(invoiceId);

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Validate all items
    items.forEach((item) => validateInvoiceItem(item));

    const itemsToInsert = items.map((item) => ({
      ...item,
      invoice_id: invoiceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert)
      .select();

    if (error) {
      logger.error('Failed to batch create invoice items', { error });
      throw new DatabaseError('Failed to batch create invoice items', { error });
    }

    logger.info('Invoice items batch created successfully', { invoiceId, count: items.length });
    return (data || []) as InvoiceItem[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error batch creating invoice items', { error });
    throw new DatabaseError('Failed to batch create invoice items', { error });
  }
}

/**
 * Calculate item totals
 */
export function calculateItemTotals(
  item: Omit<InvoiceItem, 'subtotal' | 'tax_amount' | 'total'>
): {
  subtotal: number;
  tax_amount: number;
  total: number;
} {
  const subtotal = item.quantity * item.unit_price;
  const discountAmount = item.discount_type === 'percentage'
    ? (subtotal * (item.discount || 0)) / 100
    : (item.discount || 0);
  const taxAmount = ((subtotal - discountAmount) * (item.tax_rate || 0)) / 100;
  const total = subtotal - discountAmount + taxAmount;

  return {
    subtotal,
    tax_amount: taxAmount,
    total,
  };
}
