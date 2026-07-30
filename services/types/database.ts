/**
 * Database types for Supabase
 */

/**
 * Supabase row type
 */
export type DbRow<T> = T & {
  id: string;
  created_at: string;
  updated_at: string;
};

/**
 * Supabase query result
 */
export type DbResult<T> = {
  data: T | null;
  error: {
    message: string;
    code: string;
    details?: unknown;
    hint?: string;
  } | null;
};

/**
 * Supabase query result with count
 */
export type DbResultWithCount<T> = DbResult<T> & {
  count: number | null;
};

/**
 * Supabase insert result
 */
export type DbInsertResult<T> = {
  data: T[] | null;
  error: {
    message: string;
    code: string;
    details?: unknown;
    hint?: string;
  } | null;
};

/**
 * Supabase update result
 */
export type DbUpdateResult<T> = DbInsertResult<T>;

/**
 * Supabase delete result
 */
export type DbDeleteResult = {
  error: {
    message: string;
    code: string;
    details?: unknown;
    hint?: string;
  } | null;
};

/**
 * Database table names
 */
export type TableName =
  | 'clinics'
  | 'users'
  | 'patients'
  | 'doctors'
  | 'appointments'
  | 'invoices'
  | 'payments'
  | 'medical_records'
  | 'prescriptions'
  | 'activity_logs';

/**
 * Generic database table type
 */
export type DatabaseTable<T> = {
  [K in TableName]: T;
};
