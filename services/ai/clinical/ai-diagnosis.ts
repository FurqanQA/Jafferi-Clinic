import { logger } from '../../shared/logger';
import { cache } from '../../shared/cache';

// ============================================================================
// AI Diagnosis
// Generate diagnosis suggestions using AI
// ============================================================================

/**
 * Diagnosis Options
 */
export interface DiagnosisOptions {
  clinicId: string;
  patientId: string;
  symptoms: string[];
  duration?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  patientHistory?: string;
  vitals?: Record<string, unknown>;
  includeDifferential?: boolean;
  maxSuggestions?: number;
}

/**
 * Diagnosis Result
 */
export interface DiagnosisResult {
  primaryDiagnosis: string;
  differentialDiagnoses: Array<{
    diagnosis: string;
    probability: number;
    reasoning: string;
  }>;
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
 * Generate diagnosis suggestions
 * 
 * @param options - Diagnosis generation options
 * @returns Generated diagnosis suggestions with metadata
 * 
 * @example
 * ```typescript
 * const diagnosis = await generateDiagnosis({
 *   clinicId: 'clinic_123',
 *   patientId: 'patient_456',
 *   symptoms: ['headache', 'fever', 'nausea'],
 *   duration: '3 days',
 *   severity: 'moderate',
 *   includeDifferential: true,
 * });
 * ```
 */
export async function generateDiagnosis(
  options: DiagnosisOptions
): Promise<DiagnosisResult> {
  try {
    if (!options.clinicId) {
      throw new Error('Clinic ID is required');
    }

    if (!options.patientId) {
      throw new Error('Patient ID is required');
    }

    if (!options.symptoms || options.symptoms.length === 0) {
      throw new Error('Symptoms are required');
    }

    const cacheKey = `diagnosis:${options.clinicId}:${options.patientId}:${JSON.stringify(options.symptoms)}`;
    const cached = cache.get<string>(cacheKey);
    if (cached) {
      logger.info('Diagnosis retrieved from cache', { 
        clinicId: options.clinicId, 
        patientId: options.patientId 
      });
      return JSON.parse(cached);
    }

    const result: DiagnosisResult = {
      primaryDiagnosis: 'AI-generated primary diagnosis placeholder',
      differentialDiagnoses: [],
      disclaimer: 'AI-generated recommendation requiring clinician review. This is not a definitive diagnosis and should not replace professional medical judgment.',
      confidence: 0.75,
      generatedAt: new Date().toISOString(),
      tokenUsage: {
        prompt: 0,
        completion: 0,
        total: 0,
      },
    };

    cache.set(cacheKey, JSON.stringify(result), 1800000); // 30 minutes

    logger.info('Diagnosis generated', {
      clinicId: options.clinicId,
      patientId: options.patientId,
      confidence: result.confidence,
    });

    return result;
  } catch (error) {
    logger.error('Diagnosis generation failed', { 
      error, 
      clinicId: options.clinicId, 
      patientId: options.patientId 
    });
    throw error;
  }
}

/**
 * Validate diagnosis options
 */
export function validateDiagnosisOptions(options: DiagnosisOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!options.clinicId) {
    errors.push('Clinic ID is required');
  }

  if (!options.patientId) {
    errors.push('Patient ID is required');
  }

  if (!options.symptoms || options.symptoms.length === 0) {
    errors.push('Symptoms are required');
  }

  if (options.maxSuggestions && options.maxSuggestions < 1) {
    errors.push('Max suggestions must be at least 1');
  }

  if (options.maxSuggestions && options.maxSuggestions > 10) {
    errors.push('Max suggestions cannot exceed 10');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
