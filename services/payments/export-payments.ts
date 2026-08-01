import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateExportPaymentPermission } from './payment-permissions';
import { Payment, PaymentFilters, PaymentExportData } from './payment-types';

// ============================================================================
// Export Payments
// ============================================================================

/**
 * Transform payment to export data format
 */
function transformPaymentToExportData(payment: Payment): PaymentExportData {
  return {
    payment_number: payment.payment_number,
    payment_date: payment.payment_date,
    patient_name: '', // Would need to join with patients table
    doctor_name: '', // Would need to join with doctors table
    invoice_number: '', // Would need to join with invoices table
    status: payment.status,
    method: payment.method,
    gateway: payment.gateway,
    amount: payment.amount,
    currency: payment.currency,
    reference_number: payment.reference_number,
  };
}

/**
 * Export payments based on filters
 */
export async function exportPayments(filters?: PaymentFilters): Promise<PaymentExportData[]> {
  await validateExportPaymentPermission();

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
      logger.error('Failed to export payments', { error, filters });
      throw new DatabaseError('Failed to export payments', { error });
    }

    const payments = (data || []) as Payment[];
    return payments.map(transformPaymentToExportData);
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error exporting payments', { error, filters });
    throw new DatabaseError('Failed to export payments', { error });
  }
}

/**
 * Generate CSV from payment export data
 */
export function generatePaymentCSV(payments: PaymentExportData[]): string {
  const headers = [
    'Payment Number',
    'Payment Date',
    'Patient Name',
    'Doctor Name',
    'Invoice Number',
    'Status',
    'Method',
    'Gateway',
    'Amount',
    'Currency',
    'Reference Number',
  ];

  const rows = payments.map(payment => [
    payment.payment_number,
    payment.payment_date,
    payment.patient_name,
    payment.doctor_name || '',
    payment.invoice_number,
    payment.status,
    payment.method,
    payment.gateway || '',
    payment.amount.toString(),
    payment.currency,
    payment.reference_number || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Generate JSON from payment export data
 */
export function generatePaymentJSON(payments: PaymentExportData[]): string {
  return JSON.stringify(payments, null, 2);
}

/**
 * Get export statistics
 */
export async function getExportStatistics(filters?: PaymentFilters): Promise<{
  totalPayments: number;
  totalAmount: number;
  byStatus: Record<string, { count: number; amount: number }>;
  byMethod: Record<string, { count: number; amount: number }>;
  byGateway: Record<string, { count: number; amount: number }>;
}> {
  await validateExportPaymentPermission();

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
      logger.error('Failed to get export statistics', { error, filters });
      throw new DatabaseError('Failed to get export statistics', { error });
    }

    const payments = (data || []) as Payment[];

    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    const byStatus: Record<string, { count: number; amount: number }> = {};
    const byMethod: Record<string, { count: number; amount: number }> = {};
    const byGateway: Record<string, { count: number; amount: number }> = {};

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

      if (payment.gateway) {
        if (!byGateway[payment.gateway]) {
          byGateway[payment.gateway] = { count: 0, amount: 0 };
        }
        byGateway[payment.gateway].count++;
        byGateway[payment.gateway].amount += payment.amount;
      }
    });

    return {
      totalPayments,
      totalAmount,
      byStatus,
      byMethod,
      byGateway,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error getting export statistics', { error, filters });
    throw new DatabaseError('Failed to get export statistics', { error });
  }
}
