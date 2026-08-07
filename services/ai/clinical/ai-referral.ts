import { logger } from '../../shared/logger';
import { cache } from '../../shared/cache';

// ============================================================================
// AI Referral
// Generate referral recommendations using AI
// ============================================================================

/**
 * Referral Options
 */
export interface ReferralOptions {
  clinicId: string;
  patientId: string;
  diagnosis: string;
  symptoms?: string[];
  currentTreatment?: string;
  urgency?: 'routine' | 'urgent' | 'emergency';
  specialty?: string;
}

/**
 * Referral Result
 */
export interface ReferralResult {
  recommendedSpecialty: string;
  referralReason: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  informationToInclude: string[];
  suggestedTests: string[];
  disclaimer: string;
  confidence: number;
  generatedAt: string;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

/**
 * Generate referral recommendations
 * 
 * @param options - Referral generation options
 * @returns Generated referral recommendations with metadata
 */
export async function generateReferral(
  options: ReferralOptions
): Promise<ReferralResult> {
  try {
    if (!options.clinicId) {
      throw new Error('Clinic ID is required');
    }

    if (!options.patientId) {
      throw new Error('Patient ID is required');
    }

    if (!options.diagnosis) {
      throw new Error('Diagnosis is required');
    }

    const cacheKey = `referral:${options.clinicId}:${options.patientId}`;
    const cached = cache.get<string>(cacheKey);
    if (cached) {
      logger.info('Referral retrieved from cache', { 
        clinicId: options.clinicId, 
        patientId: options.patientId 
      });
      return JSON.parse(cached);
    }

    const result: ReferralResult = {
      recommendedSpecialty: options.specialty || 'AI-generated specialty placeholder',
      referralReason: 'AI-generated referral reason placeholder',
      urgency: options.urgency || 'routine',
      informationToInclude: [],
      suggestedTests: [],
      disclaimer: 'AI-generated recommendation requiring clinician review. Referral recommendations are for informational purposes only.',
      confidence: 0.80,
      generatedAt: new Date().toISOString(),
      tokenUsage: {
        prompt: 0,
        completion: 0,
        total: 0,
      },
    };

    cache.set(cacheKey, JSON.stringify(result), 3600000);

    logger.info('Referral generated', {
      clinicId: options.clinicId,
      patientId: options.patientId,
      specialty: result.recommendedSpecialty,
    });

    return result;
  } catch (error) {
    logger.error('Referral generation failed', { 
      error, 
      clinicId: options.clinicId, 
      patientId: options.patientId 
    });
    throw error;
  }
}
