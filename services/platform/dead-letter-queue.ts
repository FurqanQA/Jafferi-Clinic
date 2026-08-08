import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Dead Letter Queue Manager
// Management of failed jobs that need manual intervention
// ============================================================================

/**
 * Dead Letter Message interface
 */
export interface DeadLetterMessage {
  id: string;
  originalJobId: string;
  queueName: string;
  payload: Record<string, unknown>;
  error: string;
  errorType: string;
  stackTrace: string | null;
  attempts: number;
  failedAt: string;
  reason: string;
  metadata: Record<string, unknown>;
  isResolved: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Add message to dead letter queue
 */
export async function addToDeadLetterQueue(data: {
  originalJobId: string;
  queueName: string;
  payload: Record<string, unknown>;
  error: string;
  errorType: string;
  stackTrace?: string | null;
  attempts: number;
  reason: string;
  metadata?: Record<string, unknown>;
}): Promise<DeadLetterMessage> {
  try {
    const supabase = getSupabaseClient();

    const messageId = `dlq-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: message, error } = await supabase
      .from('dead_letter_queue')
      .insert({
        id: messageId,
        original_job_id: data.originalJobId,
        queue_name: data.queueName,
        payload: data.payload,
        error: data.error,
        error_type: data.errorType,
        stack_trace: data.stackTrace || null,
        attempts: data.attempts,
        failed_at: now,
        reason: data.reason,
        metadata: data.metadata || {},
        is_resolved: false,
        resolved_at: null,
        resolved_by: null,
        resolution_notes: null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to add to dead letter queue', { error, data });
      throw new DatabaseError('Failed to add to dead letter queue', { error });
    }

    logger.warn('Message added to dead letter queue', { messageId, queueName: data.queueName });

    // Invalidate cache
    cache.delete('dlq:all');
    cache.delete(`dlq:queue:${data.queueName}`);

    return message as DeadLetterMessage;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error adding to dead letter queue', { error, data });
    throw new DatabaseError('Failed to add to dead letter queue', { error });
  }
}

/**
 * Get dead letter message by ID
 */
export async function getDeadLetterMessage(messageId: string): Promise<DeadLetterMessage> {
  try {
    const supabase = getSupabaseClient();

    const { data: message, error } = await supabase
      .from('dead_letter_queue')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error) {
      logger.error('Failed to fetch dead letter message', { error, messageId });
      throw new DatabaseError('Failed to fetch dead letter message', { error });
    }

    if (!message) {
      throw new NotFoundError('Dead letter message not found');
    }

    return message as DeadLetterMessage;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching dead letter message', { error, messageId });
    throw new DatabaseError('Failed to fetch dead letter message', { error });
  }
}

/**
 * List dead letter messages
 */
export async function listDeadLetterMessages(options: {
  page?: number;
  pageSize?: number;
  queueName?: string;
  isResolved?: boolean;
  errorType?: string;
  search?: string;
}): Promise<{ messages: DeadLetterMessage[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, queueName, isResolved, errorType, search } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('dead_letter_queue')
      .select('*', { count: 'exact' });

    if (queueName) {
      query = query.eq('queue_name', queueName);
    }

    if (isResolved !== undefined) {
      query = query.eq('is_resolved', isResolved);
    }

    if (errorType) {
      query = query.eq('error_type', errorType);
    }

    if (search) {
      query = query.or(`error.ilike.%${search}%,reason.ilike.%${search}%,queue_name.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: messages, error, count } = await query
      .range(from, to)
      .order('failed_at', { ascending: false });

    if (error) {
      logger.error('Failed to list dead letter messages', { error });
      throw new DatabaseError('Failed to list dead letter messages', { error });
    }

    return {
      messages: (messages || []) as DeadLetterMessage[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing dead letter messages', { error });
    throw new DatabaseError('Failed to list dead letter messages', { error });
  }
}

/**
 * Get unresolved messages
 */
export async function getUnresolvedMessages(options: {
  page?: number;
  pageSize?: number;
  queueName?: string;
}): Promise<{ messages: DeadLetterMessage[]; total: number; page: number; pageSize: number }> {
  return listDeadLetterMessages({ ...options, isResolved: false });
}

/**
 * Resolve dead letter message
 */
export async function resolveDeadLetterMessage(messageId: string, data: {
  resolvedBy: string;
  resolutionNotes: string;
}): Promise<DeadLetterMessage> {
  try {
    await validatePlatformWritePermission(PlatformResource.JOBS);

    const supabase = getSupabaseClient();

    const { data: message, error } = await supabase
      .from('dead_letter_queue')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: data.resolvedBy,
        resolution_notes: data.resolutionNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to resolve dead letter message', { error, messageId });
      throw new DatabaseError('Failed to resolve dead letter message', { error });
    }

    if (!message) {
      throw new NotFoundError('Dead letter message not found');
    }

    logger.info('Dead letter message resolved', { messageId });

    // Invalidate cache
    cache.delete('dlq:all');
    cache.delete(`dlq:queue:${message.queue_name}`);

    return message as DeadLetterMessage;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error resolving dead letter message', { error, messageId });
    throw new DatabaseError('Failed to resolve dead letter message', { error });
  }
}

/**
 * Retry dead letter message
 */
export async function retryDeadLetterMessage(messageId: string): Promise<DeadLetterMessage> {
  try {
    await validatePlatformWritePermission(PlatformResource.JOBS);

    const message = await getDeadLetterMessage(messageId);

    // Re-add job to queue
    const { addJob } = await import('./queue-manager');
    await addJob(message.queueName, {
      type: 'retry',
      payload: message.payload,
    });

    // Mark as resolved
    return resolveDeadLetterMessage(messageId, {
      resolvedBy: 'system',
      resolutionNotes: 'Message requeued for retry',
    });
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error retrying dead letter message', { error, messageId });
    throw new DatabaseError('Failed to retry dead letter message', { error });
  }
}

/**
 * Delete dead letter message
 */
export async function deleteDeadLetterMessage(messageId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.JOBS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('dead_letter_queue')
      .delete()
      .eq('id', messageId);

    if (error) {
      logger.error('Failed to delete dead letter message', { error, messageId });
      throw new DatabaseError('Failed to delete dead letter message', { error });
    }

    logger.info('Dead letter message deleted', { messageId });
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting dead letter message', { error, messageId });
    throw new DatabaseError('Failed to delete dead letter message', { error });
  }
}

