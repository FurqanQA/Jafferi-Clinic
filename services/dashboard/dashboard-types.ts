// ============================================================================
// Dashboard Types
// Type definitions for the Enterprise Dashboard & Analytics Service
// ============================================================================

/**
 * Dashboard role types
 */
export enum DashboardRole {
  OWNER = 'owner',
  ADMINISTRATOR = 'administrator',
  DOCTOR = 'doctor',
  RECEPTIONIST = 'receptionist',
  ACCOUNTANT = 'accountant',
  PATIENT = 'patient',
}

/**
 * Date range presets
 */
export enum DateRange {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'this_week',
  LAST_WEEK = 'last_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_QUARTER = 'this_quarter',
  LAST_QUARTER = 'last_quarter',
  THIS_YEAR = 'this_year',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

/**
 * Widget types
 */
export enum WidgetType {
  REVENUE = 'revenue',
  APPOINTMENTS = 'appointments',
  PATIENTS = 'patients',
  DOCTORS = 'doctors',
  LABORATORY = 'laboratory',
  BILLING = 'billing',
  PAYMENTS = 'payments',
  NOTIFICATIONS = 'notifications',
  CALENDAR = 'calendar',
  ACTIVITY = 'activity',
}

/**
 * Chart types
 */
export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  AREA = 'area',
  PIE = 'pie',
  DONUT = 'donut',
  STACKED = 'stacked',
  TREND = 'trend',
  HEATMAP = 'heatmap',
}

/**
 * Export formats
 */
export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  EXCEL = 'excel',
  PDF = 'pdf',
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

/**
 * Activity entity types
 */
export enum ActivityEntityType {
  APPOINTMENT = 'appointment',
  MEDICAL_RECORD = 'medical_record',
  PRESCRIPTION = 'prescription',
  PAYMENT = 'payment',
  INVOICE = 'invoice',
  LABORATORY = 'laboratory',
  NOTIFICATION = 'notification',
  AUTHENTICATION = 'authentication',
}

/**
 * KPI card data
 */
export interface KPICard {
  id: string;
  title: string;
  value: number | string;
  previousValue?: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  trend?: Array<{ date: string; value: number }>;
  icon?: string;
  color?: string;
  unit?: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
}

/**
 * Widget data
 */
export interface WidgetData {
  type: WidgetType;
  title: string;
  data: any;
  metadata?: {
    lastUpdated: string;
    dataSource: string;
    cacheKey?: string;
  };
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  metadata?: Record<string, any>;
}

/**
 * Chart data series
 */
export interface ChartDataSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

/**
 * Chart data
 */
export interface ChartData {
  type: ChartType;
  title: string;
  series: ChartDataSeries[];
  xAxis?: {
    label: string;
    type: 'category' | 'time' | 'number';
  };
  yAxis?: {
    label: string;
    format?: 'number' | 'currency' | 'percentage';
  };
  metadata?: {
    lastUpdated: string;
    dataSource: string;
  };
}

/**
 * Alert data
 */
export interface AlertData {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  entityType: ActivityEntityType;
  entityId?: string;
  actionUrl?: string;
  createdAt: string;
  isResolved: boolean;
  resolvedAt?: string;
  metadata?: Record<string, any>;
}

/**
 * Activity entry
 */
