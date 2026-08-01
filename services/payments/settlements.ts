import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateSettlementPermission } from './payment-permissions';
import { validateSettlementFrequency } from './payment-validation';
import { Settlement, SettlementStatus, SettlementFrequency, PaymentGateway, Currency } from './payment-types';

// ============================================================================
// Settlement Engine
// ============================================================================

/**
 * Generate unique settlement number
 */
function generateSettlementNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `STL-${timestamp}-${random}`;
}

/**
 * Create settlement record
 */
export async function createSettlement(
  gateway: PaymentGateway,
  frequency: SettlementFrequency,
  startDate: string,
  endDate: string,
  currency: Currency = 'USD'
): Promise<Settlement> {
  await validateSettlementPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    validateSettlementFrequency(frequency);

    const settlementNumber = generateSettlementNumber();

    const { data, error } = await supabase
      .from('settlements')
      .insert({
        clinic_id: clinicId,
        settlement_number: settlementNumber,
        gateway,
        status: 'pending',
        frequency,
        start_date: startDate,
        end_date: endDate,
        total_amount: 0,
        currency,
        transaction_count: 0,
        fee_amount: 0,
        net_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create settlement', { error, gateway, frequency });
      throw new DatabaseError('Failed to create settlement', { error });
    }

    logger.info('Settlement created successfully', { settlementNumber, gateway, frequency });
    return data as Settlement;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating settlement', { error, gateway, frequency });
    throw new DatabaseError('Failed to create settlement', { error });
  }
}

/**
 * Get settlement by ID
 */
export async function getSettlement(settlementId: string): Promise<Settlement> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('id', settlementId)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch settlement', { error, settlementId });
      throw new DatabaseError('Failed to fetch settlement', { error });
    }

    if (!data) {
      throw new NotFoundError('Settlement not found');
    }

    return data as Settlement;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching settlement', { error, settlementId });
    throw new DatabaseError('Failed to fetch settlement', { error });
  }
}

/**
 * Get settlement by number
 */
export async function getSettlementByNumber(settlementNumber: string): Promise<Settlement> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('settlement_number', settlementNumber)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch settlement by number', { error, settlementNumber });
      throw new DatabaseError('Failed to fetch settlement by number', { error });
    }

    if (!data) {
      throw new NotFoundError('Settlement not found');
    }

    return data as Settlement;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching settlement by number', { error, settlementNumber });
    throw new DatabaseError('Failed to fetch settlement by number', { error });
  }
}

/**
 * Get all settlements for clinic
 */
export async function getSettlements(
  gateway?: PaymentGateway,
  status?: SettlementStatus
): Promise<Settlement[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('settlements')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (gateway) {
      query = query.eq('gateway', gateway);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch settlements', { error });
      throw new DatabaseError('Failed to fetch settlements', { error });
    }

    return (data || []) as Settlement[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching settlements', { error });
    throw new DatabaseError('Failed to fetch settlements', { error });
  }
}

/**
 * Process settlement
 */
export async function processSettlement(
  settlementId: string,
  results: {
    totalAmount: number;
    transactionCount: number;
    feeAmount: number;
    netAmount: number;
    gatewayReference?: string;
  }
): Promise<Settlement> {
  await validateSettlementPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const settlement = await getSettlement(settlementId);

    if (settlement.status !== 'pending') {
      throw new Error(`Cannot process settlement with status: ${settlement.status}`);
    }

    const { data, error } = await supabase
      .from('settlements')
      .update({
        status: 'processing',
        total_amount: results.totalAmount,
        transaction_count: results.transactionCount,
        fee_amount: results.feeAmount,
        net_amount: results.netAmount,
        gateway_reference: results.gatewayReference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', settlementId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to process settlement', { error, settlementId });
      throw new DatabaseError('Failed to process settlement', { error });
    }

    logger.info('Settlement processed successfully', { settlementId, results });
    return data as Settlement;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error processing settlement', { error, settlementId });
    throw new DatabaseError('Failed to process settlement', { error });
  }
}

/**
 * Complete settlement
 */
export async function completeSettlement(
  settlementId: string,
  settlementDate?: string
): Promise<Settlement> {
  await validateSettlementPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const settlement = await getSettlement(settlementId);

    if (settlement.status !== 'processing') {
      throw new Error(`Cannot complete settlement with status: ${settlement.status}`);
    }

    const { data, error } = await supabase
      .from('settlements')
      .update({
        status: 'completed',
        settlement_date: settlementDate || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', settlementId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to complete settlement', { error, settlementId });
      throw new DatabaseError('Failed to complete settlement', { error });
    }

    logger.info('Settlement completed successfully', { settlementId, settlementDate });
    return data as Settlement;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error completing settlement', { error, settlementId });
    throw new DatabaseError('Failed to complete settlement', { error });
  }
}

