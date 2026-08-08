import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { DateRange, DashboardSummary } from './dashboard-types';
import {
  calculatePatientMetrics,
  calculateAppointmentMetrics,
  calculateRevenueMetrics,
  calculateLaboratoryMetrics,
  calculateBillingMetrics,
  getPreviousDateRange,
} from './dashboard-metrics';
import { getAlerts } from './dashboard-alerts';
import { getActivityFeed } from './dashboard-activity';

// ============================================================================
// Dashboard Summary
// Generate concise summaries for every dashboard
// ============================================================================

/**
 * Generate dashboard summary
 */
export async function generateDashboardSummary(
  dateRange: DateRange,
  startDate?: string,
  endDate?: string
): Promise<DashboardSummary> {
  const clinicId = await getUserClinicId();

  try {
    // Get date range boundaries
    const boundaries = getDateRangeBoundaries(dateRange, startDate, endDate);
    const previousBoundaries = getPreviousDateRange(dateRange, startDate, endDate);

    // Fetch metrics in parallel
    const [patientMetrics, appointmentMetrics, revenueMetrics, laboratoryMetrics, billingMetrics, alerts, activity] =
      await Promise.all([
        calculatePatientMetrics(clinicId, boundaries, previousBoundaries || undefined),
        calculateAppointmentMetrics(clinicId, boundaries, previousBoundaries || undefined),
        calculateRevenueMetrics(clinicId, boundaries, previousBoundaries || undefined),
        calculateLaboratoryMetrics(clinicId, boundaries),
        calculateBillingMetrics(clinicId),
        getAlerts(clinicId),
        getActivityFeed(clinicId, boundaries, 10),
      ]);

    // Compile metrics
    const metrics: Record<string, any> = {};

    patientMetrics.forEach((m) => {
      metrics[m.metric] = {
        value: m.value,
        previousValue: m.previousValue,
        change: m.change,
        changePercentage: m.changePercentage,
      };
    });

    appointmentMetrics.forEach((m) => {
      metrics[m.metric] = {
        value: m.value,
        previousValue: m.previousValue,
        change: m.change,
        changePercentage: m.changePercentage,
      };
    });

    revenueMetrics.forEach((m) => {
      metrics[m.metric] = {
        value: m.value,
        previousValue: m.previousValue,
        change: m.change,
        changePercentage: m.changePercentage,
      };
    });

    laboratoryMetrics.forEach((m) => {
      metrics[m.metric] = {
        value: m.value,
      };
    });

    billingMetrics.forEach((m) => {
      metrics[m.metric] = {
        value: m.value,
      };
    });

    const summary: DashboardSummary = {
      period: dateRange,
      startDate: boundaries.start,
      endDate: boundaries.end,
      metrics,
      kpis: generateKPICards(metrics),
      alerts,
      recentActivity: activity,
      generatedAt: new Date().toISOString(),
    };

    logger.info('Dashboard summary generated', { clinicId, dateRange });
    return summary;
  } catch (error) {
    logger.error('Failed to generate dashboard summary', { error, clinicId });
    throw error;
  }
}

/**
 * Get date range boundaries
 */
