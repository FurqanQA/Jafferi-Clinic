import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateInsuranceClaimPermission } from './billing-permissions';
import { validateInsuranceCoverage } from './billing-validation';
import { InsuranceClaim } from './billing-types';

/**
 * Calculate insurance coverage
 */
export function calculateInsuranceCoverage(
  claimAmount: number,
  coveragePercentage: number
): {
  coveredAmount: number;
  patientResponsibility: number;
} {
  const coveredAmount = (claimAmount * coveragePercentage) / 100;
  const patientResponsibility = claimAmount - coveredAmount;

  return {
    coveredAmount,
    patientResponsibility,
  };
}

/**
 * Create insurance claim
 */
export async function createInsuranceClaim(claim: Omit<InsuranceClaim, 'id' | 'created_at' | 'updated_at'>): Promise<InsuranceClaim> {
  await validateInsuranceClaimPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('insurance_claims')
      .insert({
        ...claim,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create insurance claim', { error });
      throw new DatabaseError('Failed to create insurance claim', { error });
    }

    logger.info('Insurance claim created successfully', { invoiceId: claim.invoice_id });
    return data as InsuranceClaim;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating insurance claim', { error });
    throw new DatabaseError('Failed to create insurance claim', { error });
  }
}

/**
 * Get insurance claim by ID
 */
export async function getInsuranceClaim(claimId: string): Promise<InsuranceClaim> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('insurance_claims')
      .select('*')
      .eq('id', claimId)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch insurance claim', { error, claimId });
      throw new DatabaseError('Failed to fetch insurance claim', { error });
    }

    if (!data) {
      throw new NotFoundError('Insurance claim not found');
    }

    return data as InsuranceClaim;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching insurance claim', { error, claimId });
    throw new DatabaseError('Failed to fetch insurance claim', { error });
  }
}

/**
 * Get insurance claims by invoice
 */
export async function getInsuranceClaimsByInvoice(invoiceId: string): Promise<InsuranceClaim[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('insurance_claims')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch insurance claims by invoice', { error, invoiceId });
      throw new DatabaseError('Failed to fetch insurance claims by invoice', { error });
    }

    return (data || []) as InsuranceClaim[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching insurance claims by invoice', { error, invoiceId });
    throw new DatabaseError('Failed to fetch insurance claims by invoice', { error });
  }
}

/**
 * Update insurance claim status
 */
export async function updateInsuranceClaimStatus(
  claimId: string,
  status: 'pending' | 'approved' | 'rejected' | 'partial',
  processedAmount?: number,
  rejectionReason?: string
): Promise<InsuranceClaim> {
  await validateInsuranceClaimPermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const updateData: any = {
      claim_status: status,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (status === 'approved' || status === 'partial') {
      const amount = processedAmount || 0;
      updateData.covered_amount = amount;
      updateData.patient_responsibility = (await getInsuranceClaim(claimId)).claim_amount - amount;
    }

    if (status === 'rejected') {
      updateData.rejection_reason = rejectionReason;
      updateData.covered_amount = 0;
      updateData.patient_responsibility = (await getInsuranceClaim(claimId)).claim_amount;
    }

    const { data, error } = await supabase
      .from('insurance_claims')
      .update(updateData)
      .eq('id', claimId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update insurance claim status', { error, claimId });
      throw new DatabaseError('Failed to update insurance claim status', { error });
    }

    if (!data) {
      throw new NotFoundError('Insurance claim not found');
    }

    logger.info('Insurance claim status updated successfully', { claimId, status });
    return data as InsuranceClaim;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating insurance claim status', { error, claimId });
    throw new DatabaseError('Failed to update insurance claim status', { error });
  }
}

/**
 * Get insurance claims by provider
 */
export async function getInsuranceClaimsByProvider(insuranceProvider: string): Promise<InsuranceClaim[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('insurance_claims')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('insurance_provider', insuranceProvider)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch insurance claims by provider', { error, insuranceProvider });
      throw new DatabaseError('Failed to fetch insurance claims by provider', { error });
    }

    return (data || []) as InsuranceClaim[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching insurance claims by provider', { error, insuranceProvider });
    throw new DatabaseError('Failed to fetch insurance claims by provider', { error });
  }
}

/**
 * Get pending insurance claims
 */
export async function getPendingInsuranceClaims(): Promise<InsuranceClaim[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('insurance_claims')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('claim_status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch pending insurance claims', { error });
      throw new DatabaseError('Failed to fetch pending insurance claims', { error });
    }

    return (data || []) as InsuranceClaim[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching pending insurance claims', { error });
    throw new DatabaseError('Failed to fetch pending insurance claims', { error });
  }
}

/**
 * Placeholder for insurance preauthorization
 * Future integration with insurance provider APIs
 */
export async function requestPreauthorization(
  insuranceProvider: string,
  policyNumber: string,
  serviceType: string,
  estimatedCost: number
): Promise<{
  authorized: boolean;
  authorizationNumber?: string;
  coveredAmount?: number;
  patientResponsibility?: number;
  expiryDate?: string;
  errorMessage?: string;
}> {
  // Placeholder for insurance preauthorization logic
  logger.info('Insurance preauthorization requested', { insuranceProvider, policyNumber, serviceType, estimatedCost });

  return {
    authorized: false,
    errorMessage: 'Insurance preauthorization integration not yet implemented',
  };
}

/**
 * Placeholder for insurance claim submission
 * Future integration with insurance provider APIs
 */
export async function submitInsuranceClaim(
  claimId: string,
  claimData: any
): Promise<{
  submitted: boolean;
  claimReference?: string;
  submittedAt?: string;
  errorMessage?: string;
}> {
  // Placeholder for insurance claim submission logic
  logger.info('Insurance claim submission requested', { claimId });

  return {
    submitted: false,
    errorMessage: 'Insurance claim submission integration not yet implemented',
  };
}

/**
 * Placeholder for FHIR Claim generation
 * Future integration with FHIR standards
 */
export async function generateFHIRClaim(claimId: string): Promise<any> {
  // Placeholder for FHIR Claim generation
  logger.info('FHIR Claim generation requested', { claimId });

  return null;
}

/**
 * Placeholder for HL7 financial message generation
 * Future integration with HL7 standards
 */
export async function generateHL7FinancialMessage(claimId: string): Promise<string> {
  // Placeholder for HL7 financial message generation
  logger.info('HL7 financial message generation requested', { claimId });

  return '';
}
