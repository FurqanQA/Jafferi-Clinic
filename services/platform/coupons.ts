import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Coupons Manager
// Coupon and discount management operations
// ============================================================================

/**
 * Coupon interface
 */
export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  currency: string;
  maxRedemptions: number | null;
  redemptionsCount: number;
  validFrom: string;
  validUntil: string | null;
  appliesTo: 'all' | 'specific';
  applicablePlanIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Generate a coupon code
 */
export function generateCouponCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new coupon
 */
export async function createCoupon(data: {
  code?: string;
  description: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  currency?: string;
  maxRedemptions?: number;
  validFrom: string;
  validUntil?: string;
  appliesTo?: 'all' | 'specific';
  applicablePlanIds?: string[];
}): Promise<Coupon> {
  try {
    await validatePlatformWritePermission(PlatformResource.COUPONS);

    const supabase = getSupabaseClient();

    const code = data.code || generateCouponCode();

    // Check if code is already taken
    const { data: existing } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', code)
      .single();

    if (existing) {
      throw new DatabaseError('Coupon code already exists', { code });
    }

    // Create coupon
    const couponId = `coupon-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert({
        id: couponId,
        code,
        description: data.description,
        type: data.type,
        value: data.value,
        currency: data.currency || 'USD',
        max_redemptions: data.maxRedemptions || null,
        redemptions_count: 0,
        valid_from: data.validFrom,
        valid_until: data.validUntil || null,
        applies_to: data.appliesTo || 'all',
        applicable_plan_ids: data.applicablePlanIds || [],
        is_active: true,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create coupon', { error, data });
      throw new DatabaseError('Failed to create coupon', { error });
    }

    logger.info('Coupon created successfully', { couponId, code });

    // Invalidate cache
    cache.delete(`coupon:${couponId}`);
    cache.delete(`coupon:code:${code}`);

    return coupon as Coupon;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating coupon', { error, data });
    throw new DatabaseError('Failed to create coupon', { error });
  }
}

/**
 * Update coupon
 */
export async function updateCoupon(couponId: string, data: {
  description?: string;
  value?: number;
  maxRedemptions?: number | null;
  validUntil?: string | null;
  appliesTo?: 'all' | 'specific';
  applicablePlanIds?: string[];
  isActive?: boolean;
}): Promise<Coupon> {
  try {
    await validatePlatformWritePermission(PlatformResource.COUPONS);

    const supabase = getSupabaseClient();

    // Get current coupon
    const { data: current } = await supabase
      .from('coupons')
      .select('code')
      .eq('id', couponId)
      .single();

    if (!current) {
      throw new NotFoundError('Coupon not found');
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.description !== undefined) updateData.description = data.description;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.maxRedemptions !== undefined) updateData.max_redemptions = data.maxRedemptions;
    if (data.validUntil !== undefined) updateData.valid_until = data.validUntil;
    if (data.appliesTo !== undefined) updateData.applies_to = data.appliesTo;
    if (data.applicablePlanIds !== undefined) updateData.applicable_plan_ids = data.applicablePlanIds;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const { data: coupon, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', couponId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update coupon', { error, couponId });
      throw new DatabaseError('Failed to update coupon', { error });
    }

    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    logger.info('Coupon updated successfully', { couponId });

    // Invalidate cache
    cache.delete(`coupon:${couponId}`);
    cache.delete(`coupon:code:${current.code}`);

    return coupon as Coupon;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating coupon', { error, couponId });
    throw new DatabaseError('Failed to update coupon', { error });
  }
}

/**
 * Delete coupon
 */
export async function deleteCoupon(couponId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.COUPONS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId);

    if (error) {
      logger.error('Failed to delete coupon', { error, couponId });
      throw new DatabaseError('Failed to delete coupon', { error });
    }

    logger.info('Coupon deleted successfully', { couponId });

    // Invalidate cache
    cache.delete(`coupon:${couponId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting coupon', { error, couponId });
    throw new DatabaseError('Failed to delete coupon', { error });
  }
}

/**
 * Get coupon by ID
 */
export async function getCoupon(couponId: string): Promise<Coupon> {
  try {
    // Check cache first
    const cached = cache.get<Coupon>(`coupon:${couponId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .single();

    if (error) {
      logger.error('Failed to fetch coupon', { error, couponId });
      throw new DatabaseError('Failed to fetch coupon', { error });
    }

    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    // Cache result
    cache.set(`coupon:${couponId}`, coupon, cacheHelpers.ttl.MEDIUM);

    return coupon as Coupon;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching coupon', { error, couponId });
    throw new DatabaseError('Failed to fetch coupon', { error });
  }
}

/**
 * Get coupon by code
 */
export async function getCouponByCode(code: string): Promise<Coupon> {
  try {
    // Check cache first
    const cacheKey = `coupon:code:${code}`;
    const cached = cache.get<Coupon>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      logger.error('Failed to fetch coupon by code', { error, code });
      throw new DatabaseError('Failed to fetch coupon', { error });
    }

    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    // Cache result
    cache.set(cacheKey, coupon, cacheHelpers.ttl.MEDIUM);
    cache.set(`coupon:${coupon.id}`, coupon, cacheHelpers.ttl.MEDIUM);

    return coupon as Coupon;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching coupon by code', { error, code });
    throw new DatabaseError('Failed to fetch coupon', { error });
  }
}

/**
 * Validate coupon
 */
export async function validateCoupon(code: string, planId?: string): Promise<{
  valid: boolean;
  coupon?: Coupon;
  reason?: string;
}> {
  try {
    const coupon = await getCouponByCode(code);

    // Check if active
    if (!coupon.isActive) {
      return {
        valid: false,
        coupon,
        reason: 'Coupon is not active',
      };
    }

    // Check validity period
    const now = new Date();
    if (new Date(coupon.validFrom) > now) {
      return {
        valid: false,
        coupon,
        reason: 'Coupon is not yet valid',
      };
    }

    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      return {
        valid: false,
        coupon,
        reason: 'Coupon has expired',
      };
    }

    // Check max redemptions
    if (coupon.maxRedemptions && coupon.redemptionsCount >= coupon.maxRedemptions) {
      return {
        valid: false,
        coupon,
        reason: 'Coupon has reached maximum redemptions',
      };
    }

    // Check if applies to plan
    if (coupon.appliesTo === 'specific' && planId) {
      if (!coupon.applicablePlanIds.includes(planId)) {
        return {
          valid: false,
          coupon,
          reason: 'Coupon does not apply to this plan',
        };
      }
    }

    return {
      valid: true,
      coupon,
    };
  } catch (error) {
    return {
      valid: false,
      reason: 'Coupon not found or invalid',
    };
  }
}

/**
 * Redeem coupon
 */
export async function redeemCoupon(couponId: string, subscriptionId: string): Promise<Coupon> {
  try {
    const supabase = getSupabaseClient();

    // Get current coupon
    const { data: currentCoupon } = await supabase
      .from('coupons')
      .select('redemptions_count')
      .eq('id', couponId)
      .single();

    if (!currentCoupon) {
      throw new NotFoundError('Coupon not found');
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .update({
        redemptions_count: currentCoupon.redemptions_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', couponId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to redeem coupon', { error, couponId });
      throw new DatabaseError('Failed to redeem coupon', { error });
    }

    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    logger.info('Coupon redeemed successfully', { couponId, subscriptionId });

    // Invalidate cache
    cache.delete(`coupon:${couponId}`);
    cache.delete(`coupon:code:${coupon.code}`);

    return coupon as Coupon;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error redeeming coupon', { error, couponId });
    throw new DatabaseError('Failed to redeem coupon', { error });
  }
}

/**
 * List coupons
 */
export async function listCoupons(options: {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  type?: 'percentage' | 'fixed_amount';
  search?: string;
}): Promise<{ coupons: Coupon[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, isActive, type, search } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('coupons')
      .select('*', { count: 'exact' });

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (search) {
      query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: coupons, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list coupons', { error });
      throw new DatabaseError('Failed to list coupons', { error });
    }

    return {
      coupons: (coupons || []) as Coupon[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing coupons', { error });
    throw new DatabaseError('Failed to list coupons', { error });
  }
}

/**
 * Calculate discount
 */
export function calculateDiscount(coupon: Coupon, amount: number): number {
  if (coupon.type === 'percentage') {
    return amount * (coupon.value / 100);
  } else {
    return Math.min(coupon.value, amount);
  }
}

/**
 * Get coupon statistics
 */
export async function getCouponStatistics(): Promise<{
  total: number;
  active: number;
  inactive: number;
  totalRedemptions: number;
  byType: Record<string, number>;
}> {
  try {
    const supabase = getSupabaseClient();

    const [{ data: allCoupons }, { count: active }, { count: inactive }] = await Promise.all([
      supabase.from('coupons').select('type, redemptions_count'),
      supabase.from('coupons').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('coupons').select('*', { count: 'exact', head: true }).eq('is_active', false),
    ]);

    const byType: Record<string, number> = {};
    let totalRedemptions = 0;

    for (const coupon of allCoupons || []) {
      byType[coupon.type] = (byType[coupon.type] || 0) + 1;
      totalRedemptions += coupon.redemptions_count;
    }

    return {
      total: allCoupons?.length || 0,
      active: active || 0,
      inactive: inactive || 0,
      totalRedemptions,
      byType,
    };
  } catch (error) {
    logger.error('Failed to get coupon statistics', { error });
    throw new DatabaseError('Failed to get coupon statistics', { error });
  }
}
