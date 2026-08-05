import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { StockMovement, InventoryRequestOptions } from './inventory-types';
import { validateStockMovement } from './inventory-validation';
import { validateWarehouseAccess, validateClinicIsolation, validateStockOperation } from './inventory-permissions';

// ============================================================================
// Stock Movement
// Management of stock movement records (in, out, transfer, adjustment, damage, loss, expiry, disposal, reservation)
// ============================================================================

/**
 * Create stock movement
 */
export async function createStockMovement(
  data: Omit<StockMovement, 'id' | 'createdAt' | 'updatedAt'>
): Promise<StockMovement> {
  const clinicId = data.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('write');

  const validation = validateStockMovement(data);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
  }

  try {
    // Placeholder for actual database insert
    const movement: StockMovement = {
      id: `MOV-${Date.now()}`,
      ...data,
      clinicId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    logger.info('Stock movement created', { id: movement.id, clinicId });
    return movement;
  } catch (error) {
    logger.error('Failed to create stock movement', { error, clinicId });
    throw error;
  }
}

/**
 * Get stock movement by ID
 */
export async function getStockMovement(
  id: string,
  options?: InventoryRequestOptions
): Promise<StockMovement | null> {
  const clinicId = options?.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('read');

  try {
    // Placeholder for actual database query
    logger.info('Stock movement retrieved', { id, clinicId });
    return null;
  } catch (error) {
    logger.error('Failed to get stock movement', { error, id, clinicId });
    throw error;
  }
}

/**
 * Get stock movements with filtering and pagination
 */
export async function getStockMovements(
  options?: InventoryRequestOptions
): Promise<{ items: StockMovement[]; total: number; limit: number; offset: number }> {
  const clinicId = options?.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('read');

  try {
    // Placeholder for actual database query
    const items: StockMovement[] = [];
    const total = 0;
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    logger.info('Stock movements retrieved', { clinicId, count: items.length, total });
    return { items, total, limit, offset };
  } catch (error) {
    logger.error('Failed to get stock movements', { error, clinicId });
    throw error;
  }
}

/**
 * Get stock movements by medicine
 */
export async function getStockMovementsByMedicine(
  medicineId: string,
  options?: InventoryRequestOptions
): Promise<StockMovement[]> {
  const clinicId = options?.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('read');

  try {
    // Placeholder for actual database query
    const items: StockMovement[] = [];

    logger.info('Stock movements by medicine retrieved', { medicineId, clinicId, count: items.length });
    return items;
  } catch (error) {
    logger.error('Failed to get stock movements by medicine', { error, medicineId, clinicId });
    throw error;
  }
}

/**
 * Get stock movements by type
 */
export async function getStockMovementsByType(
  movementType: string,
  options?: InventoryRequestOptions
): Promise<StockMovement[]> {
  const clinicId = options?.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('read');

  try {
    // Placeholder for actual database query
    const items: StockMovement[] = [];

    logger.info('Stock movements by type retrieved', { movementType, clinicId, count: items.length });
    return items;
  } catch (error) {
    logger.error('Failed to get stock movements by type', { error, movementType, clinicId });
    throw error;
  }
}

/**
 * Get stock movements by date range
 */
export async function getStockMovementsByDateRange(
  startDate: string,
  endDate: string,
  options?: InventoryRequestOptions
): Promise<StockMovement[]> {
  const clinicId = options?.clinicId || await getUserClinicId();
  
  await validateWarehouseAccess(clinicId);
  await validateStockOperation('read');

  try {
    // Placeholder for actual database query
    const items: StockMovement[] = [];

    logger.info('Stock movements by date range retrieved', { startDate, endDate, clinicId, count: items.length });
    return items;
  } catch (error) {
    logger.error('Failed to get stock movements by date range', { error, startDate, endDate, clinicId });
    throw error;
  }
}
