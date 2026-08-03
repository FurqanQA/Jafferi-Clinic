import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { StatisticsData } from './dashboard-types';

// ============================================================================
// Dashboard Statistics
// Generate statistics for dashboard display
// ============================================================================

/**
 * Get overall statistics
 */
export async function getOverallStatistics(clinicId?: string): Promise<StatisticsData> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { count: totalPatients, error: patientError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId);

    if (patientError) {
      throw new DatabaseError('Failed to fetch patient statistics', { error: patientError });
    }

    const { count: totalDoctors, error: doctorError } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId);

    if (doctorError) {
      throw new DatabaseError('Failed to fetch doctor statistics', { error: doctorError });
    }

    const { count: totalAppointments, error: appointmentError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId);

    if (appointmentError) {
      throw new DatabaseError('Failed to fetch appointment statistics', { error: appointmentError });
    }

    return {
      total: totalPatients || 0,
      count: totalDoctors || 0,
      percentage: 0,
      breakdown: {
        patients: totalPatients || 0,
        doctors: totalDoctors || 0,
        appointments: totalAppointments || 0,
      },
    };
  } catch (error) {
    logger.error('Failed to get overall statistics', { error, clinicId: targetClinicId });
    throw error;
  }
}

/**
 * Get patient statistics
 */
export async function getPatientStatistics(clinicId?: string): Promise<StatisticsData> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { count: total, error: totalError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId);

    if (totalError) {
      throw new DatabaseError('Failed to fetch patient statistics', { error: totalError });
    }

    const { count: active, error: activeError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId)
      .eq('status', 'active');

    if (activeError) {
      throw new DatabaseError('Failed to fetch active patient statistics', { error: activeError });
    }

    const { count: inactive, error: inactiveError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId)
      .eq('status', 'inactive');

    if (inactiveError) {
      throw new DatabaseError('Failed to fetch inactive patient statistics', { error: inactiveError });
    }

    const growth = total && total > 0 ? ((active || 0) / total) * 100 : 0;

    return {
      total: total || 0,
      count: active || 0,
      percentage: growth,
      breakdown: {
        active: active || 0,
        inactive: inactive || 0,
      },
    };
  } catch (error) {
    logger.error('Failed to get patient statistics', { error, clinicId: targetClinicId });
    throw error;
  }
}

/**
 * Get appointment statistics
 */
export async function getAppointmentStatistics(clinicId?: string): Promise<StatisticsData> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { count: total, error: totalError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId);

    if (totalError) {
      throw new DatabaseError('Failed to fetch appointment statistics', { error: totalError });
    }

    const { count: completed, error: completedError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId)
      .eq('status', 'completed');

    if (completedError) {
      throw new DatabaseError('Failed to fetch completed appointment statistics', { error: completedError });
    }

    const { count: cancelled, error: cancelledError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId)
      .eq('status', 'cancelled');

    if (cancelledError) {
      throw new DatabaseError('Failed to fetch cancelled appointment statistics', { error: cancelledError });
    }

    const { count: scheduled, error: scheduledError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId)
      .eq('status', 'scheduled');

    if (scheduledError) {
      throw new DatabaseError('Failed to fetch scheduled appointment statistics', { error: scheduledError });
    }

    const completionRate = total && total > 0 ? ((completed || 0) / total) * 100 : 0;
    const cancellationRate = total && total > 0 ? ((cancelled || 0) / total) * 100 : 0;

    return {
      total: total || 0,
      count: completed || 0,
      percentage: completionRate,
      growth: cancellationRate,
      breakdown: {
        completed: completed || 0,
        cancelled: cancelled || 0,
        scheduled: scheduled || 0,
      },
    };
  } catch (error) {
    logger.error('Failed to get appointment statistics', { error, clinicId: targetClinicId });
    throw error;
  }
}

/**
 * Get revenue statistics
 */
export async function getRevenueStatistics(clinicId?: string, dateRange?: { start: string; end: string }): Promise<StatisticsData> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const boundaries = dateRange || {
      start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
      end: new Date().toISOString(),
    };

    const { data: payments, error } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('clinic_id', targetClinicId)
      .gte('created_at', boundaries.start)
      .lte('created_at', boundaries.end);

    if (error) {
      throw new DatabaseError('Failed to fetch revenue statistics', { error });
    }

    const total = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const completed = payments?.filter((p) => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const pending = payments?.filter((p) => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const failed = payments?.filter((p) => p.status === 'failed').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    const successRate = total && total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      count: payments?.length || 0,
      percentage: successRate,
      breakdown: {
        completed,
        pending,
        failed,
      },
    };
  } catch (error) {
    logger.error('Failed to get revenue statistics', { error, clinicId: targetClinicId });
    throw error;
  }
}

