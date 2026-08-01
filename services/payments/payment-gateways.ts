import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateManageCashDrawerPermission } from './payment-permissions';
import { PaymentGateway, PaymentGatewayConfig } from './payment-types';

// ============================================================================
// Payment Gateway Adapters (Placeholders)
// ============================================================================

/**
 * Base Payment Gateway Adapter Interface
 */
interface PaymentGatewayAdapter {
  name: string;
  authorize(amount: number, currency: string, cardDetails?: any): Promise<{ success: boolean; reference?: string; error?: string }>;
  capture(reference: string, amount: number): Promise<{ success: boolean; error?: string }>;
  void(reference: string): Promise<{ success: boolean; error?: string }>;
  refund(reference: string, amount: number, reason: string): Promise<{ success: boolean; error?: string }>;
  getStatus(reference: string): Promise<{ status: string; error?: string }>;
}

/**
 * Stripe Adapter Placeholder
 */
class StripeAdapter implements PaymentGatewayAdapter {
  name = 'stripe';

  async authorize(amount: number, currency: string, cardDetails?: any): Promise<{ success: boolean; reference?: string; error?: string }> {
    // Placeholder for Stripe authorization
    logger.info('Stripe authorization requested', { amount, currency });
    return {
      success: false,
      error: 'Stripe adapter not yet implemented',
    };
  }

  async capture(reference: string, amount: number): Promise<{ success: boolean; error?: string }> {
    // Placeholder for Stripe capture
    logger.info('Stripe capture requested', { reference, amount });
    return {
      success: false,
      error: 'Stripe adapter not yet implemented',
    };
  }

  async void(reference: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder for Stripe void
    logger.info('Stripe void requested', { reference });
    return {
      success: false,
      error: 'Stripe adapter not yet implemented',
    };
  }

  async refund(reference: string, amount: number, reason: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder for Stripe refund
    logger.info('Stripe refund requested', { reference, amount, reason });
    return {
      success: false,
      error: 'Stripe adapter not yet implemented',
    };
  }

  async getStatus(reference: string): Promise<{ status: string; error?: string }> {
    // Placeholder for Stripe status check
    logger.info('Stripe status check requested', { reference });
    return {
      status: 'unknown',
      error: 'Stripe adapter not yet implemented',
    };
  }
}

/**
 * PayPal Adapter Placeholder
 */
class PayPalAdapter implements PaymentGatewayAdapter {
  name = 'paypal';

  async authorize(amount: number, currency: string, cardDetails?: any): Promise<{ success: boolean; reference?: string; error?: string }> {
    // Placeholder for PayPal authorization
    logger.info('PayPal authorization requested', { amount, currency });
    return {
      success: false,
      error: 'PayPal adapter not yet implemented',
    };
  }

  async capture(reference: string, amount: number): Promise<{ success: boolean; error?: string }> {
    // Placeholder for PayPal capture
    logger.info('PayPal capture requested', { reference, amount });
    return {
      success: false,
      error: 'PayPal adapter not yet implemented',
    };
  }

  async void(reference: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder for PayPal void
    logger.info('PayPal void requested', { reference });
    return {
      success: false,
      error: 'PayPal adapter not yet implemented',
    };
  }

  async refund(reference: string, amount: number, reason: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder for PayPal refund
    logger.info('PayPal refund requested', { reference, amount, reason });
    return {
      success: false,
      error: 'PayPal adapter not yet implemented',
    };
  }

  async getStatus(reference: string): Promise<{ status: string; error?: string }> {
    // Placeholder for PayPal status check
    logger.info('PayPal status check requested', { reference });
    return {
      status: 'unknown',
      error: 'PayPal adapter not yet implemented',
    };
  }
}

/**
 * JazzCash Adapter Placeholder
 */
class JazzCashAdapter implements PaymentGatewayAdapter {
  name = 'jazzcash';

  async authorize(amount: number, currency: string, cardDetails?: any): Promise<{ success: boolean; reference?: string; error?: string }> {
    // Placeholder for JazzCash authorization
    logger.info('JazzCash authorization requested', { amount, currency });
    return {
      success: false,
      error: 'JazzCash adapter not yet implemented',
    };
  }

  async capture(reference: string, amount: number): Promise<{ success: boolean; error?: string }> {
    // Placeholder for JazzCash capture
    logger.info('JazzCash capture requested', { reference, amount });
    return {
      success: false,
      error: 'JazzCash adapter not yet implemented',
    };
  }

  async void(reference: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder for JazzCash void
    logger.info('JazzCash void requested', { reference });
    return {
      success: false,
      error: 'JazzCash adapter not yet implemented',
    };
  }

