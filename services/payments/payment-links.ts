import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validatePaymentLinkPermission } from './payment-permissions';
import { validatePaymentLinkExpiry } from './payment-validation';
import { PaymentLink, PaymentLinkStatus, Currency } from './payment-types';

// ============================================================================
// Payment Link Engine
// ============================================================================

/**
 * Generate unique payment link number
 */
function generatePaymentLinkNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `LNK-${timestamp}-${random}`;
}

/**
 * Generate secure payment URL
 */
function generatePaymentURL(linkNumber: string): string {
  const baseUrl = process.env.PAYMENT_BASE_URL || 'https://pay.jaffericlinic.com';
  return `${baseUrl}/pay/${linkNumber}`;
}

/**
 * Create payment link
 */
export async function createPaymentLink(
  invoiceId: string,
  amount: number,
  currency: Currency = 'USD',
  expiryDate?: string,
  isOneTime: boolean = true
): Promise<PaymentLink> {
  await validatePaymentLinkPermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    validatePaymentLinkExpiry(expiryDate);

    const linkNumber = generatePaymentLinkNumber();
    const url = generatePaymentURL(linkNumber);

    const { data, error } = await supabase
      .from('payment_links')
      .insert({
        clinic_id: clinicId,
        invoice_id: invoiceId,
        link_number: linkNumber,
        url,
        amount,
        currency,
        expiry_date: expiryDate,
        is_one_time: isOneTime,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create payment link', { error, invoiceId, amount });
      throw new DatabaseError('Failed to create payment link', { error });
    }

    logger.info('Payment link created successfully', { linkNumber, invoiceId, amount });
    return data as PaymentLink;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating payment link', { error, invoiceId });
    throw new DatabaseError('Failed to create payment link', { error });
  }
}

/**
 * Get payment link by ID
 */
export async function getPaymentLink(linkId: string): Promise<PaymentLink> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('id', linkId)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch payment link', { error, linkId });
      throw new DatabaseError('Failed to fetch payment link', { error });
    }

    if (!data) {
      throw new NotFoundError('Payment link not found');
    }

    return data as PaymentLink;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching payment link', { error, linkId });
    throw new DatabaseError('Failed to fetch payment link', { error });
  }
}

/**
 * Get payment link by number
 */
export async function getPaymentLinkByNumber(linkNumber: string): Promise<PaymentLink> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('link_number', linkNumber)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch payment link by number', { error, linkNumber });
      throw new DatabaseError('Failed to fetch payment link by number', { error });
    }

    if (!data) {
      throw new NotFoundError('Payment link not found');
    }

    return data as PaymentLink;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching payment link by number', { error, linkNumber });
    throw new DatabaseError('Failed to fetch payment link by number', { error });
  }
}

/**
 * Get payment link by URL
 */
export async function getPaymentLinkByURL(url: string): Promise<PaymentLink> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('url', url)
      .single();

    if (error) {
      logger.error('Failed to fetch payment link by URL', { error, url });
      throw new DatabaseError('Failed to fetch payment link by URL', { error });
    }

    if (!data) {
      throw new NotFoundError('Payment link not found');
    }

    return data as PaymentLink;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching payment link by URL', { error, url });
    throw new DatabaseError('Failed to fetch payment link by URL', { error });
  }
}

/**
 * Get payment links for invoice
 */
export async function getInvoicePaymentLinks(invoiceId: string): Promise<PaymentLink[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch invoice payment links', { error, invoiceId });
      throw new DatabaseError('Failed to fetch invoice payment links', { error });
    }

    return (data || []) as PaymentLink[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching invoice payment links', { error, invoiceId });
    throw new DatabaseError('Failed to fetch invoice payment links', { error });
  }
}

/**
 * Mark payment link as used
 */
