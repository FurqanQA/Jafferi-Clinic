import { logger } from '../shared/logger';
import { cache } from '../shared/cache';

// ============================================================================
// Insurance Integration
// Insurance provider API integration for eligibility and claims
// ============================================================================

/**
 * Insurance Provider
 */
export interface InsuranceProvider {
  id: string;
  name: string;
  code: string;
  apiUrl: string;
  isActive: boolean;
}

/**
 * Eligibility Request
 */
export interface EligibilityRequest {
  patientId: string;
  patientName: string;
  patientDob: string;
  insuranceId: string;
  memberId: string;
  groupId?: string;
  serviceType: string;
  serviceDate: string;
}

/**
 * Eligibility Response
 */
export interface EligibilityResponse {
  eligible: boolean;
  coverage: {
    serviceType: string;
    covered: boolean;
    copay?: number;
    deductible?: number;
    coinsurance?: number;
    outOfPocketMax?: number;
  };
  message?: string;
  processedAt: string;
}

/**
 * Claim Submission
 */
export interface ClaimSubmission {
  claimId: string;
  patientId: string;
  providerId: string;
  insuranceId: string;
  memberId: string;
  serviceDate: string;
  services: Array<{
    code: string;
    description: string;
    amount: number;
    quantity: number;
  }>;
  totalAmount: number;
  submittedAt: string;
  status: 'pending' | 'submitted' | 'accepted' | 'rejected' | 'paid';
}

/**
 * Claim Status
 */
export interface ClaimStatus {
  claimId: string;
  status: 'pending' | 'submitted' | 'accepted' | 'rejected' | 'paid';
  processedAt?: string;
  paidAmount?: number;
  denialReason?: string;
  checkNumber?: string;
}

/**
 * Insurance providers registry
 */
const insuranceProviders: Map<string, InsuranceProvider> = new Map();

/**
 * Register insurance provider
 */
export function registerInsuranceProvider(provider: InsuranceProvider): void {
  insuranceProviders.set(provider.code, provider);
  logger.info('Insurance provider registered', { code: provider.code, name: provider.name });
}

/**
 * Get insurance provider
 */
export function getInsuranceProvider(code: string): InsuranceProvider | null {
  return insuranceProviders.get(code) || null;
}

/**
 * Get all insurance providers
 */
export function getAllInsuranceProviders(): InsuranceProvider[] {
  return Array.from(insuranceProviders.values());
}

/**
 * Check eligibility
 */
export async function checkEligibility(
  request: EligibilityRequest,
  providerCode: string
): Promise<EligibilityResponse> {
  const provider = getInsuranceProvider(providerCode);
  if (!provider) {
    throw new Error(`Insurance provider not found: ${providerCode}`);
  }

  if (!provider.isActive) {
    throw new Error(`Insurance provider is not active: ${providerCode}`);
  }

  try {
    // Placeholder for actual API call
    // In production, this would make a real API call to the insurance provider
    await new Promise((resolve) => setTimeout(resolve, 500));

    const response: EligibilityResponse = {
      eligible: true,
      coverage: {
        serviceType: request.serviceType,
        covered: true,
        copay: 25,
        deductible: 500,
        coinsurance: 0.2,
        outOfPocketMax: 5000,
      },
      processedAt: new Date().toISOString(),
    };

    logger.info('Eligibility check completed', { 
      patientId: request.patientId,
      providerCode,
      eligible: response.eligible,
    });

    return response;
  } catch (error) {
    logger.error('Eligibility check failed', { error, providerCode });
    throw error;
  }
}

/**
 * Submit claim
 */
export async function submitClaim(
  claim: ClaimSubmission,
  providerCode: string
): Promise<ClaimStatus> {
  const provider = getInsuranceProvider(providerCode);
  if (!provider) {
    throw new Error(`Insurance provider not found: ${providerCode}`);
  }

  try {
    // Placeholder for actual API call
    // In production, this would make a real API call to the insurance provider
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const status: ClaimStatus = {
      claimId: claim.claimId,
      status: 'submitted',
      processedAt: new Date().toISOString(),
    };

    // Cache the claim status
    cache.set(`insurance:claim:${claim.claimId}`, JSON.stringify(status), 86400000);

    logger.info('Claim submitted', { 
      claimId: claim.claimId,
      providerCode,
      amount: claim.totalAmount,
    });

    return status;
  } catch (error) {
    logger.error('Claim submission failed', { error, providerCode });
    throw error;
  }
}

