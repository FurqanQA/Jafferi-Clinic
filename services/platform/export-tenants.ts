import { logger } from '../shared/logger';
import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { Tenant, TenantStatus } from './platform-types';

// ============================================================================
// Export Tenants
// Tenant data export operations
// ============================================================================

/**
 * Export format
 */
export type ExportFormat = 'json' | 'csv' | 'xlsx';

/**
 * Export options
 */
export interface ExportTenantsOptions {
  format?: ExportFormat;
  status?: TenantStatus;
  planId?: string;
  includeDetails?: boolean;
  fields?: string[];
  from?: string;
  to?: string;
}

/**
 * Export result
 */
export interface ExportResult {
  data: string | Buffer;
  filename: string;
  mimeType: string;
  recordCount: number;
}

/**
 * Export tenants
 */
export async function exportTenants(options: ExportTenantsOptions = {}): Promise<ExportResult> {
  try {
    const {
      format = 'json',
      status,
      planId,
      includeDetails = false,
      fields,
      from,
      to,
    } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('tenants')
      .select('*');

    if (status) {
      query = query.eq('status', status);
    }

    if (planId) {
      query = query.eq('plan_id', planId);
    }

    if (from) {
      query = query.gte('created_at', from);
    }

    if (to) {
      query = query.lte('created_at', to);
    }

    const { data: tenants, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch tenants for export', { error });
      throw new DatabaseError('Failed to fetch tenants for export', { error });
    }

    let exportData: string | Buffer;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        exportData = JSON.stringify(tenants, null, 2);
        filename = `tenants-export-${Date.now()}.json`;
        mimeType = 'application/json';
        break;

      case 'csv':
        exportData = convertToCSV(tenants || [], fields);
        filename = `tenants-export-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;

      case 'xlsx':
        // Placeholder for Excel export
        // In production, this would use a library like xlsx
        exportData = JSON.stringify(tenants, null, 2);
        filename = `tenants-export-${Date.now()}.json`;
        mimeType = 'application/json';
        break;

      default:
        exportData = JSON.stringify(tenants, null, 2);
        filename = `tenants-export-${Date.now()}.json`;
        mimeType = 'application/json';
    }

    logger.info('Tenants exported successfully', { 
      format, 
      recordCount: tenants?.length || 0 
    });

    return {
      data: exportData,
      filename,
      mimeType,
      recordCount: tenants?.length || 0,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error exporting tenants', { error, options });
    throw new DatabaseError('Failed to export tenants', { error });
  }
}

/**
 * Convert data to CSV
 */
function convertToCSV(data: any[], fields?: string[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = fields || Object.keys(data[0]);
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const item of data) {
    const values = headers.map(header => {
      const value = item[header];
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }
      // Handle nested objects
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      // Handle strings with commas
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Export single tenant
 */
export async function exportSingleTenant(tenantId: string, format: ExportFormat = 'json'): Promise<ExportResult> {
  try {
    const supabase = getSupabaseClient();

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error) {
      logger.error('Failed to fetch tenant for export', { error, tenantId });
      throw new DatabaseError('Failed to fetch tenant for export', { error });
    }

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    let exportData: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        exportData = JSON.stringify(tenant, null, 2);
        filename = `tenant-${tenantId}-${Date.now()}.json`;
        mimeType = 'application/json';
        break;

      case 'csv':
        exportData = convertToCSV([tenant]);
        filename = `tenant-${tenantId}-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;

      case 'xlsx':
        exportData = JSON.stringify(tenant, null, 2);
        filename = `tenant-${tenantId}-${Date.now()}.json`;
        mimeType = 'application/json';
        break;

      default:
        exportData = JSON.stringify(tenant, null, 2);
        filename = `tenant-${tenantId}-${Date.now()}.json`;
        mimeType = 'application/json';
    }

    logger.info('Single tenant exported successfully', { tenantId, format });

    return {
      data: exportData,
      filename,
      mimeType,
      recordCount: 1,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error exporting single tenant', { error, tenantId });
    throw new DatabaseError('Failed to export single tenant', { error });
  }
}

/**
 * Export tenant statistics
 */
export async function exportTenantStatistics(format: ExportFormat = 'json'): Promise<ExportResult> {
  try {
    const supabase = getSupabaseClient();

    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, name, status, plan_id, created_at, updated_at');

    if (!tenants || tenants.length === 0) {
      throw new Error('No tenants to export');
    }

    const statistics = {
      total: tenants.length,
      byStatus: {} as Record<string, number>,
      byPlan: {} as Record<string, number>,
      tenants: tenants,
    };

    for (const tenant of tenants) {
      statistics.byStatus[tenant.status] = (statistics.byStatus[tenant.status] || 0) + 1;
      if (tenant.plan_id) {
        statistics.byPlan[tenant.plan_id] = (statistics.byPlan[tenant.plan_id] || 0) + 1;
      }
    }

    let exportData: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        exportData = JSON.stringify(statistics, null, 2);
        filename = `tenant-statistics-${Date.now()}.json`;
        mimeType = 'application/json';
        break;

      case 'csv':
        exportData = convertToCSV([statistics]);
        filename = `tenant-statistics-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;

      case 'xlsx':
        exportData = JSON.stringify(statistics, null, 2);
        filename = `tenant-statistics-${Date.now()}.json`;
        mimeType = 'application/json';
        break;

      default:
        exportData = JSON.stringify(statistics, null, 2);
        filename = `tenant-statistics-${Date.now()}.json`;
        mimeType = 'application/json';
    }

    logger.info('Tenant statistics exported successfully', { format });

    return {
      data: exportData,
      filename,
      mimeType,
      recordCount: tenants.length,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error exporting tenant statistics', { error });
    throw new DatabaseError('Failed to export tenant statistics', { error });
  }
}

/**
 * Get export history
 */
export async function getExportHistory(): Promise<Array<{
  id: string;
  exportedBy: string;
  exportedAt: string;
  format: string;
  recordCount: number;
}>> {
  try {
    // Placeholder for export history
    // In production, this would fetch from an export_history table
    return [];
  } catch (error) {
    logger.error('Failed to get export history', { error });
    throw new DatabaseError('Failed to get export history', { error });
  }
}

/**
 * Schedule export
 */
export async function scheduleExport(options: ExportTenantsOptions, scheduledFor: string): Promise<{
  exportId: string;
  scheduledFor: string;
  status: string;
}> {
  try {
    const exportId = `export-${Date.now()}`;

    logger.info('Export scheduled', { exportId, scheduledFor });

    // Placeholder for scheduled export
    // In production, this would create a scheduled job

    return {
      exportId,
      scheduledFor,
      status: 'scheduled',
    };
  } catch (error) {
    logger.error('Failed to schedule export', { error, options });
    throw new DatabaseError('Failed to schedule export', { error });
  }
}
