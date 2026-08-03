import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { CalendarEvent } from './dashboard-types';

// ============================================================================
// Dashboard Calendar
// Aggregate calendar events from various sources
// ============================================================================

/**
 * Get calendar events for dashboard
 */
export async function getCalendarEvents(
  clinicId?: string,
  startDate?: string,
  endDate?: string,
  limit: number = 50
): Promise<CalendarEvent[]> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const events: CalendarEvent[] = [];

    // Fetch appointments as calendar events
    const appointmentEvents = await getAppointmentCalendarEvents(targetClinicId, startDate, endDate, limit);
    events.push(...appointmentEvents);

    // Sort by start date
    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return events.slice(0, limit);
  } catch (error) {
    logger.error('Failed to fetch calendar events', { error, clinicId: targetClinicId });
    throw new DatabaseError('Failed to fetch calendar events', { error });
  }
}

/**
 * Get appointment calendar events
 */
async function getAppointmentCalendarEvents(
  clinicId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 50
): Promise<CalendarEvent[]> {
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('appointments')
      .select('id, patient_id, doctor_id, appointment_date, appointment_time, appointment_type, status')
      .eq('clinic_id', clinicId)
      .in('status', ['scheduled', 'confirmed'])
      .order('appointment_date', { ascending: true })
      .limit(limit);

    if (startDate) {
      query = query.gte('appointment_date', startDate);
    }

    if (endDate) {
      query = query.lte('appointment_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch appointment calendar events', { error });
      return [];
    }

    return (data || []).map((appointment) => ({
      id: appointment.id,
      type: 'appointment',
      title: `Appointment - ${appointment.appointment_type}`,
      start: `${appointment.appointment_date}T${appointment.appointment_time || '00:00:00'}`,
      end: `${appointment.appointment_date}T${appointment.appointment_time || '00:00:00'}`, // Would need duration calculation
      allDay: false,
      userId: appointment.doctor_id,
      metadata: {
        patientId: appointment.patient_id,
        doctorId: appointment.doctor_id,
        appointmentType: appointment.appointment_type,
        status: appointment.status,
      },
    }));
  } catch (error) {
    logger.error('Failed to get appointment calendar events', { error });
    return [];
  }
}

/**
 * Get doctor leave events (placeholder)
 */
async function getDoctorLeaveEvents(
  clinicId: string,
  startDate?: string,
  endDate?: string
): Promise<CalendarEvent[]> {
  // Placeholder for doctor leave events
  // Would query a doctor_leave table when available
  return [];
}

/**
 * Get clinic holiday events (placeholder)
 */
async function getClinicHolidayEvents(
  clinicId: string,
  startDate?: string,
  endDate?: string
): Promise<CalendarEvent[]> {
  // Placeholder for clinic holiday events
  // Would query a clinic_holidays table when available
  return [];
}

/**
 * Get general events (placeholder)
 */
async function getGeneralEvents(
  clinicId: string,
  startDate?: string,
  endDate?: string
): Promise<CalendarEvent[]> {
  // Placeholder for general events
  // Would query an events table when available
  return [];
}

/**
 * Get birthday events (placeholder)
 */
async function getBirthdayEvents(
  clinicId: string,
  startDate?: string,
  endDate?: string
): Promise<CalendarEvent[]> {
  // Placeholder for birthday events
  // Would query patients table and calculate birthdays
  return [];
}

/**
 * Get meeting events (placeholder)
 */
async function getMeetingEvents(
  clinicId: string,
  startDate?: string,
  endDate?: string
): Promise<CalendarEvent[]> {
  // Placeholder for meeting events
  // Would query a meetings table when available
  return [];
}

/**
 * Get calendar events for specific user
 */
