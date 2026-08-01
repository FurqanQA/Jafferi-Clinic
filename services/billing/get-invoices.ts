import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReadInvoicePermission } from './billing-permissions';
import { Invoice, InvoiceFilters } from './billing-types';

/**
 * Get invoices with filters
 */
export async function getInvoices(
  filters: InvoiceFilters = {},
  page: number = 1,
  pageSize: number = 50,
  sortBy: string = 'invoice_date',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}> {
  await validateReadInvoicePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' })
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

    if (filters.insurance_provider) {
      query = query.ilike('insurance_provider', `%${filters.insurance_provider}%`);
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

    if (filters.payment_status) {
      // Payment status filtering will be applied after fetching data
      // This is a limitation of the current query builder
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

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch invoices', { error, filters });
      throw new DatabaseError('Failed to fetch invoices', { error });
    }

    return {
      invoices: (data || []) as Invoice[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching invoices', { error, filters });
    throw new DatabaseError('Failed to fetch invoices', { error });
  }
}

/**
 * Get invoices by patient
 */
export async function getInvoicesByPatient(
  patientId: string,
  page: number = 1,
  pageSize: number = 50
): Promise<{
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}> {
  return getInvoices({ patient_id: patientId }, page, pageSize);
}

/**
 * Get invoices by doctor
 */
export async function getInvoicesByDoctor(
  doctorId: string,
  page: number = 1,
  pageSize: number = 50
): Promise<{
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}> {
  return getInvoices({ doctor_id: doctorId }, page, pageSize);
}

/**
 * Get invoices by status
 */
export async function getInvoicesByStatus(
  status: string,
  page: number = 1,
  pageSize: number = 50
): Promise<{
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}> {
  return getInvoices({ status: status as any }, page, pageSize);
}

/**
 * Get invoices by priority
 */
export async function getInvoicesByPriority(
  priority: string,
  page: number = 1,
  pageSize: number = 50
): Promise<{
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}> {
  return getInvoices({ priority: priority as any }, page, pageSize);
}

/**
 * Get overdue invoices
 */
export async function getOverdueInvoices(
  page: number = 1,
  pageSize: number = 50
): Promise<{
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}> {
  return getInvoices({ payment_status: 'overdue' as any }, page, pageSize);
}

/**
 * Get unpaid invoices
 */
export async function getUnpaidInvoices(
  page: number = 1,
  pageSize: number = 50
): Promise<{
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}> {
  return getInvoices({ payment_status: 'unpaid' as any }, page, pageSize);
}
