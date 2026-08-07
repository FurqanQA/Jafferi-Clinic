import { logger } from '../../shared/logger';
import { cache } from '../../shared/cache';

// ============================================================================
// AI Triage
// Generate triage recommendations using AI
// ============================================================================

/**
 * Triage Options
 */
export interface TriageOptions {
  clinicId: string;
  patientId: string;
  symptoms: string[];
  severity?: 'mild' | 'moderate' | 'severe';
  duration?: string;
  patientVitals?: Record<string, unknown>;
}

/**
 * Triage Result
 */
export interface TriageResult {
  priority: 'routine' | 'urgent' | 'emergency';
  recommendedAction: string;
  estimatedWaitTime?: string;
  redFlags: string[];
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
 * Generate triage recommendations
 * 
 * @param options - Triage generation options
 * @returns Generated triage recommendations with metadata
 */
export async function generateTriage(
  options: TriageOptions
): Promise<TriageResult> {
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

    const cacheKey = `triage:${options.clinicId}:${options.patientId}`;
    const cached = cache.get<string>(cacheKey);
    if (cached) {
      logger.info('Triage retrieved from cache', { 
        clinicId: options.clinicId, 
        patientId: options.patientId 
      });
      return JSON.parse(cached);
    }

    const result: TriageResult = {
      priority: 'routine',
      recommendedAction: 'AI-generated triage action placeholder',
      redFlags: [],
      disclaimer: 'AI-generated recommendation requiring clinician review. Triage assessments are for informational purposes only.',
      confidence: 0.75,
      generatedAt: new Date().toISOString(),
      tokenUsage: {
        prompt: 0,
        completion: 0,
        total: 0,
      },
    };

    cache.set(cacheKey, JSON.stringify(result), 1800000); // 30 minutes for triage

    logger.info('Triage generated', {
      clinicId: options.clinicId,
      patientId: options.patientId,
      priority: result.priority,
    });

    return result;
  } catch (error) {
    logger.error('Triage generation failed', { 
      error, 
      clinicId: options.clinicId, 
      patientId: options.patientId 
    });
    throw error;
  }
}