export interface ActivityEntry {
  id: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: string;
  description: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Calendar event
 */
export interface CalendarEvent {
  id: string;
  type: 'appointment' | 'leave' | 'holiday' | 'event' | 'birthday' | 'meeting';
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  userId?: string;
  userName?: string;
  metadata?: Record<string, any>;
}

/**
 * Statistics data
 */
export interface StatisticsData {
  total: number;
  count: number;
  percentage?: number;
  growth?: number;
  breakdown?: Record<string, number>;
}

/**
 * Comparison period types
 */
export enum ComparisonPeriod {
  WEEK_OVER_WEEK = 'week_over_week',
  MONTH_OVER_MONTH = 'month_over_month',
  QUARTER_OVER_QUARTER = 'quarter_over_quarter',
  YEAR_OVER_YEAR = 'year_over_year',
  CUSTOM = 'custom',
}

/**
 * Comparison data
 */
export interface ComparisonData {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  isPositive: boolean;
  unit: string;
  currentPeriod: {
    start: string;
    end: string;
  };
  previousPeriod: {
    start: string;
    end: string;
  };
}

/**
 * Dashboard summary
 */
export interface DashboardSummary {
  period: DateRange;
  startDate?: string;
  endDate?: string;
  metrics: Record<string, any>;
  kpis: KPICard[];
  alerts: AlertData[];
  recentActivity: ActivityEntry[];
  generatedAt: string;
}

/**
 * Owner dashboard data
 */
export interface OwnerDashboardData {
  summary: DashboardSummary;
  patients: {
    total: number;
    newThisMonth: number;
    active: number;
    inactive: number;
  };
  doctors: {
    total: number;
    active: number;
    onLeave: number;
  };
  staff: {
    total: number;
    active: number;
  };
  appointments: {
    total: number;
    today: number;
    thisMonth: number;
    cancelled: number;
    completed: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  };
  billing: {
    outstandingInvoices: number;
    outstandingAmount: number;
    paymentsReceived: number;
    pendingPayments: number;
    refunds: number;
  };
  laboratory: {
    totalTests: number;
    pendingResults: number;
    criticalResults: number;
  };
  medicalRecords: {
    total: number;
    createdThisMonth: number;
  };
  prescriptions: {
    total: number;
    issuedThisMonth: number;
  };
  notifications: {
    unread: number;
    total: number;
  };
  widgets?: any[];
  charts?: any[];
  calendar?: any[];
  alerts?: AlertData[];
  activity?: ActivityEntry[];
  clinicPerformance?: {
    patientSatisfaction: number;
    appointmentShowRate: number;
    averageVisitDuration: number;
  };
  growthMetrics?: {
    patientGrowth: number;
    revenueGrowth: number;
    appointmentGrowth: number;
  };
  subscriptionStatus?: {
    plan: string;
    status: string;
    features: string[];
  };
}

/**
 * Administrator dashboard data
 */
export interface AdministratorDashboardData {
  summary: DashboardSummary;
  clinicStatistics: {
    totalClinics: number;
    activeClinics: number;
    inactiveClinics: number;
  };
  departmentStatistics: {
    totalDepartments: number;
    activeDepartments: number;
  };
  staffStatistics: {
    totalStaff: number;
    activeStaff: number;
    onLeave: number;
    byDepartment: Record<string, number>;
  };
  doctorUtilization: {
    totalDoctors: number;
    activeDoctors: number;
    averageUtilization: number;
    byDepartment: Record<string, number>;
  };
  appointmentUtilization: {
    totalSlots: number;
    bookedSlots: number;
    availableSlots: number;
    utilizationRate: number;
  };
  patientRegistrations: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  };
  systemHealth: {
    databaseStatus: string;
    apiStatus: string;
    cacheStatus: string;
    lastBackup: string;
  };
  securityAlerts: AlertData[];
  widgets?: any[];
  charts?: any[];
  alerts?: AlertData[];
  activity?: ActivityEntry[];
}

/**
 * Doctor dashboard data
 */
export interface DoctorDashboardData {
  summary: DashboardSummary;
  todaySchedule: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
  };
  upcomingAppointments: Array<{
    id: string;
    patientName: string;
    time: string;
    type: string;
    status: string;
  }>;
  waitingPatients: number;
  completedVisits: number;
  pendingMedicalRecords: number;
  pendingPrescriptions: number;
  pendingLaboratoryReviews: number;
  criticalResults: number;
  notifications: {
    unread: number;
    total: number;
  };
  patientTimelineSummary: Array<{
    patientId: string;
    patientName: string;
    lastVisit: string;
    nextAppointment?: string;
  }>;
  dailyWorkload: {
    appointments: number;
    estimatedDuration: number;
    breaks: number;
  };
  widgets?: any[];
  charts?: any[];
  calendar?: any[];
  alerts?: AlertData[];
  activity?: ActivityEntry[];
}

/**
 * Receptionist dashboard data
 */
export interface ReceptionistDashboardData {
  summary: DashboardSummary;
  todayQueue: {
    checkIn: number;
    waiting: number;
    inProgress: number;
    completed: number;
  };
  walkInPatients: number;
  appointmentConfirmations: number;
  pendingRegistrations: number;
  billingQueue: number;
  notifications: {
    unread: number;
    total: number;
  };
  todayCalendar: CalendarEvent[];
  upcomingAppointments?: any[];
  newPatientRegistrations?: number;
  pendingPayments?: number;
  pendingInvoices?: number;
  appointmentStatistics?: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    cancelled: number;
    noShow: number;
  };
  doctorAvailability?: any[];
  widgets?: any[];
  charts?: any[];
  calendar?: any[];
  alerts?: AlertData[];
  activity?: ActivityEntry[];
}