  async refund(reference: string, amount: number, reason: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder for JazzCash refund
    logger.info('JazzCash refund requested', { reference, amount, reason });
    return {
      success: false,
      error: 'JazzCash adapter not yet implemented',
    };
  }

  async getStatus(reference: string): Promise<{ status: string; error?: string }> {
    // Placeholder for JazzCash status check
    logger.info('JazzCash status check requested', { reference });
    return {
      status: 'unknown',
      error: 'JazzCash adapter not yet implemented',
    };
  }
}

/**
 * EasyPaisa Adapter Placeholder
 */
class EasyPaisaAdapter implements PaymentGatewayAdapter {
  name = 'easypaisa';

  async authorize(amount: number, currency: string, cardDetails?: any): Promise<{ success: boolean; reference?: string; error?: string }> {
    // Placeholder for EasyPaisa authorization
    logger.info('EasyPaisa authorization requested', { amount, currency });
    return {
      success: false,
      error: 'EasyPaisa adapter not yet implemented',
    };
  }

  async capture(reference: string, amount: number): Promise<{ success: boolean; error?: string }> {
    // Placeholder for EasyPaisa capture
    logger.info('EasyPaisa capture requested', { reference, amount });
    return {
      success: false,
      error: 'EasyPaisa adapter not yet implemented',
    };
  }

  async void(reference: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder for EasyPaisa void
    logger.info('EasyPaisa void requested', { reference });
    return {
      success: false,
      error: 'EasyPaisa adapter not yet implemented',
    };
  }

  async refund(reference: string, amount: number, reason: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder for EasyPaisa refund
    logger.info('EasyPaisa refund requested', { reference, amount, reason });
    return {
      success: false,
      error: 'EasyPaisa adapter not yet implemented',
    };
  }

  async getStatus(reference: string): Promise<{ status: string; error?: string }> {
    // Placeholder for EasyPaisa status check
    logger.info('EasyPaisa status check requested', { reference });
    return {
      status: 'unknown',
      error: 'EasyPaisa adapter not yet implemented',
    };
  }
}

/**
 * Square Adapter Placeholder
 */
class SquareAdapter implements PaymentGatewayAdapter {
  name = 'square';

  async authorize(amount: number, currency: string, cardDetails?: any): Promise<{ success: boolean; reference?: string; error?: string }> {
    // Placeholder for Square authorization
    logger.info('Square authorization requested', { amount, currency });
    return {
      success: false,
      error: 'Square adapter not yet implemented',
    };
  }

  async capture(reference: string, amount: number): Promise<{ success: boolean; error?: string }> {
    // Placeholder for Square capture
    logger.info('Square capture requested', { reference, amount });
    return {
      success: false,
      error: 'Square adapter not yet implemented',
    };
  }

  async void(reference: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder for Square void
    logger.info('Square void requested', { reference });
    return {
      success: false,
      error: 'Square adapter not yet implemented',
    };
  }

  async refund(reference: string, amount: number, reason: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder for Square refund
    logger.info('Square refund requested', { reference, amount, reason });
    return {
      success: false,
      error: 'Square adapter not yet implemented',
    };
  }

  async getStatus(reference: string): Promise<{ status: string; error?: string }> {
    // Placeholder for Square status check
    logger.info('Square status check requested', { reference });
    return {
      status: 'unknown',
      error: 'Square adapter not yet implemented',
    };
  }
}

/**
 * Adyen Adapter Placeholder
 */
class AdyenAdapter implements PaymentGatewayAdapter {
  name = 'adyen';

  async authorize(amount: number, currency: string, cardDetails?: any): Promise<{ success: boolean; reference?: string; error?: string }> {
    // Placeholder for Adyen authorization
    logger.info('Adyen authorization requested', { amount, currency });
    return {
      success: false,
      error: 'Adyen adapter not yet implemented',
    };
  }

  async capture(reference: string, amount: number): Promise<{ success: boolean; error?: string }> {
    // Placeholder for Adyen capture
    logger.info('Adyen capture requested', { reference, amount });
    return {
      success: false,
      error: 'Adyen adapter not yet implemented',
    };
  }

  async void(reference: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder for Adyen void
    logger.info('Adyen void requested', { reference });
    return {
      success: false,
      error: 'Adyen adapter not yet implemented',
    };
  }

  async refund(reference: string, amount: number, reason: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder for Adyen refund
    logger.info('Adyen refund requested', { reference, amount, reason });
    return {
      success: false,
      error: 'Adyen adapter not yet implemented',
    };
  }

