import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReadInvoicePermission } from './billing-permissions';
import { Invoice, InvoiceSearchParams, InvoiceFilters } from './billing-types';

/**
 * Search invoices with text query and filters
 */
export async function searchInvoices(params: InvoiceSearchParams): Promise<{
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}> {
  await validateReadInvoicePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const {
      query,
      filters = {},
      sortBy = 'invoice_date',
      sortOrder = 'desc',
      page = 1,
      pageSize = 50,
    } = params;

    let dbQuery = supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Apply text search if query is provided
    if (query && query.trim()) {
      const searchTerm = `%${query.trim()}%`;
      dbQuery = dbQuery.or(
        `invoice_number.ilike.${searchTerm},invoice_reference.ilike.${searchTerm},billing_notes.ilike.${searchTerm},internal_notes.ilike.${searchTerm}`
      );
    }

    // Apply filters
    if (filters.patient_id) {
      dbQuery = dbQuery.eq('patient_id', filters.patient_id);
    }

    if (filters.doctor_id) {
      dbQuery = dbQuery.eq('doctor_id', filters.doctor_id);
    }

    if (filters.status) {
      dbQuery = dbQuery.eq('status', filters.status);
    }

    if (filters.priority) {
      dbQuery = dbQuery.eq('priority', filters.priority);
    }

    if (filters.source) {
      dbQuery = dbQuery.eq('source', filters.source);
    }

    if (filters.currency) {
      dbQuery = dbQuery.eq('currency', filters.currency);
    }

    if (filters.insurance_provider) {
      dbQuery = dbQuery.ilike('insurance_provider', `%${filters.insurance_provider}%`);
    }

    if (filters.date_from) {
      dbQuery = dbQuery.gte('invoice_date', filters.date_from);
    }

    if (filters.date_to) {
      dbQuery = dbQuery.lte('invoice_date', filters.date_to);
    }

    if (filters.due_date_from) {
      dbQuery = dbQuery.gte('due_date', filters.due_date_from);
    }

    if (filters.due_date_to) {
      dbQuery = dbQuery.lte('due_date', filters.due_date_to);
    }

    if (filters.today) {
      const today = new Date().toISOString().slice(0, 10);
      dbQuery = dbQuery.gte('invoice_date', today).lte('invoice_date', `${today}T23:59:59`);
    }

    if (filters.this_week) {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      dbQuery = dbQuery.gte('invoice_date', weekStart.toISOString());
    }

    if (filters.this_month) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dbQuery = dbQuery.gte('invoice_date', monthStart.toISOString());
    }

    if (filters.this_year) {
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);
      dbQuery = dbQuery.gte('invoice_date', yearStart.toISOString());
    }

    // Apply sorting
    dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    dbQuery = dbQuery.range(from, to);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to search invoices', { error, params });
      throw new DatabaseError('Failed to search invoices', { error });
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
    logger.error('Unexpected error searching invoices', { error, params });
    throw new DatabaseError('Failed to search invoices', { error });
  }
}

/**
 * Search invoices by invoice number
 */
export async function searchByInvoiceNumber(
  invoiceNumber: string,
  page: number = 1,
  pageSize: number = 50
): Promise<{
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}> {
  return searchInvoices({
    query: invoiceNumber,
    page,
    pageSize,
  });
}

/**
 * Search invoices by patient name (requires join)
 */
export async function searchByPatientName(
  patientName: string,
  page: number = 1,
  pageSize: number = 50
): Promise<{
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const searchTerm = `%${patientName}%`;

    const { data, error, count } = await supabase
      .from('invoices')
      .select('*, patients!inner(name)', { count: 'exact' })
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .ilike('patients.name', searchTerm)
      .order('invoice_date', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      logger.error('Failed to search invoices by patient name', { error, patientName });
      throw new DatabaseError('Failed to search invoices by patient name', { error });
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
    logger.error('Unexpected error searching invoices by patient name', { error, patientName });
    throw new DatabaseError('Failed to search invoices by patient name', { error });
  }
}

/**
 * Search invoices by doctor name (requires join)
 */
export async function searchByDoctorName(
  doctorName: string,
  page: number = 1,
  pageSize: number = 50
): Promise<{
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const searchTerm = `%${doctorName}%`;

    const { data, error, count } = await supabase
      .from('invoices')
      .select('*, doctors!inner(name)', { count: 'exact' })
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .ilike('doctors.name', searchTerm)
      .order('invoice_date', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      logger.error('Failed to search invoices by doctor name', { error, doctorName });
      throw new DatabaseError('Failed to search invoices by doctor name', { error });
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
    logger.error('Unexpected error searching invoices by doctor name', { error, doctorName });
    throw new DatabaseError('Failed to search invoices by doctor name', { error });
  }
}
