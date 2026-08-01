import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateExportInvoicePermission } from './billing-permissions';
import { Invoice, InvoiceFilters, InvoiceExportData } from './billing-types';

/**
 * Export invoices with filters
 */
export async function exportInvoices(
  filters: InvoiceFilters = {}
): Promise<Invoice[]> {
  await validateExportInvoicePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        patient:patients(name),
        doctor:doctors(name)
      `)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Apply filters
    if (filters.patient_id) {
      query = query.eq('patient_id', filters.patient_id);
    }

    if (filters.doctor_id) {
      query = query.eq('doctor_id', filters.doctor_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.source) {
      query = query.eq('source', filters.source);
    }

    if (filters.currency) {
      query = query.eq('currency', filters.currency);
    }

    if (filters.date_from) {
      query = query.gte('invoice_date', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('invoice_date', filters.date_to);
    }

    if (filters.due_date_from) {
      query = query.gte('due_date', filters.due_date_from);
    }

    if (filters.due_date_to) {
      query = query.lte('due_date', filters.due_date_to);
    }

    if (filters.today) {
      const today = new Date().toISOString().slice(0, 10);
      query = query.gte('invoice_date', today).lte('invoice_date', `${today}T23:59:59`);
    }

    if (filters.this_week) {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      query = query.gte('invoice_date', weekStart.toISOString());
    }

    if (filters.this_month) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      query = query.gte('invoice_date', monthStart.toISOString());
    }

    if (filters.this_year) {
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);
      query = query.gte('invoice_date', yearStart.toISOString());
    }

    query = query.order('invoice_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to export invoices', { error, filters });
      throw new DatabaseError('Failed to export invoices', { error });
    }

    return (data || []) as Invoice[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error exporting invoices', { error, filters });
    throw new DatabaseError('Failed to export invoices', { error });
  }
}

/**
 * Transform invoices to export data format
 */
export function transformInvoicesToExportData(invoices: Invoice[]): InvoiceExportData[] {
  return invoices.map((invoice) => ({
    invoice_number: invoice.invoice_number,
    invoice_date: invoice.invoice_date,
    patient_name: (invoice as any).patient?.name || '',
    doctor_name: (invoice as any).doctor?.name || '',
    status: invoice.status,
    grand_total: invoice.grand_total,
    paid_amount: invoice.paid_amount,
    remaining_balance: invoice.remaining_balance,
    due_date: invoice.due_date,
    payment_terms: invoice.payment_terms,
    source: invoice.source,
  }));
}

/**
 * Export invoices as CSV string
 */
export async function exportInvoicesAsCSV(filters: InvoiceFilters = {}): Promise<string> {
  const invoices = await exportInvoices(filters);
  const exportData = transformInvoicesToExportData(invoices);

  if (exportData.length === 0) {
    return '';
  }

  // CSV header
  const headers = [
    'Invoice Number',
    'Invoice Date',
    'Patient Name',
    'Doctor Name',
    'Status',
    'Grand Total',
    'Paid Amount',
    'Remaining Balance',
    'Due Date',
    'Payment Terms',
    'Source',
  ];

  // CSV rows
  const rows = exportData.map((data) => [
    data.invoice_number,
    data.invoice_date,
    data.patient_name,
    data.doctor_name,
    data.status,
    data.grand_total.toString(),
    data.paid_amount.toString(),
    data.remaining_balance.toString(),
    data.due_date,
    data.payment_terms,
    data.source,
  ]);

  // Combine header and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Export invoices as JSON
 */
export async function exportInvoicesAsJSON(filters: InvoiceFilters = {}): Promise<string> {
  const invoices = await exportInvoices(filters);
  const exportData = transformInvoicesToExportData(invoices);
  return JSON.stringify(exportData, null, 2);
}

/**
 * Get export statistics
 */
export async function getExportStatistics(filters: InvoiceFilters = {}): Promise<{
  totalInvoices: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
}> {
  const invoices = await exportInvoices(filters);

  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.grand_total, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.remaining_balance, 0);

  const byStatus: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  invoices.forEach((invoice) => {
    byStatus[invoice.status] = (byStatus[invoice.status] || 0) + 1;
    bySource[invoice.source] = (bySource[invoice.source] || 0) + 1;
  });

  return {
    totalInvoices,
    totalAmount,
    totalPaid,
    totalOutstanding,
    byStatus,
    bySource,
  };
}
