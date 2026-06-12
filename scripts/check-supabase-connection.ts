// ============================================================================
// ClinicOS AI — Verificação de conexão com o Supabase
//
// Uso: npm run check-supabase
//
// Lê NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY de `.env.local` e
// faz uma consulta simples (count) em cada tabela da migração inicial para
// confirmar que:
//   1. as credenciais estão corretas;
//   2. a migração inicial (supabase/migrations) já foi aplicada no projeto.
// ============================================================================

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    'Faltam variáveis de ambiente. Copie .env.local.example para .env.local e ' +
      'preencha NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.',
  );
  process.exit(1);
}

const TABLES = [
  'clinics',
  'clinic_team',
  'diagnostics',
  'commercial_metrics',
  'financial_metrics',
  'products',
  'product_metrics',
  'diagnostic_findings',
  'action_plans',
  'action_plan_phases',
  'tasks',
] as const;

async function main() {
  const supabase = createClient(url!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let hasError = false;

  for (const table of TABLES) {
    const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });

    if (error) {
      hasError = true;
      console.error(`✗ ${table}: ${error.message}`);
    } else {
      console.log(`✓ ${table} — ${count ?? 0} registro(s)`);
    }
  }

  if (hasError) {
    console.error(
      '\nAlgumas tabelas não foram encontradas. Aplique a migração ' +
        'supabase/migrations/20260612120000_initial_schema.sql no seu projeto Supabase.',
    );
    process.exit(1);
  }

  console.log('\nConexão com o Supabase OK — schema da migração inicial completo.');
}

main();
