/**
 * Inventory Permissions
 * Permission validation functions for inventory module using core infrastructure
 */

import { createPermissionCheckers } from '../core/base-permissions';
import { AuthorizationError } from '../core/errors';

// Create inventory permission checkers
const inventoryPermissions = createPermissionCheckers('inventory' as const);

/**
 * Check if user can create inventory items
 */
export async function canCreateInventory(): Promise<boolean> {
  return inventoryPermissions.canCreate();
}

/**
 * Check if user can read inventory items
 */
export async function canReadInventory(): Promise<boolean> {
  return inventoryPermissions.canRead();
}

/**
 * Check if user can update inventory items
 */
export async function canUpdateInventory(): Promise<boolean> {
  return inventoryPermissions.canUpdate();
}

/**
 * Check if user can delete inventory items
 */
export async function canDeleteInventory(): Promise<boolean> {
  return inventoryPermissions.canDelete();
}

/**
 * Validate user has permission to create inventory items
 */
export async function validateInventoryCreate(): Promise<void> {
  await inventoryPermissions.validateCreate();
}

/**
 * Validate user has permission to read inventory items
 */
export async function validateInventoryRead(): Promise<void> {
  await inventoryPermissions.validateRead();
}

/**
 * Validate user has permission to update inventory items
 */
export async function validateInventoryUpdate(): Promise<void> {
  await inventoryPermissions.validateUpdate();
}

/**
 * Validate user has permission to delete inventory items
 */
export async function validateInventoryDelete(): Promise<void> {
  await inventoryPermissions.validateDelete();
}

/**
 * Validate warehouse access (clinic isolation for warehouses)
 */
export async function validateWarehouseAccess(warehouseId: string): Promise<void> {
  await inventoryPermissions.validateClinicAccess(warehouseId, 'warehouses');
}

/**
 * Validate stock operation permission
 */
export async function validateStockOperation(): Promise<void> {
  await inventoryPermissions.validateUpdate();
}

/**
 * Validate clinic isolation for inventory records
 */
export async function validateClinicIsolation(recordId: string, table: string): Promise<void> {
  await inventoryPermissions.validateClinicAccess(recordId, table);
}
