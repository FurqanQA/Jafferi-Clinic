import { validateAccountantDashboardAccess } from './dashboard-permissions';
import { getDashboardData } from './dashboard-engine';
import { DashboardRequestOptions, AccountantDashboardData } from './dashboard-types';
import { logger } from '../shared/logger';

// ============================================================================
// Accountant Dashboard
// Dashboard specific to accountants with billing and financial metrics
// ============================================================================

/**
 * Get accountant dashboard data
 */
export async function getAccountantDashboard(
  options?: Partial<DashboardRequestOptions>
): Promise<AccountantDashboardData> {
  await validateAccountantDashboardAccess();

  const dashboardOptions: DashboardRequestOptions = {
    role: 'accountant' as any,
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
      throw new Error('Failed to fetch accountant dashboard data');
    }

    const accountantData: AccountantDashboardData = {
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
      revenue: response.data.revenue || {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        thisYear: 0,
      },
      outstandingInvoices: response.data.outstandingInvoices || {
        count: 0,
        amount: 0,
        overdue: 0,
      },
      pendingPayments: response.data.pendingPayments || {
        count: 0,
        amount: 0,
      },
      refundRequests: response.data.refundRequests || 0,
      cashDrawerStatus: response.data.cashDrawerStatus || {
        status: 'closed',
        balance: 0,
      },
      settlementStatus: response.data.settlementStatus || {
        pending: 0,
        settled: 0,
        failed: 0,
      },
      paymentGatewaySummary: response.data.paymentGatewaySummary || {
        totalTransactions: 0,
        successRate: 0,
        totalAmount: 0,
      },
      revenueCharts: response.data.revenueCharts || [],
      financialKPIs: response.data.financialKPIs || [],
      notifications: response.data.notifications || {
        total: 0,
        unread: 0,
      },
      paymentStatistics: response.data.paymentStatistics || {
        total: 0,
        completed: 0,
        pending: 0,
        failed: 0,
        refunded: 0,
      },
      expenseBreakdown: response.data.expenseBreakdown || {
        total: 0,
        byCategory: {},
      },
      taxSummary: response.data.taxSummary || {
        totalTax: 0,
        paidTax: 0,
        pendingTax: 0,
      },
      widgets: response.data.widgets || [],
      charts: response.data.charts || [],
      alerts: response.data.alerts || [],
      activity: response.data.activity || [],
    };

    logger.info('Accountant dashboard data fetched successfully');
    return accountantData;
  } catch (error) {
    logger.error('Failed to get accountant dashboard', { error });
    throw error;
  }
}

/**
 * Get accountant dashboard summary
 */
export async function getAccountantDashboardSummary(
  options?: Partial<DashboardRequestOptions>
): Promise<any> {
  const dashboard = await getAccountantDashboard(options);
  return dashboard.summary;
}

/**
 * Get accountant revenue overview
 */
export async function getAccountantRevenueOverview(
  options?: Partial<DashboardRequestOptions>
): Promise<{
  revenue: AccountantDashboardData['revenue'];
  paymentStatistics: AccountantDashboardData['paymentStatistics'];
}> {
  const dashboard = await getAccountantDashboard(options);
  return {
    revenue: dashboard.revenue,
    paymentStatistics: dashboard.paymentStatistics,
  };
}

/**
 * Get accountant billing overview
 */
export async function getAccountantBillingOverview(
  options?: Partial<DashboardRequestOptions>
): Promise<{
  outstandingInvoices: AccountantDashboardData['outstandingInvoices'];
  pendingPayments: AccountantDashboardData['pendingPayments'];
}> {
  const dashboard = await getAccountantDashboard(options);
  return {
    outstandingInvoices: dashboard.outstandingInvoices,
    pendingPayments: dashboard.pendingPayments,
  };
}

/**
 * Get accountant expense overview
 */
export async function getAccountantExpenseOverview(
  options?: Partial<DashboardRequestOptions>
): Promise<{
  expenseBreakdown: AccountantDashboardData['expenseBreakdown'];
  taxSummary: AccountantDashboardData['taxSummary'];
}> {
  const dashboard = await getAccountantDashboard(options);
  return {
    expenseBreakdown: dashboard.expenseBreakdown,
    taxSummary: dashboard.taxSummary,
  };
}
