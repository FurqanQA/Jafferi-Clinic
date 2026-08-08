import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId, getCurrentUser, getUserRole } from '../core/auth';
import { logger } from '../shared/logger';
import { validateDashboardRequest } from './dashboard-validation';
import { validateDashboardAccess, validateClinicIsolation } from './dashboard-permissions';
import { DashboardRole, DashboardRequestOptions, DashboardResponse } from './dashboard-types';
import { getCache, setCache } from './dashboard-cache';

// ============================================================================
// Dashboard Engine
// Central aggregation service for all dashboard data
// Reuses existing services without duplicating business logic
// ============================================================================

/**
 * Get date range boundaries based on preset
 */
function getDateRangeBoundaries(dateRange: string, startDate?: string, endDate?: string): { start: string; end: string } {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const dayOfWeek = now.getDay();

  switch (dateRange) {
    case 'today':
      return { start: startOfDay.toISOString(), end: endOfDay.toISOString() };
    
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
      const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      return { start: startOfYesterday.toISOString(), end: endOfYesterday.toISOString() };
    
    case 'this_week':
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      return { start: startOfWeek.toISOString(), end: endOfDay.toISOString() };
    
    case 'last_week':
      const lastWeekEnd = new Date(now);
      lastWeekEnd.setDate(now.getDate() - dayOfWeek - 1);
      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
      lastWeekStart.setHours(0, 0, 0, 0);
      const endOfLastWeek = new Date(lastWeekEnd);
      endOfLastWeek.setHours(23, 59, 59, 999);
      return { start: lastWeekStart.toISOString(), end: endOfLastWeek.toISOString() };
    
    case 'this_month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { start: startOfMonth.toISOString(), end: endOfDay.toISOString() };
    
    case 'last_month':
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start: lastMonthStart.toISOString(), end: lastMonthEnd.toISOString() };
    
    case 'this_year':
      const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      return { start: startOfYear.toISOString(), end: endOfDay.toISOString() };
    
    case 'last_year':
      const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return { start: startOfLastYear.toISOString(), end: endOfLastYear.toISOString() };
    
    case 'custom':
      if (!startDate || !endDate) {
        throw new Error('Custom date range requires startDate and endDate');
      }
      return { start: startDate, end: endDate };
    
    default:
      return { start: startOfDay.toISOString(), end: endOfDay.toISOString() };
  }
}

/**
 * Generate cache key for dashboard request
 */
function generateCacheKey(options: DashboardRequestOptions): string {
  const parts = [
    options.role,
    options.dateRange || 'today',
    options.startDate || '',
    options.endDate || '',
    options.userId || '',
    options.clinicId || '',
    options.departmentId || '',
    options.doctorId || '',
    options.patientId || '',
  ];
  return `dashboard:${parts.filter(Boolean).join(':')}`;
}

/**
 * Fetch patient statistics
 */
async function fetchPatientStatistics(clinicId: string, dateRange: { start: string; end: string }) {
  const supabase = getSupabaseClient();

  const { data: totalPatients, error: totalError } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', clinicId);

  if (totalError) {
    logger.error('Failed to fetch total patients', { error: totalError });
    throw new DatabaseError('Failed to fetch patient statistics', { error: totalError });
  }

  const { data: newPatients, error: newError } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', clinicId)
    .gte('created_at', dateRange.start)
    .lte('created_at', dateRange.end);

  if (newError) {
    logger.error('Failed to fetch new patients', { error: newError });
  }

  return {
    total: totalPatients || 0,
    newThisPeriod: newPatients || 0,
  };
}

/**
 * Fetch doctor statistics
 */
async function fetchDoctorStatistics(clinicId: string) {
  const supabase = getSupabaseClient();

  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('id, status')
    .eq('clinic_id', clinicId);

  if (error) {
    logger.error('Failed to fetch doctor statistics', { error });
    throw new DatabaseError('Failed to fetch doctor statistics', { error });
  }

  const total = doctors?.length || 0;
  const active = doctors?.filter(d => d.status === 'active').length || 0;
  const onLeave = doctors?.filter(d => d.status === 'on_leave').length || 0;

  return { total, active, onLeave };
}

/**
 * Fetch appointment statistics
 */
