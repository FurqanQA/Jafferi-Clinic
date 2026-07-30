/**
 * Application constants
 */

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
} as const;

/**
 * Time constants in milliseconds
 */
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const;

/**
 * File size limits in bytes
 */
export const FILE_SIZE = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

/**
 * Allowed file types
 */
export const FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as string[],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] as string[],
} as const;

/**
 * Appointment statuses
 */
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

/**
 * Patient statuses
 */
export const PATIENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
} as const;

/**
 * User roles
 */
export const USER_ROLES = {
  OWNER: 'owner',
  ADMINISTRATOR: 'administrator',
  DOCTOR: 'doctor',
  RECEPTIONIST: 'receptionist',
  ACCOUNTANT: 'accountant',
  STAFF: 'staff',
} as const;

/**
 * Default timezones
 */
export const TIMEZONES = {
  UTC: 'UTC',
  EST: 'America/New_York',
  PST: 'America/Los_Angeles',
  GMT: 'Europe/London',
} as const;

/**
 * Date formats
 */
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
  TIME: 'HH:mm',
} as const;

/**
 * API endpoints
 */
export const API = {
  BASE_URL: typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL || '/api' : '/api',
  VERSION: 'v1',
} as const;