  async getStatus(reference: string): Promise<{ status: string; error?: string }> {
    // Placeholder for Adyen status check
    logger.info('Adyen status check requested', { reference });
    return {
      status: 'unknown',
      error: 'Adyen adapter not yet implemented',
    };
  }
}

/**
 * Authorize.Net Adapter Placeholder
 */
class AuthorizeNetAdapter implements PaymentGatewayAdapter {
  name = 'authorize_net';

  async authorize(amount: number, currency: string, cardDetails?: any): Promise<{ success: boolean; reference?: string; error?: string }> {
    // Placeholder for Authorize.Net authorization
    logger.info('Authorize.Net authorization requested', { amount, currency });
    return {
      success: false,
      error: 'Authorize.Net adapter not yet implemented',
    };
  }

  async capture(reference: string, amount: number): Promise<{ success: boolean; error?: string }> {
    // Placeholder for Authorize.Net capture
    logger.info('Authorize.Net capture requested', { reference, amount });
    return {
      success: false,
      error: 'Authorize.Net adapter not yet implemented',
    };
  }

  async void(reference: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder for Authorize.Net void
    logger.info('Authorize.Net void requested', { reference });
    return {
      success: false,
      error: 'Authorize.Net adapter not yet implemented',
    };
  }

  async refund(reference: string, amount: number, reason: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder for Authorize.Net refund
    logger.info('Authorize.Net refund requested', { reference, amount, reason });
    return {
      success: false,
      error: 'Authorize.Net adapter not yet implemented',
    };
  }

  async getStatus(reference: string): Promise<{ status: string; error?: string }> {
    // Placeholder for Authorize.Net status check
    logger.info('Authorize.Net status check requested', { reference });
    return {
      status: 'unknown',
      error: 'Authorize.Net adapter not yet implemented',
    };
  }
}

/**
 * Bank API Adapter Placeholder
 */
class BankAPIAdapter implements PaymentGatewayAdapter {
  name = 'bank_api';

  async authorize(amount: number, currency: string, cardDetails?: any): Promise<{ success: boolean; reference?: string; error?: string }> {
    // Placeholder for Bank API authorization
    logger.info('Bank API authorization requested', { amount, currency });
    return {
      success: false,
      error: 'Bank API adapter not yet implemented',
    };
  }

  async capture(reference: string, amount: number): Promise<{ success: boolean; error?: string }> {
    // Placeholder for Bank API capture
    logger.info('Bank API capture requested', { reference, amount });
    return {
      success: false,
      error: 'Bank API adapter not yet implemented',
    };
  }

  async void(reference: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder for Bank API void
    logger.info('Bank API void requested', { reference });
    return {
      success: false,
      error: 'Bank API adapter not yet implemented',
    };
  }

  async refund(reference: string, amount: number, reason: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder for Bank API refund
    logger.info('Bank API refund requested', { reference, amount, reason });
    return {
      success: false,
      error: 'Bank API adapter not yet implemented',
    };
  }

  async getStatus(reference: string): Promise<{ status: string; error?: string }> {
    // Placeholder for Bank API status check
    logger.info('Bank API status check requested', { reference });
    return {
      status: 'unknown',
      error: 'Bank API adapter not yet implemented',
    };
  }
}

/**
 * Government Payment API Adapter Placeholder
 */
class GovernmentAPIAdapter implements PaymentGatewayAdapter {
  name = 'government_api';

  async authorize(amount: number, currency: string, cardDetails?: any): Promise<{ success: boolean; reference?: string; error?: string }> {
    // Placeholder for Government API authorization
    logger.info('Government API authorization requested', { amount, currency });
    return {
      success: false,
      error: 'Government API adapter not yet implemented',
    };
  }

  async capture(reference: string, amount: number): Promise<{ success: boolean; error?: string }> {
    // Placeholder for Government API capture
    logger.info('Government API capture requested', { reference, amount });
    return {
      success: false,
      error: 'Government API adapter not yet implemented',
    };
  }

  async void(reference: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder for Government API void
    logger.info('Government API void requested', { reference });
    return {
      success: false,
      error: 'Government API adapter not yet implemented',
    };
  }

  async refund(reference: string, amount: number, reason: string): Promise<{ success: boolean; error?: string }> {
    // Placeholder for Government API refund
    logger.info('Government API refund requested', { reference, amount, reason });
    return {
      success: false,
      error: 'Government API adapter not yet implemented',
    };
  }

  async getStatus(reference: string): Promise<{ status: string; error?: string }> {
    // Placeholder for Government API status check
    logger.info('Government API status check requested', { reference });
    return {
      status: 'unknown',
      error: 'Government API adapter not yet implemented',
    };
  }
}

