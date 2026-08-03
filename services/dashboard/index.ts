// ============================================================================
// Dashboard Service Index
// Main export file for the Enterprise Dashboard & Analytics Service
// ============================================================================

// Types
export * from './dashboard-types';

// Validation
export * from './dashboard-validation';

// Permissions
export {
  validateOwnerDashboardAccess,
  validateAdministratorDashboardAccess,
  validateDoctorDashboardAccess,
  validateReceptionistDashboardAccess,
  validateAccountantDashboardAccess,
  validatePatientDashboardAccess,
  validateDashboardAccess,
  validateClinicIsolation,
  validateExportAccess,
} from './dashboard-permissions';

// Cache
export * from './dashboard-cache';

// Engine
export * from './dashboard-engine';

// Metrics
export * from './dashboard-metrics';

// Summary
export * from './dashboard-summary';

// Widgets
export * from './dashboard-widgets';

// KPIs
export * from './dashboard-kpis';

// Charts
export * from './dashboard-charts';

// Alerts
export * from './dashboard-alerts';

// Activity
export * from './dashboard-activity';

// Calendar
export * from './dashboard-calendar';

// Statistics
export * from './dashboard-statistics';

// Comparison
export * from './dashboard-comparison';

// Export
export {
  exportToCSV,
  exportToJSON,
  exportToExcel,
  exportToPDF,
  exportDashboardData,
  exportMetrics,
  exportKPIs,
  exportChartData,
  exportActivity,
  exportCalendar,
  exportAlerts,
  exportComparison,
  getExportFileExtension,
  getExportMimeType,
  generateExportFilename,
  getSupportedExportFormats,
  isFormatSupported,
} from './dashboard-export';

// Role-specific Dashboards
export * from './owner-dashboard';
export * from './admin-dashboard';
export * from './doctor-dashboard';
export * from './receptionist-dashboard';
export * from './accountant-dashboard';
export * from './patient-dashboard';

// Analytics
export * from './analytics-engine';
export * from './trends';
export * from './forecasting';

// Realtime
export {
  subscribeToRealtimeEvents,
  unsubscribeFromRealtimeEvents,
  publishRealtimeEvent,
  getActiveSubscriptions,
  getRealtimeDashboardUpdates,
  simulateRealtimeEvent,
  getRealtimeMetrics,
  clearUserSubscriptions,
  clearClinicSubscriptions,
  getSubscriptionStatistics,
  initializeRealtimeService,
  shutdownRealtimeService,
} from './realtime';