/**
 * Get claim status
 */
export async function getClaimStatus(claimId: string): Promise<ClaimStatus | null> {
  const cached = cache.get<string>(`insurance:claim:${claimId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // In production, this would query the insurance provider API
  return null;
}

/**
 * Update claim status
 */
export async function updateClaimStatus(
  claimId: string,
  status: ClaimStatus
): Promise<void> {
  cache.set(`insurance:claim:${claimId}`, JSON.stringify(status), 86400000);
  logger.info('Claim status updated', { claimId, status: status.status });
}

/**
 * Batch eligibility check
 */
export async function batchEligibilityCheck(
  requests: EligibilityRequest[],
  providerCode: string
): Promise<Map<string, EligibilityResponse>> {
  const results = new Map<string, EligibilityResponse>();

  for (const request of requests) {
    try {
      const response = await checkEligibility(request, providerCode);
      results.set(request.patientId, response);
    } catch (error) {
      logger.error('Batch eligibility check failed for patient', { 
        patientId: request.patientId,
        error,
      });
      results.set(request.patientId, {
        eligible: false,
        coverage: {
          serviceType: request.serviceType,
          covered: false,
        },
        message: error instanceof Error ? error.message : 'Unknown error',
        processedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

/**
 * Validate eligibility request
 */
export function validateEligibilityRequest(request: EligibilityRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!request.patientId) errors.push('Patient ID is required');
  if (!request.patientName) errors.push('Patient name is required');
  if (!request.patientDob) errors.push('Patient date of birth is required');
  if (!request.insuranceId) errors.push('Insurance ID is required');
  if (!request.memberId) errors.push('Member ID is required');
  if (!request.serviceType) errors.push('Service type is required');
  if (!request.serviceDate) errors.push('Service date is required');

  // Validate date format
  if (request.patientDob && !isValidDate(request.patientDob)) {
    errors.push('Invalid patient date of birth format');
  }
  if (request.serviceDate && !isValidDate(request.serviceDate)) {
    errors.push('Invalid service date format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate claim submission
 */
export function validateClaimSubmission(claim: ClaimSubmission): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!claim.claimId) errors.push('Claim ID is required');
  if (!claim.patientId) errors.push('Patient ID is required');
  if (!claim.providerId) errors.push('Provider ID is required');
  if (!claim.insuranceId) errors.push('Insurance ID is required');
  if (!claim.memberId) errors.push('Member ID is required');
  if (!claim.serviceDate) errors.push('Service date is required');
  if (!claim.services || claim.services.length === 0) errors.push('At least one service is required');
  if (claim.totalAmount <= 0) errors.push('Total amount must be greater than 0');

  // Validate service date format
  if (claim.serviceDate && !isValidDate(claim.serviceDate)) {
    errors.push('Invalid service date format');
  }

  // Validate services
  if (claim.services) {
    for (let i = 0; i < claim.services.length; i++) {
      const service = claim.services[i];
      if (!service.code) errors.push(`Service ${i + 1}: code is required`);
      if (!service.description) errors.push(`Service ${i + 1}: description is required`);
      if (service.amount <= 0) errors.push(`Service ${i + 1}: amount must be greater than 0`);
      if (service.quantity <= 0) errors.push(`Service ${i + 1}: quantity must be greater than 0`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Get insurance statistics
 */
export async function getInsuranceStatistics(clinicId: string): Promise<{
  totalClaims: number;
  pendingClaims: number;
  submittedClaims: number;
  acceptedClaims: number;
  rejectedClaims: number;
  paidClaims: number;
  totalAmount: number;
  paidAmount: number;
}> {
  // Placeholder for statistics
  // In production, this would query the database
  return {
    totalClaims: 0,
    pendingClaims: 0,
    submittedClaims: 0,
    acceptedClaims: 0,
    rejectedClaims: 0,
    paidClaims: 0,
    totalAmount: 0,
    paidAmount: 0,
  };
}
