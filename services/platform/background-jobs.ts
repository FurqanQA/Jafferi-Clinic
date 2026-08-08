import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Background Jobs Manager
// Background job management and execution
// ============================================================================

/**
 * Background Job interface
 */
export interface BackgroundJob {
  id: string;
  name: string;
  description: string;
  type: string;
  handler: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  estimatedDuration: number | null;
  actualDuration: number | null;
  retryCount: number;
  maxRetries: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a background job
 */
export async function createBackgroundJob(data: {
  name: string;
  description: string;
  type: string;
  handler: string;
  payload: Record<string, unknown>;
  priority?: number;
  maxRetries?: number;
  estimatedDuration?: number;
  createdBy?: string;
}): Promise<BackgroundJob> {
  try {
    await validatePlatformWritePermission(PlatformResource.JOBS);

    const supabase = getSupabaseClient();

    // Create background job
    const jobId = `bg-job-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: job, error } = await supabase
      .from('background_jobs')
      .insert({
        id: jobId,
        name: data.name,
        description: data.description,
        type: data.type,
        handler: data.handler,
        status: 'pending',
        priority: data.priority || 0,
        payload: data.payload,
        result: null,
        error: null,
        progress: 0,
        started_at: null,
        completed_at: null,
        estimated_duration: data.estimatedDuration || null,
        actual_duration: null,
        retry_count: 0,
        max_retries: data.maxRetries || 3,
        created_by: data.createdBy || null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create background job', { error, data });
      throw new DatabaseError('Failed to create background job', { error });
    }

    logger.info('Background job created successfully', { jobId, name: data.name });

    // Invalidate cache
    cache.delete(`background-job:${jobId}`);

    return job as BackgroundJob;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating background job', { error, data });
    throw new DatabaseError('Failed to create background job', { error });
  }
}

/**
 * Update background job
 */
export async function updateBackgroundJob(jobId: string, data: {
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  result?: Record<string, unknown> | null;
  error?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  actualDuration?: number | null;
  retryCount?: number;
}): Promise<BackgroundJob> {
  try {
    await validatePlatformWritePermission(PlatformResource.JOBS);

    const supabase = getSupabaseClient();

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.status !== undefined) updateData.status = data.status;
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.result !== undefined) updateData.result = data.result;
    if (data.error !== undefined) updateData.error = data.error;
    if (data.startedAt !== undefined) updateData.started_at = data.startedAt;
    if (data.completedAt !== undefined) updateData.completed_at = data.completedAt;
    if (data.actualDuration !== undefined) updateData.actual_duration = data.actualDuration;
    if (data.retryCount !== undefined) updateData.retry_count = data.retryCount;

    const { data: job, error } = await supabase
      .from('background_jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update background job', { error, jobId });
      throw new DatabaseError('Failed to update background job', { error });
    }

    if (!job) {
      throw new NotFoundError('Background job not found');
    }

    logger.info('Background job updated successfully', { jobId });

    // Invalidate cache
    cache.delete(`background-job:${jobId}`);

    return job as BackgroundJob;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating background job', { error, jobId });
    throw new DatabaseError('Failed to update background job', { error });
  }
}

/**
 * Delete background job
 */
export async function deleteBackgroundJob(jobId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.JOBS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('background_jobs')
      .delete()
      .eq('id', jobId);

    if (error) {
      logger.error('Failed to delete background job', { error, jobId });
      throw new DatabaseError('Failed to delete background job', { error });
    }

    logger.info('Background job deleted successfully', { jobId });

    // Invalidate cache
    cache.delete(`background-job:${jobId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting background job', { error, jobId });
    throw new DatabaseError('Failed to delete background job', { error });
  }
}

/**
 * Get background job by ID
 */
export async function getBackgroundJob(jobId: string): Promise<BackgroundJob> {
  try {
    // Check cache first
    const cached = cache.get<BackgroundJob>(`background-job:${jobId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: job, error } = await supabase
      .from('background_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      logger.error('Failed to fetch background job', { error, jobId });
      throw new DatabaseError('Failed to fetch background job', { error });
    }

    if (!job) {
      throw new NotFoundError('Background job not found');
    }

    // Cache result
    cache.set(`background-job:${jobId}`, job, cacheHelpers.ttl.SHORT);

    return job as BackgroundJob;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching background job', { error, jobId });
    throw new DatabaseError('Failed to fetch background job', { error });
  }
}

/**
 * List background jobs
 */
export async function listBackgroundJobs(options: {
  page?: number;
  pageSize?: number;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  type?: string;
  createdBy?: string;
  search?: string;
}): Promise<{ jobs: BackgroundJob[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, status, type, createdBy, search } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('background_jobs')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (createdBy) {
      query = query.eq('created_by', createdBy);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,type.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: jobs, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list background jobs', { error });
      throw new DatabaseError('Failed to list background jobs', { error });
    }

    return {
      jobs: (jobs || []) as BackgroundJob[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing background jobs', { error });
    throw new DatabaseError('Failed to list background jobs', { error });
  }
}

/**
 * Start background job
 */
export async function startBackgroundJob(jobId: string): Promise<BackgroundJob> {
  return updateBackgroundJob(jobId, {
    status: 'running',
    startedAt: new Date().toISOString(),
  });
}

/**
 * Complete background job
 */
export async function completeBackgroundJob(jobId: string, result: Record<string, unknown>): Promise<BackgroundJob> {
  const job = await getBackgroundJob(jobId);
  const actualDuration = job.startedAt 
    ? Date.now() - new Date(job.startedAt).getTime()
    : null;

  return updateBackgroundJob(jobId, {
    status: 'completed',
    result,
    progress: 100,
    completedAt: new Date().toISOString(),
    actualDuration,
  });
}

/**
 * Fail background job
 */
export async function failBackgroundJob(jobId: string, error: string): Promise<BackgroundJob> {
  const job = await getBackgroundJob(jobId);

  const updateData: {
    status: 'failed' | 'pending';
    error: string;
    retryCount: number;
    completedAt?: string;
  } = {
    status: 'failed',
    error,
    retryCount: job.retryCount + 1,
  };

  // Check if should retry
  if (job.retryCount + 1 < job.maxRetries) {
    updateData.status = 'pending';
  } else {
    updateData.completedAt = new Date().toISOString();
  }

  return updateBackgroundJob(jobId, updateData);
}

/**
 * Cancel background job
 */
export async function cancelBackgroundJob(jobId: string): Promise<BackgroundJob> {
  return updateBackgroundJob(jobId, {
    status: 'cancelled',
    completedAt: new Date().toISOString(),
  });
}

/**
 * Update job progress
 */
export async function updateJobProgress(jobId: string, progress: number): Promise<BackgroundJob> {
  return updateBackgroundJob(jobId, { progress: Math.min(100, Math.max(0, progress)) });
}

/**
 * Retry background job
 */
export async function retryBackgroundJob(jobId: string): Promise<BackgroundJob> {
  return updateBackgroundJob(jobId, {
    status: 'pending',
    progress: 0,
    error: null,
    result: null,
    startedAt: null,
    completedAt: null,
    actualDuration: null,
    retryCount: 0,
  });
}

/**
 * Get pending background jobs
 */
export async function getPendingBackgroundJobs(): Promise<BackgroundJob[]> {
  try {
    const { jobs } = await listBackgroundJobs({ status: 'pending', pageSize: 100 });
    return jobs.sort((a, b) => b.priority - a.priority);
  } catch (error) {
    logger.error('Failed to get pending background jobs', { error });
    throw new DatabaseError('Failed to get pending background jobs', { error });
  }
}

/**
 * Get running background jobs
 */
export async function getRunningBackgroundJobs(): Promise<BackgroundJob[]> {
  try {
    const { jobs } = await listBackgroundJobs({ status: 'running', pageSize: 100 });
    return jobs;
  } catch (error) {
    logger.error('Failed to get running background jobs', { error });
    throw new DatabaseError('Failed to get running background jobs', { error });
  }
}

/**
 * Get background job statistics
 */
export async function getBackgroundJobStatistics(): Promise<{
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  averageDuration: number;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data: jobs } = await supabase
      .from('background_jobs')
      .select('status, actual_duration');

    if (!jobs || jobs.length === 0) {
      return {
        total: 0,
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
        averageDuration: 0,
      };
    }

    const stats = {
      total: jobs.length,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      averageDuration: 0,
    };

    let totalDuration = 0;
    let completedCount = 0;

    for (const job of jobs) {
      switch (job.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'running':
          stats.running++;
          break;
        case 'completed':
          stats.completed++;
          if (job.actual_duration) {
            totalDuration += job.actual_duration;
            completedCount++;
          }
          break;
        case 'failed':
          stats.failed++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
      }
    }

    stats.averageDuration = completedCount > 0 ? totalDuration / completedCount : 0;

    return stats;
  } catch (error) {
    logger.error('Failed to get background job statistics', { error });
    throw new DatabaseError('Failed to get background job statistics', { error });
  }
}

/**
 * Get jobs by type
 */
export async function getJobsByType(type: string, options: {
  page?: number;
  pageSize?: number;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
}): Promise<{ jobs: BackgroundJob[]; total: number; page: number; pageSize: number }> {
  return listBackgroundJobs({ ...options, type });
}

/**
 * Get jobs created by user
 */
export async function getJobsByUser(userId: string, options: {
  page?: number;
  pageSize?: number;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
}): Promise<{ jobs: BackgroundJob[]; total: number; page: number; pageSize: number }> {
  return listBackgroundJobs({ ...options, createdBy: userId });
}

/**
 * Cleanup old completed jobs
 */
export async function cleanupOldJobs(daysOld: number = 30): Promise<number> {
  try {
    await validatePlatformWritePermission(PlatformResource.JOBS);

    const supabase = getSupabaseClient();
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('background_jobs')
      .delete()
      .in('status', ['completed', 'failed', 'cancelled'])
      .lt('completed_at', cutoffDate);

    if (error) {
      logger.error('Failed to cleanup old jobs', { error, daysOld });
      throw new DatabaseError('Failed to cleanup old jobs', { error });
    }

    logger.info('Old jobs cleaned up successfully', { daysOld });

    return 0; // Return count if needed
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error cleaning up old jobs', { error, daysOld });
    throw new DatabaseError('Failed to cleanup old jobs', { error });
  }
}

/**
 * Get job types
 */
export async function getJobTypes(): Promise<string[]> {
  try {
    const cacheKey = 'background-job:types';
    const cached = cache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: jobs } = await supabase
      .from('background_jobs')
      .select('type');

    const types = new Set<string>();
    for (const job of jobs || []) {
      types.add(job.type);
    }

    const result = Array.from(types);
    cache.set(cacheKey, result, cacheHelpers.ttl.LONG);
    return result;
  } catch (error) {
    logger.error('Failed to get job types', { error });
    throw new DatabaseError('Failed to get job types', { error });
  }
}
