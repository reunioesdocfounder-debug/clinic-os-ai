// ============================================================================
// ClinicOS AI — Tipos da camada de cálculo de KPIs
// Ref.: docs/RULES_ENGINE.md
//
// Nota: colunas `numeric` do Postgres são retornadas como `string` pelo
// supabase-js (para preservar precisão). Os tipos abaixo assumem `number` —
// converta os valores (`Number(...)`) ao ler as linhas do banco antes de
// chamar as funções de `lib/kpis`.
// ============================================================================

// ----------------------------------------------------------------------------
// Comercial (commercial_metrics) — RULES_ENGINE.md secao 1.1
// ----------------------------------------------------------------------------
export interface CommercialMetricsInput {
  leads: number;
  contacted_leads: number;
  scheduled_appointments: number;
  attended_appointments: number;
  sales: number;
  renewals: number;
  eligible_renewals: number;
  referrals: number;
  new_patients: number;
  average_ticket: number;
  average_response_time_minutes: number;
  average_days_until_appointment: number;
}

export interface CommercialKpis {
  contact_rate: number | null;
  scheduling_rate: number | null;
  attendance_rate: number | null;
  conversion_rate: number | null;
  renewal_rate: number | null;
  referral_rate: number | null;
}

// ----------------------------------------------------------------------------
// Financeiro (financial_metrics) — RULES_ENGINE.md secao 1.2
// ----------------------------------------------------------------------------
export interface FinancialMetricsInput {
  gross_revenue: number;
  taxes: number;
  /**
   * Custos diretos ligados à entrega do serviço/produto: repasse médico,
   * repasse de nutricionista, insumos, exames e materiais.
   * NÃO inclui comissões comerciais — ver `commissions`.
   */
  direct_costs: number;
  payroll: number;
  marketing_expenses: number;
  /**
   * Comissões comerciais sobre vendas. Tratadas como despesa operacional
   * (compõem o EBITDA), nunca como custo direto.
   */
  commissions: number;
  operational_expenses: number;
  financial_expenses: number;
  other_expenses: number;
}

export interface FinancialKpis {
  net_revenue: number;
  gross_profit: number;
  ebitda: number;
  net_profit: number;
  gross_margin: number | null;
  net_margin: number | null;
  payroll_percentage: number | null;
  marketing_percentage: number | null;
}

// ----------------------------------------------------------------------------
// Produtos (product_metrics) — RULES_ENGINE.md secao 1.3
// ----------------------------------------------------------------------------
export interface ProductMetricsInput {
  product_id: string;
  quantity_sold: number;
  average_price: number;
  direct_cost_per_unit: number;
  commission_per_unit: number;
  team_time_minutes_per_unit: number;
}

export interface ProductKpis {
  product_id: string;
  product_revenue: number;
  product_total_cost: number;
  product_gross_profit: number;
  product_margin: number | null;
  total_team_time_minutes: number;
}

export interface RankedProductKpis extends ProductKpis {
  ranking: number;
}

// ----------------------------------------------------------------------------
// Diagnóstico / Motor de Regras — RULES_ENGINE.md secoes 1.4, 1.5, 3, 4 e 5
// ----------------------------------------------------------------------------
export type Pillar = 'commercial' | 'financial' | 'retention' | 'marketing' | 'operation';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface PillarScores {
  commercial_score: number | null;
  financial_score: number | null;
  retention_score: number | null;
  marketing_score: number | null;
  operation_score: number | null;
}