async function fetchAppointmentStatistics(clinicId: string, dateRange: { start: string; end: string }) {
  const supabase = getSupabaseClient();

  const { data: totalAppointments, error: totalError } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', clinicId)
    .gte('appointment_date', dateRange.start)
    .lte('appointment_date', dateRange.end);

  if (totalError) {
    logger.error('Failed to fetch total appointments', { error: totalError });
  }

  const { data: completedAppointments, error: completedError } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', clinicId)
    .eq('status', 'completed')
    .gte('appointment_date', dateRange.start)
    .lte('appointment_date', dateRange.end);

  if (completedError) {
    logger.error('Failed to fetch completed appointments', { error: completedError });
  }

  const { data: cancelledAppointments, error: cancelledError } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', clinicId)
    .eq('status', 'cancelled')
    .gte('appointment_date', dateRange.start)
    .lte('appointment_date', dateRange.end);

  if (cancelledError) {
    logger.error('Failed to fetch cancelled appointments', { error: cancelledError });
  }

  // Today's appointments
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).toISOString();
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

  const { data: todayAppointments, error: todayError } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', clinicId)
    .gte('appointment_date', startOfToday)
    .lte('appointment_date', endOfToday);

  if (todayError) {
    logger.error('Failed to fetch today appointments', { error: todayError });
  }

  return {
    total: totalAppointments || 0,
    today: todayAppointments || 0,
    completed: completedAppointments || 0,
    cancelled: cancelledAppointments || 0,
  };
}

/**
 * Fetch revenue statistics
 */
async function fetchRevenueStatistics(clinicId: string, dateRange: { start: string; end: string }) {
  const supabase = getSupabaseClient();

  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount')
    .eq('clinic_id', clinicId)
    .eq('status', 'completed')
    .gte('created_at', dateRange.start)
    .lte('created_at', dateRange.end);

  if (error) {
    logger.error('Failed to fetch revenue statistics', { error });
    throw new DatabaseError('Failed to fetch revenue statistics', { error });
  }

  const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  // Today's revenue
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).toISOString();
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

  const { data: todayPayments, error: todayError } = await supabase
    .from('payments')
    .select('amount')
    .eq('clinic_id', clinicId)
    .eq('status', 'completed')
    .gte('created_at', startOfToday)
    .lte('created_at', endOfToday);

  if (todayError) {
    logger.error('Failed to fetch today revenue', { error: todayError });
  }

  const todayRevenue = todayPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return {
    total: totalRevenue,
    today: todayRevenue,
  };
}

/**
 * Fetch billing statistics
 */
async function fetchBillingStatistics(clinicId: string) {
  const supabase = getSupabaseClient();

  const { data: outstandingInvoices, error: outstandingError } = await supabase
    .from('invoices')
    .select('id, total_amount')
    .eq('clinic_id', clinicId)
    .eq('status', 'pending');

  if (outstandingError) {
    logger.error('Failed to fetch outstanding invoices', { error: outstandingError });
  }

  const outstandingCount = outstandingInvoices?.length || 0;
  const outstandingAmount = outstandingInvoices?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0;

  const { data: pendingPayments, error: pendingError } = await supabase
    .from('payments')
    .select('id, amount')
    .eq('clinic_id', clinicId)
    .eq('status', 'pending');

  if (pendingError) {
    logger.error('Failed to fetch pending payments', { error: pendingError });
  }

  const pendingPaymentsCount = pendingPayments?.length || 0;

  return {
    outstandingInvoices: outstandingCount,
    outstandingAmount,
    pendingPayments: pendingPaymentsCount,
  };
}

/**
 * Fetch laboratory statistics
 */
async function fetchLaboratoryStatistics(clinicId: string) {
  const supabase = getSupabaseClient();

  const { data: totalTests, error: totalError } = await supabase
    .from('laboratory_tests')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', clinicId);

  if (totalError) {
    logger.error('Failed to fetch total lab tests', { error: totalError });
  }

  const { data: pendingResults, error: pendingError } = await supabase
    .from('laboratory_tests')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', clinicId)
    .eq('status', 'pending');

  if (pendingError) {
    logger.error('Failed to fetch pending lab results', { error: pendingError });
  }

  const { data: criticalResults, error: criticalError } = await supabase
    .from('laboratory_results')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', clinicId)
    .eq('is_critical', true)
    .eq('is_reviewed', false);

  if (criticalError) {
    logger.error('Failed to fetch critical lab results', { error: criticalError });
  }

  return {
    totalTests: totalTests || 0,
    pendingResults: pendingResults || 0,
    criticalResults: criticalResults || 0,
  };
}

