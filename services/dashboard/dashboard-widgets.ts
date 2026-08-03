import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { WidgetData, WidgetType } from './dashboard-types';
import { calculatePatientMetrics, calculateAppointmentMetrics, calculateRevenueMetrics, calculateLaboratoryMetrics, calculateBillingMetrics } from './dashboard-metrics';

// ============================================================================
// Dashboard Widgets
// Reusable widgets for dashboard display
// ============================================================================

/**
 * Get widget data by type
 */
export async function getWidgetData(
  widgetType: WidgetType,
  clinicId?: string,
  dateRange?: { start: string; end: string }
): Promise<WidgetData> {
  const targetClinicId = clinicId || await getUserClinicId();
  const now = new Date().toISOString();

  try {
    switch (widgetType) {
      case WidgetType.REVENUE:
        return await getRevenueWidget(targetClinicId, dateRange);
      case WidgetType.APPOINTMENTS:
        return await getAppointmentWidget(targetClinicId, dateRange);
      case WidgetType.PATIENTS:
        return await getPatientWidget(targetClinicId, dateRange);
      case WidgetType.DOCTORS:
        return await getDoctorWidget(targetClinicId);
      case WidgetType.LABORATORY:
        return await getLaboratoryWidget(targetClinicId, dateRange);
      case WidgetType.BILLING:
        return await getBillingWidget(targetClinicId);
      case WidgetType.PAYMENTS:
        return await getPaymentWidget(targetClinicId, dateRange);
      case WidgetType.NOTIFICATIONS:
        return await getNotificationWidget(targetClinicId);
      case WidgetType.CALENDAR:
        return await getCalendarWidget(targetClinicId, dateRange);
      case WidgetType.ACTIVITY:
        return await getActivityWidget(targetClinicId, dateRange);
      default:
        throw new Error(`Unknown widget type: ${widgetType}`);
    }
  } catch (error) {
    logger.error('Failed to get widget data', { error, widgetType, clinicId: targetClinicId });
    throw error;
  }
}

/**
 * Get multiple widgets
 */
export async function getMultipleWidgets(
  widgetTypes: WidgetType[],
  clinicId?: string,
  dateRange?: { start: string; end: string }
): Promise<WidgetData[]> {
  const widgets: WidgetData[] = [];

  for (const widgetType of widgetTypes) {
    try {
      const widget = await getWidgetData(widgetType, clinicId, dateRange);
      widgets.push(widget);
    } catch (error) {
      logger.error('Failed to get widget', { error, widgetType });
    }
  }

  return widgets;
}

/**
 * Revenue widget
 */
async function getRevenueWidget(clinicId: string, dateRange?: { start: string; end: string }): Promise<WidgetData> {
  const boundaries = dateRange || {
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    end: new Date().toISOString(),
  };

  const metrics = await calculateRevenueMetrics(clinicId, boundaries);

  return {
    type: WidgetType.REVENUE,
    title: 'Revenue',
    data: {
      total: metrics.find((m) => m.metric === 'total_revenue')?.value || 0,
      change: metrics.find((m) => m.metric === 'total_revenue')?.change || 0,
      changePercentage: metrics.find((m) => m.metric === 'total_revenue')?.changePercentage || 0,
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'payments',
    },
  };
}

/**
 * Appointment widget
 */
async function getAppointmentWidget(clinicId: string, dateRange?: { start: string; end: string }): Promise<WidgetData> {
  const boundaries = dateRange || {
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    end: new Date().toISOString(),
  };

  const metrics = await calculateAppointmentMetrics(clinicId, boundaries);

  return {
    type: WidgetType.APPOINTMENTS,
    title: 'Appointments',
    data: {
      total: metrics.find((m) => m.metric === 'total_appointments')?.value || 0,
      completed: metrics.find((m) => m.metric === 'completed_appointments')?.value || 0,
      cancelled: metrics.find((m) => m.metric === 'cancelled_appointments')?.value || 0,
      change: metrics.find((m) => m.metric === 'total_appointments')?.change || 0,
      changePercentage: metrics.find((m) => m.metric === 'total_appointments')?.changePercentage || 0,
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'appointments',
    },
  };
}

