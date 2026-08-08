import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Scheduler Manager
// Task scheduling and management
// ============================================================================

/**
 * Scheduled Task interface
 */
export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  handler: string;
  schedule: string; // cron expression
  timezone: string;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  runCount: number;
  failureCount: number;
  lastError: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Task execution record
 */
export interface TaskExecution {
  id: string;
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  output: string | null;
  error: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Create a scheduled task
 */
export async function createScheduledTask(data: {
  name: string;
  description: string;
  handler: string;
  schedule: string;
  timezone?: string;
  metadata?: Record<string, unknown>;
}): Promise<ScheduledTask> {
  try {
    await validatePlatformWritePermission(PlatformResource.JOBS);

    const supabase = getSupabaseClient();

    // Create task
    const taskId = `task-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: task, error } = await supabase
      .from('scheduled_tasks')
      .insert({
        id: taskId,
        name: data.name,
        description: data.description,
        handler: data.handler,
        schedule: data.schedule,
        timezone: data.timezone || 'UTC',
        is_active: true,
        last_run_at: null,
        next_run_at: null,
        run_count: 0,
        failure_count: 0,
        last_error: null,
        metadata: data.metadata || {},
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create scheduled task', { error, data });
      throw new DatabaseError('Failed to create scheduled task', { error });
    }

    logger.info('Scheduled task created successfully', { taskId, name: data.name });

    // Invalidate cache
    cache.delete(`scheduled-task:${taskId}`);

    return task as ScheduledTask;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating scheduled task', { error, data });
    throw new DatabaseError('Failed to create scheduled task', { error });
  }
}

/**
 * Update scheduled task
 */
export async function updateScheduledTask(taskId: string, data: {
  name?: string;
  description?: string;
  handler?: string;
  schedule?: string;
  timezone?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<ScheduledTask> {
  try {
    await validatePlatformWritePermission(PlatformResource.JOBS);

    const supabase = getSupabaseClient();

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.handler !== undefined) updateData.handler = data.handler;
    if (data.schedule !== undefined) updateData.schedule = data.schedule;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const { data: task, error } = await supabase
      .from('scheduled_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update scheduled task', { error, taskId });
      throw new DatabaseError('Failed to update scheduled task', { error });
    }

    if (!task) {
      throw new NotFoundError('Scheduled task not found');
    }

    logger.info('Scheduled task updated successfully', { taskId });

    // Invalidate cache
    cache.delete(`scheduled-task:${taskId}`);

    return task as ScheduledTask;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating scheduled task', { error, taskId });
    throw new DatabaseError('Failed to update scheduled task', { error });
  }
}

/**
 * Delete scheduled task
 */
export async function deleteScheduledTask(taskId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.JOBS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('scheduled_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      logger.error('Failed to delete scheduled task', { error, taskId });
      throw new DatabaseError('Failed to delete scheduled task', { error });
    }

    logger.info('Scheduled task deleted successfully', { taskId });

    // Invalidate cache
    cache.delete(`scheduled-task:${taskId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting scheduled task', { error, taskId });
    throw new DatabaseError('Failed to delete scheduled task', { error });
  }
}

/**
 * Get scheduled task by ID
 */
export async function getScheduledTask(taskId: string): Promise<ScheduledTask> {
  try {
    // Check cache first
    const cached = cache.get<ScheduledTask>(`scheduled-task:${taskId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: task, error } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) {
      logger.error('Failed to fetch scheduled task', { error, taskId });
      throw new DatabaseError('Failed to fetch scheduled task', { error });
    }

    if (!task) {
      throw new NotFoundError('Scheduled task not found');
    }

    // Cache result
    cache.set(`scheduled-task:${taskId}`, task, cacheHelpers.ttl.MEDIUM);

    return task as ScheduledTask;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching scheduled task', { error, taskId });
    throw new DatabaseError('Failed to fetch scheduled task', { error });
  }
}

/**
 * List scheduled tasks
 */
export async function listScheduledTasks(options: {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  search?: string;
}): Promise<{ tasks: ScheduledTask[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, isActive, search } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('scheduled_tasks')
      .select('*', { count: 'exact' });

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,handler.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: tasks, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list scheduled tasks', { error });
      throw new DatabaseError('Failed to list scheduled tasks', { error });
    }

    return {
      tasks: (tasks || []) as ScheduledTask[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing scheduled tasks', { error });
    throw new DatabaseError('Failed to list scheduled tasks', { error });
  }
}

/**
 * Activate scheduled task
 */
export async function activateScheduledTask(taskId: string): Promise<ScheduledTask> {
  return updateScheduledTask(taskId, { isActive: true });
}

/**
 * Deactivate scheduled task
 */
export async function deactivateScheduledTask(taskId: string): Promise<ScheduledTask> {
  return updateScheduledTask(taskId, { isActive: false });
}

/**
 * Run scheduled task manually
 */
export async function runScheduledTask(taskId: string): Promise<TaskExecution> {
  try {
    await validatePlatformWritePermission(PlatformResource.JOBS);

    const task = await getScheduledTask(taskId);

    // Create execution record
    const executionId = `exec-${Date.now()}`;
    const now = new Date().toISOString();

    const supabase = getSupabaseClient();

    const { data: execution, error } = await supabase
      .from('task_executions')
      .insert({
        id: executionId,
        task_id: taskId,
        status: 'running',
        started_at: now,
        completed_at: null,
        duration: null,
        output: null,
        error: null,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create task execution', { error, taskId });
      throw new DatabaseError('Failed to create task execution', { error });
    }

    logger.info('Task execution started', { executionId, taskId });

    // Placeholder for actual task execution
    // In a real implementation, this would trigger the actual handler
    const completedAt = new Date().toISOString();
    const duration = Date.now() - new Date(now).getTime();

    await updateTaskExecution(executionId, {
      status: 'completed',
      completedAt,
      duration,
      output: 'Task executed successfully',
    });

    // Update task statistics
    await updateTaskStatistics(taskId, true);

    return execution as TaskExecution;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error running scheduled task', { error, taskId });
    throw new DatabaseError('Failed to run scheduled task', { error });
  }
}

/**
 * Update task execution
 */
async function updateTaskExecution(executionId: string, data: {
  status?: 'pending' | 'running' | 'completed' | 'failed';
  completedAt?: string | null;
  duration?: number | null;
  output?: string | null;
  error?: string | null;
}): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.completedAt !== undefined) updateData.completed_at = data.completedAt;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.output !== undefined) updateData.output = data.output;
    if (data.error !== undefined) updateData.error = data.error;

    const { error } = await supabase
      .from('task_executions')
      .update(updateData)
      .eq('id', executionId);

    if (error) {
      logger.error('Failed to update task execution', { error, executionId });
      throw new DatabaseError('Failed to update task execution', { error });
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error updating task execution', { error, executionId });
    throw new DatabaseError('Failed to update task execution', { error });
  }
}

/**
 * Update task statistics
 */
async function updateTaskStatistics(taskId: string, success: boolean): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    const task = await getScheduledTask(taskId);

    const updateData: Record<string, unknown> = {
      last_run_at: new Date().toISOString(),
      run_count: task.runCount + 1,
      updated_at: new Date().toISOString(),
    };

    if (success) {
      updateData.failure_count = 0;
      updateData.last_error = null;
    } else {
      updateData.failure_count = task.failureCount + 1;
    }

    const { error } = await supabase
      .from('scheduled_tasks')
      .update(updateData)
      .eq('id', taskId);

    if (error) {
      logger.error('Failed to update task statistics', { error, taskId });
      throw new DatabaseError('Failed to update task statistics', { error });
    }

    // Invalidate cache
    cache.delete(`scheduled-task:${taskId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating task statistics', { error, taskId });
    throw new DatabaseError('Failed to update task statistics', { error });
  }
}

/**
 * Get task executions
 */
export async function getTaskExecutions(taskId: string, options: {
  page?: number;
  pageSize?: number;
  status?: 'pending' | 'running' | 'completed' | 'failed';
}): Promise<{ executions: TaskExecution[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, status } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('task_executions')
      .select('*', { count: 'exact' })
      .eq('task_id', taskId);

    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: executions, error, count } = await query
      .range(from, to)
      .order('started_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch task executions', { error, taskId });
      throw new DatabaseError('Failed to fetch task executions', { error });
    }

    return {
      executions: (executions || []) as TaskExecution[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching task executions', { error, taskId });
    throw new DatabaseError('Failed to fetch task executions', { error });
  }
}

/**
 * Get active scheduled tasks
 */
export async function getActiveScheduledTasks(): Promise<ScheduledTask[]> {
  try {
    const { tasks } = await listScheduledTasks({ isActive: true, pageSize: 100 });
    return tasks;
  } catch (error) {
    logger.error('Failed to get active scheduled tasks', { error });
    throw new DatabaseError('Failed to get active scheduled tasks', { error });
  }
}

/**
 * Get due tasks (tasks that should run now)
 */
export async function getDueTasks(): Promise<ScheduledTask[]> {
  try {
    const now = new Date().toISOString();
    const supabase = getSupabaseClient();

    const { data: tasks, error } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_at', now);

    if (error) {
      logger.error('Failed to fetch due tasks', { error });
      throw new DatabaseError('Failed to fetch due tasks', { error });
    }

    return (tasks || []) as ScheduledTask[];
  } catch (error) {
    logger.error('Unexpected error fetching due tasks', { error });
    throw new DatabaseError('Failed to fetch due tasks', { error });
  }
}

/**
 * Calculate next run time based on cron expression
 * Placeholder implementation - in production, use a proper cron library
 */
export function calculateNextRunTime(schedule: string, timezone: string = 'UTC'): string {
  // Placeholder - in production, use node-cron or similar library
  const now = new Date();
  const nextRun = new Date(now.getTime() + 60 * 60 * 1000); // Default to 1 hour from now
  return nextRun.toISOString();
}

/**
 * Update next run time for task
 */
export async function updateNextRunTime(taskId: string): Promise<void> {
  try {
    const task = await getScheduledTask(taskId);
    const nextRunAt = calculateNextRunTime(task.schedule, task.timezone);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('scheduled_tasks')
      .update({
        next_run_at: nextRunAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (error) {
      logger.error('Failed to update next run time', { error, taskId });
      throw new DatabaseError('Failed to update next run time', { error });
    }

    // Invalidate cache
    cache.delete(`scheduled-task:${taskId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating next run time', { error, taskId });
    throw new DatabaseError('Failed to update next run time', { error });
  }
}

/**
 * Get task statistics
 */
export async function getTaskStatistics(taskId: string): Promise<{
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageDuration: number;
  lastRunAt: string | null;
}> {
  try {
    const task = await getScheduledTask(taskId);
    const { executions } = await getTaskExecutions(taskId, { pageSize: 1000 });

    const successfulRuns = executions.filter(e => e.status === 'completed').length;
    const failedRuns = executions.filter(e => e.status === 'failed').length;
    
    const completedExecutions = executions.filter(e => e.status === 'completed' && e.duration !== null);
    const totalDuration = completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0);
    const averageDuration = completedExecutions.length > 0 ? totalDuration / completedExecutions.length : 0;

    return {
      totalRuns: task.runCount,
      successfulRuns,
      failedRuns,
      averageDuration,
      lastRunAt: task.lastRunAt,
    };
  } catch (error) {
    logger.error('Failed to get task statistics', { error, taskId });
    throw new DatabaseError('Failed to get task statistics', { error });
  }
}
