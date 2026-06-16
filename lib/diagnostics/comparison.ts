// ============================================================================
// ClinicOS AI — Comparação entre dois diagnósticos da mesma clínica
// ============================================================================

import { calculateCommercialKpis } from '@/lib/kpis/commercial';
import { calculateFinancialKpis } from '@/lib/kpis/financial';
import type { Tables } from '@/lib/supabase/database.types';

// Snapshot de um diagnóstico com todos os valores já calculados
export interface DiagnosticSnapshot {
  diagnostic_id: string;
  period_month: number;
  period_year: number;
  // Financeiro
  gross_revenue: number | null;
  net_profit: number | null;
  net_margin: number | null;
  // Comercial
  attendance_rate: number | null;
  conversion_rate: number | null;
  renewal_rate: number | null;
  // Scores
  general_score: number | null;
  commercial_score: number | null;
  financial_score: number | null;
  retention_score: number | null;
  marketing_score: number | null;
  operation_score: number | null;
}

export interface MetricDiff {
  current: number | null;
  previous: number | null;
  /** Diferença absoluta: current − previous. */
  delta: number | null;
  /** Variação percentual: (delta / |previous|) × 100. */
  pct_change: number | null;
}

export interface ComparisonDiffs {
  gross_revenue: MetricDiff;
  net_profit: MetricDiff;
  net_margin: MetricDiff;
  attendance_rate: MetricDiff;
  conversion_rate: MetricDiff;
  renewal_rate: MetricDiff;
  general_score: MetricDiff;
  commercial_score: MetricDiff;
  financial_score: MetricDiff;
  retention_score: MetricDiff;
  marketing_score: MetricDiff;
  operation_score: MetricDiff;
}

export interface DiagnosticComparison {
  current: DiagnosticSnapshot;
  previous: DiagnosticSnapshot;
  diffs: ComparisonDiffs;
}

function computeDiff(current: number | null, previous: number | null): MetricDiff {
  if (current === null || previous === null) {
    return { current, previous, delta: null, pct_change: null };
  }
  const delta = current - previous;
  const pct_change = previous !== 0 ? (delta / Math.abs(previous)) * 100 : null;
  return { current, previous, delta, pct_change };
}

/**
 * Constrói um `DiagnosticSnapshot` a partir das linhas brutas do banco,
 * derivando os KPIs financeiros e comerciais sob demanda.
 * Replica o padrão de conversão `Number(row?.field ?? 0)` de build-diagnostic.ts.
 */
export function buildSnapshot(
  diagnostic: Tables<'diagnostics'>,
  financial: Tables<'financial_metrics'> | null,
  commercial: Tables<'commercial_metrics'> | null,
): DiagnosticSnapshot {
  let gross_revenue: number | null = null;
  let net_profit: number | null = null;
  let net_margin: number | null = null;

  if (financial) {
    const grossRev = Number(financial.gross_revenue ?? 0);
    const fin = calculateFinancialKpis({
      gross_revenue: grossRev,
      taxes: Number(financial.taxes ?? 0),
      direct_costs: Number(financial.direct_costs ?? 0),
      payroll: Number(financial.payroll ?? 0),
      marketing_expenses: Number(financial.marketing_expenses ?? 0),
      commissions: Number(financial.commissions ?? 0),
      operational_expenses: Number(financial.operational_expenses ?? 0),
      financial_expenses: Number(financial.financial_expenses ?? 0),
      other_expenses: Number(financial.other_expenses ?? 0),
    });
    gross_revenue = financial.gross_revenue !== null ? grossRev : null;
    net_profit = fin.net_profit;
    net_margin = fin.net_margin;
  }

  let attendance_rate: number | null = null;
  let conversion_rate: number | null = null;
  let renewal_rate: number | null = null;

  if (commercial) {
    const com = calculateCommercialKpis({
      leads: Number(commercial.leads ?? 0),
      contacted_leads: Number(commercial.contacted_leads ?? 0),
      scheduled_appointments: Number(commercial.scheduled_appointments ?? 0),
      attended_appointments: Number(commercial.attended_appointments ?? 0),
      sales: Number(commercial.sales ?? 0),
      renewals: Number(commercial.renewals ?? 0),
      eligible_renewals: Number(commercial.eligible_renewals ?? 0),
      referrals: Number(commercial.referrals ?? 0),
      new_patients: Number(commercial.new_patients ?? 0),
      average_ticket: Number(commercial.average_ticket ?? 0),
      average_response_time_minutes: Number(commercial.average_response_time_minutes ?? 0),
      average_days_until_appointment: Number(commercial.average_days_until_appointment ?? 0),
    });
    attendance_rate = com.attendance_rate;
    conversion_rate = com.conversion_rate;
    renewal_rate = com.renewal_rate;
  }

  return {
    diagnostic_id: diagnostic.id,
    period_month: diagnostic.period_month,
    period_year: diagnostic.period_year,
    gross_revenue,
    net_profit,
    net_margin,
    attendance_rate,
    conversion_rate,
    renewal_rate,
    general_score: diagnostic.general_score,
    commercial_score: diagnostic.commercial_score,
    financial_score: diagnostic.financial_score,
    retention_score: diagnostic.retention_score,
    marketing_score: diagnostic.marketing_score,
    operation_score: diagnostic.operation_score,
  };
}

/**
 * Calcula as diferenças entre o diagnóstico atual e o anterior.
 * Em todas as métricas aqui comparadas, valores maiores são melhores.
 */
export function buildComparison(
  current: DiagnosticSnapshot,
  previous: DiagnosticSnapshot,
): DiagnosticComparison {
  return {
    current,
    previous,
    diffs: {
      gross_revenue: computeDiff(current.gross_revenue, previous.gross_revenue),
      net_profit: computeDiff(current.net_profit, previous.net_profit),
      net_margin: computeDiff(current.net_margin, previous.net_margin),
      attendance_rate: computeDiff(current.attendance_rate, previous.attendance_rate),
      conversion_rate: computeDiff(current.conversion_rate, previous.conversion_rate),
      renewal_rate: computeDiff(current.renewal_rate, previous.renewal_rate),
      general_score: computeDiff(current.general_score, previous.general_score),
      commercial_score: computeDiff(current.commercial_score, previous.commercial_score),
      financial_score: computeDiff(current.financial_score, previous.financial_score),
      retention_score: computeDiff(current.retention_score, previous.retention_score),
      marketing_score: computeDiff(current.marketing_score, previous.marketing_score),
      operation_score: computeDiff(current.operation_score, previous.operation_score),
    },
  };
}
