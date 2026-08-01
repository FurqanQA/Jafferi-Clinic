import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { NotificationPriority, QueueJob } from './notification-types';

// ============================================================================
// Queue Manager
// Manages notification queue with priority support
// Placeholder for future Redis/BullMQ integration
// ============================================================================

/**
 * In-memory queue storage (placeholder for Redis/BullMQ)
 * In production, this should be replaced with a proper queue system
 */
const queueStore: Map<string, QueueJob> = new Map();

/**
 * Generate queue job ID
 */
function generateQueueJobId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `QJOB${timestamp}${random}`;
}

/**
 * Add notification to queue
 */
export async function queueNotification(
  notificationId: string,
  priority: NotificationPriority = 'normal',
  scheduledAt?: string
): Promise<QueueJob> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const jobId = generateQueueJobId();
    const now = new Date().toISOString();

    const job: QueueJob = {
      id: jobId,
      notification_id: notificationId,
      priority,
      scheduled_at: scheduledAt,
      attempts: 0,
      max_attempts: 3,
      next_attempt_at: scheduledAt || now,
      status: 'pending',
      created_at: now,
      updated_at: now,
    };

    // Store in memory (placeholder for Redis)
    queueStore.set(jobId, job);

    // Also store in database for persistence
    const { data, error } = await supabase
      .from('queue_jobs')
      .insert({
        id: jobId,
        notification_id: notificationId,
        priority,
        scheduled_at: scheduledAt,
        attempts: 0,
        max_attempts: 3,
        next_attempt_at: scheduledAt || now,
        status: 'pending',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to queue notification', { error, notificationId });
      throw new DatabaseError('Failed to queue notification', { error });
    }

    logger.info('Notification queued successfully', { jobId, notificationId, priority });
    return data as QueueJob;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error queuing notification', { error, notificationId });
    throw new DatabaseError('Failed to queue notification', { error });
  }
}

/**
 * Bulk queue notifications
 */
export async function bulkQueueNotifications(
  items: Array<{ notificationId: string; priority?: NotificationPriority; scheduledAt?: string }>
): Promise<QueueJob[]> {
  const jobs: QueueJob[] = [];

  for (const item of items) {
    const job = await queueNotification(item.notificationId, item.priority, item.scheduledAt);
    jobs.push(job);
  }

  logger.info('Bulk notifications queued successfully', { count: jobs.length });
  return jobs;
}

/**
 * Get next job from queue (priority-based)
 */
export async function getNextJob(): Promise<QueueJob | null> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  try {
    // Fetch pending jobs ordered by priority and creation time
    const priorityOrder = { critical: 1, urgent: 2, high: 3, normal: 4, low: 5 };

    const { data: jobs, error } = await supabase
      .from('queue_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('next_attempt_at', now)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      logger.error('Failed to fetch next job', { error });
      throw new DatabaseError('Failed to fetch next job', { error });
    }

    if (!jobs || jobs.length === 0) {
      return null;
    }

    // Sort by priority
    const sortedJobs = (jobs as QueueJob[]).sort((a, b) => {
      const priorityA = priorityOrder[a.priority] || 999;
      const priorityB = priorityOrder[b.priority] || 999;
      return priorityA - priorityB;
    });

    return sortedJobs[0];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching next job', { error });
    throw new DatabaseError('Failed to fetch next job', { error });
  }
}

/**
 * Mark job as processing
 */
export async function markJobAsProcessing(jobId: string): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('queue_jobs')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      logger.error('Failed to mark job as processing', { error, jobId });
      throw new DatabaseError('Failed to mark job as processing', { error });
    }

    // Update in-memory store
    const job = queueStore.get(jobId);
    if (job) {
      job.status = 'processing';
      job.updated_at = new Date().toISOString();
      queueStore.set(jobId, job);
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error marking job as processing', { error, jobId });
    throw new DatabaseError('Failed to mark job as processing', { error });
  }
}

/**
 * Mark job as completed
 */
export async function markJobAsCompleted(jobId: string): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('queue_jobs')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      logger.error('Failed to mark job as completed', { error, jobId });
      throw new DatabaseError('Failed to mark job as completed', { error });
    }

    // Remove from in-memory store
    queueStore.delete(jobId);
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error marking job as completed', { error, jobId });
    throw new DatabaseError('Failed to mark job as completed', { error });
  }
}

/**
 * Mark job as failed
 */