// ============================================================================
// Gateway Registry
// ============================================================================

const gatewayAdapters: Record<PaymentGateway, PaymentGatewayAdapter> = {
  stripe: new StripeAdapter(),
  paypal: new PayPalAdapter(),
  jazzcash: new JazzCashAdapter(),
  easypaisa: new EasyPaisaAdapter(),
  square: new SquareAdapter(),
  adyen: new AdyenAdapter(),
  authorize_net: new AuthorizeNetAdapter(),
  bank_api: new BankAPIAdapter(),
  government_api: new GovernmentAPIAdapter(),
  manual: {
    name: 'manual',
    authorize: async () => ({ success: true, reference: 'manual' }),
    capture: async () => ({ success: true }),
    void: async () => ({ success: true }),
    refund: async () => ({ success: true }),
    getStatus: async () => ({ status: 'completed' }),
  },
};

/**
 * Get gateway adapter
 */
export function getGatewayAdapter(gateway: PaymentGateway): PaymentGatewayAdapter {
  const adapter = gatewayAdapters[gateway];
  if (!adapter) {
    throw new Error(`Unsupported payment gateway: ${gateway}`);
  }
  return adapter;
}

// ============================================================================
// Gateway Configuration Management
// ============================================================================

/**
 * Create gateway configuration
 */
export async function createGatewayConfig(
  gateway: PaymentGateway,
  config: Record<string, any>,
  webhookUrl?: string
): Promise<PaymentGatewayConfig> {
  await validateManageCashDrawerPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payment_gateway_configs')
      .insert({
        clinic_id: clinicId,
        gateway,
        is_active: true,
        config,
        webhook_url: webhookUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create gateway config', { error, gateway });
      throw new DatabaseError('Failed to create gateway config', { error });
    }

    logger.info('Gateway config created successfully', { gateway });
    return data as PaymentGatewayConfig;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating gateway config', { error, gateway });
    throw new DatabaseError('Failed to create gateway config', { error });
  }
}

/**
 * Get gateway configuration
 */
export async function getGatewayConfig(gateway: PaymentGateway): Promise<PaymentGatewayConfig> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payment_gateway_configs')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('gateway', gateway)
      .single();

    if (error) {
      logger.error('Failed to fetch gateway config', { error, gateway });
      throw new DatabaseError('Failed to fetch gateway config', { error });
    }

    if (!data) {
      throw new NotFoundError('Gateway configuration not found');
    }

    return data as PaymentGatewayConfig;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching gateway config', { error, gateway });
    throw new DatabaseError('Failed to fetch gateway config', { error });
  }
}

/**
 * Update gateway configuration
 */
export async function updateGatewayConfig(
  gateway: PaymentGateway,
  config: Record<string, any>,
  webhookUrl?: string
): Promise<PaymentGatewayConfig> {
  await validateManageCashDrawerPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payment_gateway_configs')
      .update({
        config,
        webhook_url: webhookUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('clinic_id', clinicId)
      .eq('gateway', gateway)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update gateway config', { error, gateway });
      throw new DatabaseError('Failed to update gateway config', { error });
    }

    if (!data) {
      throw new NotFoundError('Gateway configuration not found');
    }

    logger.info('Gateway config updated successfully', { gateway });
    return data as PaymentGatewayConfig;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating gateway config', { error, gateway });
    throw new DatabaseError('Failed to update gateway config', { error });
  }
}

/**
 * Toggle gateway active status
 */
export async function toggleGatewayStatus(gateway: PaymentGateway, isActive: boolean): Promise<PaymentGatewayConfig> {
  await validateManageCashDrawerPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payment_gateway_configs')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('clinic_id', clinicId)
      .eq('gateway', gateway)
      .select()
      .single();

    if (error) {
      logger.error('Failed to toggle gateway status', { error, gateway });
      throw new DatabaseError('Failed to toggle gateway status', { error });
    }

    if (!data) {
      throw new NotFoundError('Gateway configuration not found');
    }

    logger.info('Gateway status toggled successfully', { gateway, isActive });
    return data as PaymentGatewayConfig;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error toggling gateway status', { error, gateway });
    throw new DatabaseError('Failed to toggle gateway status', { error });
  }
}

/**
 * Get all gateway configurations for clinic
 */
export async function getGatewayConfigs(): Promise<PaymentGatewayConfig[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('payment_gateway_configs')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch gateway configs', { error });
      throw new DatabaseError('Failed to fetch gateway configs', { error });
    }

    return (data || []) as PaymentGatewayConfig[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching gateway configs', { error });
    throw new DatabaseError('Failed to fetch gateway configs', { error });
  }
}
