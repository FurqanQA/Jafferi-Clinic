import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Support Manager
// Customer support and help center management
// ============================================================================

/**
 * Support article interface
 */
export interface SupportArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  tags: string[];
  status: 'published' | 'draft' | 'archived';
  locale: string;
  author: string;
  views: number;
  helpfulCount: number;
  notHelpfulCount: number;
  tenantId?: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

/**
 * Create support article
 */
export async function createSupportArticle(data: {
  title: string;
  slug: string;
  content: string;
  category: string;
  tags: string[];
  locale: string;
  author: string;
  tenantId?: string;
}): Promise<SupportArticle> {
  try {
    await validatePlatformWritePermission(PlatformResource.SUPPORT);

    const supabase = getSupabaseClient();

    const articleId = `article-${Date.now()}`;
    const now = new Date().toISOString();

    const { data: article, error } = await supabase
      .from('support_articles')
      .insert({
        id: articleId,
        title: data.title,
        slug: data.slug,
        content: data.content,
        category: data.category,
        tags: data.tags,
        status: 'draft',
        locale: data.locale,
        author: data.author,
        views: 0,
        helpful_count: 0,
        not_helpful_count: 0,
        tenant_id: data.tenantId || null,
        published_at: null,
        created_at: now,
        updated_at: now,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create support article', { error, data });
      throw new DatabaseError('Failed to create support article', { error });
    }

    logger.info('Support article created', { articleId, title: data.title });

    // Invalidate cache
    cache.delete(`article:${articleId}`);
    cache.delete('articles:all');

    return article as SupportArticle;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating support article', { error, data });
    throw new DatabaseError('Failed to create support article', { error });
  }
}

/**
 * Get support article by ID
 */
export async function getSupportArticle(articleId: string): Promise<SupportArticle> {
  try {
    const supabase = getSupabaseClient();

    const { data: article, error } = await supabase
      .from('support_articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (error) {
      logger.error('Failed to fetch support article', { error, articleId });
      throw new DatabaseError('Failed to fetch support article', { error });
    }

    if (!article) {
      throw new NotFoundError('Support article not found');
    }

    return article as SupportArticle;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching support article', { error, articleId });
    throw new DatabaseError('Failed to fetch support article', { error });
  }
}

/**
 * Get support article by slug
 */
export async function getSupportArticleBySlug(slug: string): Promise<SupportArticle | null> {
  try {
    const supabase = getSupabaseClient();

    const { data: article, error } = await supabase
      .from('support_articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      logger.error('Failed to fetch support article by slug', { error, slug });
      throw new DatabaseError('Failed to fetch support article by slug', { error });
    }

    if (!article) {
      return null;
    }

    // Increment view count
    await supabase
      .from('support_articles')
      .update({ views: (article.views || 0) + 1 })
      .eq('id', article.id);

    return article as SupportArticle;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching support article by slug', { error, slug });
    throw new DatabaseError('Failed to fetch support article by slug', { error });
  }
}

/**
 * List support articles
 */
export async function listSupportArticles(options: {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: 'published' | 'draft' | 'archived';
  locale?: string;
  tenantId?: string;
  tag?: string;
}): Promise<{ articles: SupportArticle[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, category, status, locale, tenantId, tag } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('support_articles')
      .select('*', { count: 'exact' });

    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (locale) {
      query = query.eq('locale', locale);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: articles, error, count } = await query
      .range(fromIndex, toIndex)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list support articles', { error });
      throw new DatabaseError('Failed to list support articles', { error });
    }

    return {
      articles: (articles || []) as SupportArticle[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing support articles', { error });
    throw new DatabaseError('Failed to list support articles', { error });
  }
}

/**
 * Update support article
 */
export async function updateSupportArticle(articleId: string, data: {
  title?: string;
  slug?: string;
  content?: string;
  category?: string;
  tags?: string[];
  status?: 'published' | 'draft' | 'archived';
  locale?: string;
}): Promise<SupportArticle> {
  try {
    await validatePlatformWritePermission(PlatformResource.SUPPORT);

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = { updated_at: now };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'published' && !updateData.published_at) {
        updateData.published_at = now;
      }
    }
    if (data.locale !== undefined) updateData.locale = data.locale;

    const { data: article, error } = await supabase
      .from('support_articles')
      .update(updateData)
      .eq('id', articleId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update support article', { error, articleId });
      throw new DatabaseError('Failed to update support article', { error });
    }

    if (!article) {
      throw new NotFoundError('Support article not found');
    }

    logger.info('Support article updated', { articleId });

    // Invalidate cache
    cache.delete(`article:${articleId}`);
    cache.delete('articles:all');

    return article as SupportArticle;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating support article', { error, articleId });
    throw new DatabaseError('Failed to update support article', { error });
  }
}

/**
 * Delete support article
 */
export async function deleteSupportArticle(articleId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.SUPPORT);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('support_articles')
      .delete()
      .eq('id', articleId);

    if (error) {
      logger.error('Failed to delete support article', { error, articleId });
      throw new DatabaseError('Failed to delete support article', { error });
    }

    logger.info('Support article deleted', { articleId });

    // Invalidate cache
    cache.delete(`article:${articleId}`);
    cache.delete('articles:all');
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting support article', { error, articleId });
    throw new DatabaseError('Failed to delete support article', { error });
  }
}

