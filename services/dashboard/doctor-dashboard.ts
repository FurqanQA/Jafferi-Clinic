import { validateDoctorDashboardAccess } from './dashboard-permissions';
import { getDashboardData } from './dashboard-engine';
import { DashboardRequestOptions, DoctorDashboardData } from './dashboard-types';
import { logger } from '../shared/logger';

// ============================================================================
// Doctor Dashboard
// Dashboard specific to doctors with patient and appointment metrics
// ============================================================================

/**
 * Get doctor dashboard data
 */
export async function getDoctorDashboard(
  doctorId?: string,
  options?: Partial<DashboardRequestOptions>
): Promise<DoctorDashboardData> {
  await validateDoctorDashboardAccess(doctorId);

  const dashboardOptions: DashboardRequestOptions = {
    role: 'doctor' as any,
    dateRange: options?.dateRange,
    startDate: options?.startDate,
    endDate: options?.endDate,
    clinicId: options?.clinicId,
    doctorId: doctorId || options?.doctorId,
    includeWidgets: options?.includeWidgets,
    includeCharts: options?.includeCharts,
    cacheKey: options?.cacheKey,
    bypassCache: options?.bypassCache,
  };

  try {
    const response = await getDashboardData(dashboardOptions);

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch doctor dashboard data');
    }

    const doctorData: DoctorDashboardData = {
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
      todaySchedule: response.data.todaySchedule || {
        total: 0,
        completed: 0,
        pending: 0,
        cancelled: 0,
      },
      upcomingAppointments: response.data.upcomingAppointments || [],
      waitingPatients: response.data.waitingPatients || 0,
      completedVisits: response.data.completedVisits || 0,
      pendingMedicalRecords: response.data.pendingMedicalRecords || 0,
      pendingPrescriptions: response.data.pendingPrescriptions || 0,
      pendingLaboratoryReviews: response.data.pendingLaboratoryReviews || 0,
      criticalResults: response.data.criticalResults || 0,
      notifications: response.data.notifications || {
        total: 0,
        unread: 0,
      },
      patientTimelineSummary: response.data.patientTimelineSummary || [],
      dailyWorkload: response.data.dailyWorkload || {
        appointments: 0,
        estimatedDuration: 0,
        breaks: 0,
      },
      widgets: response.data.widgets || [],
      charts: response.data.charts || [],
      calendar: response.data.calendar || [],
      alerts: response.data.alerts || [],
      activity: response.data.activity || [],
    };

    logger.info('Doctor dashboard data fetched successfully');
    return doctorData;
  } catch (error) {
    logger.error('Failed to get doctor dashboard', { error });
    throw error;
  }
}

/**
 * Get doctor dashboard summary
 */
export async function getDoctorDashboardSummary(
  doctorId?: string,
  options?: Partial<DashboardRequestOptions>
): Promise<any> {
  const dashboard = await getDoctorDashboard(doctorId, options);
  return dashboard.summary;
}

/**
 * Get doctor schedule
 */
export async function getDoctorSchedule(
  doctorId?: string,
  options?: Partial<DashboardRequestOptions>
): Promise<{
  todaySchedule: DoctorDashboardData['todaySchedule'];
  upcomingAppointments: DoctorDashboardData['upcomingAppointments'];
  dailyWorkload: DoctorDashboardData['dailyWorkload'];
}> {
  const dashboard = await getDoctorDashboard(doctorId, options);
  return {
    todaySchedule: dashboard.todaySchedule,
    upcomingAppointments: dashboard.upcomingAppointments,
    dailyWorkload: dashboard.dailyWorkload,
  };
}

/**
 * Get doctor clinical overview
 */
export async function getDoctorClinicalOverview(
  doctorId?: string,
  options?: Partial<DashboardRequestOptions>
): Promise<{
  pendingMedicalRecords: DoctorDashboardData['pendingMedicalRecords'];
  pendingPrescriptions: DoctorDashboardData['pendingPrescriptions'];
  pendingLaboratoryReviews: DoctorDashboardData['pendingLaboratoryReviews'];
  criticalResults: DoctorDashboardData['criticalResults'];
}> {
  const dashboard = await getDoctorDashboard(doctorId, options);
  return {
    pendingMedicalRecords: dashboard.pendingMedicalRecords,
    pendingPrescriptions: dashboard.pendingPrescriptions,
    pendingLaboratoryReviews: dashboard.pendingLaboratoryReviews,
    criticalResults: dashboard.criticalResults,
  };
}

/**
 * Get doctor patient overview
 */
export async function getDoctorPatientOverview(
  doctorId?: string,
  options?: Partial<DashboardRequestOptions>
): Promise<{
  waitingPatients: DoctorDashboardData['waitingPatients'];
  completedVisits: DoctorDashboardData['completedVisits'];
  patientTimelineSummary: DoctorDashboardData['patientTimelineSummary'];
}> {
  const dashboard = await getDoctorDashboard(doctorId, options);
  return {
    waitingPatients: dashboard.waitingPatients,
    completedVisits: dashboard.completedVisits,
    patientTimelineSummary: dashboard.patientTimelineSummary,
  };
}
