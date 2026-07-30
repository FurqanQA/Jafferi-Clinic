/**
 * Common utility types
 */

/**
 * UUID type
 */
export type UUID = string;

/**
 * Timestamp type
 */
export type Timestamp = string;

/**
 * Date range
 */
export interface DateRange {
  from: string | Date;
  to: string | Date;
}

/**
 * Entity with timestamps
 */
export interface Timestamped {
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Entity with ID
 */
export interface WithId {
  id: UUID;
}

/**
 * Entity with clinic ID
 */
export interface WithClinicId {
  clinic_id: UUID;
}

/**
 * Entity with user ID
 */
export interface WithUserId {
  user_id: UUID;
}

/**
 * Soft deletable entity
 */
export interface SoftDeletable {
  deleted_at: Timestamp | null;
}

/**
 * Active status
 */
export interface WithActiveStatus {
  is_active: boolean;
}

/**
 * Status enum
 */
export type Status = 'active' | 'inactive' | 'pending' | 'archived';

/**
 * Generic entity with common fields
 */
export interface BaseEntity extends WithId, Timestamped {
  clinic_id: UUID;
}

/**
 * Select fields type
 */
export type SelectFields<T, K extends keyof T> = Pick<T, K>;

/**
 * Omit fields type
 */
export type OmitFields<T, K extends keyof T> = Omit<T, K>;
