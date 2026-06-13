# Checklist de Prontidão para Deploy — ClinicOS AI

Revisão realizada em 2026-06-13. Status geral: **✅ Pronto para deploy** (ver observações).

## 1. `.env.local` no `.gitignore`

✅ OK.

- `.gitignore` (raiz) contém `.env` e `.env*.local`, cobrindo `.env.local`, `.env.development.local`, etc.
- `git ls-files` confirma que `.env.local` **não** está versionado.
- Variáveis presentes localmente: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_DB_PASSWORD`.
- **Ação no provedor de deploy**: configurar `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` como env vars do projeto
  (a última **sem** prefixo `NEXT_PUBLIC_`, ou seja, apenas server-side).

## 2. `service_role` não exposto em Client Components

✅ OK.

- `SUPABASE_SERVICE_ROLE_KEY` só é referenciada em:
  - `lib/supabase/admin.ts` (server-only, ver item 3);
  - `scripts/check-supabase-connection.ts` (script Node executado fora do bundle do app).
- Não há nenhum arquivo com `'use client'` no projeto atualmente, portanto não há
  superfície de Client Component que possa importar `admin.ts` ou a service_role key.
- `lib/supabase/client.ts` (cliente de browser) usa apenas
  `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`, ambas seguras para exposição pública.

## 3. `lib/supabase/admin.ts` usa `server-only`

✅ OK.

- Primeira linha de código do arquivo é `import 'server-only';`, garantindo erro de build
  caso `createAdminClient` seja importado a partir de um Client Component.
- `server-only` está declarado em `dependencies` do `package.json`.

## 4. Build limpo

✅ OK.

- `npm run typecheck` (`tsc --noEmit`) — sem erros.
- `npm run build` — compila com sucesso e gera as 19 rotas esperadas (13 páginas + middleware),
  todas como `ƒ` (dynamic/server-rendered), exceto `/_not-found` (estática).
- Aviso cosmético do webpack sobre `process.version`/Edge Runtime, originado da reexportação de
  `createBrowserClient` pelo pacote `@supabase/ssr` dentro de `lib/supabase/middleware.ts`
  (que usa apenas `createServerClient`). É um warning conhecido do pacote, não impede o build
  nem o runtime no Vercel.

## 5. Middleware compatível com Vercel

✅ OK.

- `middleware.ts` está na raiz do projeto (local esperado pelo Vercel para Edge Middleware).
- Usa `updateSession` (`lib/supabase/middleware.ts`), baseado em `createServerClient` do
  `@supabase/ssr`, compatível com Edge Runtime.
- `matcher` exclui `_next/static`, `_next/image`, `favicon.ico` e arquivos de imagem
  (`svg`, `png`, `jpg`, `jpeg`, `gif`, `webp`), evitando execução desnecessária em assets estáticos.
- Não executa lógica entre `createServerClient` e `getUser()`, conforme recomendado pela
  documentação do Supabase (renovação de sessão correta).

## 6. Rotas protegidas

✅ OK.

- `middleware.ts` → `updateSession` redireciona para `/login` quando `!user` e o path começa
  com `/dashboard`, `/clinics`, `/diagnostics` ou `/products` (cobre todas as sub-rotas, ex.:
  `/diagnostics/[id]/action-plans`, `/clinics/new`, etc.).
- `app/(app)/layout.tsx` aplica uma segunda verificação (`getUser()` + `redirect('/login')`)
  a todas as rotas internas, como camada extra de defesa.
- Cada página dentro de `app/(app)/**` também verifica `user` individualmente (defesa em
  profundidade, preservada das implementações anteriores).
- `/login` e `/` (redirect inicial) ficam fora do grupo `(app)` e não são protegidas — correto,
  pois precisam ser acessíveis sem sessão.

## 7. Sem scripts temporários, seeds ou dados de teste commitados

✅ OK.

- `git status` limpo (working tree sem alterações pendentes).
- `git ls-files` não mostra nenhum arquivo de smoke test, seed, fixture ou dado de exemplo.
- `scripts/check-supabase-connection.ts` é o único script em `scripts/` — é a ferramenta
  oficial de diagnóstico (`npm run check-supabase`), não um script temporário.
- `supabase/migrations/20260612120000_initial_schema.sql` contém apenas DDL (tabelas, RLS,
  triggers, funções) — nenhum `INSERT` de dados de teste/seed.

## 8. Scripts do `package.json`

✅ OK (todos presentes).

| Script          | Comando                                  | Status |
| ---------------- | ----------------------------------------- | ------ |
| `dev`             | `next dev`                                 | ✅ já existia |
| `build`           | `next build`                               | ✅ já existia |
| `start`           | `next start`                               | ✅ já existia |
| `typecheck`       | `tsc --noEmit`                             | ✅ adicionado nesta revisão |
| `check-supabase`  | `tsx scripts/check-supabase-connection.ts` | ✅ já existia |

## Observações adicionais (não bloqueantes)

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_DB_PASSWORD` existem em `.env.local` mas
  não são lidos pelo código da aplicação — manter apenas se forem usados por tooling local
  (Supabase CLI, conexão direta ao banco). Não precisam ser configurados no Vercel.
- `lib/supabase/admin.ts` (`createAdminClient`) ainda não é usado por nenhuma rota/página —
  caso passe a ser usado, manter sempre em código server-only (Server Actions/Route Handlers).
- Não existe `.env.local.example`; ao integrar um novo ambiente, copiar as chaves usadas pelo
  código (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
  a partir deste checklist.