export async function markPaymentLinkAsUsed(linkId: string): Promise<PaymentLink> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const link = await getPaymentLink(linkId);

    if (link.status !== 'active') {
      throw new Error(`Cannot mark link as used with status: ${link.status}`);
    }

    const { data, error } = await supabase
      .from('payment_links')
      .update({
        status: 'used',
        updated_at: new Date().toISOString(),
      })
      .eq('id', linkId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to mark payment link as used', { error, linkId });
      throw new DatabaseError('Failed to mark payment link as used', { error });
    }

    logger.info('Payment link marked as used', { linkId });
    return data as PaymentLink;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error marking payment link as used', { error, linkId });
    throw new DatabaseError('Failed to mark payment link as used', { error });
  }
}

/**
 * Cancel payment link
 */
export async function cancelPaymentLink(linkId: string): Promise<PaymentLink> {
  await validatePaymentLinkPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const link = await getPaymentLink(linkId);

    if (link.status !== 'active') {
      throw new Error(`Cannot cancel link with status: ${link.status}`);
    }

    const { data, error } = await supabase
      .from('payment_links')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', linkId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to cancel payment link', { error, linkId });
      throw new DatabaseError('Failed to cancel payment link', { error });
    }

    logger.info('Payment link cancelled successfully', { linkId });
    return data as PaymentLink;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error cancelling payment link', { error, linkId });
    throw new DatabaseError('Failed to cancel payment link', { error });
  }
}

/**
 * Update payment link expiry
 */
export async function updatePaymentLinkExpiry(linkId: string, expiryDate?: string): Promise<PaymentLink> {
  await validatePaymentLinkPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    validatePaymentLinkExpiry(expiryDate);

    const link = await getPaymentLink(linkId);

    if (link.status !== 'active') {
      throw new Error(`Cannot update expiry for link with status: ${link.status}`);
    }

    const { data, error } = await supabase
      .from('payment_links')
      .update({
        expiry_date: expiryDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', linkId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update payment link expiry', { error, linkId });
      throw new DatabaseError('Failed to update payment link expiry', { error });
    }

    logger.info('Payment link expiry updated successfully', { linkId, expiryDate });
    return data as PaymentLink;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating payment link expiry', { error, linkId });
    throw new DatabaseError('Failed to update payment link expiry', { error });
  }
}

/**
 * Check and update expired payment links
 */
export async function updateExpiredPaymentLinks(): Promise<number> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('payment_links')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('clinic_id', clinicId)
      .lt('expiry_date', now)
      .eq('status', 'active')
      .select();

    if (error) {
      logger.error('Failed to update expired payment links', { error });
      throw new DatabaseError('Failed to update expired payment links', { error });
    }

    const updatedCount = (data || []).length;
    logger.info('Expired payment links updated', { count: updatedCount });
    return updatedCount;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error updating expired payment links', { error });
    throw new DatabaseError('Failed to update expired payment links', { error });
  }
}

/**
 * Get active payment links for clinic
 */
export async function getActivePaymentLinks(): Promise<PaymentLink[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch active payment links', { error });
      throw new DatabaseError('Failed to fetch active payment links', { error });
    }

    return (data || []) as PaymentLink[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching active payment links', { error });
    throw new DatabaseError('Failed to fetch active payment links', { error });
  }
}

/**
 * Regenerate payment link URL
 */
export async function regeneratePaymentLinkURL(linkId: string): Promise<PaymentLink> {
  await validatePaymentLinkPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const link = await getPaymentLink(linkId);

    if (link.status !== 'active') {
      throw new Error(`Cannot regenerate URL for link with status: ${link.status}`);
    }

    const newLinkNumber = generatePaymentLinkNumber();
    const newURL = generatePaymentURL(newLinkNumber);

    const { data, error } = await supabase
      .from('payment_links')
      .update({
        link_number: newLinkNumber,
        url: newURL,
        updated_at: new Date().toISOString(),
      })
      .eq('id', linkId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to regenerate payment link URL', { error, linkId });
      throw new DatabaseError('Failed to regenerate payment link URL', { error });
    }

    logger.info('Payment link URL regenerated successfully', { linkId, newURL });
    return data as PaymentLink;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error regenerating payment link URL', { error, linkId });
    throw new DatabaseError('Failed to regenerate payment link URL', { error });
  }
}
