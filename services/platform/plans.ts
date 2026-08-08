import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validateData } from '../core/validation';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';
import { Plan, BillingCycle, TenantLimits } from './platform-types';
import { planSchemas } from './platform-validation';

// ============================================================================
// Plans Manager
// Subscription plan management operations
// ============================================================================

/**
 * Create a new plan
 */
export async function createPlan(data: {
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  trialDays?: number;
  features: Array<{
    name: string;
    description: string;
    included: boolean;
    limit?: number;
  }>;
  limits?: Partial<TenantLimits>;
}): Promise<Plan> {
  try {
    await validatePlatformWritePermission(PlatformResource.PLANS);

    const validated = validateData(planSchemas.create, data);

    const supabase = getSupabaseClient();

    // Check if slug is already taken
    const { data: existing } = await supabase
      .from('plans')
      .select('id')
      .eq('slug', validated.slug)
      .single();

    if (existing) {
      throw new DatabaseError('Slug already exists', { slug: validated.slug });
    }

    // Create plan
    const planId = `plan-${Date.now()}`;
    const now = new Date().toISOString();

    const defaultLimits: TenantLimits = {
      users: data.limits?.users || 10,
      patients: data.limits?.patients || 100,
      appointments: data.limits?.appointments || 1000,
      storage: data.limits?.storage || 10737418240,
      apiCalls: data.limits?.apiCalls || 100000,
      aiTokens: data.limits?.aiTokens || 1000000,
    };

    const { data: plan, error } = await supabase
      .from('plans')
      .insert({
        id: planId,
        name: validated.name,
        slug: validated.slug,
        description: validated.description,
        price: validated.price,
        currency: validated.currency,
        billing_cycle: validated.billingCycle,
        trial_days: validated.trialDays || 0,
        features: validated.features,
        limits: defaultLimits,
        is_active: true,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create plan', { error, data });
      throw new DatabaseError('Failed to create plan', { error });
    }

    logger.info('Plan created successfully', { planId, slug: validated.slug });

    // Invalidate cache
    cache.delete(`plan:${planId}`);
    cache.delete(`plan:slug:${validated.slug}`);

    return plan as Plan;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating plan', { error, data });
    throw new DatabaseError('Failed to create plan', { error });
  }
}

/**
 * Update plan
 */
export async function updatePlan(planId: string, data: {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  currency?: string;
  billingCycle?: BillingCycle;
  trialDays?: number;
  features?: Array<{
    name: string;
    description: string;
    included: boolean;
    limit?: number;
  }>;
  limits?: Partial<TenantLimits>;
  isActive?: boolean;
}): Promise<Plan> {
  try {
    await validatePlatformWritePermission(PlatformResource.PLANS);

    const supabase = getSupabaseClient();

    // Get current plan to check slug
    const { data: current } = await supabase
      .from('plans')
      .select('slug')
      .eq('id', planId)
      .single();

    if (!current) {
      throw new NotFoundError('Plan not found');
    }

    // Check if new slug is already taken (if changing slug)
    if (data.slug && data.slug !== current.slug) {
      const { data: existing } = await supabase
        .from('plans')
        .select('id')
        .eq('slug', data.slug)
        .neq('id', planId)
        .single();

      if (existing) {
        throw new DatabaseError('Slug already exists', { slug: data.slug });
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.billingCycle !== undefined) updateData.billing_cycle = data.billingCycle;
    if (data.trialDays !== undefined) updateData.trial_days = data.trialDays;
    if (data.features !== undefined) updateData.features = data.features;
    if (data.limits !== undefined) updateData.limits = data.limits;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const { data: plan, error } = await supabase
      .from('plans')
      .update(updateData)
      .eq('id', planId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update plan', { error, planId });
      throw new DatabaseError('Failed to update plan', { error });
    }

    if (!plan) {
      throw new NotFoundError('Plan not found');
    }

    logger.info('Plan updated successfully', { planId });

    // Invalidate cache
    cache.delete(`plan:${planId}`);
    cache.delete(`plan:slug:${current.slug}`);
    cache.delete(`plan:slug:${plan.slug}`);

    return plan as Plan;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating plan', { error, planId });
    throw new DatabaseError('Failed to update plan', { error });
  }
}

/**
 * Delete plan
 */
export async function deletePlan(planId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.PLANS);

    const supabase = getSupabaseClient();

    // Check if plan has active subscriptions
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('plan_id', planId)
      .eq('status', 'active')
      .limit(1);

    if (subscriptions && subscriptions.length > 0) {
      throw new DatabaseError('Cannot delete plan with active subscriptions', { planId });
    }

    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', planId);

    if (error) {
      logger.error('Failed to delete plan', { error, planId });
      throw new DatabaseError('Failed to delete plan', { error });
    }

    logger.info('Plan deleted successfully', { planId });

    // Invalidate cache
    cache.delete(`plan:${planId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting plan', { error, planId });
    throw new DatabaseError('Failed to delete plan', { error });
  }
}

/**
 * Get plan by ID
 */
export async function getPlan(planId: string): Promise<Plan> {
  try {
    // Check cache first
    const cached = cache.get<Plan>(`plan:${planId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: plan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      logger.error('Failed to fetch plan', { error, planId });
      throw new DatabaseError('Failed to fetch plan', { error });
    }

    if (!plan) {
      throw new NotFoundError('Plan not found');
    }

    // Cache result
    cache.set(`plan:${planId}`, plan, cacheHelpers.ttl.LONG);

    return plan as Plan;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching plan', { error, planId });
    throw new DatabaseError('Failed to fetch plan', { error });
  }
}

/**
 * Get plan by slug
 */
export async function getPlanBySlug(slug: string): Promise<Plan> {
  try {
    // Check cache first
    const cacheKey = `plan:slug:${slug}`;
    const cached = cache.get<Plan>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: plan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      logger.error('Failed to fetch plan by slug', { error, slug });
      throw new DatabaseError('Failed to fetch plan', { error });
    }

    if (!plan) {
      throw new NotFoundError('Plan not found');
    }

    // Cache result
    cache.set(cacheKey, plan, cacheHelpers.ttl.LONG);
    cache.set(`plan:${plan.id}`, plan, cacheHelpers.ttl.LONG);

    return plan as Plan;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching plan by slug', { error, slug });
    throw new DatabaseError('Failed to fetch plan', { error });
  }
}

