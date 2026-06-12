// ============================================================================
// ClinicOS AI — Cliente Supabase com service_role (admin)
//
// Usa a chave SUPABASE_SERVICE_ROLE_KEY, que ignora RLS. Importar apenas em
// código server-side (Route Handlers, Server Actions, scripts) — nunca em
// Client Components. O import de "server-only" garante um erro de build se
// este módulo acabar em um bundle de cliente.
// ============================================================================

import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
