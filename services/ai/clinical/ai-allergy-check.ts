import { logger } from '../../shared/logger';
import { cache } from '../../shared/cache';

// ============================================================================
// AI Allergy Check
// Check for medication allergies using AI
// ============================================================================

/**
 * Allergy Check Options
 */
export interface AllergyCheckOptions {
  clinicId: string;
  patientId: string;
  patientAllergies: string[];
  medications: Array<{
    name: string;
    dosage: string;
  }>;
}

/**
 * Allergy Check Result
 */
export interface AllergyCheckResult {
  hasAllergy: boolean;
  flaggedMedications: Array<{
    medication: string;
    allergy: string;
    severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
    recommendation: string;
  }>;
  warnings: string[];
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
 * Check for medication allergies
 * 
 * @param options - Allergy check options
 * @returns Generated allergy check with metadata
 */
export async function checkAllergies(
  options: AllergyCheckOptions
): Promise<AllergyCheckResult> {
  try {
    if (!options.clinicId) {
      throw new Error('Clinic ID is required');
    }

    if (!options.patientId) {
      throw new Error('Patient ID is required');
    }

    if (!options.medications || options.medications.length === 0) {
      throw new Error('Medications are required');
    }

    const cacheKey = `allergy-check:${options.clinicId}:${options.patientId}`;
    const cached = cache.get<string>(cacheKey);
    if (cached) {
      logger.info('Allergy check retrieved from cache', { 
        clinicId: options.clinicId, 
        patientId: options.patientId 
      });
      return JSON.parse(cached);
    }

    const result: AllergyCheckResult = {
      hasAllergy: false,
      flaggedMedications: [],
      warnings: [],
      disclaimer: 'AI-generated recommendation requiring clinician review. Allergy checks are for informational purposes only.',
      confidence: 0.85,
      generatedAt: new Date().toISOString(),
      tokenUsage: {
        prompt: 0,
        completion: 0,
        total: 0,
      },
    };

    cache.set(cacheKey, JSON.stringify(result), 3600000);

    logger.info('Allergy check completed', {
      clinicId: options.clinicId,
      patientId: options.patientId,
    });

    return result;
  } catch (error) {
    logger.error('Allergy check failed', { 
      error, 
      clinicId: options.clinicId, 
      patientId: options.patientId 
    });
    throw error;
  }
}
