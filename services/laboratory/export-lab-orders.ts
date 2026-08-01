import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateExportLabOrderPermission } from './laboratory-permissions';
import { LabOrder, LabOrderFilters, LabOrderExportData } from './laboratory-types';

/**
 * Export laboratory orders as CSV-ready data
 */
export async function exportLabOrders(filters: LabOrderFilters = {}): Promise<LabOrderExportData[]> {
  await validateExportLabOrderPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('lab_orders')
      .select(`
        *,
        patient:patients(name),
        doctor:doctors(name)
      `)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    // Apply filters
    if (filters.patient_id) {
      query = query.eq('patient_id', filters.patient_id);
    }

    if (filters.doctor_id) {
      query = query.eq('doctor_id', filters.doctor_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.department) {
      query = query.eq('department', filters.department);
    }

    if (filters.date_from) {
      query = query.gte('order_date', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('order_date', filters.date_to);
    }

    if (filters.collection_date_from) {
      query = query.gte('collection_date', filters.collection_date_from);
    }

    if (filters.collection_date_to) {
      query = query.lte('collection_date', filters.collection_date_to);
    }

    if (filters.completion_date_from) {
      query = query.gte('completion_date', filters.completion_date_from);
    }

    if (filters.completion_date_to) {
      query = query.lte('completion_date', filters.completion_date_to);
    }

    query = query.order('order_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to export lab orders', { error });
      throw new DatabaseError('Failed to export lab orders', { error });
    }

    // Transform data for export
    const exportData: LabOrderExportData[] = (data || []).map((order: any) => ({
      order_number: order.order_number,
      patient_name: order.patient?.name || '',
      doctor_name: order.doctor?.name || '',
      order_date: order.order_date,
      category: order.category,
      status: order.status,
      priority: order.priority,
      test_count: order.tests?.length || 0,
      completion_date: order.completion_date,
      created_at: order.created_at,
    }));

    return exportData;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error exporting lab orders', { error });
    throw new DatabaseError('Failed to export lab orders', { error });
  }
}

/**
 * Convert export data to CSV string
 */
export function labOrdersToCSV(data: LabOrderExportData[]): string {
  if (data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map((row) =>
    Object.values(row)
      .map((value) => {
        if (value === null || value === undefined) {
          return '';
        }
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',')
  );

  return [headers, ...rows].join('\n');
}

/**
 * Export laboratory orders as CSV
 */
export async function exportLabOrdersAsCSV(filters: LabOrderFilters = {}): Promise<string> {
  const data = await exportLabOrders(filters);
  return labOrdersToCSV(data);
}
