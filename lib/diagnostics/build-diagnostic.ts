// ============================================================================
// ClinicOS AI — Motor de diagnóstico consolidado
// Ref.: docs/RULES_ENGINE.md secoes 1.1 a 1.6
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  calculateCommercialKpis,
  calculateFinancialKpis,
  calculateGeneralScore,
  calculatePillarScores,
  rankProducts,
  type CommercialKpis,
  type CommercialMetricsInput,
  type FinancialKpis,
  type FinancialMetricsInput,
  type PillarScores,
  type ProductMetricsInput,
  type RankedProductKpis,
} from '@/lib/kpis';
import type { Database } from '@/lib/supabase/database.types';
import { generateFindings, type FindingDraft } from './findings';
import { buildExecutiveSummary } from './summary';

export interface BuiltDiagnostic {
  commercialKpis: CommercialKpis;
  financialKpis: FinancialKpis;
  productRanking: RankedProductKpis[];
  pillarScores: PillarScores;
  generalScore: number | null;
  findings: FindingDraft[];
  executiveSummary: string;
}

/**
 * Carrega as métricas comerciais, financeiras e de produtos de um
 * diagnóstico, calcula os KPIs e scores (docs/RULES_ENGINE.md secoes 1.1 a
 * 1.5), gera os achados via motor de regras e o resumo executivo.
 */
export async function buildDiagnostic(
  supabase: SupabaseClient<Database>,
  diagnosticId: string,
): Promise<BuiltDiagnostic> {
  const [{ data: commercialRow }, { data: financialRow }, { data: productRows }] = await Promise.all([
    supabase.from('commercial_metrics').select('*').eq('diagnostic_id', diagnosticId).maybeSingle(),
    supabase.from('financial_metrics').select('*').eq('diagnostic_id', diagnosticId).maybeSingle(),
    supabase.from('product_metrics').select('*').eq('diagnostic_id', diagnosticId),
  ]);

  const commercialInput: CommercialMetricsInput = {
    leads: Number(commercialRow?.leads ?? 0),
    contacted_leads: Number(commercialRow?.contacted_leads ?? 0),
    scheduled_appointments: Number(commercialRow?.scheduled_appointments ?? 0),
    attended_appointments: Number(commercialRow?.attended_appointments ?? 0),
    sales: Number(commercialRow?.sales ?? 0),
    renewals: Number(commercialRow?.renewals ?? 0),
    eligible_renewals: Number(commercialRow?.eligible_renewals ?? 0),
    referrals: Number(commercialRow?.referrals ?? 0),
    new_patients: Number(commercialRow?.new_patients ?? 0),
    average_ticket: Number(commercialRow?.average_ticket ?? 0),
    average_response_time_minutes: Number(commercialRow?.average_response_time_minutes ?? 0),
    average_days_until_appointment: Number(commercialRow?.average_days_until_appointment ?? 0),
  };

  const financialInput: FinancialMetricsInput = {
    gross_revenue: Number(financialRow?.gross_revenue ?? 0),
    taxes: Number(financialRow?.taxes ?? 0),
    direct_costs: Number(financialRow?.direct_costs ?? 0),
    payroll: Number(financialRow?.payroll ?? 0),
    marketing_expenses: Number(financialRow?.marketing_expenses ?? 0),
    commissions: Number(financialRow?.commissions ?? 0),
    operational_expenses: Number(financialRow?.operational_expenses ?? 0),
    financial_expenses: Number(financialRow?.financial_expenses ?? 0),
    other_expenses: Number(financialRow?.other_expenses ?? 0),
  };

  const productInputs: ProductMetricsInput[] = (productRows ?? []).map((row) => ({
    product_id: row.product_id,
    quantity_sold: Number(row.quantity_sold ?? 0),
    average_price: Number(row.average_price ?? 0),
    direct_cost_per_unit: Number(row.direct_cost_per_unit ?? 0),
    commission_per_unit: Number(row.commission_per_unit ?? 0),
    team_time_minutes_per_unit: Number(row.team_time_minutes_per_unit ?? 0),
  }));

  const commercialKpis = calculateCommercialKpis(commercialInput);
  const financialKpis = calculateFinancialKpis(financialInput);
  const productRanking = rankProducts(productInputs);

  const pillarScores = calculatePillarScores({
    commercial: {
      ...commercialKpis,
      average_response_time_minutes: commercialInput.average_response_time_minutes,
      average_days_until_appointment: commercialInput.average_days_until_appointment,
    },
    financial: {
      net_margin: financialKpis.net_margin,
      payroll_percentage: financialKpis.payroll_percentage,
    },
  });

  const generalScore = calculateGeneralScore(pillarScores);

  const findings = generateFindings({
    commercialKpis,
    financialKpis,
    commercialInput,
    financialInput,
  });

  const executiveSummary = buildExecutiveSummary({ generalScore, pillarScores, findings });

  return {
    commercialKpis,
    financialKpis,
    productRanking,
    pillarScores,
    generalScore,
    findings,
    executiveSummary,
  };
}
