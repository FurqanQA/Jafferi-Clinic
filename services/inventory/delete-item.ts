import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { InventoryRequestOptions } from './inventory-types';
import { validateWarehouseAccess, validateClinicIsolation, validateStockOperation } from './inventory-permissions';

// ============================================================================
// Delete Item
// Generic item deletion handler for all inventory entities
// ============================================================================

/**
 * Delete any inventory item
 */
export async function deleteItem(
  itemType: string,
  id: string,
  deletedBy: string,
  options?: InventoryRequestOptions
): Promise<{ id: string; type: string; deletedAt: string }> {
  const clinicId = options?.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('write');

  try {
    // Placeholder for actual item deletion logic
    
    logger.info('Item deleted', { id, itemType, deletedBy, clinicId });
    return {
      id,
      type: itemType,
      deletedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to delete item', { error, itemType, id, clinicId });
    throw error;
  }
}

/**
 * Delete multiple items in batch
 */
export async function deleteItemsBatch(
  items: Array<{ itemType: string; id: string }>,
  deletedBy: string,
  options?: InventoryRequestOptions
): Promise<{ deleted: number; failed: number; errors: string[] }> {
  const clinicId = options?.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('write');

  try {
    // Placeholder for actual batch deletion logic
    let deleted = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        await deleteItem(item.itemType, item.id, deletedBy, options);
        deleted++;
      } catch (error) {
        failed++;
        errors.push(`${item.itemType}:${item.id} - ${error}`);
      }
    }

    logger.info('Batch items deleted', { deleted, failed, clinicId });
    return { deleted, failed, errors };
  } catch (error) {
    logger.error('Failed to delete items batch', { error, clinicId });
    throw error;
  }
}
