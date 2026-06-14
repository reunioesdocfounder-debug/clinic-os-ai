// ============================================================================
// ClinicOS AI — Score por pilar, score geral e priority_score
// Ref.: docs/RULES_ENGINE.md secoes 1.5, 2.5, 3, 4 e 5
// ============================================================================

import { scoreFromBenchmark } from './benchmarks';
import type { CommercialKpis, FinancialKpis, Pillar, PillarScores, Severity } from './types';
import { average, clamp, roundTo } from './utils';

/** Pesos dos pilares no score geral (PRD §7 / RULES_ENGINE.md secao 1.5). */
export const PILLAR_WEIGHTS: Record<Pillar, number> = {
  commercial: 25,
  financial: 30,
  retention: 20,
  marketing: 15,
  operation: 10,
};

const PILLAR_SCORE_FIELD: Record<Pillar, keyof PillarScores> = {
  commercial: 'commercial_score',
  financial: 'financial_score',
  retention: 'retention_score',
  marketing: 'marketing_score',
  operation: 'operation_score',
};

/** Peso numérico de cada severidade no priority_score (RULES_ENGINE.md secao 4). */
export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export interface PillarScoreInputs {
  commercial: CommercialKpis & {
    average_response_time_minutes: number | null;
    average_days_until_appointment: number | null;
  };
  financial: Pick<FinancialKpis, 'net_margin' | 'payroll_percentage'>;
}

/**
 * Score (0-100) do pilar Operação a partir de `average_days_until_appointment`
 * (RULES_ENGINE.md secao 3.5 / RULE-007), em faixas fixas:
 * <= 3 dias: 100; 4-7 dias: 80; 8-10 dias: 60; > 10 dias: 30.
 */
function operationScoreFromAvgDaysUntilAppointment(days: number | null): number | null {
  if (days === null) return null;
  if (days <= 3) return 100;
  if (days <= 7) return 80;
  if (days <= 10) return 60;
  return 30;
}

/**
 * Calcula os scores 0-100 por pilar a partir dos KPIs já computados,
 * conforme o mapeamento KPI -> pilar definido pelas regras de diagnóstico
 * (RULES_ENGINE.md secao 3). Cada score é a média dos scores de benchmark
 * dos KPIs mapeados para o pilar. `operation_score` usa um benchmark
 * dedicado em faixas fixas sobre `average_days_until_appointment`
 * (RULES_ENGINE.md secao 3.5).
 */
export function calculatePillarScores(inputs: PillarScoreInputs): PillarScores {
  const commercialScore = average([
    scoreFromBenchmark(inputs.commercial.attendance_rate, 'attendance_rate'),
    scoreFromBenchmark(inputs.commercial.average_response_time_minutes, 'average_response_time_minutes'),
  ]);

  const financialScore = average([
    scoreFromBenchmark(inputs.financial.net_margin, 'net_margin'),
    scoreFromBenchmark(inputs.financial.payroll_percentage, 'payroll_percentage'),
  ]);

  const retentionScore = average([
    scoreFromBenchmark(inputs.commercial.renewal_rate, 'renewal_rate'),
  ]);

  const marketingScore = average([
    scoreFromBenchmark(inputs.commercial.referral_rate, 'referral_rate'),
  ]);

  const operationScore = operationScoreFromAvgDaysUntilAppointment(
    inputs.commercial.average_days_until_appointment,
  );

  return {
    commercial_score: commercialScore === null ? null : roundTo(commercialScore, 2),
    financial_score: financialScore === null ? null : roundTo(financialScore, 2),
    retention_score: retentionScore === null ? null : roundTo(retentionScore, 2),
    marketing_score: marketingScore === null ? null : roundTo(marketingScore, 2),
    operation_score: operationScore,
  };
}

/**
 * Calcula o `general_score` (0-100) como média ponderada dos scores por
 * pilar (RULES_ENGINE.md secao 1.5). Pilares com score `null` são excluídos
 * e seu peso é redistribuído proporcionalmente entre os demais.
 */
export function calculateGeneralScore(pillarScores: PillarScores): number | null {
  const contributions = (Object.keys(PILLAR_WEIGHTS) as Pillar[])
    .map((pillar) => ({
      weight: PILLAR_WEIGHTS[pillar],
      score: pillarScores[PILLAR_SCORE_FIELD[pillar]],
    }))
    .filter((entry): entry is { weight: number; score: number } => entry.score !== null);

  if (contributions.length === 0) return null;

  const totalWeight = contributions.reduce((sum, entry) => sum + entry.weight, 0);
  const weightedSum = contributions.reduce((sum, entry) => sum + entry.weight * entry.score, 0);

  return roundTo(weightedSum / totalWeight, 2);
}

export type RuleOperator = '<' | '>';

export interface PriorityScoreInput {
  severity: Severity;
  pillar: Pillar;
  /** Valor atual do KPI que disparou a regra. */
  value: number;
  /** Threshold definido pela regra (RULES_ENGINE.md secao 3). */
  threshold: number;
  /** Operador da condição da regra (`metric < threshold` ou `metric > threshold`). */
  operator: RuleOperator;
}

/**
 * Calcula o `priority_score` (20-100) de um `diagnostic_finding`
 * (RULES_ENGINE.md secao 5).
 */
export function calculatePriorityScore(input: PriorityScoreInput): number {
  const severityWeight = SEVERITY_WEIGHTS[input.severity];
  const pillarWeight = PILLAR_WEIGHTS[input.pillar];
  const gapRatio = calculateGapRatio(input.value, input.threshold, input.operator);

  return Math.round(clamp(severityWeight * 10 + pillarWeight + gapRatio * 30, 0, 100));
}

function calculateGapRatio(value: number, threshold: number, operator: RuleOperator): number {
  if (threshold === 0) return 0;

  const ratio =
    operator === '<' ? (threshold - value) / threshold : (value - threshold) / threshold;

  return clamp(ratio, 0, 1);
}
