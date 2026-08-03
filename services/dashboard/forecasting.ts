import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { calculatePatientMetrics, calculateAppointmentMetrics, calculateRevenueMetrics } from './dashboard-metrics';

// ============================================================================
// Forecasting
// Predict future values based on historical data
// ============================================================================

/**
 * Forecast metric using simple moving average
 */
export async function forecastMetric(
  metric: string,
  clinicId?: string,
  days: number = 30,
  forecastDays: number = 7
): Promise<Array<{ date: string; predicted: number; confidence: 'high' | 'medium' | 'low' }>> {
  const targetClinicId = clinicId || await getUserClinicId();

  try {
    const historicalData: Array<{ date: string; value: number }> = [];

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

      historicalData.push({
        date: date.toISOString().split('T')[0],
        value,
      });
    }

    const forecast: Array<{ date: string; predicted: number; confidence: 'high' | 'medium' | 'low' }> = [];

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);

      const window = Math.min(7, historicalData.length);
      const recentData = historicalData.slice(-window);
      const average = recentData.reduce((sum, d) => sum + d.value, 0) / recentData.length;

      const variance = recentData.reduce((sum, d) => sum + Math.pow(d.value - average, 2), 0) / recentData.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / (average || 1);

      let confidence: 'high' | 'medium' | 'low' = 'medium';
      if (coefficientOfVariation < 0.2) {
        confidence = 'high';
      } else if (coefficientOfVariation > 0.5) {
        confidence = 'low';
      }

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predicted: Math.round(average),
        confidence,
      });
    }

    return forecast;
  } catch (error) {
    logger.error('Failed to forecast metric', { error, metric, clinicId: targetClinicId });
    throw error;
  }
}

/**
 * Forecast using linear regression
 */
export function forecastLinearRegression(
  data: Array<{ date: string; value: number }>,
  forecastDays: number = 7
): Array<{ date: string; predicted: number }> {
  if (data.length < 2) {
    const lastDate = data.length > 0 ? new Date(data[data.length - 1].date) : new Date();
    const lastValue = data.length > 0 ? data[data.length - 1].value : 0;

    return Array.from({ length: forecastDays }, (_, i) => {
      const date = new Date(lastDate);
      date.setDate(date.getDate() + i + 1);
      return {
        date: date.toISOString().split('T')[0],
        predicted: lastValue,
      };
    });
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

  const forecast: Array<{ date: string; predicted: number }> = [];
  const lastDate = new Date(data[data.length - 1].date);

  for (let i = 1; i <= forecastDays; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);
    const predicted = slope * (n + i - 1) + intercept;

    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      predicted: Math.max(0, Math.round(predicted)),
    });
  }

  return forecast;
}

/**
 * Forecast using exponential smoothing
 */
export function forecastExponentialSmoothing(
  data: Array<{ value: number }>,
  alpha: number = 0.3,
  forecastDays: number = 7
): Array<{ predicted: number }> {
  if (data.length === 0) {
    return Array.from({ length: forecastDays }, () => ({ predicted: 0 }));
  }

  let smoothed = data[0].value;

  for (let i = 1; i < data.length; i++) {
    smoothed = alpha * data[i].value + (1 - alpha) * smoothed;
  }

  return Array.from({ length: forecastDays }, () => ({
    predicted: Math.round(smoothed),
  }));
}

/**
 * Get forecast summary
 */
export async function getForecastSummary(
  clinicId?: string,
  forecastDays: number = 7
): Promise<{
  patients: Array<{ date: string; predicted: number; confidence: 'high' | 'medium' | 'low' }>;
  appointments: Array<{ date: string; predicted: number; confidence: 'high' | 'medium' | 'low' }>;
  revenue: Array<{ date: string; predicted: number; confidence: 'high' | 'medium' | 'low' }>;
}> {
  const [patientForecast, appointmentForecast, revenueForecast] = await Promise.all([
    forecastMetric('patients', clinicId, 30, forecastDays),
    forecastMetric('appointments', clinicId, 30, forecastDays),
    forecastMetric('revenue', clinicId, 30, forecastDays),
  ]);

  return {
    patients: patientForecast,
    appointments: appointmentForecast,
    revenue: revenueForecast,
  };
}

/**
 * Get forecast accuracy (placeholder)
 */
export function getForecastAccuracy(
  actual: Array<{ date: string; value: number }>,
  predicted: Array<{ date: string; predicted: number }>
): {
  mae: number;
  mse: number;
  rmse: number;
  mape: number;
} {
  const n = Math.min(actual.length, predicted.length);

  if (n === 0) {
    return { mae: 0, mse: 0, rmse: 0, mape: 0 };
  }

  let sumError = 0;
  let sumSquaredError = 0;
  let sumPercentageError = 0;

  for (let i = 0; i < n; i++) {
    const error = actual[i].value - predicted[i].predicted;
    sumError += Math.abs(error);
    sumSquaredError += error * error;

    if (actual[i].value !== 0) {
      sumPercentageError += Math.abs(error / actual[i].value);
    }
  }

  const mae = sumError / n;
  const mse = sumSquaredError / n;
  const rmse = Math.sqrt(mse);
  const mape = (sumPercentageError / n) * 100;

  return { mae, mse, rmse, mape };
}

/**
 * Get forecast confidence interval
 */
export function getForecastConfidenceInterval(
  data: Array<{ value: number }>,
  forecast: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  const mean = data.reduce((sum, d) => sum + d.value, 0) / data.length;
  const variance = data.reduce((sum, d) => sum + Math.pow(d.value - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);

  const zScore = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.99 ? 2.58 : 1.645;
  const marginOfError = zScore * stdDev;

  return {
    lower: Math.max(0, Math.round(forecast - marginOfError)),
    upper: Math.round(forecast + marginOfError),
  };
}

/**
 * Get forecast trend
 */
export function getForecastTrend(
  forecast: Array<{ predicted: number }>
): 'increasing' | 'decreasing' | 'stable' {
  if (forecast.length < 2) {
    return 'stable';
  }

  const first = forecast[0].predicted;
  const last = forecast[forecast.length - 1].predicted;
  const change = last - first;
  const threshold = first * 0.1;

  if (change > threshold) {
    return 'increasing';
  } else if (change < -threshold) {
    return 'decreasing';
  }

  return 'stable';
}
