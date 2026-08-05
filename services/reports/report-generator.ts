import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { Report, ReportCategory, ExportFormat } from './report-types';
import { validateReportViewPermission } from './report-permissions';
import { executeReport } from './report-engine';

// ============================================================================
// Report Generator
// Report generation in various formats
// ============================================================================

/**
 * Generated report interface
 */
export interface GeneratedReport {
  reportId: string;
  format: ExportFormat;
  data: any[];
  metadata: {
    title: string;
    generatedAt: string;
    generatedBy: string;
    recordCount: number;
    executionTime: number;
    columns: any[];
  };
  file?: {
    path: string;
    size: number;
    url?: string;
  };
}

/**
 * Generate report in specified format
 */
export async function generateReport(
  report: Report,
  format: ExportFormat
): Promise<GeneratedReport> {
  await validateReportViewPermission(report.id);

  const startTime = Date.now();
  const user = await getCurrentUser();

  try {
    // Execute the report
    const executionResult = await executeReport(report);

    if (executionResult.status !== 'COMPLETED') {
      throw new Error(executionResult.error || 'Report execution failed');
    }

    // Format the data based on export format
    let formattedData: any;
    let file: GeneratedReport['file'];

    switch (format) {
      case ExportFormat.CSV:
        formattedData = await generateCSV(executionResult.data, report.columns);
        break;
      case ExportFormat.EXCEL:
        formattedData = await generateExcel(executionResult.data, report.columns);
        break;
      case ExportFormat.PDF:
        formattedData = await generatePDF(executionResult.data, report.columns, report.title);
        break;
      case ExportFormat.JSON:
        formattedData = JSON.stringify(executionResult.data, null, 2);
        break;
      case ExportFormat.PRINT:
        formattedData = await generatePrintFormat(executionResult.data, report.columns, report.title);
        break;
    }

    const executionTime = Date.now() - startTime;

    logger.info('Report generated successfully', { 
      reportId: report.id, 
      format, 
      recordCount: executionResult.data.length,
      executionTime 
    });

    return {
      reportId: report.id,
      format,
      data: executionResult.data,
      metadata: {
        title: report.title,
        generatedAt: new Date().toISOString(),
        generatedBy: user.id,
        recordCount: executionResult.data.length,
        executionTime,
        columns: report.columns,
      },
      file,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Report generation failed', { error, reportId: report.id, format });
    throw error;
  }
}

/**
 * Generate CSV format
 */
async function generateCSV(data: any[], columns: any[]): Promise<string> {
  // Placeholder for CSV generation
  const headers = columns.map(c => c.label).join(',');
  const rows = data.map(row => 
    columns.map(c => {
      const value = row[c.field];
      return typeof value === 'string' ? `"${value}"` : value;
    }).join(',')
  );
  return [headers, ...rows].join('\n');
}

/**
 * Generate Excel format
 */
async function generateExcel(data: any[], columns: any[]): Promise<Buffer> {
  // Placeholder for Excel generation using xlsx library
  return Buffer.from('');
}

/**
 * Generate PDF format
 */
async function generatePDF(data: any[], columns: any[], title: string): Promise<Buffer> {
  // Placeholder for PDF generation using jsPDF or similar
  return Buffer.from('');
}

/**
 * Generate print format
 */
async function generatePrintFormat(data: any[], columns: any[], title: string): Promise<string> {
  // Placeholder for HTML print format generation
  return `<html><head><title>${title}</title></head><body><h1>${title}</h1><table></table></body></html>`;
}

/**
 * Generate multiple reports in batch
 */
export async function generateReportsBatch(
  reports: Array<{ report: Report; format: ExportFormat }>
): Promise<GeneratedReport[]> {
  const results: GeneratedReport[] = [];

  for (const { report, format } of reports) {
    try {
      const result = await generateReport(report, format);
      results.push(result);
    } catch (error) {
      logger.error('Batch report generation failed for item', { error, reportId: report.id });
    }
  }

  return results;
}

/**
 * Generate report preview (limited records)
 */
export async function generateReportPreview(
  report: Report,
  limit: number = 10
): Promise<GeneratedReport> {
  await validateReportViewPermission(report.id);

  // Create a modified report with limit
  const previewReport = {
    ...report,
    parameters: { ...report.parameters, limit },
  };

  return generateReport(previewReport, ExportFormat.JSON);
}

/**
 * Get supported export formats
 */
export function getSupportedExportFormats(): ExportFormat[] {
  return Object.values(ExportFormat);
}

/**
 * Validate export format
 */
export function validateExportFormat(format: string): format is ExportFormat {
  return Object.values(ExportFormat).includes(format as ExportFormat);
}

/**
 * Estimate report generation time
 */
export function estimateGenerationTime(recordCount: number, format: ExportFormat): number {
  const baseTime = 1000; // 1 second base
  const perRecordTime = 0.01; // 10ms per record
  const formatMultiplier: Record<ExportFormat, number> = {
    [ExportFormat.CSV]: 1,
    [ExportFormat.EXCEL]: 1.5,
    [ExportFormat.PDF]: 3,
    [ExportFormat.JSON]: 0.5,
    [ExportFormat.PRINT]: 2,
  };

  return Math.ceil(baseTime + (recordCount * perRecordTime * formatMultiplier[format]));
}
