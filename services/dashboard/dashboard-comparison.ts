import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { ComparisonData, ComparisonPeriod } from './dashboard-types';
import { calculatePatientMetrics, calculateAppointmentMetrics, calculateRevenueMetrics } from './dashboard-metrics';

// ============================================================================
// Dashboard Comparison
// Compare metrics across different time periods
// ============================================================================

/**
 * Compare metrics between current and previous period
 */
export async function compareMetrics(
  metric: string,
  clinicId?: string,
  currentPeriod?: { start: string; end: string },
  previousPeriod?: { start: string; end: string }
): Promise<ComparisonData> {
  const targetClinicId = clinicId || await getUserClinicId();

  try {
    const currentBoundaries = currentPeriod || {
      start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
      end: new Date().toISOString(),
    };

    const previousBoundaries = previousPeriod || {
      start: new Date(new Date().setDate(new Date().getDate() - 60)).toISOString(),
      end: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    };

    let currentValue = 0;
    let previousValue = 0;
    let unit = '';

    switch (metric) {
      case 'patients':
        const patientMetrics = await calculatePatientMetrics(targetClinicId, currentBoundaries, previousBoundaries);
        currentValue = patientMetrics.find((m) => m.metric === 'new_patients')?.value || 0;
        previousValue = patientMetrics.find((m) => m.metric === 'new_patients')?.previousValue || 0;
        unit = 'patients';
        break;

      case 'appointments':
        const appointmentMetrics = await calculateAppointmentMetrics(targetClinicId, currentBoundaries, previousBoundaries);
        currentValue = appointmentMetrics.find((m) => m.metric === 'total_appointments')?.value || 0;
        previousValue = appointmentMetrics.find((m) => m.metric === 'total_appointments')?.previousValue || 0;
        unit = 'appointments';
        break;

      case 'revenue':
        const revenueMetrics = await calculateRevenueMetrics(targetClinicId, currentBoundaries, previousBoundaries);
        currentValue = revenueMetrics.find((m) => m.metric === 'total_revenue')?.value || 0;
        previousValue = revenueMetrics.find((m) => m.metric === 'total_revenue')?.previousValue || 0;
        unit = 'USD';
        break;

      default:
        throw new Error(`Unknown metric for comparison: ${metric}`);
    }

    const change = currentValue - previousValue;
    const changePercentage = previousValue > 0 ? ((change / previousValue) * 100) : 0;
    const isPositive = change >= 0;

    return {
      metric,
      currentValue,
      previousValue,
      change,
      changePercentage,
      isPositive,
      unit,
      currentPeriod: {
        start: currentBoundaries.start,
        end: currentBoundaries.end,
      },
      previousPeriod: {
        start: previousBoundaries.start,
        end: previousBoundaries.end,
      },
    };
  } catch (error) {
    logger.error('Failed to compare metrics', { error, metric, clinicId: targetClinicId });
    throw error;
  }
}

/**
 * Compare multiple metrics
 */
export async function compareMultipleMetrics(
  metrics: string[],
  clinicId?: string,
  currentPeriod?: { start: string; end: string },
  previousPeriod?: { start: string; end: string }
): Promise<ComparisonData[]> {
  const comparisons: ComparisonData[] = [];

  for (const metric of metrics) {
    try {
      const comparison = await compareMetrics(metric, clinicId, currentPeriod, previousPeriod);
      comparisons.push(comparison);
    } catch (error) {
      logger.error('Failed to compare metric', { error, metric });
    }
  }

  return comparisons;
}

/**
 * Get period comparison
 */
