import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Queue Manager
// Job queue management and processing
// ============================================================================

/**
 * Queue interface
 */
export interface Queue {
  id: string;
  name: string;
  description: string;
  type: 'fifo' | 'lifo' | 'priority';
  maxRetries: number;
  timeout: number;
  isActive: boolean;
  concurrency: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Job interface
 */
export interface Job {
  id: string;
  queueId: string;
  type: string;
  payload: Record<string, unknown>;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  attempts: number;
  maxRetries: number;
  error: string | null;
  result: Record<string, unknown> | null;
  startedAt: string | null;
  completedAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a queue
 */
export async function createQueue(data: {
  name: string;
  description: string;
  type?: 'fifo' | 'lifo' | 'priority';
  maxRetries?: number;
  timeout?: number;
  concurrency?: number;
}): Promise<Queue> {
  try {
    await validatePlatformWritePermission(PlatformResource.JOBS);

    const supabase = getSupabaseClient();

    // Check if name is already taken
    const { data: existing } = await supabase
      .from('queues')
      .select('id')
      .eq('name', data.name)
      .single();

    if (existing) {
      throw new DatabaseError('Queue name already exists', { name: data.name });
    }

    // Create queue
    const queueId = `queue-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: queue, error } = await supabase
      .from('queues')
      .insert({
        id: queueId,
        name: data.name,
        description: data.description,
        type: data.type || 'fifo',
        max_retries: data.maxRetries || 3,
        timeout: data.timeout || 300000,
        is_active: true,
        concurrency: data.concurrency || 5,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create queue', { error, data });
      throw new DatabaseError('Failed to create queue', { error });
    }

    logger.info('Queue created successfully', { queueId, name: data.name });

    // Invalidate cache
    cache.delete(`queue:${queueId}`);
    cache.delete(`queue:name:${data.name}`);

    return queue as Queue;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating queue', { error, data });
    throw new DatabaseError('Failed to create queue', { error });
  }
}

/**
 * Update queue
 */
export async function updateQueue(queueId: string, data: {
  name?: string;
  description?: string;
  type?: 'fifo' | 'lifo' | 'priority';
  maxRetries?: number;
  timeout?: number;
  isActive?: boolean;
  concurrency?: number;
}): Promise<Queue> {
  try {
    await validatePlatformWritePermission(PlatformResource.JOBS);

    const supabase = getSupabaseClient();

    // Get current queue
    const { data: current } = await supabase
      .from('queues')
      .select('name')
      .eq('id', queueId)
      .single();

    if (!current) {
      throw new NotFoundError('Queue not found');
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.maxRetries !== undefined) updateData.max_retries = data.maxRetries;
    if (data.timeout !== undefined) updateData.timeout = data.timeout;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.concurrency !== undefined) updateData.concurrency = data.concurrency;

    const { data: queue, error } = await supabase
      .from('queues')
      .update(updateData)
      .eq('id', queueId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update queue', { error, queueId });
      throw new DatabaseError('Failed to update queue', { error });
    }

    if (!queue) {
      throw new NotFoundError('Queue not found');
    }

    logger.info('Queue updated successfully', { queueId });

    // Invalidate cache
    cache.delete(`queue:${queueId}`);
    cache.delete(`queue:name:${current.name}`);

    return queue as Queue;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating queue', { error, queueId });
    throw new DatabaseError('Failed to update queue', { error });
  }
}

/**
 * Delete queue
 */
export async function deleteQueue(queueId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.JOBS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('queues')
      .delete()
      .eq('id', queueId);

    if (error) {
      logger.error('Failed to delete queue', { error, queueId });
      throw new DatabaseError('Failed to delete queue', { error });
    }

    logger.info('Queue deleted successfully', { queueId });

    // Invalidate cache
    cache.delete(`queue:${queueId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting queue', { error, queueId });
    throw new DatabaseError('Failed to delete queue', { error });
  }
}

/**
 * Get queue by ID
 */
export async function getQueue(queueId: string): Promise<Queue> {
  try {
    // Check cache first
    const cached = cache.get<Queue>(`queue:${queueId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: queue, error } = await supabase
      .from('queues')
      .select('*')
      .eq('id', queueId)
      .single();

    if (error) {
      logger.error('Failed to fetch queue', { error, queueId });
      throw new DatabaseError('Failed to fetch queue', { error });
    }

    if (!queue) {
      throw new NotFoundError('Queue not found');
    }

    // Cache result
    cache.set(`queue:${queueId}`, queue, cacheHelpers.ttl.MEDIUM);

    return queue as Queue;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching queue', { error, queueId });
    throw new DatabaseError('Failed to fetch queue', { error });
  }
}

/**
 * Get queue by name
 */
export async function getQueueByName(name: string): Promise<Queue> {
  try {
    // Check cache first
    const cacheKey = `queue:name:${name}`;
    const cached = cache.get<Queue>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: queue, error } = await supabase
      .from('queues')
      .select('*')
      .eq('name', name)
      .single();

    if (error) {
      logger.error('Failed to fetch queue by name', { error, name });
      throw new DatabaseError('Failed to fetch queue', { error });
    }

    if (!queue) {
      throw new NotFoundError('Queue not found');
    }

    // Cache result
    cache.set(cacheKey, queue, cacheHelpers.ttl.MEDIUM);
    cache.set(`queue:${queue.id}`, queue, cacheHelpers.ttl.MEDIUM);

    return queue as Queue;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching queue by name', { error, name });
    throw new DatabaseError('Failed to fetch queue', { error });
  }
}

/**
 * List queues
 */
export async function listQueues(options: {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  search?: string;
}): Promise<{ queues: Queue[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, isActive, search } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('queues')
      .select('*', { count: 'exact' });

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: queues, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list queues', { error });
      throw new DatabaseError('Failed to list queues', { error });
    }

    return {
      queues: (queues || []) as Queue[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing queues', { error });
    throw new DatabaseError('Failed to list queues', { error });
  }
}

/**
 * Add job to queue
 */
export async function addJob(queueName: string, data: {
  type: string;
  payload: Record<string, unknown>;
  priority?: number;
  scheduledFor?: string;
}): Promise<Job> {
  try {
    const queue = await getQueueByName(queueName);

    const supabase = getSupabaseClient();

    const jobId = `job-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        id: jobId,
        queue_id: queue.id,
        type: data.type,
        payload: data.payload,
        priority: data.priority || 0,
        status: 'pending',
        attempts: 0,
        max_retries: queue.maxRetries,
        error: null,
        result: null,
        started_at: null,
        completed_at: null,
        scheduled_for: data.scheduledFor || null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to add job to queue', { error, queueName });
      throw new DatabaseError('Failed to add job to queue', { error });
    }

    logger.info('Job added to queue successfully', { jobId, queueName });

    // Invalidate cache
    cache.delete(`queue:${queue.id}`);
    cache.delete(`queue:jobs:${queue.id}`);

    return job as Job;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error adding job to queue', { error, queueName });
    throw new DatabaseError('Failed to add job to queue', { error });
  }
}

/**
 * Get job by ID
 */
export async function getJob(jobId: string): Promise<Job> {
  try {
    const supabase = getSupabaseClient();

    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      logger.error('Failed to fetch job', { error, jobId });
      throw new DatabaseError('Failed to fetch job', { error });
    }

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    return job as Job;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching job', { error, jobId });
    throw new DatabaseError('Failed to fetch job', { error });
  }
}

/**
 * Get jobs from queue
 */
export async function getQueueJobs(queueName: string, options: {
  page?: number;
  pageSize?: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
}): Promise<{ jobs: Job[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, status } = options;

    const queue = await getQueueByName(queueName);
    const supabase = getSupabaseClient();
    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('queue_id', queue.id);

    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: jobs, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch queue jobs', { error, queueName });
      throw new DatabaseError('Failed to fetch queue jobs', { error });
    }

