/**
 * Inventory Types
 * Centralized type definitions for inventory module
 */

/**
 * Inventory request options for pagination and filtering
 */
export interface InventoryRequestOptions {
  clinicId?: string;
  limit?: number;
  offset?: number;
}
