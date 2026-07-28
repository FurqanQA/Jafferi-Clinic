import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a browser-side Supabase client for Client Components.
 * This function uses createBrowserClient from @supabase/ssr which handles
 * cookie management automatically in the browser.
 *
 * @returns A SupabaseClient instance configured for browser use
 */
export function createClient(): SupabaseClient {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
