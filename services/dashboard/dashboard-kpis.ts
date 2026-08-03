import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { KPICard } from './dashboard-types';
import { calculatePatientMetrics, calculateAppointmentMetrics, calculateRevenueMetrics, calculateLaboratoryMetrics, calculateBillingMetrics } from './dashboard-metrics';
import { getAlerts } from './dashboard-alerts';

// ============================================================================
// Dashboard KPIs
// Generate KPI cards for dashboard display
// ============================================================================

/**
 * Get KPI cards for dashboard
 */
export async function getKPICards(
  clinicId?: string,
  dateRange?: { start: string; end: string }
): Promise<KPICard[]> {
  const targetClinicId = clinicId || await getUserClinicId();

  try {
    const boundaries = dateRange || {
      start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
      end: new Date().toISOString(),
    };

    const [patientMetrics, appointmentMetrics, revenueMetrics, laboratoryMetrics, billingMetrics, alerts] =
      await Promise.all([
        calculatePatientMetrics(targetClinicId, boundaries),
        calculateAppointmentMetrics(targetClinicId, boundaries),
        calculateRevenueMetrics(targetClinicId, boundaries),
        calculateLaboratoryMetrics(targetClinicId, boundaries),
        calculateBillingMetrics(targetClinicId),
        getAlerts(targetClinicId, 10),
      ]);

    const kpis: KPICard[] = [];

    // Revenue KPI
    const revenueMetric = revenueMetrics.find((m) => m.metric === 'total_revenue');
    if (revenueMetric) {
      kpis.push({
        id: 'revenue',
        title: 'Total Revenue',
        value: revenueMetric.value,
        previousValue: revenueMetric.previousValue,
        change: revenueMetric.change,
        changeType: (revenueMetric.change || 0) >= 0 ? 'increase' : 'decrease',
        format: 'currency',
        icon: 'dollar',
        color: 'green',
      });
    }

    // Patients KPI
    const patientMetric = patientMetrics.find((m) => m.metric === 'new_patients');
    if (patientMetric) {
      kpis.push({
        id: 'patients',
        title: 'New Patients',
        value: patientMetric.value,
        previousValue: patientMetric.previousValue,
        change: patientMetric.change,
        changeType: (patientMetric.change || 0) >= 0 ? 'increase' : 'decrease',
        format: 'number',
        icon: 'users',
        color: 'blue',
      });
    }

    // Appointments KPI
    const appointmentMetric = appointmentMetrics.find((m) => m.metric === 'total_appointments');
    if (appointmentMetric) {
      kpis.push({
        id: 'appointments',
        title: 'Total Appointments',
        value: appointmentMetric.value,
        previousValue: appointmentMetric.previousValue,
        change: appointmentMetric.change,
        changeType: (appointmentMetric.change || 0) >= 0 ? 'increase' : 'decrease',
        format: 'number',
        icon: 'calendar',
        color: 'purple',
      });
    }

    // Outstanding Payments KPI
    const outstandingMetric = billingMetrics.find((m) => m.metric === 'outstanding_amount');
    if (outstandingMetric) {
      kpis.push({
        id: 'outstanding',
        title: 'Outstanding Amount',
        value: outstandingMetric.value,
        format: 'currency',
        icon: 'file-invoice',
        color: 'orange',
      });
    }

    // Pending Lab Results KPI
    const pendingLabMetric = laboratoryMetrics.find((m) => m.metric === 'pending_results');
    if (pendingLabMetric) {
      kpis.push({
        id: 'pending_lab',
        title: 'Pending Lab Results',
        value: pendingLabMetric.value,
        format: 'number',
        icon: 'flask',
        color: 'yellow',
      });
    }

    // Critical Results KPI
    const criticalLabMetric = laboratoryMetrics.find((m) => m.metric === 'critical_results');
    if (criticalLabMetric && criticalLabMetric.value > 0) {
      kpis.push({
        id: 'critical_lab',
        title: 'Critical Results',
        value: criticalLabMetric.value,
        format: 'number',
        icon: 'alert',
        color: 'red',
      });
    }

    // Unread Notifications KPI
    const unreadAlerts = alerts.filter((a) => !a.isResolved).length;
    if (unreadAlerts > 0) {
      kpis.push({
        id: 'alerts',
        title: 'Active Alerts',
        value: unreadAlerts,
        format: 'number',
        icon: 'bell',
        color: 'red',
      });
    }

    return kpis;
  } catch (error) {
    logger.error('Failed to get KPI cards', { error, clinicId: targetClinicId });
    throw error;
  }
}

