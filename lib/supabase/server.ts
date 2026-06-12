// ============================================================================
// ClinicOS AI — Cliente Supabase para o servidor
// (Server Components, Server Actions, Route Handlers)
// ============================================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` chamado a partir de um Server Component: pode ser
            // ignorado porque o middleware (lib/supabase/middleware.ts)
            // já cuida de renovar a sessão.
          }
        },
      },
    },
  );
}
