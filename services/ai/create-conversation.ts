import { logger } from '../shared/logger';

// ============================================================================
// Create Conversation
// Create a new AI conversation
// ============================================================================

/**
 * Create Conversation Options
 */
export interface CreateConversationOptions {
  clinicId: string;
  userId: string;
  title: string;
  context?: Record<string, unknown>;
}

/**
 * Conversation Result
 */
export interface ConversationResult {
  conversationId: string;
  title: string;
  userId: string;
  clinicId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new conversation
 * 
 * @param options - Conversation creation options
 * @returns Created conversation with metadata
 */
export async function createConversation(
  options: CreateConversationOptions
): Promise<ConversationResult> {
  try {
    if (!options.clinicId) {
      throw new Error('Clinic ID is required');
    }

    if (!options.userId) {
      throw new Error('User ID is required');
    }

    if (!options.title) {
      throw new Error('Title is required');
    }

    const conversationId = `conv-${Date.now()}`;
    const now = new Date().toISOString();

    const result: ConversationResult = {
      conversationId,
      title: options.title,
      userId: options.userId,
      clinicId: options.clinicId,
      createdAt: now,
      updatedAt: now,
    };

    logger.info('Conversation created', {
      conversationId,
      clinicId: options.clinicId,
      userId: options.userId,
    });

    return result;
  } catch (error) {
    logger.error('Conversation creation failed', { 
      error, 
      clinicId: options.clinicId, 
      userId: options.userId 
    });
    throw error;
  }
}
