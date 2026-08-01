import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateManageTaxPermission } from './billing-permissions';
import { validateTaxAmount } from './billing-validation';
import { TaxRule, TaxType } from './billing-types';

/**
 * Calculate tax amount
 */
export function calculateTax(amount: number, taxRate: number): number {
  return (amount * taxRate) / 100;
}

/**
 * Get applicable tax rules for a service
 */
export async function getApplicableTaxRules(
  serviceType: string,
  country?: string,
  state?: string
): Promise<TaxRule[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('tax_rules')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .lte('effective_from', new Date().toISOString())
      .gt('effective_to', new Date().toISOString())
      .or('effective_to.is.null');

    // Filter by applicable services
    query = query.or(`applicable_services.cs.{${serviceType}},applicable_services.is.null`);

    // Filter by exempt services - exclude if service is exempt
    query = query.not('exempt_services', 'cs', `{${serviceType}}`);

    // Filter by country if specified
    if (country) {
      query = query.or(`country.eq.${country},country.is.null`);
    }

    // Filter by state if specified
    if (state) {
      query = query.or(`state.eq.${state},state.is.null`);
    }

    const { data, error } = await query.order('tax_rate', { ascending: false });

    if (error) {
      logger.error('Failed to fetch applicable tax rules', { error, serviceType });
      throw new DatabaseError('Failed to fetch applicable tax rules', { error });
    }

    return (data || []) as TaxRule[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching applicable tax rules', { error, serviceType });
    throw new DatabaseError('Failed to fetch applicable tax rules', { error });
  }
}

/**
 * Get total tax rate for a service
 */
export async function getTotalTaxRate(
  serviceType: string,
  country?: string,
  state?: string
): Promise<{
  totalTaxRate: number;
  taxRules: TaxRule[];
}> {
  const taxRules = await getApplicableTaxRules(serviceType, country, state);
  const totalTaxRate = taxRules.reduce((sum, rule) => sum + rule.tax_rate, 0);

  return {
    totalTaxRate,
    taxRules,
  };
}

/**
 * Calculate total tax for an amount
 */
export async function calculateTotalTax(
  amount: number,
  serviceType: string,
  country?: string,
  state?: string
): Promise<{
  taxAmount: number;
  taxBreakdown: Array<{ taxType: TaxType; taxRate: number; taxAmount: number }>;
}> {
  const { taxRules } = await getTotalTaxRate(serviceType, country, state);

  const taxBreakdown = taxRules.map((rule) => ({
    taxType: rule.tax_type,
    taxRate: rule.tax_rate,
    taxAmount: calculateTax(amount, rule.tax_rate),
  }));

  const taxAmount = taxBreakdown.reduce((sum, item) => sum + item.taxAmount, 0);

  return {
    taxAmount,
    taxBreakdown,
  };
}

/**
 * Check if service is tax exempt
 */
export async function isTaxExempt(serviceType: string, country?: string, state?: string): Promise<boolean> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('tax_rules')
      .select('exempt_services')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .lte('effective_from', new Date().toISOString())
      .gt('effective_to', new Date().toISOString())
      .or('effective_to.is.null')
      .contains('exempt_services', serviceType)
      .limit(1)
      .single();

    if (error) {
      logger.error('Failed to check tax exemption', { error, serviceType });
      throw new DatabaseError('Failed to check tax exemption', { error });
    }

    return !!data;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error checking tax exemption', { error, serviceType });
    throw new DatabaseError('Failed to check tax exemption', { error });
  }
}

/**
 * Create tax rule
 */
export async function createTaxRule(rule: Omit<TaxRule, 'id' | 'created_at' | 'updated_at'>): Promise<TaxRule> {
  await validateManageTaxPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('tax_rules')
      .insert({
        ...rule,
        clinic_id: clinicId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create tax rule', { error });
      throw new DatabaseError('Failed to create tax rule', { error });
    }

    logger.info('Tax rule created successfully', { taxType: rule.tax_type });
    return data as TaxRule;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating tax rule', { error });
    throw new DatabaseError('Failed to create tax rule', { error });
  }
}

/**
 * Update tax rule
 */
export async function updateTaxRule(ruleId: string, updates: Partial<TaxRule>): Promise<TaxRule> {
  await validateManageTaxPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('tax_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update tax rule', { error, ruleId });
      throw new DatabaseError('Failed to update tax rule', { error });
    }

    if (!data) {
      throw new NotFoundError('Tax rule not found');
    }

    logger.info('Tax rule updated successfully', { ruleId });
    return data as TaxRule;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating tax rule', { error, ruleId });
    throw new DatabaseError('Failed to update tax rule', { error });
  }
}

/**
 * Delete tax rule (soft delete)
 */
export async function deleteTaxRule(ruleId: string): Promise<void> {
  await validateManageTaxPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('tax_rules')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .eq('clinic_id', clinicId);

    if (error) {
      logger.error('Failed to delete tax rule', { error, ruleId });
      throw new DatabaseError('Failed to delete tax rule', { error });
    }

    logger.info('Tax rule deleted successfully', { ruleId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting tax rule', { error, ruleId });
    throw new DatabaseError('Failed to delete tax rule', { error });
  }
}

/**
 * Get all tax rules for clinic
 */
export async function getTaxRules(): Promise<TaxRule[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('tax_rules')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('tax_type', { ascending: true });

    if (error) {
      logger.error('Failed to fetch tax rules', { error });
      throw new DatabaseError('Failed to fetch tax rules', { error });
    }

    return (data || []) as TaxRule[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching tax rules', { error });
    throw new DatabaseError('Failed to fetch tax rules', { error });
  }
}

/**
 * Placeholder for tax API integration
 * Future integration with government tax APIs
 */
export async function validateTaxWithGovernmentAPI(
  taxId: string,
  amount: number,
  country: string
): Promise<{
  valid: boolean;
  taxRate: number;
  taxAmount: number;
  errorMessage?: string;
}> {
  // Placeholder for government tax API validation
  logger.info('Government tax API validation requested', { taxId, amount, country });

  return {
    valid: false,
    taxRate: 0,
    taxAmount: 0,
    errorMessage: 'Government tax API integration not yet implemented',
  };
}

/**
 * Placeholder for e-invoicing tax calculation
 * Future integration with government e-invoicing systems
 */
export async function calculateEInvoiceTax(
  invoiceData: any,
  country: string
): Promise<{
  taxBreakdown: Array<{ taxType: string; taxRate: number; taxAmount: number; taxCode: string }>;
  totalTax: number;
}> {
  // Placeholder for e-invoicing tax calculation
  logger.info('E-invoice tax calculation requested', { country });

  return {
    taxBreakdown: [],
    totalTax: 0,
  };
}
