// ============================================================================
// ClinicOS AI — Tipos do motor de regras declarativo
// Ref.: docs/RULES_ENGINE.md secoes 3, 5 e 6; docs/NO_AI_RULES_SYSTEM.md secao 1
// ============================================================================

import type { CommercialKpis, CommercialMetricsInput, FinancialKpis, FinancialMetricsInput } from '@/lib/kpis';
import type { Json, Pillar, Severity } from '@/lib/supabase/database.types';

export type RuleOperator = '<' | '>';

/** Chaves de métricas referenciadas pelas regras (docs/RULES_ENGINE.md secao 3). */
export type MetricKey =
  | 'attendance_rate'
  | 'average_response_time_minutes'
  | 'average_days_until_appointment'
  | 'net_margin'
  | 'payroll_percentage'
  | 'referral_rate'
  | 'renewal_rate';

/** Tabela plana de fatos consultada pelas regras (uma entrada por MetricKey). */
export type FactsTable = Record<MetricKey, number | null>;

/** Contexto completo disponível para avaliação de regras e cálculo de impacto. */
export interface RuleContext {
  facts: FactsTable;
  commercialInput: CommercialMetricsInput;
  financialInput: FinancialMetricsInput;
  commercialKpis: Pick<CommercialKpis, 'conversion_rate'>;
  financialKpis: Pick<FinancialKpis, 'net_profit'>;
}

export type ImpactCalculatorKey =
  | 'attendanceRecovery'
  | 'responseTimeSla'
  | 'netMarginRecovery'
  | 'payrollExcess'
  | 'referralGrowth'
  | 'renewalGrowth'
  | 'scheduleDelayRevenue';

/** Gera o texto de `estimated_impact` de uma regra disparada (Tier 2 — docs/NO_AI_RULES_SYSTEM.md secao 1.5). */
export type ImpactCalculator = (context: RuleContext, rule: RuleDefinition, value: number) => string;

/** Definição declarativa de uma regra de diagnóstico (docs/RULES_ENGINE.md secao 3). */
export interface RuleDefinition {
  /** Identificador estável — usado em `evidence.rule_id` e como chave de ACTION_PLAN_TEMPLATES. */
  id: string;
  pillar: Pillar;
  severity: Severity;
  /** Chave em FactsTable cujo valor é comparado ao threshold. */
  metric: MetricKey;
  operator: RuleOperator;
  threshold: number;
  title: string;
  description: string;
  impactCalculator: ImpactCalculatorKey;
}

/** Achado (`diagnostic_findings`) gerado pela avaliação de uma RuleDefinition. */
export interface RuleFinding {
  pillar: Pillar;
  severity: Severity;
  title: string;
  description: string;
  evidence: Json;
  estimated_impact: string;
  priority_score: number;
}

export interface ActionPlanTaskTemplate {
  title: string;
}

export interface ActionPlanPhaseTemplate {
  title: string;
  orderIndex: number;
  tasks: ActionPlanTaskTemplate[];
}

/** Template de plano de ação vinculado a uma regra por `ruleId` (docs/RULES_ENGINE.md secao 6). */
export interface ActionPlanTemplate {
  ruleId: string;
  planTitle: string;
  description: string;
  objective: string;
  expectedResult: string;
  expectedKpi: string;
  phases: ActionPlanPhaseTemplate[];
}
