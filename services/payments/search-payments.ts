import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReadPaymentPermission } from './payment-permissions';
import { Payment, PaymentSearchParams } from './payment-types';

// ============================================================================
// Search Payments
// ============================================================================

/**
 * Search payments with text query and filters
 */
export async function searchPayments(searchParams: PaymentSearchParams): Promise<{
  payments: Payment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  await validateReadPaymentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const page = searchParams.page || 1;
    const pageSize = searchParams.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    // Apply filters
    if (searchParams.filters?.invoice_id) {
      query = query.eq('invoice_id', searchParams.filters.invoice_id);
    }

    if (searchParams.filters?.patient_id) {
      query = query.eq('patient_id', searchParams.filters.patient_id);
    }

    if (searchParams.filters?.doctor_id) {
      query = query.eq('doctor_id', searchParams.filters.doctor_id);
    }

    if (searchParams.filters?.status) {
      query = query.eq('status', searchParams.filters.status);
    }

    if (searchParams.filters?.method) {
      query = query.eq('method', searchParams.filters.method);
    }

    if (searchParams.filters?.gateway) {
      query = query.eq('gateway', searchParams.filters.gateway);
    }

    if (searchParams.filters?.date_from) {
      query = query.gte('payment_date', searchParams.filters.date_from);
    }

    if (searchParams.filters?.date_to) {
      query = query.lte('payment_date', searchParams.filters.date_to);
    }

    // Text search on payment number, reference number, and notes
    if (searchParams.query) {
      query = query.or(
        `payment_number.ilike.%${searchParams.query}%,reference_number.ilike.%${searchParams.query}%,notes.ilike.%${searchParams.query}%`
      );
    }

    // Sorting
    const sortBy = searchParams.sortBy || 'payment_date';
    const sortOrder = searchParams.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const { data, error, count } = await query.range(from, to);

    if (error) {
      logger.error('Failed to search payments', { error, searchParams });
      throw new DatabaseError('Failed to search payments', { error });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      payments: (data || []) as Payment[],
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error searching payments', { error, searchParams });
    throw new DatabaseError('Failed to search payments', { error });
  }
}

/**
 * Search payments with patient and doctor names
 */
export async function searchPaymentsWithNames(searchParams: PaymentSearchParams): Promise<{
  payments: Array<Payment & { patient_name?: string; doctor_name?: string }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  await validateReadPaymentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const page = searchParams.page || 1;
    const pageSize = searchParams.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('payments')
      .select(`
        *,
        patient:patients!inner(first_name, last_name),
        doctor:doctors(first_name, last_name)
      `, { count: 'exact' })
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    // Apply filters
    if (searchParams.filters?.invoice_id) {
      query = query.eq('invoice_id', searchParams.filters.invoice_id);
    }

    if (searchParams.filters?.patient_id) {
      query = query.eq('patient_id', searchParams.filters.patient_id);
    }

    if (searchParams.filters?.doctor_id) {
      query = query.eq('doctor_id', searchParams.filters.doctor_id);
    }

    if (searchParams.filters?.status) {
      query = query.eq('status', searchParams.filters.status);
    }

    if (searchParams.filters?.method) {
      query = query.eq('method', searchParams.filters.method);
    }

    if (searchParams.filters?.gateway) {
      query = query.eq('gateway', searchParams.filters.gateway);
    }

    if (searchParams.filters?.date_from) {
      query = query.gte('payment_date', searchParams.filters.date_from);
    }

    if (searchParams.filters?.date_to) {
      query = query.lte('payment_date', searchParams.filters.date_to);
    }

    // Sorting
    const sortBy = searchParams.sortBy || 'payment_date';
    const sortOrder = searchParams.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const { data, error, count } = await query.range(from, to);

    if (error) {
      logger.error('Failed to search payments with names', { error, searchParams });
      throw new DatabaseError('Failed to search payments with names', { error });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    const paymentsWithNames = (data || []).map((payment: any) => ({
      ...payment,
      patient_name: payment.patient ? `${payment.patient.first_name} ${payment.patient.last_name}` : undefined,
      doctor_name: payment.doctor ? `${payment.doctor.first_name} ${payment.doctor.last_name}` : undefined,
    }));

    return {
      payments: paymentsWithNames,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error searching payments with names', { error, searchParams });
    throw new DatabaseError('Failed to search payments with names', { error });
  }
}

/**
 * Advanced search with multiple criteria
 */
export async function advancedSearchPayments(searchParams: PaymentSearchParams): Promise<{
  payments: Payment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  await validateReadPaymentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const page = searchParams.page || 1;
    const pageSize = searchParams.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    // Apply filters
    if (searchParams.filters?.invoice_id) {
      query = query.eq('invoice_id', searchParams.filters.invoice_id);
    }

    if (searchParams.filters?.patient_id) {
      query = query.eq('patient_id', searchParams.filters.patient_id);
    }

    if (searchParams.filters?.doctor_id) {
      query = query.eq('doctor_id', searchParams.filters.doctor_id);
    }

    if (searchParams.filters?.status) {
      query = query.eq('status', searchParams.filters.status);
    }

    if (searchParams.filters?.method) {
      query = query.eq('method', searchParams.filters.method);
    }

    if (searchParams.filters?.gateway) {
      query = query.eq('gateway', searchParams.filters.gateway);
    }

    if (searchParams.filters?.date_from) {
      query = query.gte('payment_date', searchParams.filters.date_from);
    }

    if (searchParams.filters?.date_to) {
      query = query.lte('payment_date', searchParams.filters.date_to);
    }

    // Text search
    if (searchParams.query) {
      query = query.or(
        `payment_number.ilike.%${searchParams.query}%,reference_number.ilike.%${searchParams.query}%,notes.ilike.%${searchParams.query}%,internal_notes.ilike.%${searchParams.query}%`
      );
    }

    // Sorting
    const sortBy = searchParams.sortBy || 'payment_date';
    const sortOrder = searchParams.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const { data, error, count } = await query.range(from, to);

    if (error) {
      logger.error('Failed to advanced search payments', { error, searchParams });
      throw new DatabaseError('Failed to advanced search payments', { error });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      payments: (data || []) as Payment[],
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error advanced searching payments', { error, searchParams });
    throw new DatabaseError('Failed to advanced search payments', { error });
  }
}
