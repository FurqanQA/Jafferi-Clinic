/**
 * Date utility functions with timezone support
 */

/**
 * Format date to ISO string
 */
export function toISOString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string, format: 'ISO' | 'DISPLAY' | 'DISPLAY_WITH_TIME' | 'TIME' = 'DISPLAY'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'ISO':
      return d.toISOString().split('T')[0];
    case 'DISPLAY':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    case 'DISPLAY_WITH_TIME':
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    case 'TIME':
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    default:
      return d.toISOString();
  }
}

/**
 * Format date with timezone
 */
export function formatDateWithTimezone(date: Date | string, timezone: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get start of day
 */
export function startOfDay(date: Date | string = new Date()): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day
 */
export function endOfDay(date: Date | string = new Date()): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get start of week
 */
export function startOfWeek(date: Date | string = new Date()): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of week
 */
export function endOfWeek(date: Date | string = new Date()): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7);
  d.setDate(diff);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get start of month
 */
export function startOfMonth(date: Date | string = new Date()): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of month
 */
export function endOfMonth(date: Date | string = new Date()): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Add days to date
 */
export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Subtract days from date
 */
export function subtractDays(date: Date | string, days: number): Date {
  return addDays(date, -days);
}

/**
 * Add hours to date
 */
export function addHours(date: Date | string, hours: number): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  d.setHours(d.getHours() + hours);
  return d;
}

/**
 * Get difference in days between two dates
 */
export function diffInDays(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d > new Date();
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
}
