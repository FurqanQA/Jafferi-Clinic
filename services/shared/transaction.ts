import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';

/**
 * Transaction result
 */
export interface TransactionResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Execute a database transaction
 * Note: This is a wrapper for future transaction implementation
 * Currently Supabase JS client doesn't support client-side transactions
 * This will be used with Supabase RPC functions or server-side transactions
 */
export async function executeTransaction<T>(
  operations: () => Promise<T>
): Promise<TransactionResult<T>> {
  try {
    const data = await operations();
    return { data, error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { data: null, error: err };
  }
}

/**
 * Execute multiple operations atomically using RPC
 * This requires creating PostgreSQL functions that handle transactions
 */
export async function executeRpcTransaction<T>(
  functionName: string,
  params: Record<string, unknown>
): Promise<TransactionResult<T>> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
      throw new DatabaseError(`RPC transaction failed: ${error.message}`, { error });
    }
    
    return { data, error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { data: null, error: err };
  }
}

/**
 * Batch operations helper
 * Executes multiple operations and returns combined results
 */
export async function batchOperations<T>(
  operations: (() => Promise<T>)[]
): Promise<{ results: T[]; errors: Error[] }> {
  const results: T[] = [];
  const errors: Error[] = [];

  await Promise.all(
    operations.map(async (operation) => {
      try {
        const result = await operation();
        results.push(result);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push(err);
      }
    })
  );

  return { results, errors };
}

/**
 * Sequential operations helper
 * Executes operations one after another, stopping on first error
 */
export async function sequentialOperations<T>(
  operations: (() => Promise<T>)[]
): Promise<{ results: T[]; error: Error | null }> {
  const results: T[] = [];

  for (const operation of operations) {
    try {
      const result = await operation();
      results.push(result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      return { results, error: err };
    }
  }

  return { results, error: null };
}