export async function getPeriodComparison(
  period: ComparisonPeriod,
  clinicId?: string
): Promise<ComparisonData[]> {
  const targetClinicId = clinicId || await getUserClinicId();
  const now = new Date();

  let currentStart: Date;
  let currentEnd: Date;
  let previousStart: Date;
  let previousEnd: Date;

  switch (period) {
    case ComparisonPeriod.WEEK_OVER_WEEK:
      currentStart = new Date(now);
      currentStart.setDate(now.getDate() - now.getDay());
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = new Date(now);
      currentEnd.setHours(23, 59, 59, 999);

      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 7);
      previousEnd = new Date(currentEnd);
      previousEnd.setDate(previousEnd.getDate() - 7);
      break;

    case ComparisonPeriod.MONTH_OVER_MONTH:
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      currentEnd = new Date(now);
      currentEnd.setHours(23, 59, 59, 999);

      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;

    case ComparisonPeriod.QUARTER_OVER_QUARTER:
      const currentQuarter = Math.floor(now.getMonth() / 3);
      currentStart = new Date(now.getFullYear(), currentQuarter * 3, 1, 0, 0, 0, 0);
      currentEnd = new Date(now);
      currentEnd.setHours(23, 59, 59, 999);

      const previousQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
      const previousQuarterYear = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
      previousStart = new Date(previousQuarterYear, previousQuarter * 3, 1, 0, 0, 0, 0);
      previousEnd = new Date(previousQuarterYear, previousQuarter * 3 + 2, 31, 23, 59, 59, 999);
      break;

    case ComparisonPeriod.YEAR_OVER_YEAR:
      currentStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      currentEnd = new Date(now);
      currentEnd.setHours(23, 59, 59, 999);

      previousStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      previousEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;

    default:
      currentStart = new Date(now);
      currentStart.setDate(now.getDate() - 30);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = new Date(now);
      currentEnd.setHours(23, 59, 59, 999);

      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 30);
      previousEnd = new Date(currentEnd);
      previousEnd.setDate(previousEnd.getDate() - 30);
  }

  return await compareMultipleMetrics(
    ['patients', 'appointments', 'revenue'],
    targetClinicId,
    {
      start: currentStart.toISOString(),
      end: currentEnd.toISOString(),
    },
    {
      start: previousStart.toISOString(),
      end: previousEnd.toISOString(),
    }
  );
}

/**
 * Get custom period comparison
 */
export async function getCustomPeriodComparison(
  startDate1: string,
  endDate1: string,
  startDate2: string,
  endDate2: string,
  clinicId?: string
): Promise<ComparisonData[]> {
  return await compareMultipleMetrics(
    ['patients', 'appointments', 'revenue'],
    clinicId,
    { start: startDate1, end: endDate1 },
    { start: startDate2, end: endDate2 }
  );
}

/**
 * Get comparison summary
 */
export function getComparisonSummary(comparisons: ComparisonData[]): {
  totalMetrics: number;
  positiveChanges: number;
  negativeChanges: number;
  averageChangePercentage: number;
} {
  const totalMetrics = comparisons.length;
  const positiveChanges = comparisons.filter((c) => c.isPositive).length;
  const negativeChanges = comparisons.filter((c) => !c.isPositive).length;

  const totalChangePercentage = comparisons.reduce((sum, c) => sum + c.changePercentage, 0);
  const averageChangePercentage = totalMetrics > 0 ? totalChangePercentage / totalMetrics : 0;

  return {
    totalMetrics,
    positiveChanges,
    negativeChanges,
    averageChangePercentage,
  };
}

/**
 * Get best performing metric
 */
export function getBestPerformingMetric(comparisons: ComparisonData[]): ComparisonData | null {
  if (comparisons.length === 0) {
    return null;
  }

  return comparisons.reduce((best, current) => {
    if (!best) return current;
    return current.changePercentage > best.changePercentage ? current : best;
  });
}

/**
 * Get worst performing metric
 */
export function getWorstPerformingMetric(comparisons: ComparisonData[]): ComparisonData | null {
  if (comparisons.length === 0) {
    return null;
  }

  return comparisons.reduce((worst, current) => {
    if (!worst) return current;
    return current.changePercentage < worst.changePercentage ? current : worst;
  });
}

/**
 * Format comparison for display
 */
export function formatComparison(comparison: ComparisonData): string {
  const sign = comparison.isPositive ? '+' : '';
  const formattedValue = formatMetricValue(comparison.currentValue, comparison.unit);
  const formattedPrevious = formatMetricValue(comparison.previousValue, comparison.unit);
  const formattedChange = formatMetricValue(Math.abs(comparison.change), comparison.unit);

  return `${comparison.metric}: ${formattedValue} (was ${formattedPrevious}, ${sign}${formattedChange}, ${sign}${comparison.changePercentage.toFixed(1)}%)`;
}

/**
 * Format metric value for display
 */
function formatMetricValue(value: number, unit: string): string {
  if (unit === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Get trend direction
 */
export function getTrendDirection(comparison: ComparisonData): 'up' | 'down' | 'flat' {
  if (comparison.changePercentage > 5) return 'up';
  if (comparison.changePercentage < -5) return 'down';
  return 'flat';
}

/**
 * Get performance rating
 */
export function getPerformanceRating(comparison: ComparisonData): 'excellent' | 'good' | 'fair' | 'poor' {
  if (comparison.changePercentage > 20) return 'excellent';
  if (comparison.changePercentage > 10) return 'good';
  if (comparison.changePercentage > 0) return 'fair';
  return 'poor';
}
