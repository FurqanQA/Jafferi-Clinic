import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CookieOptions } from '@supabase/ssr';

/**
 * Creates a server-side Supabase client for Server Components, Server Actions,
 * and Route Handlers. This function integrates with Next.js cookies() to handle
 * session management on the server.
 *
 * @returns A SupabaseClient instance configured for server use with cookie handling
 */
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Actions can't set cookies, but this is handled by middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Server Actions can't set cookies, but this is handled by middleware
          }
        },
      },
    }
  );
}