/**
 * Get KPI cards by role
 */
export async function getKPICardsByRole(
  role: string,
  clinicId?: string,
  dateRange?: { start: string; end: string }
): Promise<KPICard[]> {
  const allKPIs = await getKPICards(clinicId, dateRange);

  switch (role) {
    case 'owner':
      return allKPIs; // Owner sees all KPIs

    case 'administrator':
      return allKPIs.filter((kpi) => ['revenue', 'patients', 'appointments', 'alerts'].includes(kpi.id));

    case 'doctor':
      return allKPIs.filter((kpi) => ['patients', 'appointments', 'pending_lab', 'critical_lab'].includes(kpi.id));

    case 'accountant':
      return allKPIs.filter((kpi) => ['revenue', 'outstanding', 'alerts'].includes(kpi.id));

    case 'receptionist':
      return allKPIs.filter((kpi) => ['patients', 'appointments', 'alerts'].includes(kpi.id));

    case 'patient':
      return allKPIs.filter((kpi) => ['appointments'].includes(kpi.id));

    default:
      return allKPIs;
  }
}

/**
 * Get today's revenue KPI
 */
export async function getTodayRevenueKPI(clinicId?: string): Promise<KPICard> {
  const targetClinicId = clinicId || await getUserClinicId();
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).toISOString();
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount')
    .eq('clinic_id', targetClinicId)
    .eq('status', 'completed')
    .gte('created_at', startOfToday)
    .lte('created_at', endOfToday);

  if (error) {
    throw error;
  }

  const todayRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return {
    id: 'today_revenue',
    title: "Today's Revenue",
    value: todayRevenue,
    format: 'currency',
    icon: 'dollar',
    color: 'green',
  };
}

/**
 * Get today's patients KPI
 */
export async function getTodayPatientsKPI(clinicId?: string): Promise<KPICard> {
  const targetClinicId = clinicId || await getUserClinicId();
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).toISOString();
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

  const { count, error } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('clinic_id', targetClinicId)
    .gte('created_at', startOfToday)
    .lte('created_at', endOfToday);

  if (error) {
    throw error;
  }

  return {
    id: 'today_patients',
    title: "Today's Patients",
    value: count || 0,
    format: 'number',
    icon: 'users',
    color: 'blue',
  };
}

/**
 * Get today's appointments KPI
 */
export async function getTodayAppointmentsKPI(clinicId?: string): Promise<KPICard> {
  const targetClinicId = clinicId || await getUserClinicId();
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).toISOString();
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('clinic_id', targetClinicId)
    .gte('appointment_date', startOfToday)
    .lte('appointment_date', endOfToday);

  if (error) {
    throw error;
  }

  return {
    id: 'today_appointments',
    title: "Today's Appointments",
    value: count || 0,
    format: 'number',
    icon: 'calendar',
    color: 'purple',
  };
}

/**
 * Get doctors available KPI
 */
export async function getDoctorsAvailableKPI(clinicId?: string): Promise<KPICard> {
  const targetClinicId = clinicId || await getUserClinicId();
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from('doctors')
    .select('*', { count: 'exact', head: true })
    .eq('clinic_id', targetClinicId)
    .eq('status', 'active');

  if (error) {
    throw error;
  }

  return {
    id: 'doctors_available',
    title: 'Doctors Available',
    value: count || 0,
    format: 'number',
    icon: 'stethoscope',
    color: 'cyan',
  };
}