/**
 * Patient widget
 */
async function getPatientWidget(clinicId: string, dateRange?: { start: string; end: string }): Promise<WidgetData> {
  const boundaries = dateRange || {
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    end: new Date().toISOString(),
  };

  const metrics = await calculatePatientMetrics(clinicId, boundaries);

  return {
    type: WidgetType.PATIENTS,
    title: 'Patients',
    data: {
      new: metrics.find((m) => m.metric === 'new_patients')?.value || 0,
      total: metrics.find((m) => m.metric === 'total_patients')?.value || 0,
      change: metrics.find((m) => m.metric === 'new_patients')?.change || 0,
      changePercentage: metrics.find((m) => m.metric === 'new_patients')?.changePercentage || 0,
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'patients',
    },
  };
}

/**
 * Doctor widget
 */
async function getDoctorWidget(clinicId: string): Promise<WidgetData> {
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('id, status, specialization')
    .eq('clinic_id', clinicId);

  if (error) {
    throw error;
  }

  const active = doctors?.filter((d) => d.status === 'active').length || 0;
  const onLeave = doctors?.filter((d) => d.status === 'on_leave').length || 0;

  return {
    type: WidgetType.DOCTORS,
    title: 'Doctors',
    data: {
      total: doctors?.length || 0,
      active,
      onLeave,
      bySpecialization: groupBy(doctors || [], 'specialization'),
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'doctors',
    },
  };
}

/**
 * Laboratory widget
 */
async function getLaboratoryWidget(clinicId: string, dateRange?: { start: string; end: string }): Promise<WidgetData> {
  const boundaries = dateRange || {
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    end: new Date().toISOString(),
  };

  const metrics = await calculateLaboratoryMetrics(clinicId, boundaries);

  return {
    type: WidgetType.LABORATORY,
    title: 'Laboratory',
    data: {
      totalTests: metrics.find((m) => m.metric === 'total_tests')?.value || 0,
      pendingResults: metrics.find((m) => m.metric === 'pending_results')?.value || 0,
      criticalResults: metrics.find((m) => m.metric === 'critical_results')?.value || 0,
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'laboratory_tests',
    },
  };
}

/**
 * Billing widget
 */
async function getBillingWidget(clinicId: string): Promise<WidgetData> {
  const metrics = await calculateBillingMetrics(clinicId);

  return {
    type: WidgetType.BILLING,
    title: 'Billing',
    data: {
      outstandingInvoices: metrics.find((m) => m.metric === 'outstanding_invoices_count')?.value || 0,
      outstandingAmount: metrics.find((m) => m.metric === 'outstanding_amount')?.value || 0,
      pendingPayments: metrics.find((m) => m.metric === 'pending_payments')?.value || 0,
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'invoices',
    },
  };
}

/**
 * Payment widget
 */
