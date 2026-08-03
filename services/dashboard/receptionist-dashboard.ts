import { validateReceptionistDashboardAccess } from './dashboard-permissions';
import { getDashboardData } from './dashboard-engine';
import { DashboardRequestOptions, ReceptionistDashboardData } from './dashboard-types';
import { logger } from '../shared/logger';

// ============================================================================
// Receptionist Dashboard
// Dashboard specific to receptionists with appointment and patient metrics
// ============================================================================

/**
 * Get receptionist dashboard data
 */
export async function getReceptionistDashboard(
  options?: Partial<DashboardRequestOptions>
): Promise<ReceptionistDashboardData> {
  await validateReceptionistDashboardAccess();

  const dashboardOptions: DashboardRequestOptions = {
    role: 'receptionist' as any,
    dateRange: options?.dateRange,
    startDate: options?.startDate,
    endDate: options?.endDate,
    clinicId: options?.clinicId,
    includeWidgets: options?.includeWidgets,
    includeCharts: options?.includeCharts,
    cacheKey: options?.cacheKey,
    bypassCache: options?.bypassCache,
  };

  try {
    const response = await getDashboardData(dashboardOptions);

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch receptionist dashboard data');
    }

    const receptionistData: ReceptionistDashboardData = {
      summary: response.data.summary || {
        period: dashboardOptions.dateRange || 'today',
        startDate: dashboardOptions.startDate,
        endDate: dashboardOptions.endDate,
        metrics: response.data.metrics || {},
        kpis: response.data.kpis || [],
        alerts: response.data.alerts || [],
        recentActivity: response.data.recentActivity || [],
        generatedAt: new Date().toISOString(),
      },
      todayQueue: response.data.todayQueue || {
        checkIn: 0,
        waiting: 0,
        inProgress: 0,
        completed: 0,
      },
      walkInPatients: response.data.walkInPatients || 0,
      appointmentConfirmations: response.data.appointmentConfirmations || 0,
      pendingRegistrations: response.data.pendingRegistrations || 0,
      billingQueue: response.data.billingQueue || 0,
      todayCalendar: response.data.todayCalendar || [],
      upcomingAppointments: response.data.upcomingAppointments || [],
      newPatientRegistrations: response.data.newPatientRegistrations || 0,
      pendingPayments: response.data.pendingPayments || 0,
      pendingInvoices: response.data.pendingInvoices || 0,
      appointmentStatistics: response.data.appointmentStatistics || {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        cancelled: 0,
        noShow: 0,
      },
      notifications: response.data.notifications || {
        total: 0,
        unread: 0,
      },
      doctorAvailability: response.data.doctorAvailability || [],
      widgets: response.data.widgets || [],
      charts: response.data.charts || [],
      calendar: response.data.calendar || [],
      alerts: response.data.alerts || [],
      activity: response.data.activity || [],
    };

    logger.info('Receptionist dashboard data fetched successfully');
    return receptionistData;
  } catch (error) {
    logger.error('Failed to get receptionist dashboard', { error });
    throw error;
  }
}

/**
 * Get receptionist dashboard summary
 */
export async function getReceptionistDashboardSummary(
  options?: Partial<DashboardRequestOptions>
): Promise<any> {
  const dashboard = await getReceptionistDashboard(options);
  return dashboard.summary;
}

/**
 * Get receptionist queue overview
 */
export async function getReceptionistQueueOverview(
  options?: Partial<DashboardRequestOptions>
): Promise<{
  todayQueue: ReceptionistDashboardData['todayQueue'];
  upcomingAppointments: ReceptionistDashboardData['upcomingAppointments'];
  doctorAvailability: ReceptionistDashboardData['doctorAvailability'];
}> {
  const dashboard = await getReceptionistDashboard(options);
  return {
    todayQueue: dashboard.todayQueue,
    upcomingAppointments: dashboard.upcomingAppointments,
    doctorAvailability: dashboard.doctorAvailability,
  };
}

/**
 * Get receptionist registration overview
 */
export async function getReceptionistRegistrationOverview(
  options?: Partial<DashboardRequestOptions>
): Promise<{
  newPatientRegistrations: ReceptionistDashboardData['newPatientRegistrations'];
  appointmentStatistics: ReceptionistDashboardData['appointmentStatistics'];
}> {
  const dashboard = await getReceptionistDashboard(options);
  return {
    newPatientRegistrations: dashboard.newPatientRegistrations,
    appointmentStatistics: dashboard.appointmentStatistics,
  };
}

/**
 * Get receptionist billing overview
 */
export async function getReceptionistBillingOverview(
  options?: Partial<DashboardRequestOptions>
): Promise<{
  pendingPayments: ReceptionistDashboardData['pendingPayments'];
  pendingInvoices: ReceptionistDashboardData['pendingInvoices'];
}> {
  const dashboard = await getReceptionistDashboard(options);
  return {
    pendingPayments: dashboard.pendingPayments,
    pendingInvoices: dashboard.pendingInvoices,
  };
}