function getDateRangeBoundaries(
  dateRange: DateRange,
  startDate?: string,
  endDate?: string
): { start: string; end: string } {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const dayOfWeek = now.getDay();
  const currentQuarter = Math.floor(now.getMonth() / 3);

  switch (dateRange) {
    case DateRange.TODAY:
      return { start: startOfDay.toISOString(), end: endOfDay.toISOString() };

    case DateRange.YESTERDAY:
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        start: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0).toISOString(),
        end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999).toISOString(),
      };

    case DateRange.THIS_WEEK:
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      return { start: startOfWeek.toISOString(), end: endOfDay.toISOString() };

    case DateRange.LAST_WEEK:
      const lastWeekEnd = new Date(now);
      lastWeekEnd.setDate(now.getDate() - dayOfWeek - 1);
      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
      return {
        start: new Date(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate(), 0, 0, 0, 0).toISOString(),
        end: new Date(lastWeekEnd.getFullYear(), lastWeekEnd.getMonth(), lastWeekEnd.getDate(), 23, 59, 59, 999).toISOString(),
      };

    case DateRange.THIS_MONTH:
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { start: startOfMonth.toISOString(), end: endOfDay.toISOString() };

    case DateRange.LAST_MONTH:
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start: lastMonthStart.toISOString(), end: lastMonthEnd.toISOString() };

    case DateRange.THIS_QUARTER:
      const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1, 0, 0, 0, 0);
      return { start: startOfQuarter.toISOString(), end: endOfDay.toISOString() };

    case DateRange.LAST_QUARTER:
      const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
      const lastQuarterYear = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const startOfLastQuarter = new Date(lastQuarterYear, lastQuarter * 3, 1, 0, 0, 0, 0);
      const endOfLastQuarter = new Date(lastQuarterYear, lastQuarter * 3 + 2, 31, 23, 59, 59, 999);
      return { start: startOfLastQuarter.toISOString(), end: endOfLastQuarter.toISOString() };

    case DateRange.THIS_YEAR:
      const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      return { start: startOfYear.toISOString(), end: endOfDay.toISOString() };

    case DateRange.LAST_YEAR:
      const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return { start: startOfLastYear.toISOString(), end: endOfLastYear.toISOString() };

    case DateRange.CUSTOM:
      if (startDate && endDate) {
        return { start: startDate, end: endDate };
      }
      return { start: startOfDay.toISOString(), end: endOfDay.toISOString() };

    default:
      return { start: startOfDay.toISOString(), end: endOfDay.toISOString() };
  }
}

/**
 * Generate KPI cards from metrics
 */
function generateKPICards(metrics: Record<string, any>): any[] {
  const kpis = [];

  // Revenue KPI
  if (metrics.total_revenue) {
    kpis.push({
      id: 'revenue',
      title: 'Total Revenue',
      value: metrics.total_revenue.value,
      previousValue: metrics.total_revenue.previousValue,
      change: metrics.total_revenue.change,
      changeType: metrics.total_revenue.change >= 0 ? 'increase' : 'decrease',
      format: 'currency',
      icon: 'dollar',
      color: 'green',
    });
  }

  // Patients KPI
  if (metrics.new_patients) {
    kpis.push({
      id: 'patients',
      title: 'New Patients',
      value: metrics.new_patients.value,
      previousValue: metrics.new_patients.previousValue,
      change: metrics.new_patients.change,
      changeType: metrics.new_patients.change >= 0 ? 'increase' : 'decrease',
      format: 'number',
      icon: 'users',
      color: 'blue',
    });
  }

  // Appointments KPI
  if (metrics.total_appointments) {
    kpis.push({
      id: 'appointments',
      title: 'Total Appointments',
      value: metrics.total_appointments.value,
      previousValue: metrics.total_appointments.previousValue,
      change: metrics.total_appointments.change,
      changeType: metrics.total_appointments.change >= 0 ? 'increase' : 'decrease',
      format: 'number',
      icon: 'calendar',
      color: 'purple',
    });
  }

  // Outstanding Invoices KPI
  if (metrics.outstanding_amount) {
    kpis.push({
      id: 'outstanding',
      title: 'Outstanding Amount',
      value: metrics.outstanding_amount.value,
      format: 'currency',
      icon: 'file-invoice',
      color: 'orange',
    });
  }

  // Pending Lab Results KPI
  if (metrics.pending_results) {
    kpis.push({
      id: 'pending_lab',
      title: 'Pending Lab Results',
      value: metrics.pending_results.value,
      format: 'number',
      icon: 'flask',
      color: 'yellow',
    });
  }

  // Critical Results KPI
  if (metrics.critical_results && metrics.critical_results.value > 0) {
    kpis.push({
      id: 'critical_lab',
      title: 'Critical Results',
      value: metrics.critical_results.value,
      format: 'number',
      icon: 'alert',
      color: 'red',
    });
  }

  return kpis;
}

