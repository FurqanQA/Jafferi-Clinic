import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Invoices Manager
// Invoice management operations for subscriptions
// ============================================================================

/**
 * Invoice interface
 */
export interface Invoice {
  id: string;
  tenantId: string;
  subscriptionId: string;
  invoiceNumber: string;
  status: 'draft' | 'pending' | 'paid' | 'failed' | 'cancelled';
  currency: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  dueDate: string;
  paidAt: string | null;
  paidAmount: number;
  items: InvoiceItem[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Invoice Item
 */
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `INV-${year}${month}-${random}`;
}

/**
 * Create a new invoice
 */
export async function createInvoice(data: {
  tenantId: string;
  subscriptionId: string;
  currency: string;
  subtotal: number;
  tax: number;
  discount: number;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  notes?: string;
}): Promise<Invoice> {
  try {
    await validatePlatformWritePermission(PlatformResource.INVOICES);

    const supabase = getSupabaseClient();

    // Create invoice
    const invoiceId = `invoice-${Date.now()}`;
    const invoiceNumber = generateInvoiceNumber();
    const now = new Date().toISOString();

    const total = data.subtotal + data.tax - data.discount;

    const items: InvoiceItem[] = data.items.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
    }));

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        id: invoiceId,
        tenant_id: data.tenantId,
        subscription_id: data.subscriptionId,
        invoice_number: invoiceNumber,
        status: 'pending',
        currency: data.currency,
        subtotal: data.subtotal,
        tax: data.tax,
        discount: data.discount,
        total,
        due_date: data.dueDate,
        paid_at: null,
        paid_amount: 0,
        items,
        notes: data.notes || null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create invoice', { error, data });
      throw new DatabaseError('Failed to create invoice', { error });
    }

    logger.info('Invoice created successfully', { invoiceId, invoiceNumber });

    // Invalidate cache
    cache.delete(`invoice:${invoiceId}`);
    cache.delete(`invoice:number:${invoiceNumber}`);

    return invoice as Invoice;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating invoice', { error, data });
    throw new DatabaseError('Failed to create invoice', { error });
  }
}

/**
 * Update invoice
 */
export async function updateInvoice(invoiceId: string, data: {
  status?: 'draft' | 'pending' | 'paid' | 'failed' | 'cancelled';
  paidAt?: string | null;
  paidAmount?: number;
  notes?: string | null;
}): Promise<Invoice> {
  try {
    await validatePlatformWritePermission(PlatformResource.INVOICES);

    const supabase = getSupabaseClient();

    // Get current invoice
    const { data: current } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('id', invoiceId)
      .single();

    if (!current) {
      throw new NotFoundError('Invoice not found');
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.status !== undefined) updateData.status = data.status;
    if (data.paidAt !== undefined) updateData.paid_at = data.paidAt;
    if (data.paidAmount !== undefined) updateData.paid_amount = data.paidAmount;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update invoice', { error, invoiceId });
      throw new DatabaseError('Failed to update invoice', { error });
    }

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    logger.info('Invoice updated successfully', { invoiceId });

    // Invalidate cache
    cache.delete(`invoice:${invoiceId}`);
    cache.delete(`invoice:number:${current.invoice_number}`);

    return invoice as Invoice;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating invoice', { error, invoiceId });
    throw new DatabaseError('Failed to update invoice', { error });
  }
}

/**
 * Mark invoice as paid
 */
export async function markInvoiceAsPaid(invoiceId: string, paidAmount: number): Promise<Invoice> {
  return updateInvoice(invoiceId, {
    status: 'paid',
    paidAt: new Date().toISOString(),
    paidAmount,
  });
}

/**
 * Mark invoice as failed
 */
export async function markInvoiceAsFailed(invoiceId: string): Promise<Invoice> {
  return updateInvoice(invoiceId, { status: 'failed' });
}

/**
 * Cancel invoice
 */
export async function cancelInvoice(invoiceId: string): Promise<Invoice> {
  return updateInvoice(invoiceId, { status: 'cancelled' });
}

/**
 * Delete invoice
 */
export async function deleteInvoice(invoiceId: string): Promise<void> {
  try {
    await validatePlatformWritePermission(PlatformResource.INVOICES);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) {
      logger.error('Failed to delete invoice', { error, invoiceId });
      throw new DatabaseError('Failed to delete invoice', { error });
    }

    logger.info('Invoice deleted successfully', { invoiceId });

    // Invalidate cache
    cache.delete(`invoice:${invoiceId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting invoice', { error, invoiceId });
    throw new DatabaseError('Failed to delete invoice', { error });
  }
}

/**
 * Get invoice by ID
 */
export async function getInvoice(invoiceId: string): Promise<Invoice> {
  try {
    // Check cache first
    const cached = cache.get<Invoice>(`invoice:${invoiceId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error) {
      logger.error('Failed to fetch invoice', { error, invoiceId });
      throw new DatabaseError('Failed to fetch invoice', { error });
    }

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    // Cache result
    cache.set(`invoice:${invoiceId}`, invoice, cacheHelpers.ttl.MEDIUM);

    return invoice as Invoice;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching invoice', { error, invoiceId });
    throw new DatabaseError('Failed to fetch invoice', { error });
  }
}