/**
 * Get laboratory statistics
 */
export async function getLaboratoryStatistics(clinicId?: string): Promise<StatisticsData> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { count: total, error: totalError } = await supabase
      .from('laboratory_tests')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId);

    if (totalError) {
      throw new DatabaseError('Failed to fetch laboratory statistics', { error: totalError });
    }

    const { count: completed, error: completedError } = await supabase
      .from('laboratory_tests')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId)
      .eq('status', 'completed');

    if (completedError) {
      throw new DatabaseError('Failed to fetch completed lab statistics', { error: completedError });
    }

    const { count: pending, error: pendingError } = await supabase
      .from('laboratory_tests')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId)
      .eq('status', 'pending');

    if (pendingError) {
      throw new DatabaseError('Failed to fetch pending lab statistics', { error: pendingError });
    }

    const { count: critical, error: criticalError } = await supabase
      .from('laboratory_results')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId)
      .eq('is_critical', true)
      .eq('is_reviewed', false);

    if (criticalError) {
      throw new DatabaseError('Failed to fetch critical lab statistics', { error: criticalError });
    }

    const completionRate = total && total > 0 ? ((completed || 0) / total) * 100 : 0;

    return {
      total: total || 0,
      count: completed || 0,
      percentage: completionRate,
      breakdown: {
        completed: completed || 0,
        pending: pending || 0,
        critical: critical || 0,
      },
    };
  } catch (error) {
    logger.error('Failed to get laboratory statistics', { error, clinicId: targetClinicId });
    throw error;
  }
}

/**
 * Get doctor statistics
 */
export async function getDoctorStatistics(clinicId?: string): Promise<StatisticsData> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { count: total, error: totalError } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId);

    if (totalError) {
      throw new DatabaseError('Failed to fetch doctor statistics', { error: totalError });
    }

    const { count: active, error: activeError } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId)
      .eq('status', 'active');

    if (activeError) {
      throw new DatabaseError('Failed to fetch active doctor statistics', { error: activeError });
    }

    const { count: onLeave, error: onLeaveError } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId)
      .eq('status', 'on_leave');

    if (onLeaveError) {
      throw new DatabaseError('Failed to fetch on-leave doctor statistics', { error: onLeaveError });
    }

    const activeRate = total && total > 0 ? ((active || 0) / total) * 100 : 0;

    return {
      total: total || 0,
      count: active || 0,
      percentage: activeRate,
      breakdown: {
        active: active || 0,
        onLeave: onLeave || 0,
      },
    };
  } catch (error) {
    logger.error('Failed to get doctor statistics', { error, clinicId: targetClinicId });
    throw error;
  }
}

/**
 * Get billing statistics
 */
export async function getBillingStatistics(clinicId?: string): Promise<StatisticsData> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { count: total, error: totalError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId);

    if (totalError) {
      throw new DatabaseError('Failed to fetch billing statistics', { error: totalError });
    }

    const { count: paid, error: paidError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId)
      .eq('status', 'paid');

    if (paidError) {
      throw new DatabaseError('Failed to fetch paid invoice statistics', { error: paidError });
    }

    const { count: pending, error: pendingError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId)
      .eq('status', 'pending');

    if (pendingError) {
      throw new DatabaseError('Failed to fetch pending invoice statistics', { error: pendingError });
    }

    const { count: overdue, error: overdueError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId)
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString());

    if (overdueError) {
      throw new DatabaseError('Failed to fetch overdue invoice statistics', { error: overdueError });
    }

    const paymentRate = total && total > 0 ? ((paid || 0) / total) * 100 : 0;

    return {
      total: total || 0,
      count: paid || 0,
      percentage: paymentRate,
      breakdown: {
        paid: paid || 0,
        pending: pending || 0,
        overdue: overdue || 0,
      },
    };
  } catch (error) {
    logger.error('Failed to get billing statistics', { error, clinicId: targetClinicId });
    throw error;
  }
}

/**
 * Get growth rate
 */
