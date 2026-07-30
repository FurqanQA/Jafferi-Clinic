/**
 * Date range filter
 */
export interface DateRangeFilter {
  field: string;
  from?: string | Date;
  to?: string | Date;
}

/**
 * Search filter
 */
export interface SearchFilter {
  field: string;
  query: string;
}

/**
 * Status filter
 */
export interface StatusFilter {
  field: string;
  values: string[];
}

/**
 * Boolean filter
 */
export interface BooleanFilter {
  field: string;
  value: boolean;
}

/**
 * Numeric range filter
 */
export interface NumericRangeFilter {
  field: string;
  min?: number;
  max?: number;
}

/**
 * Combined filter parameters
 */
export interface FilterParams {
  dateRanges?: DateRangeFilter[];
  searches?: SearchFilter[];
  statuses?: StatusFilter[];
  booleans?: BooleanFilter[];
  numericRanges?: NumericRangeFilter[];
}

/**
 * Apply date range filter to a Supabase query
 * Note: This function assumes the query has gte and lte methods
 */
export function applyDateRangeFilter<T extends {
  gte: (column: string, value: string | Date) => T;
  lte: (column: string, value: string | Date) => T;
}>(
  query: T,
  filter: DateRangeFilter
): T {
  let q = query;
  
  if (filter.from) {
    q = q.gte(filter.field, filter.from);
  }
  
  if (filter.to) {
    q = q.lte(filter.field, filter.to);
  }
  
  return q;
}

/**
 * Apply search filter to a Supabase query
 */
export function applySearchFilter<T>(
  query: T,
  filter: SearchFilter
): T {
  const q = query as { ilike: (column: string, pattern: string) => T };
  return q.ilike(filter.field, `%${filter.query}%`);
}

/**
 * Apply status filter to a Supabase query
 */
export function applyStatusFilter<T>(
  query: T,
  filter: StatusFilter
): T {
  const q = query as { in: (column: string, values: string[]) => T };
  return q.in(filter.field, filter.values);
}

/**
 * Apply boolean filter to a Supabase query
 */
export function applyBooleanFilter<T>(
  query: T,
  filter: BooleanFilter
): T {
  const q = query as { eq: (column: string, value: boolean) => T };
  return q.eq(filter.field, filter.value);
}

/**
 * Apply numeric range filter to a Supabase query
 * Note: This function assumes the query has gte and lte methods
 */
export function applyNumericRangeFilter<T extends {
  gte: (column: string, value: number) => T;
  lte: (column: string, value: number) => T;
}>(
  query: T,
  filter: NumericRangeFilter
): T {
  let q = query;
  
  if (filter.min !== undefined) {
    q = q.gte(filter.field, filter.min);
  }
  
  if (filter.max !== undefined) {
    q = q.lte(filter.field, filter.max);
  }
  
  return q;
}

/**
 * Apply all filters to a Supabase query
 * Note: This function uses type assertions for flexibility with Supabase query builders
 */
export function applyFilters<T>(
  query: T,
  params: FilterParams
): T {
  let q = query as any;

  if (params.dateRanges) {
    for (const filter of params.dateRanges) {
      if (filter.from) {
        q = q.gte(filter.field, filter.from);
      }
      if (filter.to) {
        q = q.lte(filter.field, filter.to);
      }
    }
  }

  if (params.searches) {
    for (const filter of params.searches) {
      q = q.ilike(filter.field, `%${filter.query}%`);
    }
  }

  if (params.statuses) {
    for (const filter of params.statuses) {
      q = q.in(filter.field, filter.values);
    }
  }

  if (params.booleans) {
    for (const filter of params.booleans) {
      q = q.eq(filter.field, filter.value);
    }
  }

  if (params.numericRanges) {
    for (const filter of params.numericRanges) {
      if (filter.min !== undefined) {
        q = q.gte(filter.field, filter.min);
      }
      if (filter.max !== undefined) {
        q = q.lte(filter.field, filter.max);
      }
    }
  }

  return q as T;
}