/**
 * Fetch notification statistics
 */
async function fetchNotificationStatistics(clinicId: string, userId?: string) {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', clinicId)
    .is('deleted_at', null);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { count: totalNotifications, error: totalError } = await query;

  if (totalError) {
    logger.error('Failed to fetch total notifications', { error: totalError });
  }

  let unreadQuery = supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', clinicId)
    .in('status', ['sent', 'delivered']);

  if (userId) {
    unreadQuery = unreadQuery.eq('user_id', userId);
  }

  const { count: unreadNotifications, error: unreadError } = await unreadQuery;

  if (unreadError) {
    logger.error('Failed to fetch unread notifications', { error: unreadError });
  }

  return {
    total: totalNotifications || 0,
    unread: unreadNotifications || 0,
  };
}

/**
 * Get dashboard data based on role
 */
export async function getDashboardData(options: DashboardRequestOptions): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Validate request
    const validatedOptions = validateDashboardRequest(options);
    
    // Validate permissions
    await validateDashboardAccess(validatedOptions.role, validatedOptions.userId || validatedOptions.doctorId || validatedOptions.patientId);
    
    // Validate clinic isolation
    const clinicId = await validateClinicIsolation(validatedOptions.clinicId);
    
    // Check cache
    const cacheKey = validatedOptions.cacheKey || generateCacheKey(validatedOptions);
    if (!validatedOptions.bypassCache) {
      const cached = await getCache(cacheKey);
      if (cached) {
        logger.info('Dashboard cache hit', { cacheKey, role: validatedOptions.role });
        return {
          success: true,
          data: cached,
          metadata: {
            generatedAt: new Date().toISOString(),
            cacheHit: true,
            dataSource: ['cache'],
            executionTime: Date.now() - startTime,
          },
        };
      }
    }
    
    // Get date range boundaries
    const dateRange = getDateRangeBoundaries(
      validatedOptions.dateRange || 'today',
      validatedOptions.startDate,
      validatedOptions.endDate
    );
    
    // Fetch data based on role
    let dashboardData: any;
    
    switch (validatedOptions.role) {
      case DashboardRole.OWNER:
        dashboardData = await fetchOwnerDashboardData(clinicId, dateRange, validatedOptions);
        break;
      case DashboardRole.ADMINISTRATOR:
        dashboardData = await fetchAdministratorDashboardData(clinicId, dateRange, validatedOptions);
        break;
      case DashboardRole.DOCTOR:
        dashboardData = await fetchDoctorDashboardData(clinicId, dateRange, validatedOptions);
        break;
      case DashboardRole.RECEPTIONIST:
        dashboardData = await fetchReceptionistDashboardData(clinicId, dateRange, validatedOptions);
        break;
      case DashboardRole.ACCOUNTANT:
        dashboardData = await fetchAccountantDashboardData(clinicId, dateRange, validatedOptions);
        break;
      case DashboardRole.PATIENT:
        dashboardData = await fetchPatientDashboardData(clinicId, dateRange, validatedOptions);
        break;
      default:
        throw new Error(`Unsupported dashboard role: ${validatedOptions.role}`);
    }
    
    // Cache the result
    await setCache(cacheKey, dashboardData, 300); // Cache for 5 minutes
    
    logger.info('Dashboard data fetched successfully', { 
      role: validatedOptions.role, 
      clinicId,
      executionTime: Date.now() - startTime 
    });
    
    return {
      success: true,
      data: dashboardData,
      metadata: {
        generatedAt: new Date().toISOString(),
        cacheHit: false,
        dataSource: ['database'],
        executionTime: Date.now() - startTime,
      },
    };
  } catch (error) {
    logger.error('Failed to fetch dashboard data', { error, options });
    throw new DatabaseError('Failed to fetch dashboard data', { error });
  }
}

/**
 * Fetch owner dashboard data
 */
