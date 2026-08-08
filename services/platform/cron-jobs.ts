import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Cron Jobs Manager
// Cron job management and execution
// ============================================================================

/**
 * Cron Job interface
 */
export interface CronJob {
  id: string;
  name: string;
  description: string;
  cronExpression: string;
  handler: string;
  timezone: string;
  isActive: boolean;
  lastExecution: string | null;
  nextExecution: string | null;
  executionCount: number;
  failureCount: number;
  lastError: string | null;
  timeout: number;
  retryPolicy: RetryPolicy;
  createdAt: string;
  updatedAt: string;
}

/**
 * Retry Policy
 */
export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
}

/**
 * Cron Job Log
 */
export interface CronJobLog {
  id: string;
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  output: string | null;
  error: string | null;
  retryCount: number;
}

/**
 * Create a cron job
 */
export async function createCronJob(data: {
  name: string;
  description: string;
  cronExpression: string;
  handler: string;
  timezone?: string;
  timeout?: number;
  retryPolicy?: Partial<RetryPolicy>;
}): Promise<CronJob> {
  try {
    await validatePlatformWritePermission(PlatformResource.JOBS);

    const supabase = getSupabaseClient();

    // Create cron job
    const jobId = `cron-${Date.now()}`;
    const now = new Date().toISOString();

    const retryPolicy: RetryPolicy = {
      maxRetries: data.retryPolicy?.maxRetries ?? 3,
      backoffMultiplier: data.retryPolicy?.backoffMultiplier ?? 2,
      initialDelay: data.retryPolicy?.initialDelay ?? 1000,
      maxDelay: data.retryPolicy?.maxDelay ?? 60000,
    };

    const { data: job, error } = await supabase
      .from('cron_jobs')
      .insert({
        id: jobId,
        name: data.name,
        description: data.description,
        cron_expression: data.cronExpression,
        handler: data.handler,
        timezone: data.timezone || 'UTC',
        is_active: true,
        last_execution: null,
        next_execution: null,
        execution_count: 0,
        failure_count: 0,
        last_error: null,
        timeout: data.timeout || 300000, // 5 minutes default
        retry_policy: retryPolicy,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create cron job', { error, data });
      throw new DatabaseError('Failed to create cron job', { error });
    }

    logger.info('Cron job created successfully', { jobId, name: data.name });

    // Invalidate cache
    cache.delete(`cron-job:${jobId}`);

    return job as CronJob;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating cron job', { error, data });
    throw new DatabaseError('Failed to create cron job', { error });
  }
}

/**
 * Update cron job
 */
export async function updateCronJob(jobId: string, data: {
  name?: string;
  description?: string;
  cronExpression?: string;
  handler?: string;
  timezone?: string;
  isActive?: boolean;
  timeout?: number;
  retryPolicy?: Partial<RetryPolicy>;
}): Promise<CronJob> {
  try {
    await validatePlatformWritePermission(PlatformResource.JOBS);

    const supabase = getSupabaseClient();

    // Get current job
    const { data: current } = await supabase
      .from('cron_jobs')
      .select('retry_policy')
      .eq('id', jobId)
      .single();

    if (!current) {
      throw new NotFoundError('Cron job not found');
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.cronExpression !== undefined) updateData.cron_expression = data.cronExpression;
    if (data.handler !== undefined) updateData.handler = data.handler;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.timeout !== undefined) updateData.timeout = data.timeout;
    if (data.retryPolicy !== undefined) {
      updateData.retry_policy = { ...current.retry_policy, ...data.retryPolicy };
    }

    const { data: job, error } = await supabase
      .from('cron_jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update cron job', { error, jobId });
      throw new DatabaseError('Failed to update cron job', { error });
    }

    if (!job) {
      throw new NotFoundError('Cron job not found');
    }

    logger.info('Cron job updated successfully', { jobId });

    // Invalidate cache
    cache.delete(`cron-job:${jobId}`);

    return job as CronJob;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating cron job', { error, jobId });
    throw new DatabaseError('Failed to update cron job', { error });
  }
}

/**
 * Delete cron job
 */