/**
 * Rate article helpfulness
 */
export async function rateArticleHelpfulness(articleId: string, helpful: boolean): Promise<SupportArticle> {
  try {
    const article = await getSupportArticle(articleId);

    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = {};
    if (helpful) {
      updateData.helpful_count = (article.helpfulCount || 0) + 1;
    } else {
      updateData.not_helpful_count = (article.notHelpfulCount || 0) + 1;
    }

    const { data: updatedArticle, error } = await supabase
      .from('support_articles')
      .update(updateData)
      .eq('id', articleId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to rate article helpfulness', { error, articleId });
      throw new DatabaseError('Failed to rate article helpfulness', { error });
    }

    logger.info('Article helpfulness rated', { articleId, helpful });

    return updatedArticle as SupportArticle;
  } catch (error) {
    logger.error('Failed to rate article helpfulness', { error, articleId });
    throw new DatabaseError('Failed to rate article helpfulness', { error });
  }
}

/**
 * Search support articles
 */
export async function searchSupportArticles(query: string, options: {
  page?: number;
  pageSize?: number;
  locale?: string;
}): Promise<{ articles: SupportArticle[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, locale } = options;

    const supabase = getSupabaseClient();
    let supabaseQuery = supabase
      .from('support_articles')
      .select('*', { count: 'exact' })
      .eq('status', 'published');

    if (locale) {
      supabaseQuery = supabaseQuery.eq('locale', locale);
    }

    // Simple search by title or content
    if (query) {
      supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
    }

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    const { data: articles, error, count } = await supabaseQuery
      .range(fromIndex, toIndex)
      .order('views', { ascending: false });

    if (error) {
      logger.error('Failed to search support articles', { error });
      throw new DatabaseError('Failed to search support articles', { error });
    }

    return {
      articles: (articles || []) as SupportArticle[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    logger.error('Failed to search support articles', { error });
    throw new DatabaseError('Failed to search support articles', { error });
  }
}

/**
 * Get support categories
 */
export async function getSupportCategories(): Promise<Array<{
  name: string;
  count: number;
}>> {
  try {
    const supabase = getSupabaseClient();

    const { data: articles } = await supabase
      .from('support_articles')
      .select('category');

    if (!articles || articles.length === 0) {
      return [];
    }

    const categoryCount: Record<string, number> = {};
    for (const article of articles) {
      categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
    }

    return Object.entries(categoryCount).map(([name, count]) => ({ name, count }));
  } catch (error) {
    logger.error('Failed to get support categories', { error });
    throw new DatabaseError('Failed to get support categories', { error });
  }
}

/**
 * Get popular articles
 */
export async function getPopularArticles(limit: number = 10): Promise<SupportArticle[]> {
  try {
    const { articles } = await listSupportArticles({ 
      status: 'published', 
      pageSize: limit 
    });
    return articles.sort((a, b) => b.views - a.views).slice(0, limit);
  } catch (error) {
    logger.error('Failed to get popular articles', { error });
    throw new DatabaseError('Failed to get popular articles', { error });
  }
}

/**
 * Get related articles
 */
export async function getRelatedArticles(articleId: string, limit: number = 5): Promise<SupportArticle[]> {
  try {
    const article = await getSupportArticle(articleId);

    const { articles } = await listSupportArticles({ 
      status: 'published', 
      category: article.category,
      pageSize: limit + 1 
    });

    return articles.filter(a => a.id !== articleId).slice(0, limit);
  } catch (error) {
    logger.error('Failed to get related articles', { error, articleId });
    throw new DatabaseError('Failed to get related articles', { error });
  }
}

/**
 * Get support statistics
 */
export async function getSupportStatistics(): Promise<{
  totalArticles: number;
  published: number;
  draft: number;
  totalViews: number;
  helpfulCount: number;
  notHelpfulCount: number;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data: articles } = await supabase
      .from('support_articles')
      .select('status, views, helpful_count, not_helpful_count');

    if (!articles || articles.length === 0) {
      return {
        totalArticles: 0,
        published: 0,
        draft: 0,
        totalViews: 0,
        helpfulCount: 0,
        notHelpfulCount: 0,
      };
    }

    let published = 0;
    let draft = 0;
    let totalViews = 0;
    let helpfulCount = 0;
    let notHelpfulCount = 0;

    for (const article of articles) {
      if (article.status === 'published') published++;
      else if (article.status === 'draft') draft++;

      totalViews += article.views || 0;
      helpfulCount += article.helpful_count || 0;
      notHelpfulCount += article.not_helpful_count || 0;
    }

    return {
      totalArticles: articles.length,
      published,
      draft,
      totalViews,
      helpfulCount,
      notHelpfulCount,
    };
  } catch (error) {
    logger.error('Failed to get support statistics', { error });
    throw new DatabaseError('Failed to get support statistics', { error });
  }
}
