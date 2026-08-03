import { validatePatientDashboardAccess } from './dashboard-permissions';
import { getDashboardData } from './dashboard-engine';
import { DashboardRequestOptions, PatientDashboardData } from './dashboard-types';
import { logger } from '../shared/logger';

// ============================================================================
// Patient Dashboard
// Dashboard specific to patients with personal health information
// ============================================================================

/**
 * Get patient dashboard data
 */
export async function getPatientDashboard(
  patientId?: string,
  options?: Partial<DashboardRequestOptions>
): Promise<PatientDashboardData> {
  await validatePatientDashboardAccess(patientId);

  const dashboardOptions: DashboardRequestOptions = {
    role: 'patient' as any,
    dateRange: options?.dateRange,
    startDate: options?.startDate,
    endDate: options?.endDate,
    clinicId: options?.clinicId,
    patientId: patientId || options?.patientId,
    includeWidgets: options?.includeWidgets,
    includeCharts: options?.includeCharts,
    cacheKey: options?.cacheKey,
    bypassCache: options?.bypassCache,
  };

  try {
    const response = await getDashboardData(dashboardOptions);

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch patient dashboard data');
    }

    const patientData: PatientDashboardData = {
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
      upcomingAppointments: response.data.upcomingAppointments || [],
      appointmentHistory: response.data.appointmentHistory || [],
      medicalRecordsSummary: response.data.medicalRecordsSummary || {
        total: 0,
        lastUpdated: new Date().toISOString(),
      },
      prescriptions: response.data.prescriptions || [],
      laboratoryResults: response.data.laboratoryResults || [],
      invoices: response.data.invoices || [],
      payments: response.data.payments || [],
      notifications: response.data.notifications || {
        total: 0,
        unread: 0,
      },
      recentVisits: response.data.recentVisits || [],
      pendingPrescriptions: response.data.pendingPrescriptions || 0,
      pendingLabResults: response.data.pendingLabResults || 0,
      criticalLabResults: response.data.criticalLabResults || 0,
      outstandingBalance: response.data.outstandingBalance || 0,
      upcomingPayments: response.data.upcomingPayments || [],
      widgets: response.data.widgets || [],
      charts: response.data.charts || [],
      calendar: response.data.calendar || [],
      alerts: response.data.alerts || [],
      activity: response.data.activity || [],
    };

    logger.info('Patient dashboard data fetched successfully');
    return patientData;
  } catch (error) {
    logger.error('Failed to get patient dashboard', { error });
    throw error;
  }
}

/**
 * Get patient dashboard summary
 */
export async function getPatientDashboardSummary(
  patientId?: string,
  options?: Partial<DashboardRequestOptions>
): Promise<any> {
  const dashboard = await getPatientDashboard(patientId, options);
  return dashboard.summary;
}

/**
 * Get patient appointment overview
 */
export async function getPatientAppointmentOverview(
  patientId?: string,
  options?: Partial<DashboardRequestOptions>
): Promise<{
  upcomingAppointments: PatientDashboardData['upcomingAppointments'];
  recentVisits: PatientDashboardData['recentVisits'];
}> {
  const dashboard = await getPatientDashboard(patientId, options);
  return {
    upcomingAppointments: dashboard.upcomingAppointments,
    recentVisits: dashboard.recentVisits,
  };
}

/**
 * Get patient health overview
 */
export async function getPatientHealthOverview(
  patientId?: string,
  options?: Partial<DashboardRequestOptions>
): Promise<{
  pendingPrescriptions: PatientDashboardData['pendingPrescriptions'];
  pendingLabResults: PatientDashboardData['pendingLabResults'];
  criticalLabResults: PatientDashboardData['criticalLabResults'];
  medicalRecordsSummary: PatientDashboardData['medicalRecordsSummary'];
}> {
  const dashboard = await getPatientDashboard(patientId, options);
  return {
    pendingPrescriptions: dashboard.pendingPrescriptions,
    pendingLabResults: dashboard.pendingLabResults,
    criticalLabResults: dashboard.criticalLabResults,
    medicalRecordsSummary: dashboard.medicalRecordsSummary,
  };
}

/**
 * Get patient billing overview
 */
export async function getPatientBillingOverview(
  patientId?: string,
  options?: Partial<DashboardRequestOptions>
): Promise<{
  outstandingBalance: PatientDashboardData['outstandingBalance'];
  upcomingPayments: PatientDashboardData['upcomingPayments'];
}> {
  const dashboard = await getPatientDashboard(patientId, options);
  return {
    outstandingBalance: dashboard.outstandingBalance,
    upcomingPayments: dashboard.upcomingPayments,
  };
}
