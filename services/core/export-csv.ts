/**
 * CSV export utilities
 */

/**
 * Escape CSV value
 */
export function escapeCSV(value: string | number): string {
  const strValue = String(value);
  if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
    return `"${strValue.replace(/"/g, '""')}"`;
  }
  return strValue;
}

/**
 * Convert data to CSV string
 * @param headers - Array of header strings
 * @param data - Array of data rows, each row is an array of values
 * @returns CSV string
 */
export function toCSV(headers: string[], data: (string | number)[][]): string {
  if (data.length === 0) {
    return '';
  }

  const csvRows = [
    headers.join(','),
    ...data.map(row => row.map(escapeCSV).join(',')),
  ];

  return csvRows.join('\n');
}

/**
 * Transform object array to CSV
 * @param headers - Array of header strings
 * @param data - Array of objects to convert
 * @param mapper - Function to map each object to an array of values
 * @returns CSV string
 */
export function objectsToCSV<T>(
  headers: string[],
  data: T[],
  mapper: (item: T) => (string | number)[]
): string {
  const rows = data.map(mapper);
  return toCSV(headers, rows);
}
