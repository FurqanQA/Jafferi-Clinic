import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateOpenCashDrawerPermission, validateCloseCashDrawerPermission } from './payment-permissions';
import { validateCashDrawerStatus, validateCashDrawerBalance } from './payment-validation';
import { CashDrawer, CashDrawerStatus, CashTransaction, Currency } from './payment-types';

// ============================================================================
// Cash Drawer Engine
// ============================================================================

/**
 * Generate unique drawer number
 */
function generateDrawerNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DRW-${timestamp}-${random}`;
}

/**
 * Open cash drawer
 */
export async function openCashDrawer(
  openingBalance: number,
  currency: Currency = 'USD',
  notes?: string
): Promise<CashDrawer> {
  await validateOpenCashDrawerPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    validateCashDrawerBalance(openingBalance);

    // Check if there's already an open drawer for this user/clinic
    const { data: existingDrawer, error: checkError } = await supabase
      .from('cash_drawers')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('opened_by', user.id)
      .eq('status', 'open')
      .single();

    if (existingDrawer && !checkError) {
      throw new Error('Cash drawer is already open for this user');
    }

    const drawerNumber = generateDrawerNumber();

    const { data, error } = await supabase
      .from('cash_drawers')
      .insert({
        clinic_id: clinicId,
        drawer_number: drawerNumber,
        status: 'open',
        opened_by: user.id,
        opening_balance: openingBalance,
        current_balance: openingBalance,
        currency,
        notes,
        opened_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to open cash drawer', { error, openingBalance });
      throw new DatabaseError('Failed to open cash drawer', { error });
    }

    logger.info('Cash drawer opened successfully', { drawerNumber, openingBalance });
    return data as CashDrawer;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error opening cash drawer', { error, openingBalance });
    throw new DatabaseError('Failed to open cash drawer', { error });
  }
}

/**
 * Close cash drawer
 */
export async function closeCashDrawer(drawerId: string, closingBalance: number, notes?: string): Promise<CashDrawer> {
  await validateCloseCashDrawerPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const drawer = await getCashDrawer(drawerId);

    if (drawer.status !== 'open') {
      throw new Error(`Cannot close drawer with status: ${drawer.status}`);
    }

    validateCashDrawerBalance(closingBalance);

    const variance = closingBalance - drawer.current_balance;

    const { data, error } = await supabase
      .from('cash_drawers')
      .update({
        status: 'closed',
        closed_by: user.id,
        closing_balance: closingBalance,
        current_balance: closingBalance,
        notes: notes ? `${drawer.notes || ''}\nClosing notes: ${notes}`.trim() : drawer.notes,
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', drawerId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to close cash drawer', { error, drawerId });
      throw new DatabaseError('Failed to close cash drawer', { error });
    }

    logger.info('Cash drawer closed successfully', { drawerId, closingBalance, variance });
    return data as CashDrawer;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error closing cash drawer', { error, drawerId });
    throw new DatabaseError('Failed to close cash drawer', { error });
  }
}

/**
 * Get cash drawer by ID
 */
export async function getCashDrawer(drawerId: string): Promise<CashDrawer> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('cash_drawers')
      .select('*')
      .eq('id', drawerId)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch cash drawer', { error, drawerId });
      throw new DatabaseError('Failed to fetch cash drawer', { error });
    }

    if (!data) {
      throw new NotFoundError('Cash drawer not found');
    }

    return data as CashDrawer;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching cash drawer', { error, drawerId });
    throw new DatabaseError('Failed to fetch cash drawer', { error });
  }
}

/**
 * Get cash drawer by number
 */
export async function getCashDrawerByNumber(drawerNumber: string): Promise<CashDrawer> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('cash_drawers')
      .select('*')
      .eq('drawer_number', drawerNumber)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch cash drawer by number', { error, drawerNumber });
      throw new DatabaseError('Failed to fetch cash drawer by number', { error });
    }

    if (!data) {
      throw new NotFoundError('Cash drawer not found');
    }

    return data as CashDrawer;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching cash drawer by number', { error, drawerNumber });
    throw new DatabaseError('Failed to fetch cash drawer by number', { error });
  }
}

/**
 * Get open cash drawer for user
 */
export async function getOpenCashDrawer(): Promise<CashDrawer | null> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('cash_drawers')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('opened_by', user.id)
      .eq('status', 'open')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      logger.error('Failed to fetch open cash drawer', { error });
      throw new DatabaseError('Failed to fetch open cash drawer', { error });
    }

    return data as CashDrawer;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching open cash drawer', { error });
    throw new DatabaseError('Failed to fetch open cash drawer', { error });
  }
}

/**
 * Get all cash drawers for clinic
 */
export async function getCashDrawers(status?: CashDrawerStatus): Promise<CashDrawer[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('cash_drawers')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('opened_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch cash drawers', { error });
      throw new DatabaseError('Failed to fetch cash drawers', { error });
    }

    return (data || []) as CashDrawer[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching cash drawers', { error });
    throw new DatabaseError('Failed to fetch cash drawers', { error });
  }
}

/**
 * Cash in to drawer
 */
export async function cashIn(
  drawerId: string,
  amount: number,
  currency: Currency,
  description?: string,
  referenceId?: string
): Promise<CashDrawer> {
  await validateOpenCashDrawerPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const drawer = await getCashDrawer(drawerId);

    if (drawer.status !== 'open') {
      throw new Error('Cannot add cash to closed drawer');
    }

    validateCashDrawerBalance(amount);

    // Create cash transaction record
    const { error: transactionError } = await supabase
      .from('cash_transactions')
      .insert({
        drawer_id: drawerId,
        type: 'cash_in',
        amount,
        currency,
        description,
        reference_id: referenceId,
        created_at: new Date().toISOString(),
        created_by: user.id,
      });

    if (transactionError) {
      throw new DatabaseError('Failed to create cash transaction', { error: transactionError });
    }

    // Update drawer balance
    const newBalance = drawer.current_balance + amount;

    const { data, error } = await supabase
      .from('cash_drawers')
      .update({
        current_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', drawerId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update drawer balance', { error, drawerId });
      throw new DatabaseError('Failed to update drawer balance', { error });
    }

    logger.info('Cash in recorded successfully', { drawerId, amount });
    return data as CashDrawer;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error recording cash in', { error, drawerId });
    throw new DatabaseError('Failed to record cash in', { error });
  }
}

/**
 * Cash out from drawer
 */
export async function cashOut(
  drawerId: string,
  amount: number,
  currency: Currency,
  description?: string,
  referenceId?: string
): Promise<CashDrawer> {
  await validateOpenCashDrawerPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const drawer = await getCashDrawer(drawerId);

    if (drawer.status !== 'open') {
      throw new Error('Cannot remove cash from closed drawer');
    }

    validateCashDrawerBalance(amount);

    if (amount > drawer.current_balance) {
      throw new Error('Insufficient balance in drawer');
    }

    // Create cash transaction record
    const { error: transactionError } = await supabase
      .from('cash_transactions')
      .insert({
        drawer_id: drawerId,
        type: 'cash_out',
        amount,
        currency,
        description,
        reference_id: referenceId,
        created_at: new Date().toISOString(),
        created_by: user.id,
      });

    if (transactionError) {
      throw new DatabaseError('Failed to create cash transaction', { error: transactionError });
    }

    // Update drawer balance
    const newBalance = drawer.current_balance - amount;

    const { data, error } = await supabase
      .from('cash_drawers')
      .update({
        current_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', drawerId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update drawer balance', { error, drawerId });
      throw new DatabaseError('Failed to update drawer balance', { error });
    }

    logger.info('Cash out recorded successfully', { drawerId, amount });
    return data as CashDrawer;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error recording cash out', { error, drawerId });
    throw new DatabaseError('Failed to record cash out', { error });
  }
}

/**
 * Get cash transactions for drawer
 */
export async function getCashTransactions(drawerId: string): Promise<CashTransaction[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('cash_transactions')
      .select('*')
      .eq('drawer_id', drawerId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch cash transactions', { error, drawerId });
      throw new DatabaseError('Failed to fetch cash transactions', { error });
    }

    return (data || []) as CashTransaction[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching cash transactions', { error, drawerId });
    throw new DatabaseError('Failed to fetch cash transactions', { error });
  }
}

/**
 * Calculate variance
 */
export function calculateVariance(expectedBalance: number, actualBalance: number): number {
  return actualBalance - expectedBalance;
}

/**
 * Perform cash audit (placeholder)
 */
export async function performCashAudit(drawerId: string): Promise<{
  expectedBalance: number;
  actualBalance: number;
  variance: number;
  transactions: CashTransaction[];
}> {
  // Placeholder for cash audit logic
  logger.info('Cash audit requested', { drawerId });

  const drawer = await getCashDrawer(drawerId);
  const transactions = await getCashTransactions(drawerId);

  // Placeholder: Calculate expected balance from transactions
  const expectedBalance = drawer.current_balance;
  const actualBalance = drawer.current_balance;
  const variance = calculateVariance(expectedBalance, actualBalance);

  return {
    expectedBalance,
    actualBalance,
    variance,
    transactions,
  };
}

/**
 * Lock cash drawer
 */
export async function lockCashDrawer(drawerId: string): Promise<CashDrawer> {
  await validateOpenCashDrawerPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const drawer = await getCashDrawer(drawerId);

    if (drawer.status !== 'open') {
      throw new Error(`Cannot lock drawer with status: ${drawer.status}`);
    }

    const { data, error } = await supabase
      .from('cash_drawers')
      .update({
        status: 'locked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', drawerId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to lock cash drawer', { error, drawerId });
      throw new DatabaseError('Failed to lock cash drawer', { error });
    }

    logger.info('Cash drawer locked successfully', { drawerId });
    return data as CashDrawer;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error locking cash drawer', { error, drawerId });
    throw new DatabaseError('Failed to lock cash drawer', { error });
  }
}

/**
 * Unlock cash drawer
 */
export async function unlockCashDrawer(drawerId: string): Promise<CashDrawer> {
  await validateOpenCashDrawerPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const drawer = await getCashDrawer(drawerId);

    if (drawer.status !== 'locked') {
      throw new Error(`Cannot unlock drawer with status: ${drawer.status}`);
    }

    const { data, error } = await supabase
      .from('cash_drawers')
      .update({
        status: 'open',
        updated_at: new Date().toISOString(),
      })
      .eq('id', drawerId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to unlock cash drawer', { error, drawerId });
      throw new DatabaseError('Failed to unlock cash drawer', { error });
    }

    logger.info('Cash drawer unlocked successfully', { drawerId });
    return data as CashDrawer;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error unlocking cash drawer', { error, drawerId });
    throw new DatabaseError('Failed to unlock cash drawer', { error });
  }
}