export async function getGrowthRate(
  metric: string,
  clinicId?: string,
  days: number = 30
): Promise<number> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const now = new Date();
    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    const previousStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000).toISOString();
    const previousEnd = currentStart;

    let currentCount = 0;
    let previousCount = 0;

    switch (metric) {
      case 'patients':
        const { count: currentPatients } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('clinic_id', targetClinicId)
          .gte('created_at', currentStart);
        const { count: previousPatients } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('clinic_id', targetClinicId)
          .gte('created_at', previousStart)
          .lte('created_at', previousEnd);
        currentCount = currentPatients || 0;
        previousCount = previousPatients || 0;
        break;

      case 'appointments':
        const { count: currentAppointments } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('clinic_id', targetClinicId)
          .gte('appointment_date', currentStart);
        const { count: previousAppointments } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('clinic_id', targetClinicId)
          .gte('appointment_date', previousStart)
          .lte('appointment_date', previousEnd);
        currentCount = currentAppointments || 0;
        previousCount = previousAppointments || 0;
        break;

      default:
        return 0;
    }

    if (previousCount === 0) {
      return currentCount > 0 ? 100 : 0;
    }

    return ((currentCount - previousCount) / previousCount) * 100;
  } catch (error) {
    logger.error('Failed to calculate growth rate', { error, metric, clinicId: targetClinicId });
    return 0;
  }
}

/**
 * Get completion rate
 */
export async function getCompletionRate(
  metric: string,
  clinicId?: string
): Promise<number> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let total = 0;
    let completed = 0;

    switch (metric) {
      case 'appointments':
        const { count: totalAppointments, error: appointmentTotalError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('clinic_id', targetClinicId);
        const { count: completedAppointments, error: appointmentCompletedError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('clinic_id', targetClinicId)
          .eq('status', 'completed');

        if (appointmentTotalError || appointmentCompletedError) {
          throw new DatabaseError('Failed to fetch appointment completion rate', { error: appointmentTotalError || appointmentCompletedError });
        }

        total = totalAppointments || 0;
        completed = completedAppointments || 0;
        break;

      case 'laboratory':
        const { count: totalLab, error: labTotalError } = await supabase
          .from('laboratory_tests')
          .select('*', { count: 'exact', head: true })
          .eq('clinic_id', targetClinicId);
        const { count: completedLab, error: labCompletedError } = await supabase
          .from('laboratory_tests')
          .select('*', { count: 'exact', head: true })
          .eq('clinic_id', targetClinicId)
          .eq('status', 'completed');

        if (labTotalError || labCompletedError) {
          throw new DatabaseError('Failed to fetch lab completion rate', { error: labTotalError || labCompletedError });
        }

        total = totalLab || 0;
        completed = completedLab || 0;
        break;

      default:
        return 0;
    }

    if (total === 0) {
      return 0;
    }

    return (completed / total) * 100;
  } catch (error) {
    logger.error('Failed to calculate completion rate', { error, metric, clinicId: targetClinicId });
    return 0;
  }
}

/**
 * Get cancellation rate
 */
export async function getCancellationRate(clinicId?: string): Promise<number> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { count: total, error: totalError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId);

    const { count: cancelled, error: cancelledError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId)
      .eq('status', 'cancelled');

    if (totalError || cancelledError) {
      throw new DatabaseError('Failed to fetch cancellation rate', { error: totalError || cancelledError });
    }

    if ((total || 0) === 0) {
      return 0;
    }

    return ((cancelled || 0) / (total || 0)) * 100;
  } catch (error) {
    logger.error('Failed to calculate cancellation rate', { error, clinicId: targetClinicId });
    return 0;
  }
}

/**
 * Get success rate
 */
export async function getSuccessRate(metric: string, clinicId?: string): Promise<number> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let total = 0;
    let successful = 0;

    switch (metric) {
      case 'payments':
        const { count: totalPayments, error: paymentTotalError } = await supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('clinic_id', targetClinicId);
        const { count: successfulPayments, error: paymentSuccessError } = await supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('clinic_id', targetClinicId)
          .eq('status', 'completed');

        if (paymentTotalError || paymentSuccessError) {
          throw new DatabaseError('Failed to fetch payment success rate', { error: paymentTotalError || paymentSuccessError });
        }

        total = totalPayments || 0;
        successful = successfulPayments || 0;
        break;

      default:
        return 0;
    }

    if (total === 0) {
      return 0;
    }

    return (successful / total) * 100;
  } catch (error) {
    logger.error('Failed to calculate success rate', { error, metric, clinicId: targetClinicId });
    return 0;
  }
}
