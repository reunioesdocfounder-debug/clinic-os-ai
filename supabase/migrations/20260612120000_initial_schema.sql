-- ============================================================================
-- ClinicOS AI — Schema inicial (Supabase / PostgreSQL)
-- Gerado a partir de docs/PRD.md e docs/DATABASE.md
--
-- Escopo (prioridade MVP, conforme DATABASE.md secao 10):
--   1. clinics
--   2. clinic_team
--   3. diagnostics
--   4. commercial_metrics
--   5. financial_metrics
--   6. products
--   7. product_metrics
--   8. diagnostic_findings
--   9. action_plans
--  10. action_plan_phases
--  11. tasks
--
-- Tabelas de IA (ai_reports, ai_conversations) ficam para a 2a etapa.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensoes
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Funcao utilitaria: mantem updated_at sempre atualizado
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 1. clinics
-- Representa cada clinica diagnosticada. Pertence ao consultor (auth.users).
-- ============================================================================
create table public.clinics (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name               text not null,
  city               text,
  state              text,
  business_model     text,
  years_in_operation integer check (years_in_operation >= 0),
  specialties        text[] not null default '{}',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index clinics_user_id_idx on public.clinics (user_id);

create trigger trg_clinics_updated_at
before update on public.clinics
for each row execute function public.set_updated_at();

-- ============================================================================
-- 2. clinic_team
-- Equipe da clinica (snapshot atual). 1:1 com clinics.
-- ============================================================================
create table public.clinic_team (
  id                     uuid primary key default gen_random_uuid(),
  clinic_id              uuid not null unique references public.clinics (id) on delete cascade,
  doctors_count          integer not null default 0 check (doctors_count >= 0),
  nutritionists_count    integer not null default 0 check (nutritionists_count >= 0),
  receptionists_count    integer not null default 0 check (receptionists_count >= 0),
  sales_people_count     integer not null default 0 check (sales_people_count >= 0),
  managers_count         integer not null default 0 check (managers_count >= 0),
  other_staff_count      integer not null default 0 check (other_staff_count >= 0),
  total_payroll          numeric(14, 2) check (total_payroll >= 0),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index clinic_team_clinic_id_idx on public.clinic_team (clinic_id);

create trigger trg_clinic_team_updated_at
before update on public.clinic_team
for each row execute function public.set_updated_at();

-- ============================================================================
-- 3. diagnostics
-- Analise mensal ou pontual da clinica, com scores por pilar (0-100).
-- ============================================================================
create table public.diagnostics (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null references public.clinics (id) on delete cascade,
  period_month      integer not null check (period_month between 1 and 12),
  period_year       integer not null check (period_year between 2000 and 2100),
  status            text not null default 'draft'
                      check (status in ('draft', 'completed', 'archived')),
  general_score     numeric(5, 2) check (general_score between 0 and 100),
  commercial_score  numeric(5, 2) check (commercial_score between 0 and 100),
  financial_score   numeric(5, 2) check (financial_score between 0 and 100),
  retention_score   numeric(5, 2) check (retention_score between 0 and 100),
  marketing_score   numeric(5, 2) check (marketing_score between 0 and 100),
  operation_score   numeric(5, 2) check (operation_score between 0 and 100),
  executive_summary text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index diagnostics_clinic_id_idx on public.diagnostics (clinic_id);
create index diagnostics_clinic_period_idx on public.diagnostics (clinic_id, period_year, period_month);

create trigger trg_diagnostics_updated_at
before update on public.diagnostics
for each row execute function public.set_updated_at();

-- ============================================================================
-- 4. commercial_metrics
-- Dados comerciais de um diagnostico (1:1). KPIs (contact_rate, etc.) sao
-- calculados na aplicacao a partir destes campos brutos.
-- ============================================================================
create table public.commercial_metrics (
  id                                uuid primary key default gen_random_uuid(),
  diagnostic_id                     uuid not null unique references public.diagnostics (id) on delete cascade,
  leads                             integer check (leads >= 0),
  contacted_leads                   integer check (contacted_leads >= 0),
  scheduled_appointments            integer check (scheduled_appointments >= 0),
  attended_appointments             integer check (attended_appointments >= 0),
  sales                             integer check (sales >= 0),
  renewals                          integer check (renewals >= 0),
  eligible_renewals                 integer check (eligible_renewals >= 0),
  referrals                         integer check (referrals >= 0),
  new_patients                      integer check (new_patients >= 0),
  average_ticket                    numeric(12, 2) check (average_ticket >= 0),
  average_response_time_minutes     numeric(8, 2) check (average_response_time_minutes >= 0),
  average_days_until_appointment     numeric(8, 2) check (average_days_until_appointment >= 0),
  created_at                        timestamptz not null default now(),
  updated_at                        timestamptz not null default now()
);

create trigger trg_commercial_metrics_updated_at
before update on public.commercial_metrics
for each row execute function public.set_updated_at();

-- ============================================================================
-- 5. financial_metrics
-- Dados financeiros de um diagnostico (1:1). KPIs (ebitda, margens, etc.)
-- sao calculados na aplicacao a partir destes campos brutos.
-- ============================================================================
create table public.financial_metrics (
  id                     uuid primary key default gen_random_uuid(),
  diagnostic_id          uuid not null unique references public.diagnostics (id) on delete cascade,
  gross_revenue          numeric(14, 2) check (gross_revenue >= 0),
  taxes                  numeric(14, 2) check (taxes >= 0),
  direct_costs           numeric(14, 2) check (direct_costs >= 0),
  payroll                numeric(14, 2) check (payroll >= 0),
  marketing_expenses     numeric(14, 2) check (marketing_expenses >= 0),
  commissions            numeric(14, 2) check (commissions >= 0),
  operational_expenses   numeric(14, 2) check (operational_expenses >= 0),
  financial_expenses     numeric(14, 2) check (financial_expenses >= 0),
  other_expenses         numeric(14, 2) check (other_expenses >= 0),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create trigger trg_financial_metrics_updated_at
before update on public.financial_metrics
for each row execute function public.set_updated_at();

-- ============================================================================
-- 6. products
-- Produtos/servicos oferecidos pela clinica.
-- ============================================================================
create table public.products (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references public.clinics (id) on delete cascade,
  name       text not null,
  category   text not null default 'outro'
               check (category in (
                 'emagrecimento',
                 'reposicao_hormonal',
                 'soroterapia',
                 'nutricao',
                 'estetica',
                 'consulta',
                 'outro'
               )),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_clinic_id_idx on public.products (clinic_id);

create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- ============================================================================
-- 7. product_metrics
-- Metricas de um produto dentro de um diagnostico especifico.
-- KPIs (product_revenue, product_margin, etc.) sao calculados na aplicacao.
-- ============================================================================
create table public.product_metrics (
  id                          uuid primary key default gen_random_uuid(),
  diagnostic_id               uuid not null references public.diagnostics (id) on delete cascade,
  product_id                  uuid not null references public.products (id) on delete cascade,
  quantity_sold               integer check (quantity_sold >= 0),
  average_price                numeric(12, 2) check (average_price >= 0),
  direct_cost_per_unit        numeric(12, 2) check (direct_cost_per_unit >= 0),
  commission_per_unit         numeric(12, 2) check (commission_per_unit >= 0),
  team_time_minutes_per_unit  numeric(8, 2) check (team_time_minutes_per_unit >= 0),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  unique (diagnostic_id, product_id)
);

create index product_metrics_diagnostic_id_idx on public.product_metrics (diagnostic_id);
create index product_metrics_product_id_idx on public.product_metrics (product_id);

create trigger trg_product_metrics_updated_at
before update on public.product_metrics
for each row execute function public.set_updated_at();

-- ============================================================================
-- 8. diagnostic_findings
-- Gargalos/problemas identificados pelo motor de regras para um diagnostico.
-- ============================================================================
create table public.diagnostic_findings (
  id               uuid primary key default gen_random_uuid(),
  diagnostic_id    uuid not null references public.diagnostics (id) on delete cascade,
  pillar           text not null
                     check (pillar in ('commercial', 'financial', 'retention', 'marketing', 'operation')),
  severity         text not null
                     check (severity in ('low', 'medium', 'high', 'critical')),
  title            text not null,
  description      text,
  evidence         jsonb not null default '{}'::jsonb,
  estimated_impact text,
  priority_score   numeric(6, 2) check (priority_score >= 0),
  created_at       timestamptz not null default now()
);

create index diagnostic_findings_diagnostic_id_idx on public.diagnostic_findings (diagnostic_id);

-- ============================================================================
-- 9. action_plans
-- Plano de acao gerado a partir de um ou mais gargalos do diagnostico.
-- ============================================================================
create table public.action_plans (
  id              uuid primary key default gen_random_uuid(),
  diagnostic_id   uuid not null references public.diagnostics (id) on delete cascade,
  title           text not null,
  description     text,
  objective       text,
  expected_result text,
  status          text not null default 'planned'
                    check (status in ('planned', 'in_progress', 'completed', 'paused')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index action_plans_diagnostic_id_idx on public.action_plans (diagnostic_id);

create trigger trg_action_plans_updated_at
before update on public.action_plans
for each row execute function public.set_updated_at();

-- ============================================================================
-- 10. action_plan_phases
-- Fases ordenadas de um plano de acao (ex: Diagnostico, Processo, Tecnologia).
-- ============================================================================
create table public.action_plan_phases (
  id              uuid primary key default gen_random_uuid(),
  action_plan_id  uuid not null references public.action_plans (id) on delete cascade,
  title           text not null,
  description     text,
  order_index     integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index action_plan_phases_action_plan_id_idx on public.action_plan_phases (action_plan_id);

create trigger trg_action_plan_phases_updated_at
before update on public.action_plan_phases
for each row execute function public.set_updated_at();

-- ============================================================================
-- 11. tasks
-- Tarefas executaveis dentro de uma fase do plano de acao.
-- ============================================================================
create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  phase_id      uuid not null references public.action_plan_phases (id) on delete cascade,
  title         text not null,
  description   text,
  owner         text,
  due_date      date,
  status        text not null default 'todo'
                  check (status in ('todo', 'doing', 'done', 'blocked')),
  priority      text not null default 'medium'
                  check (priority in ('low', 'medium', 'high', 'urgent')),
  expected_kpi  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index tasks_phase_id_idx on public.tasks (phase_id);

create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security
--
-- Regra geral (DATABASE.md secao 8 e 9):
--   Todo dado pertence a um user_id por meio da clinica. O usuario so pode
--   acessar (SELECT/INSERT/UPDATE/DELETE) dados das clinicas que criou.
--
-- Funcoes auxiliares "owns_*" centralizam a verificacao de propriedade,
-- percorrendo a cadeia de FKs ate clinics.user_id.
-- ============================================================================

create or replace function public.owns_clinic(p_clinic_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.clinics c
    where c.id = p_clinic_id
      and c.user_id = auth.uid()
  );
$$;

create or replace function public.owns_diagnostic(p_diagnostic_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.diagnostics d
    join public.clinics c on c.id = d.clinic_id
    where d.id = p_diagnostic_id
      and c.user_id = auth.uid()
  );
$$;

create or replace function public.owns_action_plan(p_action_plan_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.action_plans ap
    join public.diagnostics d on d.id = ap.diagnostic_id
    join public.clinics c on c.id = d.clinic_id
    where ap.id = p_action_plan_id
      and c.user_id = auth.uid()
  );
$$;

create or replace function public.owns_phase(p_phase_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.action_plan_phases ph
    join public.action_plans ap on ap.id = ph.action_plan_id
    join public.diagnostics d on d.id = ap.diagnostic_id
    join public.clinics c on c.id = d.clinic_id
    where ph.id = p_phase_id
      and c.user_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- clinics: dono direto via user_id
-- ----------------------------------------------------------------------------
alter table public.clinics enable row level security;

create policy "clinics_owner_access"
on public.clinics
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- clinic_team, diagnostics, products: dono via clinic_id
-- ----------------------------------------------------------------------------
alter table public.clinic_team enable row level security;

create policy "clinic_team_owner_access"
on public.clinic_team
for all
using (public.owns_clinic(clinic_id))
with check (public.owns_clinic(clinic_id));

alter table public.diagnostics enable row level security;

create policy "diagnostics_owner_access"
on public.diagnostics
for all
using (public.owns_clinic(clinic_id))
with check (public.owns_clinic(clinic_id));

alter table public.products enable row level security;

create policy "products_owner_access"
on public.products
for all
using (public.owns_clinic(clinic_id))
with check (public.owns_clinic(clinic_id));

-- ----------------------------------------------------------------------------
-- commercial_metrics, financial_metrics, product_metrics, diagnostic_findings,
-- action_plans: dono via diagnostic_id
-- ----------------------------------------------------------------------------
alter table public.commercial_metrics enable row level security;

create policy "commercial_metrics_owner_access"
on public.commercial_metrics
for all
using (public.owns_diagnostic(diagnostic_id))
with check (public.owns_diagnostic(diagnostic_id));

alter table public.financial_metrics enable row level security;

create policy "financial_metrics_owner_access"
on public.financial_metrics
for all
using (public.owns_diagnostic(diagnostic_id))
with check (public.owns_diagnostic(diagnostic_id));

alter table public.product_metrics enable row level security;

create policy "product_metrics_owner_access"
on public.product_metrics
for all
using (public.owns_diagnostic(diagnostic_id))
with check (public.owns_diagnostic(diagnostic_id));

alter table public.diagnostic_findings enable row level security;

create policy "diagnostic_findings_owner_access"
on public.diagnostic_findings
for all
using (public.owns_diagnostic(diagnostic_id))
with check (public.owns_diagnostic(diagnostic_id));

alter table public.action_plans enable row level security;

create policy "action_plans_owner_access"
on public.action_plans
for all
using (public.owns_diagnostic(diagnostic_id))
with check (public.owns_diagnostic(diagnostic_id));

-- ----------------------------------------------------------------------------
-- action_plan_phases: dono via action_plan_id
-- ----------------------------------------------------------------------------
alter table public.action_plan_phases enable row level security;

create policy "action_plan_phases_owner_access"
on public.action_plan_phases
for all
using (public.owns_action_plan(action_plan_id))
with check (public.owns_action_plan(action_plan_id));

-- ----------------------------------------------------------------------------
-- tasks: dono via phase_id
-- ----------------------------------------------------------------------------
alter table public.tasks enable row level security;

create policy "tasks_owner_access"
on public.tasks
for all
using (public.owns_phase(phase_id))
with check (public.owns_phase(phase_id));
