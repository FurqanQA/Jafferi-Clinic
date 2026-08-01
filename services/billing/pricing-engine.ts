import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateManagePricingPermission } from './billing-permissions';
import { PricingRule } from './billing-types';

/**
 * Get pricing rule for a service
 */
export async function getPricingRule(serviceType: string, serviceCode?: string, doctorId?: string): Promise<PricingRule> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('pricing_rules')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('service_type', serviceType)
      .eq('is_active', true)
      .lte('effective_from', new Date().toISOString());

    if (serviceCode) {
      query = query.eq('service_code', serviceCode);
    }

    if (doctorId) {
      query = query.or(`doctor_id.eq.${doctorId},doctor_id.is.null`);
    } else {
      query = query.is('doctor_id', null);
    }

    query = query.gt('effective_to', new Date().toISOString()).or('effective_to.is.null');

    const { data, error } = await query.order('effective_from', { ascending: false }).limit(1).single();

    if (error) {
      logger.error('Failed to fetch pricing rule', { error, serviceType, serviceCode });
      throw new DatabaseError('Failed to fetch pricing rule', { error });
    }

    if (!data) {
      throw new NotFoundError('Pricing rule not found');
    }

    return data as PricingRule;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching pricing rule', { error, serviceType });
    throw new DatabaseError('Failed to fetch pricing rule', { error });
  }
}

/**
 * Get default pricing for a service
 */
export async function getDefaultPrice(serviceType: string, serviceCode?: string): Promise<number> {
  const pricingRule = await getPricingRule(serviceType, serviceCode);
  return pricingRule.default_price;
}

/**
 * Get doctor-specific pricing for a service
 */
export async function getDoctorPrice(serviceType: string, doctorId: string, serviceCode?: string): Promise<number> {
  try {
    const pricingRule = await getPricingRule(serviceType, serviceCode, doctorId);
    return pricingRule.doctor_price || pricingRule.default_price;
  } catch (error) {
    // Fallback to default price if doctor-specific pricing not found
    return getDefaultPrice(serviceType, serviceCode);
  }
}

/**
 * Get clinic pricing for a service
 */
export async function getClinicPrice(serviceType: string, serviceCode?: string): Promise<number> {
  return getDefaultPrice(serviceType, serviceCode);
}

/**
 * Create pricing rule
 */
export async function createPricingRule(rule: Omit<PricingRule, 'id' | 'created_at' | 'updated_at'>): Promise<PricingRule> {
  await validateManagePricingPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .insert({
        ...rule,
        clinic_id: clinicId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create pricing rule', { error });
      throw new DatabaseError('Failed to create pricing rule', { error });
    }

    logger.info('Pricing rule created successfully', { serviceType: rule.service_type });
    return data as PricingRule;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating pricing rule', { error });
    throw new DatabaseError('Failed to create pricing rule', { error });
  }
}

/**
 * Update pricing rule
 */
export async function updatePricingRule(ruleId: string, updates: Partial<PricingRule>): Promise<PricingRule> {
  await validateManagePricingPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update pricing rule', { error, ruleId });
      throw new DatabaseError('Failed to update pricing rule', { error });
    }

    if (!data) {
      throw new NotFoundError('Pricing rule not found');
    }

    logger.info('Pricing rule updated successfully', { ruleId });
    return data as PricingRule;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating pricing rule', { error, ruleId });
    throw new DatabaseError('Failed to update pricing rule', { error });
  }
}

/**
 * Delete pricing rule (soft delete)
 */
export async function deletePricingRule(ruleId: string): Promise<void> {
  await validateManagePricingPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('pricing_rules')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .eq('clinic_id', clinicId);

    if (error) {
      logger.error('Failed to delete pricing rule', { error, ruleId });
      throw new DatabaseError('Failed to delete pricing rule', { error });
    }

    logger.info('Pricing rule deleted successfully', { ruleId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting pricing rule', { error, ruleId });
    throw new DatabaseError('Failed to delete pricing rule', { error });
  }
}

/**
 * Get all pricing rules for clinic
 */
export async function getPricingRules(): Promise<PricingRule[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('service_type', { ascending: true });

    if (error) {
      logger.error('Failed to fetch pricing rules', { error });
      throw new DatabaseError('Failed to fetch pricing rules', { error });
    }

    return (data || []) as PricingRule[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching pricing rules', { error });
    throw new DatabaseError('Failed to fetch pricing rules', { error });
  }
}

/**
 * Get pricing rules by service type
 */
export async function getPricingRulesByServiceType(serviceType: string): Promise<PricingRule[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('service_type', serviceType)
      .eq('is_active', true)
      .order('effective_from', { ascending: false });

    if (error) {
      logger.error('Failed to fetch pricing rules by service type', { error, serviceType });
      throw new DatabaseError('Failed to fetch pricing rules by service type', { error });
    }

    return (data || []) as PricingRule[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching pricing rules by service type', { error, serviceType });
    throw new DatabaseError('Failed to fetch pricing rules by service type', { error });
  }
}

/**
 * Placeholder for dynamic pricing calculation
 * Future integration with AI pricing suggestions
 */
export async function calculateDynamicPrice(
  serviceType: string,
  factors: {
    demandLevel?: number;
    timeOfDay?: string;
    seasonality?: number;
    competitorPricing?: number;
  }
): Promise<number> {
  // Placeholder for AI-powered dynamic pricing
  // This would integrate with external pricing engines or AI models
  logger.info('Dynamic pricing calculation requested', { serviceType, factors });

  // For now, return default price
  return getDefaultPrice(serviceType);
}

/**
 * Placeholder for package pricing calculation
 * Future support for bundled service packages
 */
export async function calculatePackagePrice(packageCode: string): Promise<{
  packagePrice: number;
  individualServicesPrice: number;
  discountAmount: number;
  services: Array<{ serviceType: string; serviceCode: string; price: number }>;
}> {
  // Placeholder for package pricing logic
  logger.info('Package pricing calculation requested', { packageCode });

  return {
    packagePrice: 0,
    individualServicesPrice: 0,
    discountAmount: 0,
    services: [],
  };
}
