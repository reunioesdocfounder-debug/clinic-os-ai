// ============================================================================
// ClinicOS AI — Motor de regras declarativo (avaliador + barrel)
// Ref.: docs/RULES_ENGINE.md secoes 3, 5 e 6; docs/NO_AI_RULES_SYSTEM.md
// ============================================================================

import { calculatePriorityScore, roundTo } from '@/lib/kpis';
import { IMPACT_CALCULATORS } from './impact-calculators';
import { KPI_DEFINITIONS } from './kpi-definitions';
import { RULE_DEFINITIONS } from './rule-definitions';
import type { RuleContext, RuleFinding, RuleOperator } from './types';

export * from './types';
export * from './kpi-definitions';
export * from './rule-definitions';
export * from './impact-calculators';
export * from './action-plan-templates';

function conditionMatches(value: number, operator: RuleOperator, threshold: number): boolean {
  return operator === '<' ? value < threshold : value > threshold;
}

/**
 * Avalia RULE_DEFINITIONS contra o contexto e retorna os achados disparados,
 * na mesma ordem de RULE_DEFINITIONS. Cada achado inclui `evidence.rule_id`
 * (docs/NO_AI_RULES_SYSTEM.md secao 3.2 — coluna `rule_id` ainda não existe
 * em `diagnostic_findings`).
 */
export function evaluateRules(context: RuleContext): RuleFinding[] {
  const findings: RuleFinding[] = [];

  for (const rule of RULE_DEFINITIONS) {
    const value = context.facts[rule.metric];
    if (value === null || !conditionMatches(value, rule.operator, rule.threshold)) continue;

    const kpiDefinition = KPI_DEFINITIONS[rule.metric];
    const impactCalculator = IMPACT_CALCULATORS[rule.impactCalculator];

    findings.push({
      pillar: rule.pillar,
      severity: rule.severity,
      title: rule.title,
      description: rule.description,
      evidence: {
        kpi: rule.metric,
        value: roundTo(value, kpiDefinition.evidenceDecimals),
        threshold: rule.threshold,
        operator: rule.operator,
        unit: kpiDefinition.unit,
        rule_id: rule.id,
      },
      estimated_impact: impactCalculator(context, rule, value),
      priority_score: calculatePriorityScore({
        severity: rule.severity,
        pillar: rule.pillar,
        value,
        threshold: rule.threshold,
        operator: rule.operator,
      }),
    });
  }

  return findings;
}