/**
 * Get messages by queue
 */
export async function getMessagesByQueue(queueName: string, options: {
  page?: number;
  pageSize?: number;
  isResolved?: boolean;
}): Promise<{ messages: DeadLetterMessage[]; total: number; page: number; pageSize: number }> {
  return listDeadLetterMessages({ ...options, queueName });
}

/**
 * Get messages by error type
 */
export async function getMessagesByErrorType(errorType: string, options: {
  page?: number;
  pageSize?: number;
  isResolved?: boolean;
}): Promise<{ messages: DeadLetterMessage[]; total: number; page: number; pageSize: number }> {
  return listDeadLetterMessages({ ...options, errorType });
}

/**
 * Get dead letter queue statistics
 */
export async function getDeadLetterStatistics(): Promise<{
  total: number;
  unresolved: number;
  resolved: number;
  byQueue: Record<string, number>;
  byErrorType: Record<string, number>;
  averageAttempts: number;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data: messages } = await supabase
      .from('dead_letter_queue')
      .select('queue_name, error_type, attempts, is_resolved');

    if (!messages || messages.length === 0) {
      return {
        total: 0,
        unresolved: 0,
        resolved: 0,
        byQueue: {},
        byErrorType: {},
        averageAttempts: 0,
      };
    }

    const stats = {
      total: messages.length,
      unresolved: 0,
      resolved: 0,
      byQueue: {} as Record<string, number>,
      byErrorType: {} as Record<string, number>,
      averageAttempts: 0,
    };

    let totalAttempts = 0;

    for (const message of messages) {
      if (message.is_resolved) {
        stats.resolved++;
      } else {
        stats.unresolved++;
      }

      stats.byQueue[message.queue_name] = (stats.byQueue[message.queue_name] || 0) + 1;
      stats.byErrorType[message.error_type] = (stats.byErrorType[message.error_type] || 0) + 1;
      totalAttempts += message.attempts;
    }

    stats.averageAttempts = messages.length > 0 ? totalAttempts / messages.length : 0;

    return stats;
  } catch (error) {
    logger.error('Failed to get dead letter statistics', { error });
    throw new DatabaseError('Failed to get dead letter statistics', { error });
  }
}

