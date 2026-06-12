// ============================================================================
// ClinicOS AI — Benchmarks e score (0-100) por KPI
// Ref.: docs/RULES_ENGINE.md secao 2
//
// Cada KPI possui uma lista de pontos de ancoragem (valor do KPI -> score
// 0-100), ordenados por `value` ascendente. `scoreFromBenchmark` interpola
// linearmente entre os pontos e satura (clamp) fora dos extremos.
// Apenas KPIs em formato de taxa/percentual/tempo possuem benchmark — KPIs
// em valores absolutos (R$) variam com o porte da clínica.
// ============================================================================

import { clamp } from './utils';

export type BenchmarkDirection = 'up' | 'down';

export type KpiStatus = 'critico' | 'atencao' | 'bom' | 'excelente';

export type BenchmarkKpiKey =
  | 'contact_rate'
  | 'scheduling_rate'
  | 'attendance_rate'
  | 'conversion_rate'
  | 'renewal_rate'
  | 'referral_rate'
  | 'average_response_time_minutes'
  | 'average_days_until_appointment'
  | 'gross_margin'
  | 'net_margin'
  | 'payroll_percentage'
  | 'marketing_percentage'
  | 'product_margin';

interface BenchmarkPoint {
  /** Valor do KPI (ratio 0-1 para percentuais, ou minutos/dias para KPIs de tempo). */
  value: number;
  /** Score correspondente, de 0 a 100. */
  score: number;
}

export interface KpiBenchmark {
  /** `up`: valores maiores são melhores. `down`: valores menores são melhores. */
  direction: BenchmarkDirection;
  /** Pontos de ancoragem ordenados por `value` ascendente. */
  points: readonly BenchmarkPoint[];
}

export const KPI_BENCHMARKS: Record<BenchmarkKpiKey, KpiBenchmark> = {
  contact_rate: {
    direction: 'up',
    points: [
      { value: 0, score: 0 },
      { value: 0.5, score: 40 },
      { value: 0.7, score: 60 },
      { value: 0.9, score: 80 },
      { value: 1, score: 100 },
    ],
  },
  scheduling_rate: {
    direction: 'up',
    points: [
      { value: 0, score: 0 },
      { value: 0.3, score: 40 },
      { value: 0.5, score: 60 },
      { value: 0.7, score: 80 },
      { value: 1, score: 100 },
    ],
  },
  // PRD Regra 001: attendance_rate < 75% -> "Alto no-show"
  attendance_rate: {
    direction: 'up',
    points: [
      { value: 0, score: 0 },
      { value: 0.6, score: 40 },
      { value: 0.75, score: 60 },
      { value: 0.9, score: 80 },
      { value: 1, score: 100 },
    ],
  },
  conversion_rate: {
    direction: 'up',
    points: [
      { value: 0, score: 0 },
      { value: 0.2, score: 40 },
      { value: 0.35, score: 60 },
      { value: 0.5, score: 80 },
      { value: 1, score: 100 },
    ],
  },
  renewal_rate: {
    direction: 'up',
    points: [
      { value: 0, score: 0 },
      { value: 0.4, score: 40 },
      { value: 0.6, score: 60 },
      { value: 0.8, score: 80 },
      { value: 1, score: 100 },
    ],
  },
  // PRD Regra 005: referral_rate < 10% -> "Baixa satisfação/ativação da base"
  referral_rate: {
    direction: 'up',
    points: [
      { value: 0, score: 0 },
      { value: 0.05, score: 40 },
      { value: 0.1, score: 60 },
      { value: 0.2, score: 80 },
      { value: 1, score: 100 },
    ],
  },
  // PRD Regra 002: average_response_time_minutes > 15 -> "SLA crítico"
  average_response_time_minutes: {
    direction: 'down',
    points: [
      { value: 0, score: 100 },
      { value: 5, score: 80 },
      { value: 10, score: 60 },
      { value: 15, score: 40 },
      { value: 30, score: 0 },
    ],
  },
  average_days_until_appointment: {
    direction: 'down',
    points: [
      { value: 0, score: 100 },
      { value: 2, score: 80 },
      { value: 4, score: 60 },
      { value: 7, score: 40 },
      { value: 14, score: 0 },
    ],
  },
  gross_margin: {
    direction: 'up',
    points: [
      { value: 0, score: 0 },
      { value: 0.3, score: 40 },
      { value: 0.5, score: 60 },
      { value: 0.7, score: 80 },
      { value: 1, score: 100 },
    ],
  },
  // PRD Regra 003: net_margin < 10% -> "Rentabilidade comprometida"
  net_margin: {
    direction: 'up',
    points: [
      { value: 0, score: 0 },
      { value: 0.1, score: 40 },
      { value: 0.15, score: 60 },
      { value: 0.25, score: 80 },
      { value: 1, score: 100 },
    ],
  },
  // PRD Regra 004: payroll_percentage > 40% -> "Estrutura possivelmente inchada"
  payroll_percentage: {
    direction: 'down',
    points: [
      { value: 0, score: 100 },
      { value: 0.25, score: 80 },
      { value: 0.35, score: 60 },
      { value: 0.45, score: 40 },
      { value: 0.9, score: 0 },
    ],
  },
  marketing_percentage: {
    direction: 'down',
    points: [
      { value: 0, score: 100 },
      { value: 0.08, score: 80 },
      { value: 0.15, score: 60 },
      { value: 0.2, score: 40 },
      { value: 0.4, score: 0 },
    ],
  },
  product_margin: {
    direction: 'up',
    points: [
      { value: 0, score: 0 },
      { value: 0.3, score: 40 },
      { value: 0.5, score: 60 },
      { value: 0.7, score: 80 },
      { value: 1, score: 100 },
    ],
  },
};

/**
 * Converte o valor de um KPI em um score de 0-100 via interpolação linear
 * entre os pontos de ancoragem do benchmark (docs/RULES_ENGINE.md secao 2.4).
 * Retorna `null` se o KPI não pôde ser calculado (`value === null`).
 */
export function scoreFromBenchmark(value: number | null, kpi: BenchmarkKpiKey): number | null {
  if (value === null) return null;

  const { points } = KPI_BENCHMARKS[kpi];
  const first = points[0];
  const last = points[points.length - 1];

  if (value <= first.value) return first.score;
  if (value >= last.value) return last.score;

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];

    if (value >= start.value && value <= end.value) {
      const ratio = (value - start.value) / (end.value - start.value);
      return clamp(start.score + ratio * (end.score - start.score), 0, 100);
    }
  }

  return last.score;
}

/** Classifica um score 0-100 conforme docs/RULES_ENGINE.md secao 1.6. */
export function getKpiStatus(score: number | null): KpiStatus | null {
  if (score === null) return null;
  if (score < 40) return 'critico';
  if (score < 60) return 'atencao';
  if (score < 80) return 'bom';
  return 'excelente';
}
