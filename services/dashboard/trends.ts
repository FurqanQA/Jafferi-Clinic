import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { calculatePatientMetrics, calculateAppointmentMetrics, calculateRevenueMetrics } from './dashboard-metrics';

// ============================================================================
// Trends Analysis
// Analyze trends over time for various metrics
// ============================================================================

/**
 * Get trend data
 */
export async function getTrendData(
  metric: string,
  clinicId?: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  days: number = 30
): Promise<Array<{ date: string; value: number; trend: 'up' | 'down' | 'stable' }>> {
  const targetClinicId = clinicId || await getUserClinicId();

  try {
    const trendData: Array<{ date: string; value: number; trend: 'up' | 'down' | 'stable' }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).toISOString();
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).toISOString();

      let value = 0;

      switch (metric) {
        case 'patients':
          const patientMetrics = await calculatePatientMetrics(targetClinicId, { start: startOfDay, end: endOfDay });
          value = patientMetrics.find((m) => m.metric === 'new_patients')?.value || 0;
          break;
        case 'appointments':
          const appointmentMetrics = await calculateAppointmentMetrics(targetClinicId, { start: startOfDay, end: endOfDay });
          value = appointmentMetrics.find((m) => m.metric === 'total_appointments')?.value || 0;
          break;
        case 'revenue':
          const revenueMetrics = await calculateRevenueMetrics(targetClinicId, { start: startOfDay, end: endOfDay });
          value = revenueMetrics.find((m) => m.metric === 'total_revenue')?.value || 0;
          break;
        default:
          value = 0;
      }

      const previousValue = trendData.length > 0 ? trendData[trendData.length - 1].value : value;
      let trend: 'up' | 'down' | 'stable' = 'stable';

      if (value > previousValue) {
        trend = 'up';
      } else if (value < previousValue) {
        trend = 'down';
      }

      trendData.push({
        date: date.toISOString().split('T')[0],
        value,
        trend,
      });
    }

    return trendData;
  } catch (error) {
    logger.error('Failed to get trend data', { error, metric, clinicId: targetClinicId });
    throw error;
  }
}

/**
 * Get trend analysis
 */
export async function getTrendAnalysis(
  metric: string,
  clinicId?: string,
  days: number = 30
): Promise<{
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
  direction: 'increasing' | 'decreasing' | 'neutral';
}> {
  const trendData = await getTrendData(metric, clinicId, 'daily', days);

  if (trendData.length === 0) {
    return {
      current: 0,
      previous: 0,
      change: 0,
      changePercentage: 0,
      trend: 'stable',
      direction: 'neutral',
    };
  }

  const current = trendData[trendData.length - 1].value;
  const previous = trendData[0].value;
  const change = current - previous;
  const changePercentage = previous > 0 ? (change / previous) * 100 : 0;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  let direction: 'increasing' | 'decreasing' | 'neutral' = 'neutral';

  if (change > 0) {
    trend = 'up';
    direction = 'increasing';
  } else if (change < 0) {
    trend = 'down';
    direction = 'decreasing';
  }

  return {
    current,
    previous,
    change,
    changePercentage,
    trend,
    direction,
  };
}

/**
 * Get moving average
 */
export function getMovingAverage(
  data: Array<{ date: string; value: number }>,
  window: number = 7
): Array<{ date: string; value: number; movingAverage: number }> {
  const result: Array<{ date: string; value: number; movingAverage: number }> = [];

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const windowData = data.slice(start, i + 1);
    const sum = windowData.reduce((acc, d) => acc + d.value, 0);
    const movingAverage = sum / windowData.length;

    result.push({
      date: data[i].date,
      value: data[i].value,
      movingAverage,
    });
  }

  return result;
}

/**
 * Get trend line
 */
export function getTrendLine(
  data: Array<{ date: string; value: number }>
): Array<{ date: string; value: number; trendLine: number }> {
  if (data.length < 2) {
    return data.map((d) => ({ ...d, trendLine: d.value }));
  }

  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = data[i].value;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return data.map((d, i) => ({
    date: d.date,
    value: d.value,
    trendLine: slope * i + intercept,
  }));
}

/**
 * Get trend summary
 */
export async function getTrendSummary(
  clinicId?: string,
  days: number = 30
): Promise<{
  patients: any;
  appointments: any;
  revenue: any;
}> {
  const [patientTrend, appointmentTrend, revenueTrend] = await Promise.all([
    getTrendAnalysis('patients', clinicId, days),
    getTrendAnalysis('appointments', clinicId, days),
    getTrendAnalysis('revenue', clinicId, days),
  ]);

  return {
    patients: patientTrend,
    appointments: appointmentTrend,
    revenue: revenueTrend,
  };
}

/**
 * Compare trends
 */
export function compareTrends(
  trend1: Array<{ date: string; value: number }>,
  trend2: Array<{ date: string; value: number }>
): Array<{ date: string; value1: number; value2: number; difference: number }> {
  const result: Array<{ date: string; value1: number; value2: number; difference: number }> = [];

  const maxLength = Math.max(trend1.length, trend2.length);

  for (let i = 0; i < maxLength; i++) {
    const value1 = trend1[i]?.value || 0;
    const value2 = trend2[i]?.value || 0;
    const date = trend1[i]?.date || trend2[i]?.date || '';

    result.push({
      date,
      value1,
      value2,
      difference: value1 - value2,
    });
  }

  return result;
}

/**
 * Get trend correlation
 */
export function getTrendCorrelation(
  trend1: Array<{ value: number }>,
  trend2: Array<{ value: number }>
): number {
  const n = Math.min(trend1.length, trend2.length);

  if (n < 2) {
    return 0;
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const x = trend1[i].value;
    const y = trend2[i].value;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

/**
 * Get trend seasonality (placeholder)
 */
export async function getTrendSeasonality(
  metric: string,
  clinicId?: string
): Promise<{
  hasSeasonality: boolean;
  seasonalityPattern?: string;
  seasonalFactors?: number[];
}> {
  // Placeholder for seasonality analysis
  // In production, this would use statistical methods like STL decomposition
  return {
    hasSeasonality: false,
  };
}

/**
 * Get trend outliers
 */
export function getTrendOutliers(
  data: Array<{ date: string; value: number }>,
  threshold: number = 2
): Array<{ date: string; value: number; isOutlier: boolean; zScore: number }> {
  const values = data.map((d) => d.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return data.map((d) => {
    const zScore = stdDev > 0 ? (d.value - mean) / stdDev : 0;
    const isOutlier = Math.abs(zScore) > threshold;
    return {
      date: d.date,
      value: d.value,
      isOutlier,
      zScore,
    };
  });
}