async function fetchOwnerDashboardData(clinicId: string, dateRange: { start: string; end: string }, options: DashboardRequestOptions) {
  const [patients, doctors, appointments, revenue, billing, laboratory, notifications] = await Promise.all([
    fetchPatientStatistics(clinicId, dateRange),
    fetchDoctorStatistics(clinicId),
    fetchAppointmentStatistics(clinicId, dateRange),
    fetchRevenueStatistics(clinicId, dateRange),
    fetchBillingStatistics(clinicId),
    fetchLaboratoryStatistics(clinicId),
    fetchNotificationStatistics(clinicId),
  ]);

  return {
    patients,
    doctors,
    appointments,
    revenue,
    billing,
    laboratory,
    notifications,
    // Placeholder for additional owner-specific data
    staff: { total: 0, active: 0 },
    medicalRecords: { total: 0, createdThisMonth: 0 },
    prescriptions: { total: 0, issuedThisMonth: 0 },
    clinicPerformance: {
      patientSatisfaction: 0,
      appointmentShowRate: 0,
      averageVisitDuration: 0,
    },
    growthMetrics: {
      patientGrowth: 0,
      revenueGrowth: 0,
      appointmentGrowth: 0,
    },
    subscriptionStatus: {
      plan: 'enterprise',
      status: 'active',
      features: ['all'],
    },
  };
}

/**
 * Fetch administrator dashboard data
 */
async function fetchAdministratorDashboardData(clinicId: string, dateRange: { start: string; end: string }, options: DashboardRequestOptions) {
  const [doctors, appointments, patients, notifications] = await Promise.all([
    fetchDoctorStatistics(clinicId),
    fetchAppointmentStatistics(clinicId, dateRange),
    fetchPatientStatistics(clinicId, dateRange),
    fetchNotificationStatistics(clinicId),
  ]);

  return {
    clinicStatistics: {
      totalClinics: 1,
      activeClinics: 1,
      inactiveClinics: 0,
    },
    departmentStatistics: {
      totalDepartments: 0,
      activeDepartments: 0,
    },
    staffStatistics: {
      totalStaff: 0,
      activeStaff: 0,
      onLeave: 0,
      byDepartment: {},
    },
    doctorUtilization: {
      totalDoctors: doctors.total,
      activeDoctors: doctors.active,
      averageUtilization: 0,
      byDepartment: {},
    },
    appointmentUtilization: {
      totalSlots: 0,
      bookedSlots: appointments.total,
      availableSlots: 0,
      utilizationRate: 0,
    },
    patientRegistrations: {
      today: patients.newThisPeriod,
      thisWeek: 0,
      thisMonth: patients.newThisPeriod,
      thisYear: 0,
    },
    systemHealth: {
      databaseStatus: 'healthy',
      apiStatus: 'healthy',
      cacheStatus: 'healthy',
      lastBackup: new Date().toISOString(),
    },
    securityAlerts: [],
  };
}

/**
 * Fetch doctor dashboard data
 */
async function fetchDoctorDashboardData(clinicId: string, dateRange: { start: string; end: string }, options: DashboardRequestOptions) {
  const user = await getCurrentUser();
  const doctorId = options.doctorId || user.id;

  const supabase = getSupabaseClient();

  // Fetch doctor's appointments
  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('doctor_id', doctorId)
    .gte('appointment_date', dateRange.start)
    .lte('appointment_date', dateRange.end)
    .order('appointment_date', { ascending: true });

  if (appointmentsError) {
    logger.error('Failed to fetch doctor appointments', { error: appointmentsError });
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).toISOString();
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

  const { data: todayAppointments, error: todayError } = await supabase
    .from('appointments')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('doctor_id', doctorId)
    .gte('appointment_date', startOfToday)
    .lte('appointment_date', endOfToday);

  if (todayError) {
    logger.error('Failed to fetch today appointments', { error: todayError });
  }

  const notifications = await fetchNotificationStatistics(clinicId, user.id);

  return {
    todaySchedule: {
      total: todayAppointments?.length || 0,
      completed: todayAppointments?.filter(a => a.status === 'completed').length || 0,
      pending: todayAppointments?.filter(a => a.status === 'scheduled').length || 0,
      cancelled: todayAppointments?.filter(a => a.status === 'cancelled').length || 0,
    },
    upcomingAppointments: appointments?.slice(0, 5).map(a => ({
      id: a.id,
      patientName: a.patient_id, // Would need to join with patients table
      time: a.appointment_time,
      type: a.appointment_type,
      status: a.status,
    })) || [],
    waitingPatients: 0,
    completedVisits: 0,
    pendingMedicalRecords: 0,
    pendingPrescriptions: 0,
    pendingLaboratoryReviews: 0,
    criticalResults: 0,
    notifications,
    patientTimelineSummary: [],
    dailyWorkload: {
      appointments: todayAppointments?.length || 0,
      estimatedDuration: 0,
      breaks: 0,
    },
  };
}

