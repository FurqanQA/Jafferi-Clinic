import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { objectsToCSV } from '../core/export-csv';
import { logger } from '../shared/logger';
import { validateExportAppointmentsPermission } from './appointment-permissions';
import { AppointmentExportData, Appointment } from './appointment-types';

/**
 * Export appointments as CSV-ready data
 */
export async function exportAppointments(params?: {
  status?: string;
  appointment_type?: string;
  doctor_id?: string;
  patient_id?: string;
  date_from?: string;
  date_to?: string;
}): Promise<AppointmentExportData[]> {
  // Validate permissions
  await validateExportAppointmentsPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patients!inner(first_name, last_name),
        doctors!inner(first_name, last_name),
        departments!inner(name)
      `)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Apply filters
    if (params?.status) {
      query = query.eq('status', params.status);
    }

    if (params?.appointment_type) {
      query = query.eq('appointment_type', params.appointment_type);
    }

    if (params?.doctor_id) {
      query = query.eq('doctor_id', params.doctor_id);
    }

    if (params?.patient_id) {
      query = query.eq('patient_id', params.patient_id);
    }

    if (params?.date_from) {
      query = query.gte('appointment_date', params.date_from);
    }

    if (params?.date_to) {
      query = query.lte('appointment_date', params.date_to);
    }

    const { data, error } = await query.order('appointment_date', { ascending: true });

    if (error) {
      logger.error('Failed to export appointments', { error, params });
      throw new DatabaseError('Failed to export appointments', { error });
    }

    // Transform to export format
    const exportData = (data || []).map((apt: any) => ({
      appointment_number: apt.appointment_number,
      patient_name: `${apt.patients.first_name} ${apt.patients.last_name}`,
      doctor_name: `${apt.doctors.first_name} ${apt.doctors.last_name}`,
      department: apt.departments?.name || '',
      appointment_date: apt.appointment_date,
      start_time: apt.start_time,
      end_time: apt.end_time,
      duration: apt.duration,
      appointment_type: apt.appointment_type,
      visit_type: apt.visit_type,
      priority: apt.priority,
      status: apt.status,
      reason_for_visit: apt.reason_for_visit || '',
      source: apt.source,
      created_at: apt.created_at,
    }));

    logger.info('Appointments exported successfully', { count: exportData.length });
    return exportData as AppointmentExportData[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error exporting appointments', { error, params });
    throw new DatabaseError('Failed to export appointments', { error });
  }
}

/**
 * Convert export data to CSV string
 */
export function appointmentsToCSV(data: AppointmentExportData[]): string {
  const headers = [
    'Appointment Number',
    'Patient Name',
    'Doctor Name',
    'Department',
    'Appointment Date',
    'Start Time',
    'End Time',
    'Duration',
    'Appointment Type',
    'Visit Type',
    'Priority',
    'Status',
    'Reason for Visit',
    'Source',
    'Created At',
  ];

  return objectsToCSV(headers, data, (apt) => [
    apt.appointment_number,
    apt.patient_name,
    apt.doctor_name,
    apt.department,
    apt.appointment_date,
    apt.start_time,
    apt.end_time,
    apt.duration,
    apt.appointment_type,
    apt.visit_type,
    apt.priority,
    apt.status,
    apt.reason_for_visit,
    apt.source,
    apt.created_at,
  ]);
}
