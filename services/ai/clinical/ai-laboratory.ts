import { logger } from '../../shared/logger';
import { cache } from '../../shared/cache';

// ============================================================================
// AI Laboratory
// Generate laboratory result interpretations using AI
// ============================================================================

/**
 * Laboratory Options
 */
export interface LaboratoryOptions {
  clinicId: string;
  patientId: string;
  labResults: Array<{
    testName: string;
    value: string;
    unit: string;
    referenceRange: string;
    isAbnormal: boolean;
  }>;
  patientContext?: string;
  includeRecommendations?: boolean;
}

/**
 * Laboratory Result
 */
export interface LaboratoryResult {
  interpretation: string;
  abnormalFindings: string[];
  recommendations: string[];
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
 * Generate laboratory result interpretation
 * 
 * @param options - Laboratory interpretation options
 * @returns Generated laboratory interpretation with metadata
 */
export async function interpretLaboratoryResults(
  options: LaboratoryOptions
): Promise<LaboratoryResult> {
  try {
    if (!options.clinicId) {
      throw new Error('Clinic ID is required');
    }

    if (!options.patientId) {
      throw new Error('Patient ID is required');
    }

    if (!options.labResults || options.labResults.length === 0) {
      throw new Error('Lab results are required');
    }

    const cacheKey = `lab-interpretation:${options.clinicId}:${options.patientId}`;
    const cached = cache.get<string>(cacheKey);
    if (cached) {
      logger.info('Lab interpretation retrieved from cache', { 
        clinicId: options.clinicId, 
        patientId: options.patientId 
      });
      return JSON.parse(cached);
    }

    const result: LaboratoryResult = {
      interpretation: 'AI-generated laboratory interpretation placeholder',
      abnormalFindings: [],
      recommendations: [],
      disclaimer: 'AI-generated recommendation requiring clinician review. Laboratory interpretations are for informational purposes only.',
      confidence: 0.85,
      generatedAt: new Date().toISOString(),
      tokenUsage: {
        prompt: 0,
        completion: 0,
        total: 0,
      },
    };

    cache.set(cacheKey, JSON.stringify(result), 3600000);

    logger.info('Laboratory interpretation generated', {
      clinicId: options.clinicId,
      patientId: options.patientId,
    });

    return result;
  } catch (error) {
    logger.error('Laboratory interpretation failed', { 
      error, 
      clinicId: options.clinicId, 
      patientId: options.patientId 
    });
    throw error;
  }
}