export async function markJobAsFailed(jobId: string, errorMessage: string): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('queue_jobs')
      .update({
        status: 'failed',
        error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      logger.error('Failed to mark job as failed', { error, jobId });
      throw new DatabaseError('Failed to mark job as failed', { error });
    }

    // Remove from in-memory store
    queueStore.delete(jobId);
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error marking job as failed', { error, jobId });
    throw new DatabaseError('Failed to mark job as failed', { error });
  }
}

/**
 * Retry failed job
 */
export async function retryJob(jobId: string, delayMs: number = 5000): Promise<void> {
  const supabase = getSupabaseClient();
  const now = new Date();
  const nextAttemptAt = new Date(now.getTime() + delayMs).toISOString();

  try {
    // First fetch current job to get attempts
    const { data: currentJob } = await supabase
      .from('queue_jobs')
      .select('attempts')
      .eq('id', jobId)
      .single();

    const newAttempts = (currentJob?.attempts || 0) + 1;

    const { error } = await supabase
      .from('queue_jobs')
      .update({
        status: 'pending',
        attempts: newAttempts,
        next_attempt_at: nextAttemptAt,
        error: null,
        updated_at: now.toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      logger.error('Failed to retry job', { error, jobId });
      throw new DatabaseError('Failed to retry job', { error });
    }

    logger.info('Job queued for retry', { jobId, nextAttemptAt });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error retrying job', { error, jobId });
    throw new DatabaseError('Failed to retry job', { error });
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStatistics(): Promise<{
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  byPriority: Record<NotificationPriority, number>;
}> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data: jobs, error } = await supabase
      .from('queue_jobs')
      .select('*');

    if (error) {
      logger.error('Failed to fetch queue statistics', { error });
      throw new DatabaseError('Failed to fetch queue statistics', { error });
    }

    const byPriority: Record<NotificationPriority, number> = {
      low: 0,
      normal: 0,
      high: 0,
      urgent: 0,
      critical: 0,
    };

    let pending = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;

    (jobs || []).forEach((job: QueueJob) => {
      byPriority[job.priority] = (byPriority[job.priority] || 0) + 1;

      switch (job.status) {
        case 'pending':
          pending++;
          break;
        case 'processing':
          processing++;
          break;
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
      }
    });

    return {
      total: jobs?.length || 0,
      pending,
      processing,
      completed,
      failed,
      byPriority,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching queue statistics', { error });
    throw new DatabaseError('Failed to fetch queue statistics', { error });
  }
}

/**
 * Clear completed jobs
 */
export async function clearCompletedJobs(olderThanHours: number = 24): Promise<number> {
  const supabase = getSupabaseClient();
  const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabase
      .from('queue_jobs')
      .delete()
      .eq('status', 'completed')
      .lt('created_at', cutoffDate)
      .select();

    if (error) {
      logger.error('Failed to clear completed jobs', { error });
      throw new DatabaseError('Failed to clear completed jobs', { error });
    }

    const count = data?.length || 0;
    logger.info('Completed jobs cleared', { count });
    return count;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error clearing completed jobs', { error });
    throw new DatabaseError('Failed to clear completed jobs', { error });
  }
}

/**
 * Get job by ID
 */
export async function getJob(jobId: string): Promise<QueueJob | null> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('queue_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      return null;
    }

    return data as QueueJob;
  } catch (error) {
    logger.error('Unexpected error fetching job', { error, jobId });
    return null;
  }
}

/**
 * Get jobs by notification ID
 */
export async function getJobsByNotification(notificationId: string): Promise<QueueJob[]> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('queue_jobs')
      .select('*')
      .eq('notification_id', notificationId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch jobs by notification', { error, notificationId });
      throw new DatabaseError('Failed to fetch jobs by notification', { error });
    }

    return (data || []) as QueueJob[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching jobs by notification', { error, notificationId });
    throw new DatabaseError('Failed to fetch jobs by notification', { error });
  }
}

/**
 * Cancel job
 */
export async function cancelJob(jobId: string): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('queue_jobs')
      .update({
        status: 'failed',
        error: 'Cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      logger.error('Failed to cancel job', { error, jobId });
      throw new DatabaseError('Failed to cancel job', { error });
    }

    // Remove from in-memory store
    queueStore.delete(jobId);

    logger.info('Job cancelled', { jobId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error cancelling job', { error, jobId });
    throw new DatabaseError('Failed to cancel job', { error });
  }
}