/**
 * Generate summary text
 */
export function generateSummaryText(summary: DashboardSummary): string {
  const parts: string[] = [];

  if (summary.metrics.new_patients) {
    const patientChange = summary.metrics.new_patients.changePercentage || 0;
    const patientText = patientChange >= 0 ? 'increased' : 'decreased';
    parts.push(
      `${Math.abs(summary.metrics.new_patients.value)} new patients (${patientText} by ${Math.abs(patientChange).toFixed(1)}%)`
    );
  }

  if (summary.metrics.total_appointments) {
    const appointmentChange = summary.metrics.total_appointments.changePercentage || 0;
    const appointmentText = appointmentChange >= 0 ? 'increased' : 'decreased';
    parts.push(
      `${Math.abs(summary.metrics.total_appointments.value)} appointments (${appointmentText} by ${Math.abs(appointmentChange).toFixed(1)}%)`
    );
  }

  if (summary.metrics.total_revenue) {
    const revenueChange = summary.metrics.total_revenue.changePercentage || 0;
    const revenueText = revenueChange >= 0 ? 'increased' : 'decreased';
    parts.push(
      `$${Math.abs(summary.metrics.total_revenue.value).toFixed(2)} revenue (${revenueText} by ${Math.abs(revenueChange).toFixed(1)}%)`
    );
  }

  if (summary.metrics.critical_results && summary.metrics.critical_results.value > 0) {
    parts.push(`${summary.metrics.critical_results.value} critical lab results requiring attention`);
  }

  if (summary.metrics.outstanding_amount) {
    parts.push(`$${summary.metrics.outstanding_amount.value.toFixed(2)} outstanding in invoices`);
  }

  if (parts.length === 0) {
    return 'No data available for the selected period.';
  }

  return parts.join('. ');
}

/**
 * Get summary for specific role
 */
export async function getRoleSummary(role: string, dateRange: DateRange): Promise<DashboardSummary> {
  const summary = await generateDashboardSummary(dateRange);

  // Filter metrics based on role
  let roleMetrics: Record<string, any> = {};

  switch (role) {
    case 'owner':
      // Owner sees all metrics
      roleMetrics = { ...summary.metrics };
      break;

    case 'administrator':
      // Administrator sees operational metrics
      ['new_patients', 'total_appointments', 'completed_appointments', 'cancelled_appointments'].forEach((key) => {
        if (summary.metrics[key]) {
          roleMetrics[key] = summary.metrics[key];
        }
      });
      break;

    case 'doctor':
      // Doctor sees patient and appointment metrics
      ['new_patients', 'total_appointments', 'completed_appointments'].forEach((key) => {
        if (summary.metrics[key]) {
          roleMetrics[key] = summary.metrics[key];
        }
      });
      break;

    case 'accountant':
      // Accountant sees financial metrics
      ['total_revenue', 'outstanding_amount', 'outstanding_invoices_count'].forEach((key) => {
        if (summary.metrics[key]) {
          roleMetrics[key] = summary.metrics[key];
        }
      });
      break;

    case 'receptionist':
      // Receptionist sees appointment metrics
      ['total_appointments', 'completed_appointments', 'cancelled_appointments'].forEach((key) => {
        if (summary.metrics[key]) {
          roleMetrics[key] = summary.metrics[key];
        }
      });
      break;

    case 'patient':
      // Patient sees minimal metrics
      if (summary.metrics.total_appointments) {
        roleMetrics.total_appointments = summary.metrics.total_appointments;
      }
      break;

    default:
      roleMetrics = { ...summary.metrics };
  }

  return {
    ...summary,
    metrics: roleMetrics,
    kpis: generateKPICards(roleMetrics),
  };
}
