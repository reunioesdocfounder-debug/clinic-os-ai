// ============================================================================
// ClinicOS AI — Renovação de sessão Supabase no middleware
// ============================================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Importante: não executar lógica entre createServerClient e getUser().
  // getUser() renova o token de sessão se necessário.
  await supabase.auth.getUser();

  // TODO: quando as rotas autenticadas (app) existirem, redirecionar para
  // /login se !user e a rota exigir autenticação.

  return supabaseResponse;
}
