import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateReadPaymentPermission } from './payment-permissions';
import { Payment, PaymentStatus, PaymentMethod, PaymentFilters } from './payment-types';

// ============================================================================
// Get Payments
// ============================================================================

/**
 * Get payments with filters
 */
export async function getPayments(filters?: PaymentFilters): Promise<Payment[]> {
  await validateReadPaymentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('payments')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    if (filters) {
      if (filters.invoice_id) {
        query = query.eq('invoice_id', filters.invoice_id);
      }

      if (filters.patient_id) {
        query = query.eq('patient_id', filters.patient_id);
      }

      if (filters.doctor_id) {
        query = query.eq('doctor_id', filters.doctor_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.method) {
        query = query.eq('method', filters.method);
      }

      if (filters.gateway) {
        query = query.eq('gateway', filters.gateway);
      }

      if (filters.date_from) {
        query = query.gte('payment_date', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('payment_date', filters.date_to);
      }
    }

    const { data, error } = await query.order('payment_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch payments', { error, filters });
      throw new DatabaseError('Failed to fetch payments', { error });
    }

    return (data || []) as Payment[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching payments', { error, filters });
    throw new DatabaseError('Failed to fetch payments', { error });
  }
}

/**
 * Get payments with pagination
 */
export async function getPaymentsPaginated(
  filters?: PaymentFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<{
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
    let query = supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    if (filters) {
      if (filters.invoice_id) {
        query = query.eq('invoice_id', filters.invoice_id);
      }

      if (filters.patient_id) {
        query = query.eq('patient_id', filters.patient_id);
      }

      if (filters.doctor_id) {
        query = query.eq('doctor_id', filters.doctor_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.method) {
        query = query.eq('method', filters.method);
      }

      if (filters.gateway) {
        query = query.eq('gateway', filters.gateway);
      }

      if (filters.date_from) {
        query = query.gte('payment_date', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('payment_date', filters.date_to);
      }
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('payment_date', { ascending: false })
      .range(from, to);

    if (error) {
      logger.error('Failed to fetch payments paginated', { error, filters, page, pageSize });
      throw new DatabaseError('Failed to fetch payments paginated', { error });
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
    logger.error('Unexpected error fetching payments paginated', { error, filters, page, pageSize });
    throw new DatabaseError('Failed to fetch payments paginated', { error });
  }
}

/**
 * Get payments by invoice
 */
export async function getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
  await validateReadPaymentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('payment_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch payments by invoice', { error, invoiceId });
      throw new DatabaseError('Failed to fetch payments by invoice', { error });
    }

    return (data || []) as Payment[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching payments by invoice', { error, invoiceId });
    throw new DatabaseError('Failed to fetch payments by invoice', { error });
  }
}

/**
 * Get payments by patient
 */
export async function getPaymentsByPatient(patientId: string): Promise<Payment[]> {
  await validateReadPaymentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('payment_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch payments by patient', { error, patientId });
      throw new DatabaseError('Failed to fetch payments by patient', { error });
    }

    return (data || []) as Payment[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching payments by patient', { error, patientId });
    throw new DatabaseError('Failed to fetch payments by patient', { error });
  }
}

/**
 * Get payments by doctor
 */
export async function getPaymentsByDoctor(doctorId: string): Promise<Payment[]> {
  await validateReadPaymentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('payment_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch payments by doctor', { error, doctorId });
      throw new DatabaseError('Failed to fetch payments by doctor', { error });
    }

    return (data || []) as Payment[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching payments by doctor', { error, doctorId });
    throw new DatabaseError('Failed to fetch payments by doctor', { error });
  }
}

/**
 * Get payments by status
 */
export async function getPaymentsByStatus(status: PaymentStatus): Promise<Payment[]> {
  await validateReadPaymentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', status)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('payment_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch payments by status', { error, status });
      throw new DatabaseError('Failed to fetch payments by status', { error });
    }

    return (data || []) as Payment[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching payments by status', { error, status });
    throw new DatabaseError('Failed to fetch payments by status', { error });
  }
}

/**
 * Get payments by method
 */
export async function getPaymentsByMethod(method: PaymentMethod): Promise<Payment[]> {
  await validateReadPaymentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('method', method)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('payment_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch payments by method', { error, method });
      throw new DatabaseError('Failed to fetch payments by method', { error });
    }

    return (data || []) as Payment[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching payments by method', { error, method });
    throw new DatabaseError('Failed to fetch payments by method', { error });
  }
}

/**
 * Get payment summary
 */
export async function getPaymentSummary(filters?: PaymentFilters): Promise<{
  totalPayments: number;
  totalAmount: number;
  byStatus: Record<PaymentStatus, { count: number; amount: number }>;
  byMethod: Record<PaymentMethod, { count: number; amount: number }>;
}> {
  await validateReadPaymentPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('payments')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    if (filters) {
      if (filters.invoice_id) {
        query = query.eq('invoice_id', filters.invoice_id);
      }

      if (filters.patient_id) {
        query = query.eq('patient_id', filters.patient_id);
      }

      if (filters.doctor_id) {
        query = query.eq('doctor_id', filters.doctor_id);
      }

      if (filters.date_from) {
        query = query.gte('payment_date', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('payment_date', filters.date_to);
      }
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch payment summary', { error, filters });
      throw new DatabaseError('Failed to fetch payment summary', { error });
    }

    const payments = (data || []) as Payment[];

    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    const byStatus: Record<PaymentStatus, { count: number; amount: number }> = {} as any;
    const byMethod: Record<PaymentMethod, { count: number; amount: number }> = {} as any;

    payments.forEach(payment => {
      if (!byStatus[payment.status]) {
        byStatus[payment.status] = { count: 0, amount: 0 };
      }
      byStatus[payment.status].count++;
      byStatus[payment.status].amount += payment.amount;

      if (!byMethod[payment.method]) {
        byMethod[payment.method] = { count: 0, amount: 0 };
      }
      byMethod[payment.method].count++;
      byMethod[payment.method].amount += payment.amount;
    });

    return {
      totalPayments,
      totalAmount,
      byStatus,
      byMethod,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching payment summary', { error, filters });
    throw new DatabaseError('Failed to fetch payment summary', { error });
  }
}