/**
 * Fail settlement
 */
export async function failSettlement(settlementId: string, reason?: string): Promise<Settlement> {
  await validateSettlementPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const settlement = await getSettlement(settlementId);

    if (settlement.status !== 'processing') {
      throw new Error(`Cannot fail settlement with status: ${settlement.status}`);
    }

    const { data, error } = await supabase
      .from('settlements')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', settlementId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to fail settlement', { error, settlementId });
      throw new DatabaseError('Failed to fail settlement', { error });
    }

    logger.info('Settlement failed', { settlementId, reason });
    return data as Settlement;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error failing settlement', { error, settlementId });
    throw new DatabaseError('Failed to fail settlement', { error });
  }
}

/**
 * Cancel settlement
 */
export async function cancelSettlement(settlementId: string): Promise<Settlement> {
  await validateSettlementPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const settlement = await getSettlement(settlementId);

    if (settlement.status !== 'pending' && settlement.status !== 'processing') {
      throw new Error(`Cannot cancel settlement with status: ${settlement.status}`);
    }

    const { data, error } = await supabase
      .from('settlements')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', settlementId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to cancel settlement', { error, settlementId });
      throw new DatabaseError('Failed to cancel settlement', { error });
    }

    logger.info('Settlement cancelled successfully', { settlementId });
    return data as Settlement;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error cancelling settlement', { error, settlementId });
    throw new DatabaseError('Failed to cancel settlement', { error });
  }
}

/**
 * Get settlement report
 */
export async function getSettlementReport(
  startDate: string,
  endDate: string,
  gateway?: PaymentGateway
): Promise<{
  totalSettlements: number;
  totalAmount: number;
  totalFees: number;
  totalNetAmount: number;
  byGateway: Record<PaymentGateway, { count: number; amount: number; fees: number; netAmount: number }>;
  settlements: Settlement[];
}> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('settlements')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('start_date', startDate)
      .lte('end_date', endDate)
      .eq('status', 'completed');

    if (gateway) {
      query = query.eq('gateway', gateway);
    }

    const { data, error } = await query.order('settlement_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch settlement report', { error });
      throw new DatabaseError('Failed to fetch settlement report', { error });
    }

    const settlements = (data || []) as Settlement[];

    const totalSettlements = settlements.length;
    const totalAmount = settlements.reduce((sum, s) => sum + s.total_amount, 0);
    const totalFees = settlements.reduce((sum, s) => sum + s.fee_amount, 0);
    const totalNetAmount = settlements.reduce((sum, s) => sum + s.net_amount, 0);

    const byGateway: Record<PaymentGateway, { count: number; amount: number; fees: number; netAmount: number }> = {} as any;

    settlements.forEach(settlement => {
      if (!byGateway[settlement.gateway]) {
        byGateway[settlement.gateway] = { count: 0, amount: 0, fees: 0, netAmount: 0 };
      }
      byGateway[settlement.gateway].count++;
      byGateway[settlement.gateway].amount += settlement.total_amount;
      byGateway[settlement.gateway].fees += settlement.fee_amount;
      byGateway[settlement.gateway].netAmount += settlement.net_amount;
    });

    return {
      totalSettlements,
      totalAmount,
      totalFees,
      totalNetAmount,
      byGateway,
      settlements,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching settlement report', { error });
    throw new DatabaseError('Failed to fetch settlement report', { error });
  }
}

/**
 * Get pending settlements
 */
export async function getPendingSettlements(): Promise<Settlement[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch pending settlements', { error });
      throw new DatabaseError('Failed to fetch pending settlements', { error });
    }

    return (data || []) as Settlement[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching pending settlements', { error });
    throw new DatabaseError('Failed to fetch pending settlements', { error });
  }
}

/**
 * Calculate next settlement date based on frequency (placeholder)
 */
export function calculateNextSettlementDate(
  frequency: SettlementFrequency,
  baseDate?: Date
): Date {
  const date = baseDate || new Date();

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'custom':
      // Placeholder for custom frequency logic
      break;
  }

  return date;
}

/**
 * Auto-create settlement based on frequency (placeholder)
 */
export async function autoCreateSettlement(gateway: PaymentGateway, frequency: SettlementFrequency): Promise<Settlement> {
  // Placeholder for auto-settlement logic
  logger.info('Auto settlement creation requested', { gateway, frequency });

  const now = new Date();
  const nextDate = calculateNextSettlementDate(frequency, now);

  return createSettlement(
    gateway,
    frequency,
    now.toISOString(),
    nextDate.toISOString()
  );
}