export async function deleteCronJob(jobId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.JOBS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('cron_jobs')
      .delete()
      .eq('id', jobId);

    if (error) {
      logger.error('Failed to delete cron job', { error, jobId });
      throw new DatabaseError('Failed to delete cron job', { error });
    }

    logger.info('Cron job deleted successfully', { jobId });

    // Invalidate cache
    cache.delete(`cron-job:${jobId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting cron job', { error, jobId });
    throw new DatabaseError('Failed to delete cron job', { error });
  }
}

/**
 * Get cron job by ID
 */
export async function getCronJob(jobId: string): Promise<CronJob> {
  try {
    // Check cache first
    const cached = cache.get<CronJob>(`cron-job:${jobId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: job, error } = await supabase
      .from('cron_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      logger.error('Failed to fetch cron job', { error, jobId });
      throw new DatabaseError('Failed to fetch cron job', { error });
    }

    if (!job) {
      throw new NotFoundError('Cron job not found');
    }

    // Cache result
    cache.set(`cron-job:${jobId}`, job, cacheHelpers.ttl.MEDIUM);

    return job as CronJob;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching cron job', { error, jobId });
    throw new DatabaseError('Failed to fetch cron job', { error });
  }
}

/**
 * List cron jobs
 */
export async function listCronJobs(options: {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  search?: string;
}): Promise<{ jobs: CronJob[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, isActive, search } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('cron_jobs')
      .select('*', { count: 'exact' });

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,handler.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: jobs, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list cron jobs', { error });
      throw new DatabaseError('Failed to list cron jobs', { error });
    }

    return {
      jobs: (jobs || []) as CronJob[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing cron jobs', { error });
    throw new DatabaseError('Failed to list cron jobs', { error });
  }
}

/**
 * Activate cron job
 */
export async function activateCronJob(jobId: string): Promise<CronJob> {
  return updateCronJob(jobId, { isActive: true });
}

/**
 * Deactivate cron job
 */
export async function deactivateCronJob(jobId: string): Promise<CronJob> {
  return updateCronJob(jobId, { isActive: false });
}

/**
 * Execute cron job manually
 */
export async function executeCronJob(jobId: string): Promise<CronJobLog> {
  try {
    await validatePlatformWritePermission(PlatformResource.JOBS);

    const job = await getCronJob(jobId);

    // Create execution log
    const logId = `log-${Date.now()}`;
    const now = new Date().toISOString();

    const supabase = getSupabaseClient();

    const { data: log, error } = await supabase
      .from('cron_job_logs')
      .insert({
        id: logId,
        job_id: jobId,
        status: 'running',
        started_at: now,
        completed_at: null,
        duration: null,
        output: null,
        error: null,
        retry_count: 0,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create cron job log', { error, jobId });
      throw new DatabaseError('Failed to create cron job log', { error });
    }

    logger.info('Cron job execution started', { logId, jobId });

    // Placeholder for actual job execution
    // In a real implementation, this would trigger the actual handler
    const completedAt = new Date().toISOString();
    const duration = Date.now() - new Date(now).getTime();

    await updateCronJobLog(logId, {
      status: 'completed',
      completedAt,
      duration,
      output: 'Job executed successfully',
    });

    // Update job statistics
    await updateCronJobStatistics(jobId, true);

    return log as CronJobLog;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error executing cron job', { error, jobId });
    throw new DatabaseError('Failed to execute cron job', { error });
  }
}

/**
 * Update cron job log
 */
async function updateCronJobLog(logId: string, data: {
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  completedAt?: string | null;
  duration?: number | null;
  output?: string | null;
  error?: string | null;
  retryCount?: number;
}): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.completedAt !== undefined) updateData.completed_at = data.completedAt;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.output !== undefined) updateData.output = data.output;
    if (data.error !== undefined) updateData.error = data.error;
    if (data.retryCount !== undefined) updateData.retry_count = data.retryCount;

    const { error } = await supabase
      .from('cron_job_logs')
      .update(updateData)
      .eq('id', logId);

    if (error) {
      logger.error('Failed to update cron job log', { error, logId });
      throw new DatabaseError('Failed to update cron job log', { error });
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error updating cron job log', { error, logId });
    throw new DatabaseError('Failed to update cron job log', { error });
  }
}

/**
 * Update cron job statistics
 */
