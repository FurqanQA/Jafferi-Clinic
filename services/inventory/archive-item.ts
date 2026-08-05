import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { InventoryRequestOptions } from './inventory-types';
import { validateWarehouseAccess, validateClinicIsolation, validateStockOperation } from './inventory-permissions';

// ============================================================================
// Archive Item
// Generic item archival handler for all inventory entities
// ============================================================================

/**
 * Archive any inventory item
 */
export async function archiveItem(
  itemType: string,
  id: string,
  archivedBy: string,
  options?: InventoryRequestOptions
): Promise<{ id: string; type: string; archivedAt: string }> {
  const clinicId = options?.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('write');

  try {
    // Placeholder for actual item archival logic
    
    logger.info('Item archived', { id, itemType, archivedBy, clinicId });
    return {
      id,
      type: itemType,
      archivedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to archive item', { error, itemType, id, clinicId });
    throw error;
  }
}

/**
 * Archive multiple items in batch
 */
export async function archiveItemsBatch(
  items: Array<{ itemType: string; id: string }>,
  archivedBy: string,
  options?: InventoryRequestOptions
): Promise<{ archived: number; failed: number; errors: string[] }> {
  const clinicId = options?.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('write');

  try {
    // Placeholder for actual batch archival logic
    let archived = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        await archiveItem(item.itemType, item.id, archivedBy, options);
        archived++;
      } catch (error) {
        failed++;
        errors.push(`${item.itemType}:${item.id} - ${error}`);
      }
    }

    logger.info('Batch items archived', { archived, failed, clinicId });
    return { archived, failed, errors };
  } catch (error) {
    logger.error('Failed to archive items batch', { error, clinicId });
    throw error;
  }
}
