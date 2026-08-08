import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { AnalyticsRequestOptions } from './dashboard-types';
import { calculatePatientMetrics, calculateAppointmentMetrics, calculateRevenueMetrics, calculateLaboratoryMetrics, calculateBillingMetrics } from './dashboard-metrics';

// ============================================================================
// Analytics Engine
// Core analytics engine for advanced data analysis and aggregation
// ============================================================================

/**
 * Execute analytics query
 */
export async function executeAnalyticsQuery(
  options: AnalyticsRequestOptions
): Promise<any> {
  const targetClinicId = options.clinicId || await getUserClinicId();

  try {
    const boundaries = options.dateRange
      ? getDateRangeBoundaries(options.dateRange)
      : options.startDate && options.endDate
      ? { start: options.startDate, end: options.endDate }
      : {
          start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
          end: new Date().toISOString(),
        };

    let result: any = {};

    switch (options.metric) {
      case 'patients':
        result = await analyzePatientMetrics(targetClinicId, boundaries, options);
        break;
      case 'appointments':
        result = await analyzeAppointmentMetrics(targetClinicId, boundaries, options);
        break;
      case 'revenue':
        result = await analyzeRevenueMetrics(targetClinicId, boundaries, options);
        break;
      case 'laboratory':
        result = await analyzeLaboratoryMetrics(targetClinicId, boundaries, options);
        break;
      case 'billing':
        result = await analyzeBillingMetrics(targetClinicId, boundaries, options);
        break;
      default:
        result = await analyzeCustomMetric(targetClinicId, boundaries, options);
    }

    return {
      success: true,
      data: result,
      metadata: {
        clinicId: targetClinicId,
        metric: options.metric,
        aggregation: options.aggregation,
        groupBy: options.groupBy,
        dateRange: boundaries,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error('Failed to execute analytics query', { error, options });
    throw error;
  }
}

/**
 * Analyze patient metrics
 */
async function analyzePatientMetrics(
  clinicId: string,
  dateRange: { start: string; end: string },
  options: AnalyticsRequestOptions
): Promise<any> {
  const metrics = await calculatePatientMetrics(clinicId, dateRange);

  if (options.groupBy === 'date') {
    return groupMetricsByDate(metrics, dateRange);
  }

  if (options.aggregation === 'sum') {
    return metrics.reduce((sum, m) => sum + m.value, 0);
  }

  if (options.aggregation === 'average') {
    const sum = metrics.reduce((sum, m) => sum + m.value, 0);
    return metrics.length > 0 ? sum / metrics.length : 0;
  }

  return metrics;
}

/**
 * Analyze appointment metrics
 */
async function analyzeAppointmentMetrics(
  clinicId: string,
  dateRange: { start: string; end: string },
  options: AnalyticsRequestOptions
): Promise<any> {
  const metrics = await calculateAppointmentMetrics(clinicId, dateRange);

  if (options.groupBy === 'status') {
    return groupMetricsByKey(metrics, 'status');
  }

  if (options.groupBy === 'date') {
    return groupMetricsByDate(metrics, dateRange);
  }

  if (options.aggregation === 'sum') {
    return metrics.reduce((sum, m) => sum + m.value, 0);
  }

  return metrics;
}

/**
 * Analyze revenue metrics
 */
async function analyzeRevenueMetrics(
  clinicId: string,
  dateRange: { start: string; end: string },
  options: AnalyticsRequestOptions
): Promise<any> {
  const metrics = await calculateRevenueMetrics(clinicId, dateRange);

  if (options.groupBy === 'date') {
    return groupMetricsByDate(metrics, dateRange);
  }

  if (options.aggregation === 'sum') {
    return metrics.reduce((sum, m) => sum + m.value, 0);
  }

  return metrics;
}

/**
 * Analyze laboratory metrics
 */
async function analyzeLaboratoryMetrics(
  clinicId: string,
  dateRange: { start: string; end: string },
  options: AnalyticsRequestOptions
): Promise<any> {
  const metrics = await calculateLaboratoryMetrics(clinicId, dateRange);

  if (options.groupBy === 'status') {
    return groupMetricsByKey(metrics, 'status');
  }

  if (options.aggregation === 'sum') {
    return metrics.reduce((sum, m) => sum + m.value, 0);
  }

  return metrics;
}

/**
 * Analyze billing metrics
 */
async function analyzeBillingMetrics(
  clinicId: string,
  dateRange: { start: string; end: string },
  options: AnalyticsRequestOptions
): Promise<any> {
  const metrics = await calculateBillingMetrics(clinicId);

  if (options.groupBy === 'status') {
    return groupMetricsByKey(metrics, 'status');
  }

  if (options.aggregation === 'sum') {
    return metrics.reduce((sum, m) => sum + m.value, 0);
  }

  return metrics;
}

/**
 * Analyze custom metric
 */
async function analyzeCustomMetric(
  clinicId: string,
  dateRange: { start: string; end: string },
  options: AnalyticsRequestOptions
): Promise<any> {
  // Placeholder for custom metric analysis
  return {
    metric: options.metric,
    value: 0,
    message: 'Custom metric analysis not implemented',
  };
}

/**
 * Group metrics by key
 */
function groupMetricsByKey(metrics: any[], key: string): Record<string, number> {
  return metrics.reduce((acc, metric) => {
    const groupKey = metric[key] || 'unknown';
    acc[groupKey] = (acc[groupKey] || 0) + metric.value;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Group metrics by date
 */
function groupMetricsByDate(
  metrics: any[],
  dateRange: { start: string; end: string }
): Array<{ date: string; value: number }> {
  const grouped: Record<string, number> = {};

  for (const metric of metrics) {
    const date = new Date(metric.timestamp || new Date()).toISOString().split('T')[0];
    grouped[date] = (grouped[date] || 0) + metric.value;
  }

  return Object.entries(grouped).map(([date, value]) => ({ date, value }));
}

/**
 * Get date range boundaries
 */
function getDateRangeBoundaries(dateRange: string): { start: string; end: string } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (dateRange) {
    case 'today':
      return {
        start: startOfToday.toISOString(),
        end: endOfToday.toISOString(),
      };
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
      const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      return {
        start: startOfYesterday.toISOString(),
        end: endOfYesterday.toISOString(),
      };
    case 'this_week':
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return {
        start: startOfWeek.toISOString(),
        end: endOfToday.toISOString(),
      };
    case 'this_month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return {
        start: startOfMonth.toISOString(),
        end: endOfToday.toISOString(),
      };
    case 'this_year':
      const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      return {
        start: startOfYear.toISOString(),
        end: endOfToday.toISOString(),
      };
    default:
      return {
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
        end: endOfToday.toISOString(),
      };
  }
}

/**
 * Get analytics summary
 */
export async function getAnalyticsSummary(
  clinicId?: string,
  dateRange?: string
): Promise<{
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number;
  totalLabTests: number;
  totalInvoices: number;
}> {
  const targetClinicId = clinicId || await getUserClinicId();
  const boundaries = getDateRangeBoundaries(dateRange || 'this_month');

  const [patientMetrics, appointmentMetrics, revenueMetrics, labMetrics, billingMetrics] =
    await Promise.all([
      calculatePatientMetrics(targetClinicId, boundaries),
      calculateAppointmentMetrics(targetClinicId, boundaries),
      calculateRevenueMetrics(targetClinicId, boundaries),
      calculateLaboratoryMetrics(targetClinicId, boundaries),
      calculateBillingMetrics(targetClinicId),
    ]);

  return {
    totalPatients: patientMetrics.find((m) => m.metric === 'total_patients')?.value || 0,
    totalAppointments: appointmentMetrics.find((m) => m.metric === 'total_appointments')?.value || 0,
    totalRevenue: revenueMetrics.find((m) => m.metric === 'total_revenue')?.value || 0,
    totalLabTests: labMetrics.find((m) => m.metric === 'total_tests')?.value || 0,
    totalInvoices: billingMetrics.find((m) => m.metric === 'total_invoices')?.value || 0,
  };
}

/**
 * Execute batch analytics queries
 */
export async function executeBatchAnalyticsQueries(
  queries: AnalyticsRequestOptions[]
): Promise<any[]> {
  const results: any[] = [];

  for (const query of queries) {
    try {
      const result = await executeAnalyticsQuery(query);
      results.push(result);
    } catch (error) {
      logger.error('Failed to execute analytics query in batch', { error, query });
      results.push({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        query,
      });
    }
  }

  return results;
}
