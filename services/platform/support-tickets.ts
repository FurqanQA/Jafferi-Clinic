import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Support Tickets Manager
// Customer support ticket management
// ============================================================================

/**
 * Support ticket interface
 */
export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  tenantId?: string;
  userId: string;
  assignedTo?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

/**
 * Ticket comment interface
 */
export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  metadata: Record<string, unknown>;
}

/**
 * Create support ticket
 */
export async function createSupportTicket(data: {
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userId: string;
  tenantId?: string;
}): Promise<SupportTicket> {
  try {
    const supabase = getSupabaseClient();

    const ticketId = `ticket-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        id: ticketId,
        subject: data.subject,
        description: data.description,
        status: 'open',
        priority: data.priority,
        category: data.category,
        tenant_id: data.tenantId || null,
        user_id: data.userId,
        assigned_to: null,
        resolved_at: null,
        closed_at: null,
        created_at: now,
        updated_at: now,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create support ticket', { error, data });
      throw new DatabaseError('Failed to create support ticket', { error });
    }

    logger.info('Support ticket created', { ticketId, subject: data.subject });

    // Invalidate cache
    cache.delete(`ticket:${ticketId}`);
    cache.delete('tickets:all');

    return ticket as SupportTicket;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating support ticket', { error, data });
    throw new DatabaseError('Failed to create support ticket', { error });
  }
}

/**
 * Get support ticket by ID
 */
export async function getSupportTicket(ticketId: string): Promise<SupportTicket> {
  try {
    const supabase = getSupabaseClient();

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) {
      logger.error('Failed to fetch support ticket', { error, ticketId });
      throw new DatabaseError('Failed to fetch support ticket', { error });
    }

    if (!ticket) {
      throw new NotFoundError('Support ticket not found');
    }

    return ticket as SupportTicket;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching support ticket', { error, ticketId });
    throw new DatabaseError('Failed to fetch support ticket', { error });
  }
}

/**
 * List support tickets
 */
export async function listSupportTickets(options: {
  page?: number;
  pageSize?: number;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  tenantId?: string;
  userId?: string;
  assignedTo?: string;
}): Promise<{ tickets: SupportTicket[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, status, priority, category, tenantId, userId, assignedTo } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('support_tickets')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: tickets, error, count } = await query
      .range(fromIndex, toIndex)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list support tickets', { error });
      throw new DatabaseError('Failed to list support tickets', { error });
    }

    return {
      tickets: (tickets || []) as SupportTicket[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing support tickets', { error });
    throw new DatabaseError('Failed to list support tickets', { error });
  }
}

/**
 * Update support ticket
 */
export async function updateSupportTicket(ticketId: string, data: {
  subject?: string;
  description?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  assignedTo?: string;
}): Promise<SupportTicket> {
  try {
    await validatePlatformWritePermission(PlatformResource.SUPPORT);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = { updated_at: now };

    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'resolved') updateData.resolved_at = now;
      if (data.status === 'closed') updateData.closed_at = now;
    }
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.assignedTo !== undefined) updateData.assigned_to = data.assignedTo;

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update support ticket', { error, ticketId });
      throw new DatabaseError('Failed to update support ticket', { error });
    }

    if (!ticket) {
      throw new NotFoundError('Support ticket not found');
    }

    logger.info('Support ticket updated', { ticketId });

    // Invalidate cache
    cache.delete(`ticket:${ticketId}`);
    cache.delete('tickets:all');

    return ticket as SupportTicket;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating support ticket', { error, ticketId });
    throw new DatabaseError('Failed to update support ticket', { error });
  }
}

/**
 * Delete support ticket
 */
export async function deleteSupportTicket(ticketId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.SUPPORT);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('support_tickets')
      .delete()
      .eq('id', ticketId);

    if (error) {
      logger.error('Failed to delete support ticket', { error, ticketId });
      throw new DatabaseError('Failed to delete support ticket', { error });
    }

    logger.info('Support ticket deleted', { ticketId });

    // Invalidate cache
    cache.delete(`ticket:${ticketId}`);
    cache.delete('tickets:all');
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting support ticket', { error, ticketId });
    throw new DatabaseError('Failed to delete support ticket', { error });
  }
}

/**
 * Add ticket comment
 */
export async function addTicketComment(ticketId: string, data: {
  userId: string;
  content: string;
  isInternal?: boolean;
}): Promise<TicketComment> {
  try {
    const supabase = getSupabaseClient();

    const commentId = `comment-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: comment, error } = await supabase
      .from('ticket_comments')
      .insert({
        id: commentId,
        ticket_id: ticketId,
        user_id: data.userId,
        content: data.content,
        is_internal: data.isInternal || false,
        created_at: now,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to add ticket comment', { error, data });
      throw new DatabaseError('Failed to add ticket comment', { error });
    }

    logger.info('Ticket comment added', { commentId, ticketId });

    // Invalidate cache
    cache.delete(`ticket:${ticketId}:comments`);

    return comment as TicketComment;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error adding ticket comment', { error, data });
    throw new DatabaseError('Failed to add ticket comment', { error });
  }
}

/**
 * Get ticket comments
 */
