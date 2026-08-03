import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { DateRange } from './dashboard-types';

// ============================================================================
// Dashboard Metrics
// Core metrics calculation functions for dashboard aggregation
// ============================================================================

/**
 * Metric calculation interface
 */
export interface MetricCalculation {
  metric: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercentage?: number;
  period: string;
}

/**
 * Calculate patient metrics
 */
export async function calculatePatientMetrics(
  clinicId: string,
  dateRange: { start: string; end: string },
  previousDateRange?: { start: string; end: string }
): Promise<MetricCalculation[]> {
  const supabase = getSupabaseClient();

  try {
    // Current period patients
    const { count: currentCount, error: currentError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    if (currentError) {
      throw new DatabaseError('Failed to calculate patient metrics', { error: currentError });
    }

    const metrics: MetricCalculation[] = [
      {
        metric: 'new_patients',
        value: currentCount || 0,
        period: 'current',
      },
    ];

    // Previous period comparison if provided
    if (previousDateRange) {
      const { count: previousCount, error: previousError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .gte('created_at', previousDateRange.start)
        .lte('created_at', previousDateRange.end);

      if (!previousError && previousCount !== null) {
        const change = (currentCount || 0) - previousCount;
        const changePercentage = previousCount > 0 ? ((change / previousCount) * 100) : 0;

        metrics[0].previousValue = previousCount;
        metrics[0].change = change;
        metrics[0].changePercentage = changePercentage;
      }
    }

    // Total patients
    const { count: totalPatients, error: totalError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId);

    if (!totalError && totalPatients !== null) {
      metrics.push({
        metric: 'total_patients',
        value: totalPatients,
        period: 'all_time',
      });
    }

    return metrics;
  } catch (error) {
    logger.error('Failed to calculate patient metrics', { error, clinicId });
    throw error;
  }
}

/**
 * Calculate appointment metrics
 */
export async function calculateAppointmentMetrics(
  clinicId: string,
  dateRange: { start: string; end: string },
  previousDateRange?: { start: string; end: string }
): Promise<MetricCalculation[]> {
  const supabase = getSupabaseClient();

  try {
    // Current period appointments
    const { count: currentCount, error: currentError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .gte('appointment_date', dateRange.start)
      .lte('appointment_date', dateRange.end);

    if (currentError) {
      throw new DatabaseError('Failed to calculate appointment metrics', { error: currentError });
    }

    const metrics: MetricCalculation[] = [
      {
        metric: 'total_appointments',
        value: currentCount || 0,
        period: 'current',
      },
    ];

    // Completed appointments
    const { count: completedCount, error: completedError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('status', 'completed')
      .gte('appointment_date', dateRange.start)
      .lte('appointment_date', dateRange.end);

    if (!completedError && completedCount !== null) {
      metrics.push({
        metric: 'completed_appointments',
        value: completedCount,
        period: 'current',
      });
    }

    // Cancelled appointments
    const { count: cancelledCount, error: cancelledError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('status', 'cancelled')
      .gte('appointment_date', dateRange.start)
      .lte('appointment_date', dateRange.end);

    if (!cancelledError && cancelledCount !== null) {
      metrics.push({
        metric: 'cancelled_appointments',
        value: cancelledCount,
        period: 'current',
      });
    }

    // Previous period comparison
    if (previousDateRange) {
      const { count: previousCount, error: previousError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .gte('appointment_date', previousDateRange.start)
        .lte('appointment_date', previousDateRange.end);

      if (!previousError && previousCount !== null) {
        const change = (currentCount || 0) - previousCount;
        const changePercentage = previousCount > 0 ? ((change / previousCount) * 100) : 0;

        metrics[0].previousValue = previousCount;
        metrics[0].change = change;
        metrics[0].changePercentage = changePercentage;
      }
    }

    return metrics;
  } catch (error) {
    logger.error('Failed to calculate appointment metrics', { error, clinicId });
    throw error;
  }
}

/**
 * Calculate revenue metrics
 */
export async function calculateRevenueMetrics(
  clinicId: string,
  dateRange: { start: string; end: string },
  previousDateRange?: { start: string; end: string }
): Promise<MetricCalculation[]> {
  const supabase = getSupabaseClient();

  try {
    // Current period revenue
    const { data: payments, error: currentError } = await supabase
      .from('payments')
      .select('amount')
      .eq('clinic_id', clinicId)
      .eq('status', 'completed')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    if (currentError) {
      throw new DatabaseError('Failed to calculate revenue metrics', { error: currentError });
    }

    const currentRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    const metrics: MetricCalculation[] = [
      {
        metric: 'total_revenue',
        value: currentRevenue,
        period: 'current',
      },
    ];

    // Previous period comparison
    if (previousDateRange) {
      const { data: previousPayments, error: previousError } = await supabase
        .from('payments')
        .select('amount')
        .eq('clinic_id', clinicId)
        .eq('status', 'completed')
        .gte('created_at', previousDateRange.start)
        .lte('created_at', previousDateRange.end);

      if (!previousError) {
        const previousRevenue = previousPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const change = currentRevenue - previousRevenue;
        const changePercentage = previousRevenue > 0 ? ((change / previousRevenue) * 100) : 0;

        metrics[0].previousValue = previousRevenue;
        metrics[0].change = change;
        metrics[0].changePercentage = changePercentage;
      }
    }

    return metrics;
  } catch (error) {
    logger.error('Failed to calculate revenue metrics', { error, clinicId });
    throw error;
  }
}

/**
 * Calculate laboratory metrics
 */
export async function calculateLaboratoryMetrics(
  clinicId: string,
  dateRange: { start: string; end: string }
): Promise<MetricCalculation[]> {
  const supabase = getSupabaseClient();

  try {
    const metrics: MetricCalculation[] = [];

    // Total tests
    const { count: totalTests, error: totalError } = await supabase
      .from('laboratory_tests')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    if (!totalError && totalTests !== null) {
      metrics.push({
        metric: 'total_tests',
        value: totalTests,
        period: 'current',
      });
    }

    // Pending results
    const { count: pendingResults, error: pendingError } = await supabase
      .from('laboratory_tests')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('status', 'pending');

    if (!pendingError && pendingResults !== null) {
      metrics.push({
        metric: 'pending_results',
        value: pendingResults,
        period: 'current',
      });
    }

    // Critical results
    const { count: criticalResults, error: criticalError } = await supabase
      .from('laboratory_results')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('is_critical', true)
      .eq('is_reviewed', false);

    if (!criticalError && criticalResults !== null) {
      metrics.push({
        metric: 'critical_results',
        value: criticalResults,
        period: 'current',
      });
    }

    return metrics;
  } catch (error) {
    logger.error('Failed to calculate laboratory metrics', { error, clinicId });
    throw error;
  }
}

/**
 * Calculate billing metrics
 */
export async function calculateBillingMetrics(
  clinicId: string
): Promise<MetricCalculation[]> {
  const supabase = getSupabaseClient();

  try {
    const metrics: MetricCalculation[] = [];

    // Outstanding invoices
    const { data: outstandingInvoices, error: outstandingError } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('clinic_id', clinicId)
      .eq('status', 'pending');

    if (!outstandingError) {
      const outstandingCount = outstandingInvoices?.length || 0;
      const outstandingAmount = outstandingInvoices?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0;

      metrics.push({
        metric: 'outstanding_invoices_count',
        value: outstandingCount,
        period: 'current',
      });

      metrics.push({
        metric: 'outstanding_amount',
        value: outstandingAmount,
        period: 'current',
      });
    }

    // Pending payments
    const { count: pendingPayments, error: pendingError } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('status', 'pending');

    if (!pendingError && pendingPayments !== null) {
      metrics.push({
        metric: 'pending_payments',
        value: pendingPayments,
        period: 'current',
      });
    }

    return metrics;
  } catch (error) {
    logger.error('Failed to calculate billing metrics', { error, clinicId });
    throw error;
  }
}

/**
 * Calculate doctor utilization metrics
 */
export async function calculateDoctorUtilizationMetrics(
  clinicId: string,
  dateRange: { start: string; end: string }
): Promise<MetricCalculation[]> {
  const supabase = getSupabaseClient();

  try {
    const metrics: MetricCalculation[] = [];

    // Get all doctors
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('status', 'active');

    if (doctorsError) {
      throw new DatabaseError('Failed to fetch doctors', { error: doctorsError });
    }

    const activeDoctors = doctors?.length || 0;

    // Get appointments per doctor
    for (const doctor of doctors || []) {
      const { count: appointmentCount, error: countError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .eq('doctor_id', doctor.id)
        .gte('appointment_date', dateRange.start)
        .lte('appointment_date', dateRange.end);

      if (!countError && appointmentCount !== null) {
        metrics.push({
          metric: `doctor_${doctor.id}_appointments`,
          value: appointmentCount,
          period: 'current',
        });
      }
    }

    // Average utilization
    const totalAppointments = metrics.reduce((sum, m) => sum + m.value, 0);
    const averageUtilization = activeDoctors > 0 ? totalAppointments / activeDoctors : 0;

    metrics.push({
      metric: 'average_doctor_utilization',
      value: averageUtilization,
      period: 'current',
    });

    return metrics;
  } catch (error) {
    logger.error('Failed to calculate doctor utilization metrics', { error, clinicId });
    throw error;
  }
}

/**
 * Calculate custom metric
 */
export async function calculateCustomMetric(
  clinicId: string,
  table: string,
  column: string,
  aggregation: 'sum' | 'count' | 'average' | 'min' | 'max',
  filters?: Record<string, any>
): Promise<number> {
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from(table)
      .select(column);

    // Apply filters
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new DatabaseError('Failed to calculate custom metric', { error });
    }

    if (!data || data.length === 0) {
      return 0;
    }

    switch (aggregation) {
      case 'count':
        return data.length;
      case 'sum':
        return data.reduce((sum: number, row: any) => sum + (row[column] || 0), 0);
      case 'average':
        const sum = data.reduce((sum: number, row: any) => sum + (row[column] || 0), 0);
        return sum / data.length;
      case 'min':
        return Math.min(...data.map((row: any) => row[column] || 0));
      case 'max':
        return Math.max(...data.map((row: any) => row[column] || 0));
      default:
        return 0;
    }
  } catch (error) {
    logger.error('Failed to calculate custom metric', { error, clinicId, table, column });
    throw error;
  }
}

/**
 * Get previous date range for comparison
 */
export function getPreviousDateRange(
  currentRange: DateRange,
  startDate?: string,
  endDate?: string
): { start: string; end: string } | null {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  switch (currentRange) {
    case DateRange.TODAY:
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        start: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0).toISOString(),
        end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999).toISOString(),
      };

    case DateRange.THIS_WEEK:
      const lastWeekEnd = new Date(now);
      lastWeekEnd.setDate(now.getDate() - now.getDay() - 1);
      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
      return {
        start: new Date(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate(), 0, 0, 0, 0).toISOString(),
        end: new Date(lastWeekEnd.getFullYear(), lastWeekEnd.getMonth(), lastWeekEnd.getDate(), 23, 59, 59, 999).toISOString(),
      };

    case DateRange.THIS_MONTH:
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return {
        start: lastMonthStart.toISOString(),
        end: lastMonthEnd.toISOString(),
      };

    case DateRange.THIS_YEAR:
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return {
        start: lastYearStart.toISOString(),
        end: lastYearEnd.toISOString(),
      };

    case DateRange.CUSTOM:
      if (startDate && endDate) {
        const daysDiff = Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
        const prevEnd = new Date(startDate);
        prevEnd.setDate(prevEnd.getDate() - 1);
        const prevStart = new Date(prevEnd);
        prevStart.setDate(prevStart.getDate() - daysDiff);
        return {
          start: prevStart.toISOString(),
          end: prevEnd.toISOString(),
        };
      }
      return null;

    default:
      return null;
  }
}
