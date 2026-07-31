import { getSupabaseClient } from '../core/client';
import { getUserClinicId } from '../core/auth';
import { DatabaseError } from '../core/errors';
import { logger } from '../shared/logger';
import { CalendarEvent, CalendarView, Appointment } from './appointment-types';

/**
 * Calendar view parameters
 */
export interface CalendarViewParams {
  view: CalendarView;
  startDate: string;
  endDate: string;
  doctorId?: string;
  patientId?: string;
  departmentId?: string;
}

/**
 * Get calendar events for a specific view
 */
export async function getCalendarEvents(params: CalendarViewParams): Promise<CalendarEvent[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        color_tag,
        patient_id,
        doctor_id,
        patients!inner(first_name, last_name),
        doctors!inner(first_name, last_name)
      `)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .gte('appointment_date', params.startDate)
      .lte('appointment_date', params.endDate);

    // Filter by doctor if specified
    if (params.doctorId) {
      query = query.eq('doctor_id', params.doctorId);
    }

    // Filter by patient if specified
    if (params.patientId) {
      query = query.eq('patient_id', params.patientId);
    }

    // Filter by department if specified
    if (params.departmentId) {
      query = query.eq('department_id', params.departmentId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch calendar events', { error, params });
      throw new DatabaseError('Failed to fetch calendar events', { error });
    }

    // Transform to calendar events
    const events = (data || []).map((apt: any) => ({
      id: apt.id,
      title: `${apt.patients.first_name} ${apt.patients.last_name}`,
      start: new Date(`${apt.appointment_date}T${apt.start_time}`),
      end: new Date(`${apt.appointment_date}T${apt.end_time}`),
      patient_id: apt.patient_id,
      patient_name: `${apt.patients.first_name} ${apt.patients.last_name}`,
      doctor_id: apt.doctor_id,
      doctor_name: `${apt.doctors.first_name} ${apt.doctors.last_name}`,
      status: apt.status,
      color_tag: apt.color_tag,
    }));

    return events;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching calendar events', { error, params });
    throw new DatabaseError('Failed to fetch calendar events', { error });
  }
}

/**
 * Get doctor calendar for a specific date range
 */
export async function getDoctorCalendar(
  doctorId: string,
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  return getCalendarEvents({
    view: 'day',
    startDate,
    endDate,
    doctorId,
  });
}

/**
 * Get clinic calendar for a specific date range
 */
export async function getClinicCalendar(
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  return getCalendarEvents({
    view: 'day',
    startDate,
    endDate,
  });
}

/**
 * Get patient appointment history timeline
 */
export async function getPatientTimeline(
  patientId: string,
  limit: number = 50
): Promise<Appointment[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('appointment_date', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch patient timeline', { error, patientId });
      throw new DatabaseError('Failed to fetch patient timeline', { error });
    }

    return (data || []) as Appointment[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching patient timeline', { error, patientId });
    throw new DatabaseError('Failed to fetch patient timeline', { error });
  }
}

/**
 * Get daily view events
 */
export async function getDailyView(date: string, doctorId?: string): Promise<CalendarEvent[]> {
  return getCalendarEvents({
    view: 'day',
    startDate: date,
    endDate: date,
    doctorId,
  });
}

/**
 * Get weekly view events
 */
export async function getWeeklyView(
  startDate: string,
  endDate: string,
  doctorId?: string
): Promise<CalendarEvent[]> {
  return getCalendarEvents({
    view: 'week',
    startDate,
    endDate,
    doctorId,
  });
}

/**
 * Get monthly view events
 */
export async function getMonthlyView(
  startDate: string,
  endDate: string,
  doctorId?: string
): Promise<CalendarEvent[]> {
  return getCalendarEvents({
    view: 'month',
    startDate,
    endDate,
    doctorId,
  });
}

/**
 * Get agenda view (list of upcoming appointments)
 */
export async function getAgendaView(
  doctorId?: string,
  limit: number = 20
): Promise<CalendarEvent[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        color_tag,
        patient_id,
        doctor_id,
        patients!inner(first_name, last_name),
        doctors!inner(first_name, last_name)
      `)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .gte('appointment_date', today)
      .in('status', ['scheduled', 'confirmed'])
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(limit);

    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch agenda view', { error, doctorId });
      throw new DatabaseError('Failed to fetch agenda view', { error });
    }

    const events = (data || []).map((apt: any) => ({
      id: apt.id,
      title: `${apt.patients.first_name} ${apt.patients.last_name}`,
      start: new Date(`${apt.appointment_date}T${apt.start_time}`),
      end: new Date(`${apt.appointment_date}T${apt.end_time}`),
      patient_id: apt.patient_id,
      patient_name: `${apt.patients.first_name} ${apt.patients.last_name}`,
      doctor_id: apt.doctor_id,
      doctor_name: `${apt.doctors.first_name} ${apt.doctors.last_name}`,
      status: apt.status,
      color_tag: apt.color_tag,
    }));

    return events;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching agenda view', { error, doctorId });
    throw new DatabaseError('Failed to fetch agenda view', { error });
  }
}

/**
 * Get date range for calendar view
 */
export function getDateRangeForView(view: CalendarView, baseDate: Date): { start: string; end: string } {
  const start = new Date(baseDate);
  const end = new Date(baseDate);

  switch (view) {
    case 'day':
      // Same day
      break;
    case 'week':
      // Start of week (Sunday) to end of week (Saturday)
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      end.setDate(end.getDate() + (6 - dayOfWeek));
      break;
    case 'month':
      // First day of month to last day of month
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      break;
    case 'agenda':
      // Next 30 days
      end.setDate(end.getDate() + 30);
      break;
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}
