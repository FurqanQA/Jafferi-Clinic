import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { objectsToCSV } from '../core/export-csv';
import { logger } from '../shared/logger';
import { validateExportMedicalRecordPermission } from './medical-record-permissions';
import { MedicalRecordExportData, MedicalRecord } from './medical-record-types';

/**
 * Export medical records as CSV-ready data
 */
export async function exportMedicalRecords(params?: {
  status?: string;
  visit_type?: string;
  doctor_id?: string;
  patient_id?: string;
  date_from?: string;
  date_to?: string;
}): Promise<MedicalRecordExportData[]> {
  // Validate permissions
  await validateExportMedicalRecordPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('medical_records')
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

    if (params?.visit_type) {
      query = query.eq('visit_type', params.visit_type);
    }

    if (params?.doctor_id) {
      query = query.eq('doctor_id', params.doctor_id);
    }

    if (params?.patient_id) {
      query = query.eq('patient_id', params.patient_id);
    }

    if (params?.date_from) {
      query = query.gte('visit_date', params.date_from);
    }

    if (params?.date_to) {
      query = query.lte('visit_date', params.date_to);
    }

    const { data, error } = await query.order('visit_date', { ascending: true });

    if (error) {
      logger.error('Failed to export medical records', { error, params });
      throw new DatabaseError('Failed to export medical records', { error });
    }

    // Transform to export format
    const exportData = (data || []).map((mr: any) => ({
      medical_record_number: mr.medical_record_number,
      patient_name: `${mr.patients.first_name} ${mr.patients.last_name}`,
      doctor_name: `${mr.doctors.first_name} ${mr.doctors.last_name}`,
      visit_date: mr.visit_date,
      visit_type: mr.visit_type,
      chief_complaint: mr.chief_complaint?.primary_complaint || '',
      diagnosis: mr.diagnosis?.primary_diagnosis || '',
      status: mr.status,
      created_at: mr.created_at,
    }));

    logger.info('Medical records exported successfully', { count: exportData.length });
    return exportData as MedicalRecordExportData[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error exporting medical records', { error, params });
    throw new DatabaseError('Failed to export medical records', { error });
  }
}

/**
 * Convert export data to CSV string
 */
export function medicalRecordsToCSV(data: MedicalRecordExportData[]): string {
  const headers = [
    'Medical Record Number',
    'Patient Name',
    'Doctor Name',
    'Visit Date',
    'Visit Type',
    'Chief Complaint',
    'Diagnosis',
    'Status',
    'Created At',
  ];

  return objectsToCSV(headers, data, (mr) => [
    mr.medical_record_number,
    mr.patient_name,
    mr.doctor_name,
    mr.visit_date,
    mr.visit_type,
    mr.chief_complaint,
    mr.diagnosis,
    mr.status,
    mr.created_at,
  ]);
}