export async function getUserCalendarEvents(
  userId: string,
  clinicId?: string,
  startDate?: string,
  endDate?: string,
  limit: number = 50
): Promise<CalendarEvent[]> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('appointments')
      .select('id, patient_id, doctor_id, appointment_date, appointment_time, appointment_type, status')
      .eq('clinic_id', targetClinicId)
      .or(`doctor_id.eq.${userId},patient_id.eq.${userId}`)
      .in('status', ['scheduled', 'confirmed'])
      .order('appointment_date', { ascending: true })
      .limit(limit);

    if (startDate) {
      query = query.gte('appointment_date', startDate);
    }

    if (endDate) {
      query = query.lte('appointment_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch user calendar events', { error });
      return [];
    }

    return (data || []).map((appointment) => ({
      id: appointment.id,
      type: 'appointment',
      title: `Appointment - ${appointment.appointment_type}`,
      start: `${appointment.appointment_date}T${appointment.appointment_time || '00:00:00'}`,
      end: `${appointment.appointment_date}T${appointment.appointment_time || '00:00:00'}`,
      allDay: false,
      userId: appointment.doctor_id,
      metadata: {
        patientId: appointment.patient_id,
        doctorId: appointment.doctor_id,
        appointmentType: appointment.appointment_type,
        status: appointment.status,
      },
    }));
  } catch (error) {
    logger.error('Failed to get user calendar events', { error, userId });
    throw new DatabaseError('Failed to get user calendar events', { error });
  }
}

/**
 * Get calendar events by type
 */
export async function getCalendarEventsByType(
  eventType: CalendarEvent['type'],
  clinicId?: string,
  startDate?: string,
  endDate?: string,
  limit: number = 50
): Promise<CalendarEvent[]> {
  const targetClinicId = clinicId || await getUserClinicId();

  switch (eventType) {
    case 'appointment':
      return await getAppointmentCalendarEvents(targetClinicId, startDate, endDate, limit);
    case 'leave':
      return await getDoctorLeaveEvents(targetClinicId, startDate, endDate);
    case 'holiday':
      return await getClinicHolidayEvents(targetClinicId, startDate, endDate);
    case 'event':
      return await getGeneralEvents(targetClinicId, startDate, endDate);
    case 'birthday':
      return await getBirthdayEvents(targetClinicId, startDate, endDate);
    case 'meeting':
      return await getMeetingEvents(targetClinicId, startDate, endDate);
    default:
      return [];
  }
}

/**
 * Get today's calendar events
 */
export async function getTodayCalendarEvents(clinicId?: string): Promise<CalendarEvent[]> {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).toISOString();
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

  return await getCalendarEvents(clinicId, startOfToday, endOfToday, 100);
}

/**
 * Get upcoming calendar events
 */
export async function getUpcomingCalendarEvents(
  clinicId?: string,
  days: number = 7,
  limit: number = 50
): Promise<CalendarEvent[]> {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).toISOString();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + days);
  const endOfFuture = new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate(), 23, 59, 59, 999).toISOString();

  return await getCalendarEvents(clinicId, startOfToday, endOfFuture, limit);
}

/**
 * Get calendar event count by type
 */
export async function getCalendarEventCountByType(
  clinicId?: string,
  startDate?: string,
  endDate?: string
): Promise<Record<CalendarEvent['type'], number>> {
  const targetClinicId = clinicId || await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const counts: Record<string, number> = {
      appointment: 0,
      leave: 0,
      holiday: 0,
      event: 0,
      birthday: 0,
      meeting: 0,
    };

    // Count appointments
    let query = supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', targetClinicId)
      .in('status', ['scheduled', 'confirmed']);

    if (startDate) {
      query = query.gte('appointment_date', startDate);
    }

    if (endDate) {
      query = query.lte('appointment_date', endDate);
    }

    const { count: appointmentCount } = await query;
    counts.appointment = appointmentCount || 0;

    // Other event types are placeholders
    counts.leave = 0;
    counts.holiday = 0;
    counts.event = 0;
    counts.birthday = 0;
    counts.meeting = 0;

    return counts as Record<CalendarEvent['type'], number>;
  } catch (error) {
    logger.error('Failed to get calendar event count by type', { error });
    throw new DatabaseError('Failed to get calendar event count by type', { error });
  }
}

/**
 * Get calendar statistics
 */
export async function getCalendarStatistics(clinicId?: string, days: number = 30): Promise<{
  totalEvents: number;
  byType: Record<CalendarEvent['type'], number>;
  averagePerDay: number;
  busiestDay: string;
}> {
  const targetClinicId = clinicId || await getUserClinicId();
  const events = await getUpcomingCalendarEvents(targetClinicId, days, 1000);

  const byType = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<CalendarEvent['type'], number>);

  const totalEvents = events.length;
  const averagePerDay = days > 0 ? totalEvents / days : 0;

  // Find busiest day
  const eventsByDay = events.reduce((acc, event) => {
    const day = event.start.split('T')[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const busiestDay = Object.entries(eventsByDay).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

  return {
    totalEvents,
    byType,
    averagePerDay,
    busiestDay,
  };
}
