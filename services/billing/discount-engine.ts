import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateManageDiscountPermission } from './billing-permissions';
import { validateDiscountAmount } from './billing-validation';
import { DiscountRule, DiscountType } from './billing-types';

/**
 * Calculate discount amount
 */
export function calculateDiscount(
  amount: number,
  discountValue: number,
  discountType: DiscountType,
  maxDiscount?: number
): number {
  let discountAmount = 0;

  if (discountType === 'percentage') {
    discountAmount = (amount * discountValue) / 100;
  } else {
    discountAmount = discountValue; // fixed_amount
  }

  // Apply maximum discount limit if specified
  if (maxDiscount && discountAmount > maxDiscount) {
    discountAmount = maxDiscount;
  }

  // Ensure discount doesn't exceed the amount
  if (discountAmount > amount) {
    discountAmount = amount;
  }

  return discountAmount;
}

/**
 * Get applicable discount rules for a service
 */
export async function getApplicableDiscounts(
  serviceType: string,
  patientCategory?: string,
  membershipTier?: string
): Promise<DiscountRule[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('discount_rules')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .lte('valid_from', new Date().toISOString())
      .gt('valid_to', new Date().toISOString())
      .or('valid_to.is.null');

    // Filter by applicable services
    query = query.or(`applicable_services.cs.{${serviceType}},applicable_services.is.null`);

    // Filter by patient category if specified
    if (patientCategory) {
      query = query.or(`patient_categories.cs.{${patientCategory}},patient_categories.is.null`);
    }

    // Filter by membership tier if specified
    if (membershipTier) {
      query = query.or(`membership_tiers.cs.{${membershipTier}},membership_tiers.is.null`);
    }

    const { data, error } = await query.order('discount_value', { ascending: false });

    if (error) {
      logger.error('Failed to fetch applicable discounts', { error, serviceType });
      throw new DatabaseError('Failed to fetch applicable discounts', { error });
    }

    return (data || []) as DiscountRule[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching applicable discounts', { error, serviceType });
    throw new DatabaseError('Failed to fetch applicable discounts', { error });
  }
}

/**
 * Get best discount for a service
 */
export async function getBestDiscount(
  amount: number,
  serviceType: string,
  patientCategory?: string,
  membershipTier?: string
): Promise<{
  discountRule: DiscountRule;
  discountAmount: number;
}> {
  const discountRules = await getApplicableDiscounts(serviceType, patientCategory, membershipTier);

  if (discountRules.length === 0) {
    throw new NotFoundError('No applicable discounts found');
  }

  let bestRule = discountRules[0];
  let bestDiscountAmount = calculateDiscount(
    amount,
    bestRule.discount_value,
    bestRule.discount_type,
    bestRule.max_discount
  );

  for (const rule of discountRules) {
    const discountAmount = calculateDiscount(
      amount,
      rule.discount_value,
      rule.discount_type,
      rule.max_discount
    );

    if (discountAmount > bestDiscountAmount) {
      bestRule = rule;
      bestDiscountAmount = discountAmount;
    }
  }

  return {
    discountRule: bestRule,
    discountAmount: bestDiscountAmount,
  };
}

/**
 * Create discount rule
 */
export async function createDiscountRule(rule: Omit<DiscountRule, 'id' | 'created_at' | 'updated_at'>): Promise<DiscountRule> {
  await validateManageDiscountPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('discount_rules')
      .insert({
        ...rule,
        clinic_id: clinicId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create discount rule', { error });
      throw new DatabaseError('Failed to create discount rule', { error });
    }

    logger.info('Discount rule created successfully', { discountType: rule.discount_type });
    return data as DiscountRule;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating discount rule', { error });
    throw new DatabaseError('Failed to create discount rule', { error });
  }
}

/**
 * Update discount rule
 */
export async function updateDiscountRule(ruleId: string, updates: Partial<DiscountRule>): Promise<DiscountRule> {
  await validateManageDiscountPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('discount_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update discount rule', { error, ruleId });
      throw new DatabaseError('Failed to update discount rule', { error });
    }

    if (!data) {
      throw new NotFoundError('Discount rule not found');
    }

    logger.info('Discount rule updated successfully', { ruleId });
    return data as DiscountRule;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating discount rule', { error, ruleId });
    throw new DatabaseError('Failed to update discount rule', { error });
  }
}

/**
 * Delete discount rule (soft delete)
 */
export async function deleteDiscountRule(ruleId: string): Promise<void> {
  await validateManageDiscountPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('discount_rules')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .eq('clinic_id', clinicId);

    if (error) {
      logger.error('Failed to delete discount rule', { error, ruleId });
      throw new DatabaseError('Failed to delete discount rule', { error });
    }

    logger.info('Discount rule deleted successfully', { ruleId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting discount rule', { error, ruleId });
    throw new DatabaseError('Failed to delete discount rule', { error });
  }
}

/**
 * Get all discount rules for clinic
 */
export async function getDiscountRules(): Promise<DiscountRule[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('discount_rules')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('valid_from', { ascending: false });

    if (error) {
      logger.error('Failed to fetch discount rules', { error });
      throw new DatabaseError('Failed to fetch discount rules', { error });
    }

    return (data || []) as DiscountRule[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching discount rules', { error });
    throw new DatabaseError('Failed to fetch discount rules', { error });
  }
}

/**
 * Placeholder for coupon validation
 * Future integration with coupon management system
 */
export async function validateCoupon(
  couponCode: string,
  serviceType: string,
  amount: number
): Promise<{
  valid: boolean;
  discountAmount: number;
  discountType: DiscountType;
  errorMessage?: string;
}> {
  // Placeholder for coupon validation logic
  logger.info('Coupon validation requested', { couponCode, serviceType, amount });

  return {
    valid: false,
    discountAmount: 0,
    discountType: 'fixed_amount',
    errorMessage: 'Coupon system not yet implemented',
  };
}

/**
 * Placeholder for campaign discount calculation
 * Future integration with marketing campaigns
 */
export async function calculateCampaignDiscount(
  campaignId: string,
  serviceType: string,
  amount: number
): Promise<{
  discountAmount: number;
  discountType: DiscountType;
  campaignName?: string;
}> {
  // Placeholder for campaign discount logic
  logger.info('Campaign discount calculation requested', { campaignId, serviceType, amount });

  return {
    discountAmount: 0,
    discountType: 'fixed_amount',
  };
}