/**
 * Accountant dashboard data
 */
export interface AccountantDashboardData {
  summary: DashboardSummary;
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  };
  outstandingInvoices: {
    count: number;
    amount: number;
    overdue: number;
  };
  pendingPayments: {
    count: number;
    amount: number;
  };
  refundRequests: number;
  cashDrawerStatus: {
    status: string;
    balance: number;
    lastClosed?: string;
  };
  settlementStatus: {
    pending: number;
    settled: number;
    failed: number;
  };
  paymentGatewaySummary: {
    totalTransactions: number;
    successRate: number;
    totalAmount: number;
  };
  revenueCharts: ChartData[];
  financialKPIs: KPICard[];
  notifications?: {
    unread: number;
    total: number;
  };
  paymentStatistics?: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
    refunded: number;
  };
  expenseBreakdown?: {
    total: number;
    byCategory: Record<string, number>;
  };
  taxSummary?: {
    totalTax: number;
    paidTax: number;
    pendingTax: number;
  };
  widgets?: any[];
  charts?: any[];
  alerts?: AlertData[];
  activity?: ActivityEntry[];
}

/**
 * Patient dashboard data
 */
export interface PatientDashboardData {
  summary: DashboardSummary;
  upcomingAppointments: Array<{
    id: string;
    doctorName: string;
    date: string;
    time: string;
    type: string;
    location?: string;
  }>;
  appointmentHistory: Array<{
    id: string;
    doctorName: string;
    date: string;
    type: string;
    status: string;
  }>;
  medicalRecordsSummary: {
    total: number;
    lastUpdated: string;
  };
  prescriptions: Array<{
    id: string;
    medication: string;
    prescribedDate: string;
    status: string;
  }>;
  laboratoryResults: Array<{
    id: string;
    testName: string;
    date: string;
    status: string;
    isCritical?: boolean;
  }>;
  invoices: Array<{
    id: string;
    amount: number;
    date: string;
    status: string;
    dueDate?: string;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    date: string;
    method: string;
    status: string;
  }>;
  notifications: {
    unread: number;
    total: number;
  };
  recentVisits?: any[];
  pendingPrescriptions?: number;
  pendingLabResults?: number;
  criticalLabResults?: number;
  outstandingBalance?: number;
  upcomingPayments?: any[];
  widgets?: any[];
  charts?: any[];
  calendar?: any[];
  alerts?: AlertData[];
  activity?: ActivityEntry[];
}

/**
 * Dashboard request options
 */
export interface DashboardRequestOptions {
  role: DashboardRole;
  dateRange?: DateRange;
  startDate?: string;
  endDate?: string;
  userId?: string;
  clinicId?: string;
  departmentId?: string;
  doctorId?: string;
  patientId?: string;
  includeWidgets?: WidgetType[];
  includeCharts?: ChartType[];
  cacheKey?: string;
  bypassCache?: boolean;
}

/**
 * Dashboard response
 */
export interface DashboardResponse<T> {
  success: boolean;
  data: T;
  metadata: {
    generatedAt: string;
    cacheHit: boolean;
    dataSource: string[];
    executionTime: number;
  };
}

/**
 * Analytics request options
 */
export interface AnalyticsRequestOptions {
  metric: string;
  aggregation?: 'sum' | 'count' | 'average' | 'min' | 'max';
  groupBy?: string;
  filters?: Record<string, any>;
  dateRange?: DateRange;
  startDate?: string;
  endDate?: string;
  clinicId?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Trend data
 */
export interface TrendData {
  metric: string;
  period: string;
  data: Array<{
    date: string;
    value: number;
  }>;
  growthRate: number;
  forecast?: Array<{
    date: string;
    value: number;
    confidence?: number;
  }>;
}

/**
 * Forecast data
 */
export interface ForecastData {
  metric: string;
  forecastPeriod: string;
  predictions: Array<{
    date: string;
    value: number;
    confidence: number;
  }>;
  methodology: string;
  accuracy?: number;
}

/**
 * Realtime subscription
 */
export interface RealtimeSubscription {
  channel: string;
  event: string;
  callback: (payload: any) => void;
}

/**
 * Cache entry
 */
export interface CacheEntry {
  key: string;
  data: any;
  createdAt: string;
  expiresAt: string;
  metadata?: Record<string, any>;
}