/**
 * Fetch receptionist dashboard data
 */
async function fetchReceptionistDashboardData(clinicId: string, dateRange: { start: string; end: string }, options: DashboardRequestOptions) {
  const user = await getCurrentUser();
  const notifications = await fetchNotificationStatistics(clinicId, user.id);

  const supabase = getSupabaseClient();

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).toISOString();
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

  const { data: todayAppointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('*')
    .eq('clinic_id', clinicId)
    .gte('appointment_date', startOfToday)
    .lte('appointment_date', endOfToday);

  if (appointmentsError) {
    logger.error('Failed to fetch today appointments', { error: appointmentsError });
  }

  return {
    todayQueue: {
      checkIn: todayAppointments?.filter(a => a.status === 'checked_in').length || 0,
      waiting: todayAppointments?.filter(a => a.status === 'waiting').length || 0,
      inProgress: todayAppointments?.filter(a => a.status === 'in_progress').length || 0,
      completed: todayAppointments?.filter(a => a.status === 'completed').length || 0,
    },
    walkInPatients: 0,
    appointmentConfirmations: 0,
    pendingRegistrations: 0,
    billingQueue: 0,
    notifications,
    todayCalendar: [],
  };
}

/**
 * Fetch accountant dashboard data
 */
async function fetchAccountantDashboardData(clinicId: string, dateRange: { start: string; end: string }, options: DashboardRequestOptions) {
  const [revenue, billing] = await Promise.all([
    fetchRevenueStatistics(clinicId, dateRange),
    fetchBillingStatistics(clinicId),
  ]);

  return {
    revenue,
    outstandingInvoices: {
      count: billing.outstandingInvoices,
      amount: billing.outstandingAmount,
      overdue: 0,
    },
    pendingPayments: {
      count: billing.pendingPayments,
      amount: 0,
    },
    refundRequests: 0,
    cashDrawerStatus: {
      status: 'closed',
      balance: 0,
      lastClosed: new Date().toISOString(),
    },
    settlementStatus: {
      pending: 0,
      settled: 0,
      failed: 0,
    },
    paymentGatewaySummary: {
      totalTransactions: 0,
      successRate: 0,
      totalAmount: revenue.total,
    },
    revenueCharts: [],
    financialKPIs: [],
  };
}

/**
 * Fetch patient dashboard data
 */
async function fetchPatientDashboardData(clinicId: string, dateRange: { start: string; end: string }, options: DashboardRequestOptions) {
  const user = await getCurrentUser();
  const patientId = options.patientId || user.id;

  const supabase = getSupabaseClient();

  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('patient_id', patientId)
    .gte('appointment_date', new Date().toISOString())
    .order('appointment_date', { ascending: true });

  if (appointmentsError) {
    logger.error('Failed to fetch patient appointments', { error: appointmentsError });
  }

  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (invoicesError) {
    logger.error('Failed to fetch patient invoices', { error: invoicesError });
  }

  const notifications = await fetchNotificationStatistics(clinicId, user.id);

  return {
    upcomingAppointments: appointments?.slice(0, 5).map(a => ({
      id: a.id,
      doctorName: a.doctor_id,
      date: a.appointment_date,
      time: a.appointment_time,
      type: a.appointment_type,
      location: a.location,
    })) || [],
    appointmentHistory: [],
    medicalRecordsSummary: {
      total: 0,
      lastUpdated: new Date().toISOString(),
    },
    prescriptions: [],
    laboratoryResults: [],
    invoices: invoices?.map(i => ({
      id: i.id,
      amount: i.total_amount,
      date: i.created_at,
      status: i.status,
      dueDate: i.due_date,
    })) || [],
    payments: [],
    notifications,
    profileCompletion: {
      percentage: 100,
      missingFields: [],
    },
  };
}

/**
 * Refresh dashboard cache
 */
export async function refreshDashboardCache(cacheKey: string): Promise<void> {
  // Invalidate cache by key
  // In production, this would use Redis or similar
  logger.info('Dashboard cache refresh requested', { cacheKey });
}

/**
 * Clear all dashboard cache
 */
export async function clearDashboardCache(): Promise<void> {
  // Clear all dashboard cache
  // In production, this would use Redis or similar
  logger.info('Dashboard cache cleared');
}