/**
 * Get outstanding payments KPI
 */
export async function getOutstandingPaymentsKPI(clinicId?: string): Promise<KPICard> {
  const targetClinicId = clinicId || await getUserClinicId();
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('total_amount')
    .eq('clinic_id', targetClinicId)
    .eq('status', 'pending');

  if (error) {
    throw error;
  }

  const outstandingAmount = invoices?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0;

  return {
    id: 'outstanding_payments',
    title: 'Outstanding Payments',
    value: outstandingAmount,
    format: 'currency',
    icon: 'file-invoice',
    color: 'orange',
  };
}

/**
 * Get unread notifications KPI
 */
export async function getUnreadNotificationsKPI(clinicId?: string, userId?: string): Promise<KPICard> {
  const targetClinicId = clinicId || await getUserClinicId();
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('clinic_id', targetClinicId)
    .in('status', ['sent', 'delivered']);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return {
    id: 'unread_notifications',
    title: 'Unread Notifications',
    value: count || 0,
    format: 'number',
    icon: 'bell',
    color: 'red',
  };
}

/**
 * Get pending prescriptions KPI
 */
export async function getPendingPrescriptionsKPI(clinicId?: string): Promise<KPICard> {
  const targetClinicId = clinicId || await getUserClinicId();
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from('prescriptions')
    .select('*', { count: 'exact', head: true })
    .eq('clinic_id', targetClinicId)
    .eq('status', 'pending');

  if (error) {
    throw error;
  }

  return {
    id: 'pending_prescriptions',
    title: 'Pending Prescriptions',
    value: count || 0,
    format: 'number',
    icon: 'prescription',
    color: 'indigo',
  };
}

/**
 * Get pending lab tests KPI
 */
export async function getPendingLabTestsKPI(clinicId?: string): Promise<KPICard> {
  const targetClinicId = clinicId || await getUserClinicId();
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from('laboratory_tests')
    .select('*', { count: 'exact', head: true })
    .eq('clinic_id', targetClinicId)
    .eq('status', 'pending');

  if (error) {
    throw error;
  }

  return {
    id: 'pending_lab_tests',
    title: 'Pending Lab Tests',
    value: count || 0,
    format: 'number',
    icon: 'flask',
    color: 'yellow',
  };
}

/**
 * Format KPI value for display
 */
export function formatKPIValue(value: number | string, format: KPICard['format']): string {
  if (typeof value === 'string') {
    return value;
  }

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);

    case 'percentage':
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value / 100);

    case 'duration':
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value % 3600) / 60);
      const seconds = Math.floor(value % 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }

    case 'number':
    default:
      return new Intl.NumberFormat('en-US').format(value);
  }
}

/**
 * Get KPI trend data
 */
export async function getKPITrend(
  kpiId: string,
  clinicId?: string,
  days: number = 30
): Promise<Array<{ date: string; value: number }>> {
  const targetClinicId = clinicId || await getUserClinicId();
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const trendData: Array<{ date: string; value: number }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).toISOString();
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).toISOString();

    let value = 0;

    switch (kpiId) {
      case 'revenue':
        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('clinic_id', targetClinicId)
          .eq('status', 'completed')
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay);
        value = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        break;

      case 'patients':
        const { count: patientCount } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('clinic_id', targetClinicId)
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay);
        value = patientCount || 0;
        break;

      case 'appointments':
        const { count: appointmentCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('clinic_id', targetClinicId)
          .gte('appointment_date', startOfDay)
          .lte('appointment_date', endOfDay);
        value = appointmentCount || 0;
        break;
    }

    trendData.push({
      date: date.toISOString().split('T')[0],
      value,
    });
  }

  return trendData;
}