async function updateCronJobStatistics(jobId: string, success: boolean): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    const job = await getCronJob(jobId);

    const updateData: Record<string, unknown> = {
      last_execution: new Date().toISOString(),
      execution_count: job.executionCount + 1,
      updated_at: new Date().toISOString(),
    };

    if (success) {
      updateData.failure_count = 0;
      updateData.last_error = null;
    } else {
      updateData.failure_count = job.failureCount + 1;
    }

    const { error } = await supabase
      .from('cron_jobs')
      .update(updateData)
      .eq('id', jobId);

    if (error) {
      logger.error('Failed to update cron job statistics', { error, jobId });
      throw new DatabaseError('Failed to update cron job statistics', { error });
    }

    // Invalidate cache
    cache.delete(`cron-job:${jobId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating cron job statistics', { error, jobId });
    throw new DatabaseError('Failed to update cron job statistics', { error });
  }
}

/**
 * Get cron job logs
 */
export async function getCronJobLogs(jobId: string, options: {
  page?: number;
  pageSize?: number;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
}): Promise<{ logs: CronJobLog[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, status } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('cron_job_logs')
      .select('*', { count: 'exact' })
      .eq('job_id', jobId);

    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: logs, error, count } = await query
      .range(from, to)
      .order('started_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch cron job logs', { error, jobId });
      throw new DatabaseError('Failed to fetch cron job logs', { error });
    }

    return {
      logs: (logs || []) as CronJobLog[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching cron job logs', { error, jobId });
    throw new DatabaseError('Failed to fetch cron job logs', { error });
  }
}

/**
 * Get active cron jobs
 */
export async function getActiveCronJobs(): Promise<CronJob[]> {
  try {
    const { jobs } = await listCronJobs({ isActive: true, pageSize: 100 });
    return jobs;
  } catch (error) {
    logger.error('Failed to get active cron jobs', { error });
    throw new DatabaseError('Failed to get active cron jobs', { error });
  }
}

/**
 * Get due cron jobs
 */
export async function getDueCronJobs(): Promise<CronJob[]> {
  try {
    const now = new Date().toISOString();
    const supabase = getSupabaseClient();

    const { data: jobs, error } = await supabase
      .from('cron_jobs')
      .select('*')
      .eq('is_active', true)
      .lte('next_execution', now);

    if (error) {
      logger.error('Failed to fetch due cron jobs', { error });
      throw new DatabaseError('Failed to fetch due cron jobs', { error });
    }

    return (jobs || []) as CronJob[];
  } catch (error) {
    logger.error('Unexpected error fetching due cron jobs', { error });
    throw new DatabaseError('Failed to fetch due cron jobs', { error });
  }
}

/**
 * Calculate next execution time based on cron expression
 * Placeholder implementation - in production, use a proper cron library
 */
export function calculateNextExecution(cronExpression: string, timezone: string = 'UTC'): string {
  // Placeholder - in production, use node-cron or similar library
  const now = new Date();
  const nextExecution = new Date(now.getTime() + 60 * 60 * 1000); // Default to 1 hour from now
  return nextExecution.toISOString();
}

/**
 * Update next execution time for cron job
 */
export async function updateNextExecution(jobId: string): Promise<void> {
  try {
    const job = await getCronJob(jobId);
    const nextExecution = calculateNextExecution(job.cronExpression, job.timezone);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('cron_jobs')
      .update({
        next_execution: nextExecution,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      logger.error('Failed to update next execution time', { error, jobId });
      throw new DatabaseError('Failed to update next execution time', { error });
    }

    // Invalidate cache
    cache.delete(`cron-job:${jobId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating next execution time', { error, jobId });
    throw new DatabaseError('Failed to update next execution time', { error });
  }
}

/**
 * Get cron job statistics
 */
export async function getCronJobStatistics(jobId: string): Promise<{
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  lastExecution: string | null;
}> {
  try {
    const job = await getCronJob(jobId);
    const { logs } = await getCronJobLogs(jobId, { pageSize: 1000 });

    const successfulExecutions = logs.filter(l => l.status === 'completed').length;
    const failedExecutions = logs.filter(l => l.status === 'failed').length;
    
    const completedLogs = logs.filter(l => l.status === 'completed' && l.duration !== null);
    const totalDuration = completedLogs.reduce((sum, l) => sum + (l.duration || 0), 0);
    const averageDuration = completedLogs.length > 0 ? totalDuration / completedLogs.length : 0;

    return {
      totalExecutions: job.executionCount,
      successfulExecutions,
      failedExecutions,
      averageDuration,
      lastExecution: job.lastExecution,
    };
  } catch (error) {
    logger.error('Failed to get cron job statistics', { error, jobId });
    throw new DatabaseError('Failed to get cron job statistics', { error });
  }
}

/**
 * Validate cron expression
 */
export function validateCronExpression(cronExpression: string): boolean {
  // Basic validation - in production, use a proper cron parser
  const parts = cronExpression.split(' ');
  return parts.length === 5 || parts.length === 6;
}
