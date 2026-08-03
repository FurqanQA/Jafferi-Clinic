import { validateAdministratorDashboardAccess } from './dashboard-permissions';
import { getDashboardData } from './dashboard-engine';
import { DashboardRequestOptions, AdministratorDashboardData } from './dashboard-types';
import { logger } from '../shared/logger';

// ============================================================================
// Administrator Dashboard
// Dashboard specific to clinic administrators with operational metrics
// ============================================================================

/**
 * Get administrator dashboard data
 */
export async function getAdministratorDashboard(
  options?: Partial<DashboardRequestOptions>
): Promise<AdministratorDashboardData> {
  await validateAdministratorDashboardAccess();

  const dashboardOptions: DashboardRequestOptions = {
    role: 'administrator' as any,
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
      throw new Error('Failed to fetch administrator dashboard data');
    }

    const adminData: AdministratorDashboardData = {
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
      clinicStatistics: response.data.clinicStatistics || {
        totalClinics: 1,
        activeClinics: 1,
        inactiveClinics: 0,
      },
      departmentStatistics: response.data.departmentStatistics || {
        totalDepartments: 0,
        activeDepartments: 0,
      },
      staffStatistics: response.data.staffStatistics || {
        totalStaff: 0,
        activeStaff: 0,
        onLeave: 0,
        byDepartment: {},
      },
      doctorUtilization: response.data.doctorUtilization || {
        totalDoctors: 0,
        activeDoctors: 0,
        averageUtilization: 0,
        byDepartment: {},
      },
      appointmentUtilization: response.data.appointmentUtilization || {
        totalSlots: 0,
        bookedSlots: 0,
        availableSlots: 0,
        utilizationRate: 0,
      },
      patientRegistrations: response.data.patientRegistrations || {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        thisYear: 0,
      },
      systemHealth: response.data.systemHealth || {
        databaseStatus: 'healthy',
        apiStatus: 'healthy',
        cacheStatus: 'healthy',
        lastBackup: new Date().toISOString(),
      },
      securityAlerts: response.data.securityAlerts || [],
      widgets: response.data.widgets || [],
      charts: response.data.charts || [],
      alerts: response.data.alerts || [],
      activity: response.data.activity || [],
    };

    logger.info('Administrator dashboard data fetched successfully');
    return adminData;
  } catch (error) {
    logger.error('Failed to get administrator dashboard', { error });
    throw error;
  }
}

/**
 * Get administrator dashboard summary
 */
export async function getAdministratorDashboardSummary(
  options?: Partial<DashboardRequestOptions>
): Promise<any> {
  const dashboard = await getAdministratorDashboard(options);
  return dashboard.summary;
}

/**
 * Get administrator operational overview
 */
export async function getAdministratorOperationalOverview(
  options?: Partial<DashboardRequestOptions>
): Promise<{
  clinicStatistics: AdministratorDashboardData['clinicStatistics'];
  departmentStatistics: AdministratorDashboardData['departmentStatistics'];
  staffStatistics: AdministratorDashboardData['staffStatistics'];
  doctorUtilization: AdministratorDashboardData['doctorUtilization'];
  appointmentUtilization: AdministratorDashboardData['appointmentUtilization'];
}> {
  const dashboard = await getAdministratorDashboard(options);
  return {
    clinicStatistics: dashboard.clinicStatistics,
    departmentStatistics: dashboard.departmentStatistics,
    staffStatistics: dashboard.staffStatistics,
    doctorUtilization: dashboard.doctorUtilization,
    appointmentUtilization: dashboard.appointmentUtilization,
  };
}

/**
 * Get administrator system health
 */
export async function getAdministratorSystemHealth(
  options?: Partial<DashboardRequestOptions>
): Promise<AdministratorDashboardData['systemHealth']> {
  const dashboard = await getAdministratorDashboard(options);
  return dashboard.systemHealth;
}

/**
 * Get administrator security overview
 */
export async function getAdministratorSecurityOverview(
  options?: Partial<DashboardRequestOptions>
): Promise<{
  securityAlerts: AdministratorDashboardData['securityAlerts'];
  systemHealth: AdministratorDashboardData['systemHealth'];
}> {
  const dashboard = await getAdministratorDashboard(options);
  return {
    securityAlerts: dashboard.securityAlerts,
    systemHealth: dashboard.systemHealth,
  };
}