    return {
      jobs: (jobs || []) as Job[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching queue jobs', { error, queueName });
    throw new DatabaseError('Failed to fetch queue jobs', { error });
  }
}

/**
 * Get next job from queue
 */
export async function getNextJob(queueName: string): Promise<Job | null> {
  try {
    const queue = await getQueueByName(queueName);
    const supabase = getSupabaseClient();

    let query = supabase
      .from('jobs')
      .select('*')
      .eq('queue_id', queue.id)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString());

    // Order by queue type
    if (queue.type === 'priority') {
      query = query.order('priority', { ascending: false });
    } else if (queue.type === 'fifo') {
      query = query.order('created_at', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: job, error } = await query.limit(1).single();

    if (error) {
      // No job available
      return null;
    }

    return job as Job;
  } catch (error) {
    if (error instanceof DatabaseError) {
      return null;
    }
    logger.error('Unexpected error fetching next job', { error, queueName });
    return null;
  }
}

/**
 * Process job
 */
export async function processJob(jobId: string, result: Record<string, unknown>): Promise<Job> {
  try {
    const supabase = getSupabaseClient();

    const now = new Date().toISOString();

    const { data: job, error } = await supabase
      .from('jobs')
      .update({
        status: 'completed',
        result,
        completed_at: now,
        updated_at: now,
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to process job', { error, jobId });
      throw new DatabaseError('Failed to process job', { error });
    }

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    logger.info('Job processed successfully', { jobId });

    return job as Job;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error processing job', { error, jobId });
    throw new DatabaseError('Failed to process job', { error });
  }
}

/**
 * Fail job
 */
export async function failJob(jobId: string, error: string): Promise<Job> {
  try {
    const supabase = getSupabaseClient();

    const job = await getJob(jobId);

    const updateData: Record<string, unknown> = {
      attempts: job.attempts + 1,
      error,
      updated_at: new Date().toISOString(),
    };

    // Check if should retry
    if (job.attempts + 1 < job.maxRetries) {
      updateData.status = 'pending';
    } else {
      updateData.status = 'failed';
      updateData.completed_at = new Date().toISOString();
    }

    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to fail job', { updateError, jobId });
      throw new DatabaseError('Failed to fail job', { updateError });
    }

    if (!updatedJob) {
      throw new NotFoundError('Job not found');
    }

    logger.info('Job failed', { jobId, attempts: job.attempts + 1 });

    return updatedJob as Job;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error failing job', { error, jobId });
    throw new DatabaseError('Failed to fail job', { error });
  }
}

/**
 * Cancel job
 */
export async function cancelJob(jobId: string): Promise<Job> {
  try {
    const supabase = getSupabaseClient();

    const { data: job, error } = await supabase
      .from('jobs')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to cancel job', { error, jobId });
      throw new DatabaseError('Failed to cancel job', { error });
    }

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    logger.info('Job cancelled successfully', { jobId });

    return job as Job;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error cancelling job', { error, jobId });
    throw new DatabaseError('Failed to cancel job', { error });
  }
}

/**
 * Retry job
 */
export async function retryJob(jobId: string): Promise<Job> {
  try {
    const supabase = getSupabaseClient();

    const { data: job, error } = await supabase
      .from('jobs')
      .update({
        status: 'pending',
        attempts: 0,
        error: null,
        result: null,
        started_at: null,
        completed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to retry job', { error, jobId });
      throw new DatabaseError('Failed to retry job', { error });
    }

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    logger.info('Job retried successfully', { jobId });

    return job as Job;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error retrying job', { error, jobId });
    throw new DatabaseError('Failed to retry job', { error });
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStatistics(queueName: string): Promise<{
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  cancelledJobs: number;
}> {
  try {
    const queue = await getQueueByName(queueName);
    const supabase = getSupabaseClient();

    const { data: jobs } = await supabase
      .from('jobs')
      .select('status')
      .eq('queue_id', queue.id);

    if (!jobs || jobs.length === 0) {
      return {
        totalJobs: 0,
        pendingJobs: 0,
        processingJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        cancelledJobs: 0,
      };
    }

    const stats = {
      totalJobs: jobs.length,
      pendingJobs: 0,
      processingJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      cancelledJobs: 0,
    };

    for (const job of jobs) {
      stats[job.status + 'Jobs' as keyof typeof stats]++;
    }

    return stats;
  } catch (error) {
    logger.error('Failed to get queue statistics', { error, queueName });
    throw new DatabaseError('Failed to get queue statistics', { error });
  }
}

/**
 * Activate queue
 */
export async function activateQueue(queueId: string): Promise<Queue> {
  return updateQueue(queueId, { isActive: true });
}

/**
 * Deactivate queue
 */
export async function deactivateQueue(queueId: string): Promise<Queue> {
  return updateQueue(queueId, { isActive: false });
}

/**
 * Clear completed jobs from queue
 */
export async function clearCompletedJobs(queueName: string): Promise<number> {
  try {
    const queue = await getQueueByName(queueName);
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('queue_id', queue.id)
      .eq('status', 'completed');

    if (error) {
      logger.error('Failed to clear completed jobs', { error, queueName });
      throw new DatabaseError('Failed to clear completed jobs', { error });
    }

    logger.info('Completed jobs cleared from queue', { queueName });

    // Invalidate cache
    cache.delete(`queue:${queue.id}`);
    cache.delete(`queue:jobs:${queue.id}`);

    return 0; // Return count if needed
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error clearing completed jobs', { error, queueName });
    throw new DatabaseError('Failed to clear completed jobs', { error });
  }
}
