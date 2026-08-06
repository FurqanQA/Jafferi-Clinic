import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { Document, DocumentSearchFilters, PaginationOptions } from './document-types';
import { validateDocumentViewPermission } from './document-permissions';

// ============================================================================
// Search Documents Service
// High-level document search orchestrator
// ============================================================================

/**
 * Search documents with filters
 */
export async function searchDocuments(
  query: string,
  filters?: DocumentSearchFilters,
  options?: PaginationOptions
): Promise<{ documents: Document[]; total: number }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    await validateDocumentViewPermission();

    // Placeholder for database search
    const documents: Document[] = [];
    const total = 0;

    logger.info('Documents searched', { query, filters, clinicId, userId: user.id, count: documents.length });
    return { documents, total };
  } catch (error) {
    logger.error('Failed to search documents', { error, query, filters, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Full-text search across document content
 */
export async function fullTextSearch(
  query: string,
  options?: PaginationOptions
): Promise<{ documents: Document[]; total: number }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    await validateDocumentViewPermission();

    const documents: Document[] = [];
    const total = 0;

    logger.info('Full-text search executed', { query, clinicId, userId: user.id, count: documents.length });
    return { documents, total };
  } catch (error) {
    logger.error('Failed to execute full-text search', { error, query, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Get search suggestions for autocomplete
 */
export async function getSearchSuggestions(query: string): Promise<string[]> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    const suggestions: string[] = [];

    logger.info('Search suggestions retrieved', { query, clinicId, userId: user.id, count: suggestions.length });
    return suggestions;
  } catch (error) {
    logger.error('Failed to get search suggestions', { error, query, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Get recent searches for current user
 */
export async function getRecentSearches(limit: number = 10): Promise<Array<{
  query: string;
  timestamp: string;
}>> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    const recentSearches: Array<{ query: string; timestamp: string }> = [];

    logger.info('Recent searches retrieved', { clinicId, userId: user.id, count: recentSearches.length });
    return recentSearches;
  } catch (error) {
    logger.error('Failed to get recent searches', { error, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Save a search query for later use
 */
export async function saveSearch(
  query: string,
  name: string,
  filters?: DocumentSearchFilters
): Promise<{ id: string; name: string; query: string; filters: DocumentSearchFilters }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    const savedSearch = {
      id: crypto.randomUUID(),
      name,
      query,
      filters: filters || {},
    };

    // Placeholder for database insertion
    logger.info('Search saved', { savedSearchId: savedSearch.id, clinicId, userId: user.id });
    return savedSearch;
  } catch (error) {
    logger.error('Failed to save search', { error, query, name, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Get saved searches for current user
 */
export async function getSavedSearches(): Promise<Array<{
  id: string;
  name: string;
  query: string;
  filters: DocumentSearchFilters;
}>> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    const savedSearches: Array<{
      id: string;
      name: string;
      query: string;
      filters: DocumentSearchFilters;
    }> = [];

    logger.info('Saved searches retrieved', { clinicId, userId: user.id, count: savedSearches.length });
    return savedSearches;
  } catch (error) {
    logger.error('Failed to get saved searches', { error, clinicId, userId: user.id });
    throw error;
  }
}
