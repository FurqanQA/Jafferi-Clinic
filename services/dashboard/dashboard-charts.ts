import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { ChartData, ChartType, ChartDataPoint, ChartDataSeries } from './dashboard-types';

// ============================================================================
// Dashboard Charts
// Return chart-ready data for various visualizations
// ============================================================================

/**
 * Get chart data by type
 */
export async function getChartData(
  chartType: ChartType,
  metric: string,
  clinicId?: string,
  dateRange?: { start: string; end: string }
): Promise<ChartData> {
  const targetClinicId = clinicId || await getUserClinicId();

  try {
    switch (chartType) {
      case ChartType.LINE:
        return await getLineChart(metric, targetClinicId, dateRange);
      case ChartType.BAR:
        return await getBarChart(metric, targetClinicId, dateRange);
      case ChartType.AREA:
        return await getAreaChart(metric, targetClinicId, dateRange);
      case ChartType.PIE:
        return await getPieChart(metric, targetClinicId, dateRange);
      case ChartType.DONUT:
        return await getDonutChart(metric, targetClinicId, dateRange);
      case ChartType.STACKED:
        return await getStackedChart(metric, targetClinicId, dateRange);
      case ChartType.TREND:
        return await getTrendChart(metric, targetClinicId, dateRange);
      case ChartType.HEATMAP:
        return await getHeatmapChart(metric, targetClinicId, dateRange);
      default:
        throw new Error(`Unknown chart type: ${chartType}`);
    }
  } catch (error) {
    logger.error('Failed to get chart data', { error, chartType, metric, clinicId: targetClinicId });
    throw error;
  }
}

/**
 * Get revenue chart data
 */
export async function getRevenueChart(
  clinicId?: string,
  dateRange?: { start: string; end: string }
): Promise<ChartData> {
  const targetClinicId = clinicId || await getUserClinicId();
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const boundaries = dateRange || {
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    end: new Date().toISOString(),
  };

  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount, created_at')
    .eq('clinic_id', targetClinicId)
    .eq('status', 'completed')
    .gte('created_at', boundaries.start)
    .lte('created_at', boundaries.end)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  // Group by date
  const groupedByDate = groupByDate(payments || [], 'created_at', (p) => p.amount || 0);

  const dataPoints: ChartDataPoint[] = Object.entries(groupedByDate).map(([date, value]) => ({
    label: date,
    value,
  }));

  return {
    type: ChartType.LINE,
    title: 'Revenue Trend',
    series: [
      {
        name: 'Revenue',
        data: dataPoints,
        color: '#10b981',
      },
    ],
    xAxis: {
      label: 'Date',
      type: 'time',
    },
    yAxis: {
      label: 'Revenue',
      format: 'currency',
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'payments',
    },
  };
}

/**
 * Get appointments chart data
 */
export async function getAppointmentsChart(
  clinicId?: string,
  dateRange?: { start: string; end: string }
): Promise<ChartData> {
  const targetClinicId = clinicId || await getUserClinicId();
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const boundaries = dateRange || {
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    end: new Date().toISOString(),
  };

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('appointment_date, status')
    .eq('clinic_id', targetClinicId)
    .gte('appointment_date', boundaries.start)
    .lte('appointment_date', boundaries.end)
    .order('appointment_date', { ascending: true });

  if (error) {
    throw error;
  }

  // Group by date and status
  const completedByDate = groupByDate(
    appointments?.filter((a) => a.status === 'completed') || [],
    'appointment_date',
    () => 1
  );
  const cancelledByDate = groupByDate(
    appointments?.filter((a) => a.status === 'cancelled') || [],
    'appointment_date',
    () => 1
  );
  const allDates = new Set([...Object.keys(completedByDate), ...Object.keys(cancelledByDate)]);

  const completedData: ChartDataPoint[] = Array.from(allDates).map((date) => ({
    label: date,
    value: completedByDate[date] || 0,
  }));

  const cancelledData: ChartDataPoint[] = Array.from(allDates).map((date) => ({
    label: date,
    value: cancelledByDate[date] || 0,
  }));

  return {
    type: ChartType.STACKED,
    title: 'Appointments by Status',
    series: [
      {
        name: 'Completed',
        data: completedData,
        color: '#10b981',
      },
      {
        name: 'Cancelled',
        data: cancelledData,
        color: '#ef4444',
      },
    ],
    xAxis: {
      label: 'Date',
      type: 'time',
    },
    yAxis: {
      label: 'Count',
      format: 'number',
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'appointments',
    },
  };
}

/**
 * Get patients chart data
 */