async function getPaymentWidget(clinicId: string, dateRange?: { start: string; end: string }): Promise<WidgetData> {
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const boundaries = dateRange || {
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    end: new Date().toISOString(),
  };

  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount, status, payment_method')
    .eq('clinic_id', clinicId)
    .gte('created_at', boundaries.start)
    .lte('created_at', boundaries.end);

  if (error) {
    throw error;
  }

  const completed = payments?.filter((p) => p.status === 'completed').length || 0;
  const pending = payments?.filter((p) => p.status === 'pending').length || 0;
  const failed = payments?.filter((p) => p.status === 'failed').length || 0;
  const totalAmount = payments?.filter((p) => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return {
    type: WidgetType.PAYMENTS,
    title: 'Payments',
    data: {
      total: payments?.length || 0,
      completed,
      pending,
      failed,
      totalAmount,
      byMethod: groupBy(payments || [], 'payment_method'),
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'payments',
    },
  };
}

/**
 * Notification widget
 */
async function getNotificationWidget(clinicId: string): Promise<WidgetData> {
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const { count: total, error: totalError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('clinic_id', clinicId)
    .is('deleted_at', null);

  if (totalError) {
    throw totalError;
  }

  const { count: unread, error: unreadError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('clinic_id', clinicId)
    .in('status', ['sent', 'delivered']);

  if (unreadError) {
    throw unreadError;
  }

  return {
    type: WidgetType.NOTIFICATIONS,
    title: 'Notifications',
    data: {
      total: total || 0,
      unread: unread || 0,
      read: (total || 0) - (unread || 0),
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'notifications',
    },
  };
}

/**
 * Calendar widget
 */
async function getCalendarWidget(clinicId: string, dateRange?: { start: string; end: string }): Promise<WidgetData> {
  const { getSupabaseClient } = await import('../core/client');
  const supabase = getSupabaseClient();

  const boundaries = dateRange || {
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
    end: new Date().toISOString(),
  };

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('id, patient_id, doctor_id, appointment_date, appointment_time, status')
    .eq('clinic_id', clinicId)
    .gte('appointment_date', boundaries.start)
    .lte('appointment_date', boundaries.end)
    .order('appointment_date', { ascending: true });

  if (error) {
    throw error;
  }

  return {
    type: WidgetType.CALENDAR,
    title: 'Calendar',
    data: {
      appointments: appointments || [],
      count: appointments?.length || 0,
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'appointments',
    },
  };
}

/**
 * Activity widget
 */
async function getActivityWidget(clinicId: string, dateRange?: { start: string; end: string }): Promise<WidgetData> {
  const { getActivityFeed } = await import('./dashboard-activity');

  const boundaries = dateRange || {
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
    end: new Date().toISOString(),
  };

  const activities = await getActivityFeed(clinicId, boundaries, 10);

  return {
    type: WidgetType.ACTIVITY,
    title: 'Recent Activity',
    data: {
      activities,
      count: activities.length,
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: 'activity_feed',
    },
  };
}

/**
 * Helper function to group array by key
 */
function groupBy<T>(array: T[], key: keyof T): Record<string, number> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key] || 'unknown');
    result[groupKey] = (result[groupKey] || 0) + 1;
    return result;
  }, {} as Record<string, number>);
}

/**
 * Get widget configuration
 */
export function getWidgetConfig(widgetType: WidgetType): {
  title: string;
  icon: string;
  color: string;
  refreshInterval: number;
} {
  const configs: Record<WidgetType, { title: string; icon: string; color: string; refreshInterval: number }> = {
    [WidgetType.REVENUE]: {
      title: 'Revenue',
      icon: 'dollar',
      color: 'green',
      refreshInterval: 300000, // 5 minutes
    },
    [WidgetType.APPOINTMENTS]: {
      title: 'Appointments',
      icon: 'calendar',
      color: 'blue',
      refreshInterval: 60000, // 1 minute
    },
    [WidgetType.PATIENTS]: {
      title: 'Patients',
      icon: 'users',
      color: 'purple',
      refreshInterval: 300000, // 5 minutes
    },
    [WidgetType.DOCTORS]: {
      title: 'Doctors',
      icon: 'stethoscope',
      color: 'cyan',
      refreshInterval: 600000, // 10 minutes
    },
    [WidgetType.LABORATORY]: {
      title: 'Laboratory',
      icon: 'flask',
      color: 'orange',
      refreshInterval: 120000, // 2 minutes
    },
    [WidgetType.BILLING]: {
      title: 'Billing',
      icon: 'file-invoice',
      color: 'yellow',
      refreshInterval: 300000, // 5 minutes
    },
    [WidgetType.PAYMENTS]: {
      title: 'Payments',
      icon: 'credit-card',
      color: 'emerald',
      refreshInterval: 120000, // 2 minutes
    },
    [WidgetType.NOTIFICATIONS]: {
      title: 'Notifications',
      icon: 'bell',
      color: 'red',
      refreshInterval: 30000, // 30 seconds
    },
    [WidgetType.CALENDAR]: {
      title: 'Calendar',
      icon: 'calendar-days',
      color: 'indigo',
      refreshInterval: 60000, // 1 minute
    },
    [WidgetType.ACTIVITY]: {
      title: 'Activity',
      icon: 'activity',
      color: 'gray',
      refreshInterval: 60000, // 1 minute
    },
  };

  return configs[widgetType];
}
