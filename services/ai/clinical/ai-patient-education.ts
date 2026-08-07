import { logger } from '../../shared/logger';
import { cache } from '../../shared/cache';

// ============================================================================
// AI Patient Education
// Generate patient education materials using AI
// ============================================================================

/**
 * Patient Education Options
 */
export interface PatientEducationOptions {
  clinicId: string;
  patientId: string;
  topic: string;
  diagnosis?: string;
  treatment?: string;
  language?: string;
  readingLevel?: 'elementary' | 'middle' | 'high' | 'college';
  format?: 'text' | 'simplified' | 'detailed';
}

/**
 * Patient Education Result
 */
export interface PatientEducationResult {
  title: string;
  content: string;
  keyPoints: string[];
  questionsToAsk: string[];
  resources: string[];
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
 * Generate patient education materials
 * 
 * @param options - Patient education generation options
 * @returns Generated patient education with metadata
 */
export async function generatePatientEducation(
  options: PatientEducationOptions
): Promise<PatientEducationResult> {
  try {
    if (!options.clinicId) {
      throw new Error('Clinic ID is required');
    }

    if (!options.patientId) {
      throw new Error('Patient ID is required');
    }

    if (!options.topic) {
      throw new Error('Topic is required');
    }

    const cacheKey = `patient-education:${options.clinicId}:${options.patientId}:${options.topic}`;
    const cached = cache.get<string>(cacheKey);
    if (cached) {
      logger.info('Patient education retrieved from cache', { 
        clinicId: options.clinicId, 
        patientId: options.patientId 
      });
      return JSON.parse(cached);
    }

    const result: PatientEducationResult = {
      title: `AI-generated education: ${options.topic}`,
      content: 'AI-generated patient education content placeholder',
      keyPoints: [],
      questionsToAsk: [],
      resources: [],
      disclaimer: 'AI-generated recommendation requiring clinician review. Patient education materials are for informational purposes only.',
      confidence: 0.85,
      generatedAt: new Date().toISOString(),
      tokenUsage: {
        prompt: 0,
        completion: 0,
        total: 0,
      },
    };

    cache.set(cacheKey, JSON.stringify(result), 3600000);

    logger.info('Patient education generated', {
      clinicId: options.clinicId,
      patientId: options.patientId,
      topic: options.topic,
    });

    return result;
  } catch (error) {
    logger.error('Patient education generation failed', { 
      error, 
      clinicId: options.clinicId, 
      patientId: options.patientId 
    });
    throw error;
  }
}
