import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { objectsToCSV } from '../core/export-csv';
import { logger } from '../shared/logger';
import { validateExportPrescriptionPermission } from './prescription-permissions';
import { PrescriptionExportData } from './prescription-types';

/**
 * Export prescriptions as CSV-ready data
 */
export async function exportPrescriptions(params?: {
  status?: string;
  priority?: string;
  doctor_id?: string;
  patient_id?: string;
  date_from?: string;
  date_to?: string;
}): Promise<PrescriptionExportData[]> {
  // Validate permissions
  await validateExportPrescriptionPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('prescriptions')
      .select(`
        *,
        patients!inner(first_name, last_name),
        doctors!inner(first_name, last_name)
      `)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Apply filters
    if (params?.status) {
      query = query.eq('status', params.status);
    }

    if (params?.priority) {
      query = query.eq('priority', params.priority);
    }

    if (params?.doctor_id) {
      query = query.eq('doctor_id', params.doctor_id);
    }

    if (params?.patient_id) {
      query = query.eq('patient_id', params.patient_id);
    }

    if (params?.date_from) {
      query = query.gte('prescription_date', params.date_from);
    }

    if (params?.date_to) {
      query = query.lte('prescription_date', params.date_to);
    }

    const { data, error } = await query.order('prescription_date', { ascending: true });

    if (error) {
      logger.error('Failed to export prescriptions', { error, params });
      throw new DatabaseError('Failed to export prescriptions', { error });
    }

    // Transform to export format
    const exportData = (data || []).map((rx: any) => ({
      prescription_number: rx.prescription_number,
      patient_name: `${rx.patients.first_name} ${rx.patients.last_name}`,
      doctor_name: `${rx.doctors.first_name} ${rx.doctors.last_name}`,
      prescription_date: rx.prescription_date,
      issue_date: rx.issue_date,
      expiry_date: rx.expiry_date,
      status: rx.status,
      priority: rx.priority,
      medicine_count: rx.medicines?.length || 0,
      refill_allowed: rx.refill_allowed,
      created_at: rx.created_at,
    }));

    logger.info('Prescriptions exported successfully', { count: exportData.length });
    return exportData as PrescriptionExportData[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error exporting prescriptions', { error, params });
    throw new DatabaseError('Failed to export prescriptions', { error });
  }
}

/**
 * Convert export data to CSV string
 */
export function prescriptionsToCSV(data: PrescriptionExportData[]): string {
  const headers = [
    'Prescription Number',
    'Patient Name',
    'Doctor Name',
    'Prescription Date',
    'Issue Date',
    'Expiry Date',
    'Status',
    'Priority',
    'Medicine Count',
    'Refill Allowed',
    'Created At',
  ];

  return objectsToCSV(headers, data, (rx) => [
    rx.prescription_number,
    rx.patient_name,
    rx.doctor_name,
    rx.prescription_date,
    rx.issue_date,
    rx.expiry_date,
    rx.status,
    rx.priority,
    rx.medicine_count,
    rx.refill_allowed ? 'Yes' : 'No',
    rx.created_at,
  ]);
}
