import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Marketplace Manager
// Platform marketplace for plugins, templates, and extensions
// ============================================================================

/**
 * Marketplace item interface
 */
export interface MarketplaceItem {
  id: string;
  name: string;
  type: 'plugin' | 'template' | 'theme' | 'integration';
  category: string;
  description: string;
  version: string;
  author: string;
  status: 'published' | 'draft' | 'archived';
  price: number;
  currency: string;
  rating: number;
  downloads: number;
  imageUrl?: string;
  documentationUrl?: string;
  repositoryUrl?: string;
  configSchema: Record<string, unknown>;
  features: string[];
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

/**
 * Create marketplace item
 */
export async function createMarketplaceItem(data: {
  name: string;
  type: 'plugin' | 'template' | 'theme' | 'integration';
  category: string;
  description: string;
  version: string;
  author: string;
  price: number;
  currency: string;
  configSchema: Record<string, unknown>;
  features: string[];
  imageUrl?: string;
  documentationUrl?: string;
  repositoryUrl?: string;
  tenantId?: string;
  createdBy: string;
}): Promise<MarketplaceItem> {
  try {
    await validatePlatformWritePermission(PlatformResource.MARKETPLACE);

    const supabase = getSupabaseClient();

    const itemId = `marketplace-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: item, error } = await supabase
      .from('marketplace_items')
      .insert({
        id: itemId,
        name: data.name,
        type: data.type,
        category: data.category,
        description: data.description,
        version: data.version,
        author: data.author,
        status: 'published',
        price: data.price,
        currency: data.currency,
        rating: 0,
        downloads: 0,
        image_url: data.imageUrl || null,
        documentation_url: data.documentationUrl || null,
        repository_url: data.repositoryUrl || null,
        config_schema: data.configSchema,
        features: data.features,
        tenant_id: data.tenantId || null,
        created_at: now,
        updated_at: now,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create marketplace item', { error, data });
      throw new DatabaseError('Failed to create marketplace item', { error });
    }

    logger.info('Marketplace item created', { itemId, name: data.name, type: data.type });

    // Invalidate cache
    cache.delete(`marketplace:${itemId}`);
    cache.delete('marketplace:all');

    return item as MarketplaceItem;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating marketplace item', { error, data });
    throw new DatabaseError('Failed to create marketplace item', { error });
  }
}

/**
 * Get marketplace item by ID
 */
export async function getMarketplaceItem(itemId: string): Promise<MarketplaceItem> {
  try {
    const supabase = getSupabaseClient();

    const { data: item, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) {
      logger.error('Failed to fetch marketplace item', { error, itemId });
      throw new DatabaseError('Failed to fetch marketplace item', { error });
    }

    if (!item) {
      throw new NotFoundError('Marketplace item not found');
    }

    return item as MarketplaceItem;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching marketplace item', { error, itemId });
    throw new DatabaseError('Failed to fetch marketplace item', { error });
  }
}

/**
 * List marketplace items
 */
export async function listMarketplaceItems(options: {
  page?: number;
  pageSize?: number;
  type?: 'plugin' | 'template' | 'theme' | 'integration';
  category?: string;
  status?: 'published' | 'draft' | 'archived';
  tenantId?: string;
  minRating?: number;
  maxPrice?: number;
}): Promise<{ items: MarketplaceItem[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, type, category, status, tenantId, minRating, maxPrice } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('marketplace_items')
      .select('*', { count: 'exact' });

    if (type) {
      query = query.eq('type', type);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (minRating !== undefined) {
      query = query.gte('rating', minRating);
    }

    if (maxPrice !== undefined) {
      query = query.lte('price', maxPrice);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: items, error, count } = await query
      .range(fromIndex, toIndex)
      .order('downloads', { ascending: false });

    if (error) {
      logger.error('Failed to list marketplace items', { error });
      throw new DatabaseError('Failed to list marketplace items', { error });
    }

    return {
      items: (items || []) as MarketplaceItem[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing marketplace items', { error });
    throw new DatabaseError('Failed to list marketplace items', { error });
  }
}

/**
 * Update marketplace item
 */
export async function updateMarketplaceItem(itemId: string, data: {
  name?: string;
  description?: string;
  version?: string;
  price?: number;
  imageUrl?: string;
  documentationUrl?: string;
  repositoryUrl?: string;
  status?: 'published' | 'draft' | 'archived';
}): Promise<MarketplaceItem> {
  try {
    await validatePlatformWritePermission(PlatformResource.MARKETPLACE);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = { updated_at: now };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.version !== undefined) updateData.version = data.version;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
    if (data.documentationUrl !== undefined) updateData.documentation_url = data.documentationUrl;
    if (data.repositoryUrl !== undefined) updateData.repository_url = data.repositoryUrl;
    if (data.status !== undefined) updateData.status = data.status;

    const { data: item, error } = await supabase
      .from('marketplace_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update marketplace item', { error, itemId });
      throw new DatabaseError('Failed to update marketplace item', { error });
    }

    if (!item) {
      throw new NotFoundError('Marketplace item not found');
    }

    logger.info('Marketplace item updated', { itemId });

    // Invalidate cache
    cache.delete(`marketplace:${itemId}`);
    cache.delete('marketplace:all');

    return item as MarketplaceItem;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating marketplace item', { error, itemId });
    throw new DatabaseError('Failed to update marketplace item', { error });
  }
}

/**
 * Delete marketplace item
 */
export async function deleteMarketplaceItem(itemId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.MARKETPLACE);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('marketplace_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      logger.error('Failed to delete marketplace item', { error, itemId });
      throw new DatabaseError('Failed to delete marketplace item', { error });
    }

    logger.info('Marketplace item deleted', { itemId });

    // Invalidate cache
    cache.delete(`marketplace:${itemId}`);
    cache.delete('marketplace:all');
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting marketplace item', { error, itemId });
    throw new DatabaseError('Failed to delete marketplace item', { error });
  }
}

/**
 * Rate marketplace item
 */
export async function rateMarketplaceItem(itemId: string, rating: number, userId: string): Promise<MarketplaceItem> {
  try {
    const item = await getMarketplaceItem(itemId);

    // Placeholder for rating logic
    // In production, this would:
    // - Store individual ratings
    // - Calculate average rating
    // - Update item rating

    const supabase = getSupabaseClient();
    const newRating = Math.round(((item.rating * item.downloads) + rating) / (item.downloads + 1));

    const { data: updatedItem, error } = await supabase
      .from('marketplace_items')
      .update({
        rating: newRating,
        downloads: item.downloads + 1,
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to rate marketplace item', { error, itemId });
      throw new DatabaseError('Failed to rate marketplace item', { error });
    }

    logger.info('Marketplace item rated', { itemId, rating, userId });

    // Invalidate cache
    cache.delete(`marketplace:${itemId}`);

    return updatedItem as MarketplaceItem;
  } catch (error) {
    logger.error('Failed to rate marketplace item', { error, itemId });
    throw new DatabaseError('Failed to rate marketplace item', { error });
  }
}

/**
 * Download marketplace item
 */
export async function downloadMarketplaceItem(itemId: string, userId: string): Promise<{
  success: boolean;
  downloadUrl?: string;
  message: string;
}> {
  try {
    const item = await getMarketplaceItem(itemId);

    // Placeholder for download logic
    // In production, this would:
    // - Generate download link
    // - Track download
    // - Handle payment if required

    const supabase = getSupabaseClient();
    await supabase
      .from('marketplace_items')
      .update({ downloads: item.downloads + 1 })
      .eq('id', itemId);

    logger.info('Marketplace item downloaded', { itemId, userId });

    return {
      success: true,
      downloadUrl: `/downloads/${itemId}`,
      message: 'Download successful',
    };
  } catch (error) {
    logger.error('Failed to download marketplace item', { error, itemId });
    throw new DatabaseError('Failed to download marketplace item', { error });
  }
}

/**
 * Get marketplace categories
 */
export async function getMarketplaceCategories(): Promise<Array<{
  name: string;
  count: number;
}>> {
  try {
    const supabase = getSupabaseClient();

    const { data: items } = await supabase
      .from('marketplace_items')
      .select('category');

    if (!items || items.length === 0) {
      return [];
    }

    const categoryCount: Record<string, number> = {};
    for (const item of items) {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
    }

    return Object.entries(categoryCount).map(([name, count]) => ({ name, count }));
  } catch (error) {
    logger.error('Failed to get marketplace categories', { error });
    throw new DatabaseError('Failed to get marketplace categories', { error });
  }
}

/**
 * Get featured items
 */
export async function getFeaturedItems(limit: number = 10): Promise<MarketplaceItem[]> {
  try {
    const { items } = await listMarketplaceItems({ 
      status: 'published', 
      pageSize: limit 
    });
    return items.slice(0, limit);
  } catch (error) {
    logger.error('Failed to get featured items', { error });
    throw new DatabaseError('Failed to get featured items', { error });
  }
}

/**
 * Get popular items
 */
export async function getPopularItems(limit: number = 10): Promise<MarketplaceItem[]> {
  try {
    const { items } = await listMarketplaceItems({ 
      status: 'published', 
      pageSize: limit 
    });
    return items.sort((a, b) => b.downloads - a.downloads).slice(0, limit);
  } catch (error) {
    logger.error('Failed to get popular items', { error });
    throw new DatabaseError('Failed to get popular items', { error });
  }
}

/**
 * Search marketplace items
 */
export async function searchMarketplaceItems(query: string, options: {
  page?: number;
  pageSize?: number;
}): Promise<{ items: MarketplaceItem[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20 } = options;

    const supabase = getSupabaseClient();
    let supabaseQuery = supabase
      .from('marketplace_items')
      .select('*', { count: 'exact' })
      .eq('status', 'published');

    // Simple search by name or description
    if (query) {
      supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: items, error, count } = await supabaseQuery
      .range(fromIndex, toIndex)
      .order('downloads', { ascending: false });

    if (error) {
      logger.error('Failed to search marketplace items', { error });
      throw new DatabaseError('Failed to search marketplace items', { error });
    }

    return {
      items: (items || []) as MarketplaceItem[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    logger.error('Failed to search marketplace items', { error });
    throw new DatabaseError('Failed to search marketplace items', { error });
  }
}

/**
 * Get marketplace statistics
 */
export async function getMarketplaceStatistics(): Promise<{
  totalItems: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  totalDownloads: number;
  averageRating: number;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data: items } = await supabase
      .from('marketplace_items')
      .select('type, category, downloads, rating');

    if (!items || items.length === 0) {
      return {
        totalItems: 0,
        byType: {},
        byCategory: {},
        totalDownloads: 0,
        averageRating: 0,
      };
    }

    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let totalDownloads = 0;
    let totalRating = 0;

    for (const item of items) {
      byType[item.type] = (byType[item.type] || 0) + 1;
      byCategory[item.category] = (byCategory[item.category] || 0) + 1;
      totalDownloads += item.downloads;
      totalRating += item.rating;
    }

    const averageRating = items.length > 0 ? totalRating / items.length : 0;

    return {
      totalItems: items.length,
      byType,
      byCategory,
      totalDownloads,
      averageRating,
    };
  } catch (error) {
    logger.error('Failed to get marketplace statistics', { error });
    throw new DatabaseError('Failed to get marketplace statistics', { error });
  }
}