/**
 * List plans
 */
export async function listPlans(options: {
  page?: number;
  pageSize?: number;
  billingCycle?: BillingCycle;
  active?: boolean;
  search?: string;
}): Promise<{ plans: Plan[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, billingCycle, active, search } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('plans')
      .select('*', { count: 'exact' });

    if (billingCycle) {
      query = query.eq('billing_cycle', billingCycle);
    }

    if (active !== undefined) {
      // Plans are considered active if they exist and are not deleted
      // This is a placeholder for actual active status logic
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: plans, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list plans', { error });
      throw new DatabaseError('Failed to list plans', { error });
    }

    return {
      plans: (plans || []) as Plan[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing plans', { error });
    throw new DatabaseError('Failed to list plans', { error });
  }
}

/**
 * Get public plans (for pricing page)
 */
export async function getPublicPlans(): Promise<Plan[]> {
  try {
    const cacheKey = 'plans:public';
    const cached = cache.get<Plan[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: plans, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      logger.error('Failed to fetch public plans', { error });
      throw new DatabaseError('Failed to fetch public plans', { error });
    }

    const result = (plans || []) as Plan[];
    cache.set(cacheKey, result, cacheHelpers.ttl.LONG);

    return result;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching public plans', { error });
    throw new DatabaseError('Failed to fetch public plans', { error });
  }
}

/**
 * Calculate monthly price from billing cycle
 */
export function calculateMonthlyPrice(price: number, billingCycle: BillingCycle): number {
  switch (billingCycle) {
    case BillingCycle.MONTHLY:
      return price;
    case BillingCycle.QUARTERLY:
      return price / 3;
    case BillingCycle.YEARLY:
      return price / 12;
    default:
      return price;
  }
}

/**
 * Get plan comparison
 */
export async function getPlanComparison(planIds: string[]): Promise<Record<string, Plan>> {
  try {
    const supabase = getSupabaseClient();

    const { data: plans, error } = await supabase
      .from('plans')
      .select('*')
      .in('id', planIds);

    if (error) {
      logger.error('Failed to fetch plan comparison', { error });
      throw new DatabaseError('Failed to fetch plan comparison', { error });
    }

    const result: Record<string, Plan> = {};
    for (const plan of plans || []) {
      result[plan.id] = plan as Plan;
    }

    return result;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching plan comparison', { error });
    throw new DatabaseError('Failed to fetch plan comparison', { error });
  }
}

/**
 * Get plan statistics
 */
export async function getPlanStatistics(): Promise<{
  total: number;
  byBillingCycle: Record<string, number>;
  averagePrice: number;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data: plans } = await supabase
      .from('plans')
      .select('billing_cycle, price');

    if (!plans || plans.length === 0) {
      return {
        total: 0,
        byBillingCycle: {},
        averagePrice: 0,
      };
    }

    const byBillingCycle: Record<string, number> = {};
    let totalPrice = 0;

    for (const plan of plans) {
      byBillingCycle[plan.billing_cycle] = (byBillingCycle[plan.billing_cycle] || 0) + 1;
      totalPrice += plan.price;
    }

    return {
      total: plans.length,
      byBillingCycle,
      averagePrice: totalPrice / plans.length,
    };
  } catch (error) {
    logger.error('Failed to get plan statistics', { error });
    throw new DatabaseError('Failed to get plan statistics', { error });
  }
}
