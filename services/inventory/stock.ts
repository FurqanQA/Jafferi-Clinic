import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { Stock, InventoryRequestOptions } from './inventory-types';
import { validateStock } from './inventory-validation';
import { validateWarehouseAccess, validateClinicIsolation, validateStockOperation } from './inventory-permissions';

// ============================================================================
// Stock
// Management of stock records (available, reserved, dispensed, returned, damaged, expired, transferred quantities)
// ============================================================================

/**
 * Create stock record
 */
export async function createStock(
  data: Omit<Stock, 'id' | 'createdAt' | 'updatedAt' | 'version'>
): Promise<Stock> {
  const clinicId = data.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('write');

  const validation = validateStock(data);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
  }

  try {
    // Placeholder for actual database insert
    const stock: Stock = {
      id: `STK-${Date.now()}`,
      ...data,
      clinicId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    logger.info('Stock record created', { id: stock.id, clinicId });
    return stock;
  } catch (error) {
    logger.error('Failed to create stock record', { error, clinicId });
    throw error;
  }
}

/**
 * Get stock by ID
 */
export async function getStock(
  id: string,
  options?: InventoryRequestOptions
): Promise<Stock | null> {
  const clinicId = options?.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('read');

  try {
    // Placeholder for actual database query
    logger.info('Stock retrieved', { id, clinicId });
    return null;
  } catch (error) {
    logger.error('Failed to get stock', { error, id, clinicId });
    throw error;
  }
}

/**
 * Get stock records with filtering and pagination
 */
export async function getStockRecords(
  options?: InventoryRequestOptions
): Promise<{ items: Stock[]; total: number; limit: number; offset: number }> {
  const clinicId = options?.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('read');

  try {
    // Placeholder for actual database query
    const items: Stock[] = [];
    const total = 0;
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    logger.info('Stock records retrieved', { clinicId, count: items.length, total });
    return { items, total, limit, offset };
  } catch (error) {
    logger.error('Failed to get stock records', { error, clinicId });
    throw error;
  }
}

/**
 * Update stock record
 */
export async function updateStock(
  id: string,
  data: Partial<Omit<Stock, 'id' | 'clinicId' | 'createdAt' | 'version'>>,
  options?: InventoryRequestOptions
): Promise<Stock> {
  const clinicId = options?.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('write');

  try {
    // Placeholder for actual database update
    const stock: Stock = {
      id,
      clinicId,
      warehouseId: data.warehouseId || '',
      locationId: data.locationId,
      medicineId: data.medicineId || '',
      batchNumber: data.batchNumber,
      expiryDate: data.expiryDate,
      manufacturingDate: data.manufacturingDate,
      serialNumber: data.serialNumber,
      availableQuantity: data.availableQuantity ?? 0,
      reservedQuantity: data.reservedQuantity ?? 0,
      dispensedQuantity: data.dispensedQuantity ?? 0,
      returnedQuantity: data.returnedQuantity ?? 0,
      damagedQuantity: data.damagedQuantity ?? 0,
      expiredQuantity: data.expiredQuantity ?? 0,
      transferredQuantity: data.transferredQuantity ?? 0,
      openingBalance: data.openingBalance ?? 0,
      closingBalance: data.closingBalance ?? 0,
      costPrice: data.costPrice ?? 0,
      sellingPrice: data.sellingPrice ?? 0,
      supplierId: data.supplierId,
      purchaseOrderId: data.purchaseOrderId,
      expiryStatus: data.expiryStatus || 'ACTIVE',
      isActive: data.isActive ?? true,
      notes: data.notes,
      createdBy: data.createdBy || '',
      updatedBy: data.updatedBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    logger.info('Stock record updated', { id, clinicId });
    return stock;
  } catch (error) {
    logger.error('Failed to update stock record', { error, id, clinicId });
    throw error;
  }
}

/**
 * Delete stock record
 */
export async function deleteStock(
  id: string,
  options?: InventoryRequestOptions
): Promise<void> {
  const clinicId = options?.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('delete');

  try {
    // Placeholder for actual database delete
    logger.info('Stock record deleted', { id, clinicId });
  } catch (error) {
    logger.error('Failed to delete stock record', { error, id, clinicId });
    throw error;
  }
}

/**
 * Get stock by medicine
 */
export async function getStockByMedicine(
  medicineId: string,
  options?: InventoryRequestOptions
): Promise<Stock[]> {
  const clinicId = options?.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('read');

  try {
    // Placeholder for actual database query
    const items: Stock[] = [];

    logger.info('Stock by medicine retrieved', { medicineId, clinicId, count: items.length });
    return items;
  } catch (error) {
    logger.error('Failed to get stock by medicine', { error, medicineId, clinicId });
    throw error;
  }
}

/**
 * Get stock by warehouse
 */
export async function getStockByWarehouse(
  warehouseId: string,
  options?: InventoryRequestOptions
): Promise<Stock[]> {
  const clinicId = options?.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('read');

  try {
    // Placeholder for actual database query
    const items: Stock[] = [];

    logger.info('Stock by warehouse retrieved', { warehouseId, clinicId, count: items.length });
    return items;
  } catch (error) {
    logger.error('Failed to get stock by warehouse', { error, warehouseId, clinicId });
    throw error;
  }
}

/**
 * Get stock by batch
 */
export async function getStockByBatch(
  batchNumber: string,
  options?: InventoryRequestOptions
): Promise<Stock[]> {
  const clinicId = options?.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('read');

  try {
    // Placeholder for actual database query
    const items: Stock[] = [];

    logger.info('Stock by batch retrieved', { batchNumber, clinicId, count: items.length });
    return items;
  } catch (error) {
    logger.error('Failed to get stock by batch', { error, batchNumber, clinicId });
    throw error;
  }
}

/**
 * Adjust stock quantity
 */
export async function adjustStockQuantity(
  id: string,
  quantityDelta: number,
  reason: string,
  options?: InventoryRequestOptions
): Promise<Stock> {
  const clinicId = options?.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('write');

  try {
    // Placeholder for actual stock adjustment
    const existing = await getStock(id, options);
    if (!existing) {
      throw new Error('Stock record not found');
    }

    const updated = await updateStock(id, {
      availableQuantity: Math.max(0, existing.availableQuantity + quantityDelta),
      closingBalance: Math.max(0, existing.closingBalance + quantityDelta),
    }, options);

    logger.info('Stock quantity adjusted', { id, quantityDelta, reason, clinicId });
    return updated;
  } catch (error) {
    logger.error('Failed to adjust stock quantity', { error, id, quantityDelta, clinicId });
    throw error;
  }
}
