import { logger } from '../shared/logger';
import { cache } from '../shared/cache';

// ============================================================================
// AI Feedback
// Generate feedback on clinical decisions using AI
// ============================================================================

/**
 * Feedback Options
 */
export interface FeedbackOptions {
  clinicId: string;
  userId: string;
  clinicalDecision: string;
  context: string;
  feedbackType: 'quality' | 'safety' | 'efficiency' | 'general';
}

/**
 * Feedback Result
 */
export interface FeedbackResult {
  feedback: string;
  strengths: string[];
  improvements: string[];
  score: number;
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
 * Generate feedback on clinical decision
 * 
 * @param options - Feedback generation options
 * @returns Generated feedback with metadata
 */
export async function generateFeedback(
  options: FeedbackOptions
): Promise<FeedbackResult> {
  try {
    if (!options.clinicId) {
      throw new Error('Clinic ID is required');
    }

    if (!options.userId) {
      throw new Error('User ID is required');
    }

    if (!options.clinicalDecision) {
      throw new Error('Clinical decision is required');
    }

    const cacheKey = `feedback:${options.clinicId}:${options.userId}`;
    const cached = cache.get<string>(cacheKey);
    if (cached) {
      logger.info('Feedback retrieved from cache', { 
        clinicId: options.clinicId, 
        userId: options.userId 
      });
      return JSON.parse(cached);
    }

    const result: FeedbackResult = {
      feedback: 'AI-generated feedback placeholder',
      strengths: [],
      improvements: [],
      score: 85,
      disclaimer: 'AI-generated feedback requiring clinician review. Feedback is for informational purposes only.',
      confidence: 0.80,
      generatedAt: new Date().toISOString(),
      tokenUsage: {
        prompt: 0,
        completion: 0,
        total: 0,
      },
    };

    cache.set(cacheKey, JSON.stringify(result), 3600000);

    logger.info('Feedback generated', {
      clinicId: options.clinicId,
      userId: options.userId,
      feedbackType: options.feedbackType,
    });

    return result;
  } catch (error) {
    logger.error('Feedback generation failed', { 
      error, 
      clinicId: options.clinicId, 
      userId: options.userId 
    });
    throw error;
  }
}