/**
 * Get error types
 */
export async function getErrorTypes(): Promise<string[]> {
  try {
    const cacheKey = 'dlq:error-types';
    const cached = cache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: messages } = await supabase
      .from('dead_letter_queue')
      .select('error_type');

    const errorTypes = new Set<string>();
    for (const message of messages || []) {
      errorTypes.add(message.error_type);
    }

    const result = Array.from(errorTypes);
    cache.set(cacheKey, result, cacheHelpers.ttl.LONG);
    return result;
  } catch (error) {
    logger.error('Failed to get error types', { error });
    throw new DatabaseError('Failed to get error types', { error });
  }
}

/**
 * Get affected queues
 */
export async function getAffectedQueues(): Promise<string[]> {
  try {
    const cacheKey = 'dlq:queues';
    const cached = cache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: messages } = await supabase
      .from('dead_letter_queue')
      .select('queue_name');

    const queues = new Set<string>();
    for (const message of messages || []) {
      queues.add(message.queue_name);
    }

    const result = Array.from(queues);
    cache.set(cacheKey, result, cacheHelpers.ttl.LONG);
    return result;
  } catch (error) {
    logger.error('Failed to get affected queues', { error });
    throw new DatabaseError('Failed to get affected queues', { error });
  }
}

/**
 * Bulk resolve messages
 */
export async function bulkResolveMessages(messageIds: string[], data: {
  resolvedBy: string;
  resolutionNotes: string;
}): Promise<number> {
  try {
    await validatePlatformWritePermission(PlatformResource.JOBS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('dead_letter_queue')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: data.resolvedBy,
        resolution_notes: data.resolutionNotes,
        updated_at: new Date().toISOString(),
      })
      .in('id', messageIds);

    if (error) {
      logger.error('Failed to bulk resolve messages', { error });
      throw new DatabaseError('Failed to bulk resolve messages', { error });
    }

    logger.info('Bulk resolved dead letter messages', { count: messageIds.length });

    // Invalidate cache
    cache.delete('dlq:all');

    return messageIds.length;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error bulk resolving messages', { error });
    throw new DatabaseError('Failed to bulk resolve messages', { error });
  }
}

/**
 * Cleanup old resolved messages
 */
export async function cleanupOldMessages(daysOld: number = 30): Promise<number> {
  try {
    await validatePlatformWritePermission(PlatformResource.JOBS);

    const supabase = getSupabaseClient();
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('dead_letter_queue')
      .delete()
      .eq('is_resolved', true)
      .lt('resolved_at', cutoffDate);

    if (error) {
      logger.error('Failed to cleanup old messages', { error, daysOld });
      throw new DatabaseError('Failed to cleanup old messages', { error });
    }

    logger.info('Old resolved messages cleaned up', { daysOld });

    // Invalidate cache
    cache.delete('dlq:all');

    return 0; // Return count if needed
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error cleaning up old messages', { error, daysOld });
    throw new DatabaseError('Failed to cleanup old messages', { error });
  }
}

/**
 * Get recent failures
 */
export async function getRecentFailures(hours: number = 24): Promise<DeadLetterMessage[]> {
  try {
    const supabase = getSupabaseClient();
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data: messages, error } = await supabase
      .from('dead_letter_queue')
      .select('*')
      .eq('is_resolved', false)
      .gte('failed_at', cutoffDate)
      .order('failed_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('Failed to get recent failures', { error });
      throw new DatabaseError('Failed to get recent failures', { error });
    }

    return (messages || []) as DeadLetterMessage[];
  } catch (error) {
    logger.error('Unexpected error getting recent failures', { error });
    throw new DatabaseError('Failed to get recent failures', { error });
  }
}
