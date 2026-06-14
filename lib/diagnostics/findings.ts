// ============================================================================
// ClinicOS AI — Motor de regras de diagnóstico
// Ref.: docs/RULES_ENGINE.md secoes 3, 5 e 6; docs/NO_AI_RULES_SYSTEM.md secao 1
// ============================================================================

import type { CommercialKpis, CommercialMetricsInput, FinancialKpis, FinancialMetricsInput } from '@/lib/kpis';
import { evaluateRules, type RuleContext, type RuleFinding } from '@/lib/rules-engine';

export type FindingDraft = RuleFinding;

export interface FindingsInput {
  commercialKpis: CommercialKpis;
  financialKpis: FinancialKpis;
  commercialInput: CommercialMetricsInput;
  financialInput: FinancialMetricsInput;
}

/**
 * Avalia RULE_DEFINITIONS (lib/rules-engine) contra os KPIs e métricas do
 * diagnóstico e retorna os achados (`diagnostic_findings`) gerados — sem
 * `diagnostic_id`, `id` ou `created_at`, que são responsabilidade de quem
 * persiste o resultado.
 */
export function generateFindings(input: FindingsInput): FindingDraft[] {
  const { commercialKpis, financialKpis, commercialInput, financialInput } = input;

  const context: RuleContext = {
    facts: {
      attendance_rate: commercialKpis.attendance_rate,
      average_response_time_minutes: commercialInput.average_response_time_minutes,
      net_margin: financialKpis.net_margin,
      payroll_percentage: financialKpis.payroll_percentage,
      referral_rate: commercialKpis.referral_rate,
      renewal_rate: commercialKpis.renewal_rate,
    },
    commercialInput,
    financialInput,
    financialKpis: { net_profit: financialKpis.net_profit },
  };

  return evaluateRules(context);
}