/**
 * Get invoice by invoice number
 */
export async function getInvoiceByNumber(invoiceNumber: string): Promise<Invoice> {
  try {
    // Check cache first
    const cacheKey = `invoice:number:${invoiceNumber}`;
    const cached = cache.get<Invoice>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', invoiceNumber)
      .single();

    if (error) {
      logger.error('Failed to fetch invoice by number', { error, invoiceNumber });
      throw new DatabaseError('Failed to fetch invoice', { error });
    }

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    // Cache result
    cache.set(cacheKey, invoice, cacheHelpers.ttl.MEDIUM);
    cache.set(`invoice:${invoice.id}`, invoice, cacheHelpers.ttl.MEDIUM);

    return invoice as Invoice;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching invoice by number', { error, invoiceNumber });
    throw new DatabaseError('Failed to fetch invoice', { error });
  }
}

/**
 * List invoices
 */
export async function listInvoices(options: {
  page?: number;
  pageSize?: number;
  tenantId?: string;
  subscriptionId?: string;
  status?: 'draft' | 'pending' | 'paid' | 'failed' | 'cancelled';
  search?: string;
}): Promise<{ invoices: Invoice[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, tenantId, subscriptionId, status, search } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (subscriptionId) {
      query = query.eq('subscription_id', subscriptionId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: invoices, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list invoices', { error });
      throw new DatabaseError('Failed to list invoices', { error });
    }

    return {
      invoices: (invoices || []) as Invoice[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing invoices', { error });
    throw new DatabaseError('Failed to list invoices', { error });
  }
}

/**
 * Get invoices for tenant
 */
export async function getTenantInvoices(tenantId: string, options: {
  page?: number;
  pageSize?: number;
  status?: 'draft' | 'pending' | 'paid' | 'failed' | 'cancelled';
}): Promise<{ invoices: Invoice[]; total: number; page: number; pageSize: number }> {
  return listInvoices({ ...options, tenantId });
}

/**
 * Get invoices for subscription
 */
export async function getSubscriptionInvoices(subscriptionId: string, options: {
  page?: number;
  pageSize?: number;
  status?: 'draft' | 'pending' | 'paid' | 'failed' | 'cancelled';
}): Promise<{ invoices: Invoice[]; total: number; page: number; pageSize: number }> {
  return listInvoices({ ...options, subscriptionId });
}

/**
 * Get invoice statistics
 */
export async function getInvoiceStatistics(tenantId?: string): Promise<{
  total: number;
  draft: number;
  pending: number;
  paid: number;
  failed: number;
  cancelled: number;
  totalRevenue: number;
  pendingRevenue: number;
}> {
  try {
    const supabase = getSupabaseClient();

    let query = supabase.from('invoices').select('status, total, paid_amount');

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: invoices } = await query;

    if (!invoices || invoices.length === 0) {
      return {
        total: 0,
        draft: 0,
        pending: 0,
        paid: 0,
        failed: 0,
        cancelled: 0,
        totalRevenue: 0,
        pendingRevenue: 0,
      };
    }

    let draft = 0, pending = 0, paid = 0, failed = 0, cancelled = 0;
    let totalRevenue = 0, pendingRevenue = 0;

    for (const invoice of invoices) {
      switch (invoice.status) {
        case 'draft': draft++; break;
        case 'pending': pending++; pendingRevenue += invoice.total; break;
        case 'paid': paid++; totalRevenue += invoice.paid_amount; break;
        case 'failed': failed++; break;
        case 'cancelled': cancelled++; break;
      }
    }

    return {
      total: invoices.length,
      draft,
      pending,
      paid,
      failed,
      cancelled,
      totalRevenue,
      pendingRevenue,
    };
  } catch (error) {
    logger.error('Failed to get invoice statistics', { error, tenantId });
    throw new DatabaseError('Failed to get invoice statistics', { error });
  }
}

/**
 * Generate invoice for subscription
 */
export async function generateInvoiceForSubscription(subscriptionId: string): Promise<Invoice> {
  try {
    const supabase = getSupabaseClient();

    // Get subscription details
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tenant_id, plan_id, billing_cycle')
      .eq('id', subscriptionId)
      .single();

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    // Get plan details
    const { data: plan } = await supabase
      .from('plans')
      .select('price, currency, name')
      .eq('id', subscription.plan_id)
      .single();

    if (!plan) {
      throw new NotFoundError('Plan not found');
    }

    // Calculate due date (14 days from now)
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    // Create invoice
    return createInvoice({
      tenantId: subscription.tenant_id,
      subscriptionId,
      currency: plan.currency,
      subtotal: plan.price,
      tax: 0,
      discount: 0,
      dueDate,
      items: [
        {
          description: `${plan.name} (${subscription.billing_cycle})`,
          quantity: 1,
          unitPrice: plan.price,
        },
      ],
    });
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error generating invoice for subscription', { error, subscriptionId });
    throw new DatabaseError('Failed to generate invoice for subscription', { error });
  }
}
