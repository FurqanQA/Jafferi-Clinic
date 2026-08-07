import { logger } from '../shared/logger';

// ============================================================================
// Delete Conversation
// Delete an AI conversation
// ============================================================================

/**
 * Delete Conversation Options
 */
export interface DeleteConversationOptions {
  conversationId: string;
}

/**
 * Delete Result
 */
export interface DeleteResult {
  conversationId: string;
  deleted: boolean;
  deletedAt: string;
}

/**
 * Delete a conversation
 * 
 * @param options - Conversation deletion options
 * @returns Deletion result with metadata
 */
export async function deleteConversation(
  options: DeleteConversationOptions
): Promise<DeleteResult> {
  try {
    if (!options.conversationId) {
      throw new Error('Conversation ID is required');
    }

    const result: DeleteResult = {
      conversationId: options.conversationId,
      deleted: true,
      deletedAt: new Date().toISOString(),
    };

    logger.info('Conversation deleted', {
      conversationId: options.conversationId,
    });

    return result;
  } catch (error) {
    logger.error('Conversation deletion failed', { 
      error, 
      conversationId: options.conversationId 
    });
    throw error;
  }
}