export async function getPatientsChart(
  clinicId?: string,
  dateRange?: { start: string; end: string }
): Promise<ChartData> {
  const targetClinicId = clinicId || await getUserClinicId();
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const boundaries = dateRange || {
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    end: new Date().toISOString(),
  };

  const { data: patients, error } = await supabase
    .from('patients')
    .select('created_at')
    .eq('clinic_id', targetClinicId)
    .gte('created_at', boundaries.start)
    .lte('created_at', boundaries.end)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  // Group by date
  const groupedByDate = groupByDate(patients || [], 'created_at', () => 1);

  const dataPoints: ChartDataPoint[] = Object.entries(groupedByDate).map(([date, value]) => ({
    label: date,
    value,
  }));

  return {
    type: ChartType.AREA,
    title: 'Patient Registrations',
    series: [
      {
        name: 'New Patients',
        data: dataPoints,
        color: '#3b82f6',
      },
    ],
    xAxis: {
      label: 'Date',
      type: 'time',
    },
    yAxis: {
      label: 'Count',
      format: 'number',
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'patients',
    },
  };
}

/**
 * Get payments chart data
 */
export async function getPaymentsChart(
  clinicId?: string,
  dateRange?: { start: string; end: string }
): Promise<ChartData> {
  const targetClinicId = clinicId || await getUserClinicId();
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const boundaries = dateRange || {
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    end: new Date().toISOString(),
  };

  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount, payment_method, created_at')
    .eq('clinic_id', targetClinicId)
    .eq('status', 'completed')
    .gte('created_at', boundaries.start)
    .lte('created_at', boundaries.end);

  if (error) {
    throw error;
  }

  // Group by payment method
  const groupedByMethod = (payments || []).reduce((acc, payment) => {
    const method = payment.payment_method || 'unknown';
    acc[method] = (acc[method] || 0) + (payment.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const dataPoints: ChartDataPoint[] = Object.entries(groupedByMethod).map(([method, value]) => ({
    label: method,
    value,
  }));

  return {
    type: ChartType.PIE,
    title: 'Payments by Method',
    series: [
      {
        name: 'Payment Methods',
        data: dataPoints,
        color: '#8b5cf6',
      },
    ],
    xAxis: {
      label: 'Method',
      type: 'category',
    },
    yAxis: {
      label: 'Amount',
      format: 'currency',
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'payments',
    },
  };
}

/**
 * Get doctors chart data
 */
export async function getDoctorsChart(clinicId?: string): Promise<ChartData> {
  const targetClinicId = clinicId || await getUserClinicId();
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('specialization, status')
    .eq('clinic_id', targetClinicId);

  if (error) {
    throw error;
  }

  // Group by specialization
  const groupedBySpecialization = (doctors || []).reduce((acc, doctor) => {
    const spec = doctor.specialization || 'General';
    acc[spec] = (acc[spec] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dataPoints: ChartDataPoint[] = Object.entries(groupedBySpecialization).map(([spec, value]) => ({
    label: spec,
    value,
  }));

  return {
    type: ChartType.BAR,
    title: 'Doctors by Specialization',
    series: [
      {
        name: 'Doctors',
        data: dataPoints,
        color: '#06b6d4',
      },
    ],
    xAxis: {
      label: 'Specialization',
      type: 'category',
    },
    yAxis: {
      label: 'Count',
      format: 'number',
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'doctors',
    },
  };
}

/**
 * Get lab tests chart data
 */
export async function getLabTestsChart(
  clinicId?: string,
  dateRange?: { start: string; end: string }
): Promise<ChartData> {
  const targetClinicId = clinicId || await getUserClinicId();
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const boundaries = dateRange || {
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    end: new Date().toISOString(),
  };

  const { data: tests, error } = await supabase
    .from('laboratory_tests')
    .select('test_name, status, created_at')
    .eq('clinic_id', targetClinicId)
    .gte('created_at', boundaries.start)
    .lte('created_at', boundaries.end);

  if (error) {
    throw error;
  }

  // Group by status
  const groupedByStatus = (tests || []).reduce((acc, test) => {
    const status = test.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dataPoints: ChartDataPoint[] = Object.entries(groupedByStatus).map(([status, value]) => ({
    label: status,
    value,
  }));

  return {
    type: ChartType.DONUT,
    title: 'Lab Tests by Status',
    series: [
      {
        name: 'Test Status',
        data: dataPoints,
        color: '#f59e0b',
      },
    ],
    xAxis: {
      label: 'Status',
      type: 'category',
    },
    yAxis: {
      label: 'Count',
      format: 'number',
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'laboratory_tests',
    },
  };
}

/**
 * Get prescription trends chart data
 */
export async function getPrescriptionTrendsChart(
  clinicId?: string,
  dateRange?: { start: string; end: string }
): Promise<ChartData> {
  const targetClinicId = clinicId || await getUserClinicId();
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const boundaries = dateRange || {
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    end: new Date().toISOString(),
  };

  const { data: prescriptions, error } = await supabase
    .from('prescriptions')
    .select('created_at')
    .eq('clinic_id', targetClinicId)
    .gte('created_at', boundaries.start)
    .lte('created_at', boundaries.end)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  // Group by date
  const groupedByDate = groupByDate(prescriptions || [], 'created_at', () => 1);

  const dataPoints: ChartDataPoint[] = Object.entries(groupedByDate).map(([date, value]) => ({
    label: date,
    value,
  }));

  return {
    type: ChartType.TREND,
    title: 'Prescription Trends',
    series: [
      {
        name: 'Prescriptions',
        data: dataPoints,
        color: '#ec4899',
      },
    ],
    xAxis: {
      label: 'Date',
      type: 'time',
    },
    yAxis: {
      label: 'Count',
      format: 'number',
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'prescriptions',
    },
  };
}

/**
 * Helper function to group array by date
 */
function groupByDate<T>(
  array: T[],
  dateField: keyof T,
  valueExtractor: (item: T) => number
): Record<string, number> {
  return array.reduce((acc, item) => {
    const dateStr = String(item[dateField]).split('T')[0];
    acc[dateStr] = (acc[dateStr] || 0) + valueExtractor(item);
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Get line chart
 */
async function getLineChart(
  metric: string,
  clinicId: string,
  dateRange?: { start: string; end: string }
): Promise<ChartData> {
  switch (metric) {
    case 'revenue':
      return await getRevenueChart(clinicId, dateRange);
    case 'patients':
      return await getPatientsChart(clinicId, dateRange);
    case 'prescriptions':
      return await getPrescriptionTrendsChart(clinicId, dateRange);
    default:
      throw new Error(`Unknown metric for line chart: ${metric}`);
  }
}

/**
 * Get bar chart
 */
async function getBarChart(
  metric: string,
  clinicId: string,
  dateRange?: { start: string; end: string }
): Promise<ChartData> {
  switch (metric) {
    case 'doctors':
      return await getDoctorsChart(clinicId);
    default:
      throw new Error(`Unknown metric for bar chart: ${metric}`);
  }
}

/**
 * Get area chart
 */
async function getAreaChart(
  metric: string,
  clinicId: string,
  dateRange?: { start: string; end: string }
): Promise<ChartData> {
  switch (metric) {
    case 'patients':
      return await getPatientsChart(clinicId, dateRange);
    default:
      throw new Error(`Unknown metric for area chart: ${metric}`);
  }
}

/**
 * Get pie chart
 */
async function getPieChart(
  metric: string,
  clinicId: string,
  dateRange?: { start: string; end: string }
): Promise<ChartData> {
  switch (metric) {
    case 'payments':
      return await getPaymentsChart(clinicId, dateRange);
    default:
      throw new Error(`Unknown metric for pie chart: ${metric}`);
  }
}

/**
 * Get donut chart
 */
async function getDonutChart(
  metric: string,
  clinicId: string,
  dateRange?: { start: string; end: string }
): Promise<ChartData> {
  switch (metric) {
    case 'lab_tests':
      return await getLabTestsChart(clinicId, dateRange);
    default:
      throw new Error(`Unknown metric for donut chart: ${metric}`);
  }
}

/**
 * Get stacked chart
 */
async function getStackedChart(
  metric: string,
  clinicId: string,
  dateRange?: { start: string; end: string }
): Promise<ChartData> {
  switch (metric) {
    case 'appointments':
      return await getAppointmentsChart(clinicId, dateRange);
    default:
      throw new Error(`Unknown metric for stacked chart: ${metric}`);
  }
}

/**
 * Get trend chart
 */
async function getTrendChart(
  metric: string,
  clinicId: string,
  dateRange?: { start: string; end: string }
): Promise<ChartData> {
  switch (metric) {
    case 'prescriptions':
      return await getPrescriptionTrendsChart(clinicId, dateRange);
    default:
      throw new Error(`Unknown metric for trend chart: ${metric}`);
  }
}

/**
 * Get heatmap chart (placeholder)
 */
async function getHeatmapChart(
  metric: string,
  clinicId: string,
  dateRange?: { start: string; end: string }
): Promise<ChartData> {
  // Placeholder for heatmap chart
  return {
    type: ChartType.HEATMAP,
    title: `${metric} Heatmap`,
    series: [],
    xAxis: {
      label: 'X Axis',
      type: 'category',
    },
    yAxis: {
      label: 'Y Axis',
      format: 'number',
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'placeholder',
    },
  };
}
