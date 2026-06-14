// ============================================================================
// ClinicOS AI — Confirmação manual de email de usuário (dev)
//
// Uso: npm run confirm-user -- usuario@exemplo.com
//
// Confirma o email de um usuário criado via supabase.auth.signUp(), útil em
// desenvolvimento quando "Confirm email" está habilitado no projeto Supabase
// e o email de confirmação não foi recebido/acessado.
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

const email = process.argv[2];

if (!email) {
  console.error('Uso: npm run confirm-user -- <email>');
  process.exit(1);
}

async function main() {
  const supabase = createClient(url!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let user: { id: string; email?: string; email_confirmed_at?: string | null } | undefined;
  let page = 1;

  while (!user) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });

    if (error) {
      console.error(`Erro ao listar usuários: ${error.message}`);
      process.exit(1);
    }

    user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (data.users.length < 200) break;
    page += 1;
  }

  if (!user) {
    console.error(`Usuário não encontrado: ${email}`);
    process.exit(1);
  }

  if (user.email_confirmed_at) {
    console.log(`✓ ${email} já está confirmado.`);
    return;
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });

  if (error) {
    console.error(`Erro ao confirmar usuário: ${error.message}`);
    process.exit(1);
  }

  console.log(`✓ ${email} confirmado com sucesso. Já pode fazer login.`);
}

main();
