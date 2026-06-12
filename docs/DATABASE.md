# DATABASE.md — ClinicOS AI

## Stack de Dados

- Banco: Supabase Postgres
- Auth: Supabase Auth
- Storage: Supabase Storage
- Backend: Next.js Server Actions / Route Handlers
- Deploy: Vercel

---

# 1. Entidades Principais

## users

Gerenciado pelo Supabase Auth.

Usado para identificar o consultor logado.

---

## clinics

Representa cada clínica diagnosticada.

Campos:

- id
- user_id
- name
- city
- state
- business_model
- years_in_operation
- specialties
- created_at
- updated_at

Exemplo de specialties:

- emagrecimento
- reposição hormonal
- nutrologia
- estética avançada
- medicina integrativa

---

## clinic_team

Equipe da clínica.

Campos:

- id
- clinic_id
- doctors_count
- nutritionists_count
- receptionists_count
- sales_people_count
- managers_count
- other_staff_count
- total_payroll
- created_at
- updated_at

---

## diagnostics

Representa uma análise mensal ou pontual da clínica.

Campos:

- id
- clinic_id
- period_month
- period_year
- status
- general_score
- commercial_score
- financial_score
- retention_score
- marketing_score
- operation_score
- executive_summary
- created_at
- updated_at

Status:

- draft
- completed
- archived

---

# 2. Dados Comerciais

## commercial_metrics

Campos:

- id
- diagnostic_id
- leads
- contacted_leads
- scheduled_appointments
- attended_appointments
- sales
- renewals
- eligible_renewals
- referrals
- new_patients
- average_ticket
- average_response_time_minutes
- average_days_until_appointment
- created_at
- updated_at

KPIs calculados:

- contact_rate
- scheduling_rate
- attendance_rate
- conversion_rate
- renewal_rate
- referral_rate

---

# 3. Dados Financeiros

## financial_metrics

Campos:

- id
- diagnostic_id
- gross_revenue
- taxes
- direct_costs
- payroll
- marketing_expenses
- commissions
- operational_expenses
- financial_expenses
- other_expenses
- created_at
- updated_at

KPIs calculados:

- net_revenue
- gross_profit
- ebitda
- net_profit
- gross_margin
- net_margin
- payroll_percentage
- marketing_percentage

---

# 4. Produtos e Serviços

## products

Produtos/serviços da clínica.

Campos:

- id
- clinic_id
- name
- category
- is_active
- created_at
- updated_at

Categorias:

- emagrecimento
- reposição hormonal
- soroterapia
- nutrição
- estética
- consulta
- outro

---

## product_metrics

Métricas por produto dentro de um diagnóstico.

Campos:

- id
- diagnostic_id
- product_id
- quantity_sold
- average_price
- direct_cost_per_unit
- commission_per_unit
- team_time_minutes_per_unit
- created_at
- updated_at

KPIs calculados:

- product_revenue
- product_total_cost
- product_gross_profit
- product_margin
- total_team_time_minutes

---

# 5. Diagnóstico e Gargalos

## diagnostic_findings

Problemas identificados pelo sistema.

Campos:

- id
- diagnostic_id
- pillar
- severity
- title
- description
- evidence
- estimated_impact
- priority_score
- created_at

Pillars:

- commercial
- financial
- retention
- marketing
- operation

Severity:

- low
- medium
- high
- critical

---

# 6. Planos de Ação

## action_plans

Campos:

- id
- diagnostic_id
- title
- description
- objective
- expected_result
- status
- created_at
- updated_at

Status:

- planned
- in_progress
- completed
- paused

---

## action_plan_phases

Campos:

- id
- action_plan_id
- title
- description
- order_index
- created_at
- updated_at

---

## tasks

Campos:

- id
- phase_id
- title
- description
- owner
- due_date
- status
- priority
- expected_kpi
- created_at
- updated_at

Status:

- todo
- doing
- done
- blocked

Priority:

- low
- medium
- high
- urgent

---

# 7. IA e Histórico

## ai_reports

Relatórios gerados pela IA.

Campos:

- id
- diagnostic_id
- report_type
- content
- created_at

Report types:

- executive_summary
- full_diagnostic
- action_plan
- commercial_analysis
- financial_analysis

---

## ai_conversations

Histórico do copiloto.

Campos:

- id
- clinic_id
- diagnostic_id
- user_message
- ai_response
- created_at

---

# 8. Segurança

## Regra geral

Todo dado pertence a um user_id por meio da clínica.

O usuário só pode acessar dados das clínicas que criou.

---

# 9. Row Level Security

Todas as tabelas devem usar RLS.

Política base:

- SELECT: usuário pode ver registros vinculados às suas clínicas
- INSERT: usuário pode criar registros para suas próprias clínicas
- UPDATE: usuário pode editar registros das suas clínicas
- DELETE: usuário pode excluir registros das suas clínicas

---

# 10. Observações para o MVP

No MVP, priorizar:

1. clinics
2. diagnostics
3. commercial_metrics
4. financial_metrics
5. products
6. product_metrics
7. diagnostic_findings
8. action_plans
9. action_plan_phases
10. tasks

As tabelas de IA podem ser implementadas na segunda etapa.