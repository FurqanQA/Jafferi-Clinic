import { getSupabaseClient } from './client';
import { DatabaseError, NotFoundError } from './errors';
import { logger } from '../shared/logger';

/**
 * Soft delete a record
 * @param table - Table name
 * @param recordId - Record ID
 * @returns Deleted record
 */
export async function softDelete(table: string, recordId: string): Promise<any> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from(table)
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        status: 'inactive',
      })
      .eq('id', recordId)
      .select()
      .single();

    if (error) {
      logger.error(`Failed to delete record from ${table}`, { error, recordId });
      throw new DatabaseError(`Failed to delete record`, { error });
    }

    if (!data) {
      throw new NotFoundError('Record not found');
    }

    logger.info(`Record deleted successfully from ${table}`, { recordId });
    return data;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error(`Unexpected error deleting record from ${table}`, { error, recordId });
    throw new DatabaseError(`Failed to delete record`, { error });
  }
}

/**
 * Restore a soft-deleted record
 * @param table - Table name
 * @param recordId - Record ID
 * @returns Restored record
 */
export async function restoreRecord(table: string, recordId: string): Promise<any> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from(table)
      .update({
        deleted_at: null,
        is_active: true,
        status: 'active',
      })
      .eq('id', recordId)
      .select()
      .single();

    if (error) {
      logger.error(`Failed to restore record from ${table}`, { error, recordId });
      throw new DatabaseError(`Failed to restore record`, { error });
    }

    if (!data) {
      throw new NotFoundError('Record not found');
    }

    logger.info(`Record restored successfully from ${table}`, { recordId });
    return data;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error(`Unexpected error restoring record from ${table}`, { error, recordId });
    throw new DatabaseError(`Failed to restore record`, { error });
  }
}

/**
 * Archive a record (set status to archived)
 * @param table - Table name
 * @param recordId - Record ID
 * @returns Archived record
 */
export async function archiveRecord(table: string, recordId: string): Promise<any> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from(table)
      .update({
        status: 'archived',
        availability: 'unavailable',
      })
      .eq('id', recordId)
      .select()
      .single();

    if (error) {
      logger.error(`Failed to archive record from ${table}`, { error, recordId });
      throw new DatabaseError(`Failed to archive record`, { error });
    }

    if (!data) {
      throw new NotFoundError('Record not found');
    }

    logger.info(`Record archived successfully from ${table}`, { recordId });
    return data;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error(`Unexpected error archiving record from ${table}`, { error, recordId });
    throw new DatabaseError(`Failed to archive record`, { error });
  }
}

/**
 * Get single record by ID with clinic isolation
 * @param table - Table name
 * @param recordId - Record ID
 * @param includeDeleted - Whether to include deleted records
 * @returns Record
 */
export async function getRecordById(
  table: string,
  recordId: string,
  includeDeleted: boolean = false
): Promise<any> {
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from(table)
      .select('*')
      .eq('id', recordId);

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query.single();

    if (error) {
      logger.error(`Failed to fetch record from ${table}`, { error, recordId });
      throw new DatabaseError(`Failed to fetch record`, { error });
    }

    if (!data) {
      throw new NotFoundError('Record not found');
    }

    return data;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error(`Unexpected error fetching record from ${table}`, { error, recordId });
    throw new DatabaseError(`Failed to fetch record`, { error });
  }
}

/**
 * Build update object with only provided fields
 * @param input - Input object
 * @param fields - Array of field names to include
 * @returns Update object with only non-undefined fields
 */
export function buildUpdateObject(input: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};

  for (const field of fields) {
    if (input[field] !== undefined) {
      updateData[field] = input[field];
    }
  }

  return updateData;
}