export async function getTicketComments(ticketId: string): Promise<TicketComment[]> {
  try {
    const supabase = getSupabaseClient();

    const { data: comments, error } = await supabase
      .from('ticket_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch ticket comments', { error, ticketId });
      throw new DatabaseError('Failed to fetch ticket comments', { error });
    }

    return (comments || []) as TicketComment[];
  } catch (error) {
    logger.error('Unexpected error fetching ticket comments', { error, ticketId });
    throw new DatabaseError('Failed to fetch ticket comments', { error });
  }
}

/**
 * Assign ticket
 */
export async function assignTicket(ticketId: string, assignedTo: string): Promise<SupportTicket> {
  try {
    await validatePlatformWritePermission(PlatformResource.SUPPORT);

    return updateSupportTicket(ticketId, { assignedTo });
  } catch (error) {
    logger.error('Failed to assign ticket', { error, ticketId });
    throw new DatabaseError('Failed to assign ticket', { error });
  }
}

/**
 * Resolve ticket
 */
export async function resolveTicket(ticketId: string): Promise<SupportTicket> {
  try {
    await validatePlatformWritePermission(PlatformResource.SUPPORT);

    return updateSupportTicket(ticketId, { status: 'resolved' });
  } catch (error) {
    logger.error('Failed to resolve ticket', { error, ticketId });
    throw new DatabaseError('Failed to resolve ticket', { error });
  }
}

/**
 * Close ticket
 */
export async function closeTicket(ticketId: string): Promise<SupportTicket> {
  try {
    await validatePlatformWritePermission(PlatformResource.SUPPORT);

    return updateSupportTicket(ticketId, { status: 'closed' });
  } catch (error) {
    logger.error('Failed to close ticket', { error, ticketId });
    throw new DatabaseError('Failed to close ticket', { error });
  }
}

/**
 * Reopen ticket
 */
export async function reopenTicket(ticketId: string): Promise<SupportTicket> {
  try {
    await validatePlatformWritePermission(PlatformResource.SUPPORT);

    return updateSupportTicket(ticketId, { status: 'open' });
  } catch (error) {
    logger.error('Failed to reopen ticket', { error, ticketId });
    throw new DatabaseError('Failed to reopen ticket', { error });
  }
}

/**
 * Get tickets by tenant
 */
export async function getTicketsByTenant(tenantId: string): Promise<SupportTicket[]> {
  try {
    const { tickets } = await listSupportTickets({ tenantId, pageSize: 1000 });
    return tickets;
  } catch (error) {
    logger.error('Failed to get tickets by tenant', { error, tenantId });
    throw new DatabaseError('Failed to get tickets by tenant', { error });
  }
}

/**
 * Get tickets by user
 */
export async function getTicketsByUser(userId: string): Promise<SupportTicket[]> {
  try {
    const { tickets } = await listSupportTickets({ userId, pageSize: 1000 });
    return tickets;
  } catch (error) {
    logger.error('Failed to get tickets by user', { error, userId });
    throw new DatabaseError('Failed to get tickets by user', { error });
  }
}

/**
 * Get tickets assigned to user
 */
export async function getTicketsAssignedTo(assignedTo: string): Promise<SupportTicket[]> {
  try {
    const { tickets } = await listSupportTickets({ assignedTo, pageSize: 1000 });
    return tickets;
  } catch (error) {
    logger.error('Failed to get tickets assigned to user', { error, assignedTo });
    throw new DatabaseError('Failed to get tickets assigned to user', { error });
  }
}

/**
 * Get ticket statistics
 */
export async function getTicketStatistics(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  open: number;
  resolved: number;
  closed: number;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('status, priority');

    if (!tickets || tickets.length === 0) {
      return {
        total: 0,
        byStatus: {},
        byPriority: {},
        open: 0,
        resolved: 0,
        closed: 0,
      };
    }

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let open = 0;
    let resolved = 0;
    let closed = 0;

    for (const ticket of tickets) {
      byStatus[ticket.status] = (byStatus[ticket.status] || 0) + 1;
      byPriority[ticket.priority] = (byPriority[ticket.priority] || 0) + 1;

      if (ticket.status === 'open') open++;
      else if (ticket.status === 'resolved') resolved++;
      else if (ticket.status === 'closed') closed++;
    }

    return {
      total: tickets.length,
      byStatus,
      byPriority,
      open,
      resolved,
      closed,
    };
  } catch (error) {
    logger.error('Failed to get ticket statistics', { error });
    throw new DatabaseError('Failed to get ticket statistics', { error });
  }
}

/**
 * Get ticket categories
 */
export async function getTicketCategories(): Promise<Array<{
  name: string;
  count: number;
}>> {
  try {
    const supabase = getSupabaseClient();

    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('category');

    if (!tickets || tickets.length === 0) {
      return [];
    }

    const categoryCount: Record<string, number> = {};
    for (const ticket of tickets) {
      categoryCount[ticket.category] = (categoryCount[ticket.category] || 0) + 1;
    }

    return Object.entries(categoryCount).map(([name, count]) => ({ name, count }));
  } catch (error) {
    logger.error('Failed to get ticket categories', { error });
    throw new DatabaseError('Failed to get ticket categories', { error });
  }
}
