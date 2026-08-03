import { validateOwnerDashboardAccess } from './dashboard-permissions';
import { getDashboardData } from './dashboard-engine';
import { DashboardRequestOptions, OwnerDashboardData } from './dashboard-types';
import { logger } from '../shared/logger';

// ============================================================================
// Owner Dashboard
// Dashboard specific to clinic owners with comprehensive metrics
// ============================================================================

/**
 * Get owner dashboard data
 */
export async function getOwnerDashboard(
  options?: Partial<DashboardRequestOptions>
): Promise<OwnerDashboardData> {
  await validateOwnerDashboardAccess();

  const dashboardOptions: DashboardRequestOptions = {
    role: 'owner' as any,
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
      throw new Error('Failed to fetch owner dashboard data');
    }

    // Transform the data into OwnerDashboardData format
    const ownerData: OwnerDashboardData = {
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
      patients: response.data.patients || {
        total: 0,
        newThisMonth: 0,
        active: 0,
        inactive: 0,
      },
      doctors: response.data.doctors || {
        total: 0,
        active: 0,
        onLeave: 0,
      },
      staff: response.data.staff || {
        total: 0,
        active: 0,
      },
      appointments: response.data.appointments || {
        total: 0,
        today: 0,
        thisMonth: 0,
        cancelled: 0,
        completed: 0,
      },
      revenue: response.data.revenue || {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        thisYear: 0,
      },
      billing: response.data.billing || {
        outstandingInvoices: 0,
        outstandingAmount: 0,
        paymentsReceived: 0,
        pendingPayments: 0,
        refunds: 0,
      },
      laboratory: response.data.laboratory || {
        totalTests: 0,
        pendingResults: 0,
        criticalResults: 0,
      },
      medicalRecords: response.data.medicalRecords || {
        total: 0,
        createdThisMonth: 0,
      },
      prescriptions: response.data.prescriptions || {
        total: 0,
        issuedThisMonth: 0,
      },
      notifications: response.data.notifications || {
        unread: 0,
        total: 0,
      },
      widgets: response.data.widgets || [],
      charts: response.data.charts || [],
      calendar: response.data.calendar || [],
      alerts: response.data.alerts || [],
      activity: response.data.activity || [],
      clinicPerformance: response.data.clinicPerformance || {
        patientSatisfaction: 0,
        appointmentShowRate: 0,
        averageVisitDuration: 0,
      },
      growthMetrics: response.data.growthMetrics || {
        patientGrowth: 0,
        revenueGrowth: 0,
        appointmentGrowth: 0,
      },
      subscriptionStatus: response.data.subscriptionStatus || {
        plan: 'enterprise',
        status: 'active',
        features: ['all'],
      },
    };

    logger.info('Owner dashboard data fetched successfully');
    return ownerData;
  } catch (error) {
    logger.error('Failed to get owner dashboard', { error });
    throw error;
  }
}

/**
 * Get owner dashboard summary
 */
export async function getOwnerDashboardSummary(
  options?: Partial<DashboardRequestOptions>
): Promise<any> {
  const dashboard = await getOwnerDashboard(options);
  return dashboard.summary;
}

/**
 * Get owner dashboard widgets
 */
export async function getOwnerDashboardWidgets(
  options?: Partial<DashboardRequestOptions>
): Promise<any[]> {
  const dashboard = await getOwnerDashboard(options);
  return dashboard.widgets || [];
}

/**
 * Get owner dashboard charts
 */
export async function getOwnerDashboardCharts(
  options?: Partial<DashboardRequestOptions>
): Promise<any[]> {
  const dashboard = await getOwnerDashboard(options);
  return dashboard.charts || [];
}

/**
 * Get owner financial overview
 */
export async function getOwnerFinancialOverview(
  options?: Partial<DashboardRequestOptions>
): Promise<{
  revenue: OwnerDashboardData['revenue'];
  billing: OwnerDashboardData['billing'];
  growthMetrics: OwnerDashboardData['growthMetrics'];
}> {
  const dashboard = await getOwnerDashboard(options);
  return {
    revenue: dashboard.revenue,
    billing: dashboard.billing,
    growthMetrics: dashboard.growthMetrics,
  };
}

/**
 * Get owner operational overview
 */
export async function getOwnerOperationalOverview(
  options?: Partial<DashboardRequestOptions>
): Promise<{
  patients: OwnerDashboardData['patients'];
  doctors: OwnerDashboardData['doctors'];
  staff: OwnerDashboardData['staff'];
  appointments: OwnerDashboardData['appointments'];
  clinicPerformance: OwnerDashboardData['clinicPerformance'];
}> {
  const dashboard = await getOwnerDashboard(options);
  return {
    patients: dashboard.patients,
    doctors: dashboard.doctors,
    staff: dashboard.staff,
    appointments: dashboard.appointments,
    clinicPerformance: dashboard.clinicPerformance,
  };
}

/**
 * Get owner clinical overview
 */
export async function getOwnerClinicalOverview(
  options?: Partial<DashboardRequestOptions>
): Promise<{
  laboratory: OwnerDashboardData['laboratory'];
  medicalRecords: OwnerDashboardData['medicalRecords'];
  prescriptions: OwnerDashboardData['prescriptions'];
}> {
  const dashboard = await getOwnerDashboard(options);
  return {
    laboratory: dashboard.laboratory,
    medicalRecords: dashboard.medicalRecords,
    prescriptions: dashboard.prescriptions,
  };
}
