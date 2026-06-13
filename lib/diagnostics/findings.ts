// ============================================================================
// ClinicOS AI — Motor de regras de diagnóstico
// Ref.: docs/RULES_ENGINE.md secoes 3, 5 e 6
// ============================================================================

import {
  calculatePriorityScore,
  roundTo,
  type CommercialKpis,
  type CommercialMetricsInput,
  type FinancialKpis,
  type FinancialMetricsInput,
} from '@/lib/kpis';
import type { Json, Pillar, Severity } from '@/lib/supabase/database.types';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export interface FindingDraft {
  pillar: Pillar;
  severity: Severity;
  title: string;
  description: string;
  evidence: Json;
  estimated_impact: string;
  priority_score: number;
}

export interface FindingsInput {
  commercialKpis: CommercialKpis;
  financialKpis: FinancialKpis;
  commercialInput: CommercialMetricsInput;
  financialInput: FinancialMetricsInput;
}

/**
 * Aplica as regras RULE-001 a RULE-006 (docs/RULES_ENGINE.md secao 3) e
 * retorna os achados (`diagnostic_findings`) gerados — sem `diagnostic_id`,
 * `id` ou `created_at`, que são responsabilidade de quem persiste o resultado.
 */
export function generateFindings(input: FindingsInput): FindingDraft[] {
  const { commercialKpis, financialKpis, commercialInput, financialInput } = input;
  const findings: FindingDraft[] = [];

  // RULE-001 — Alto índice de no-show (commercial / high)
  if (commercialKpis.attendance_rate !== null && commercialKpis.attendance_rate < 0.75) {
    const threshold = 0.75;
    const additionalAttendances = Math.max(
      0,
      Math.ceil(commercialInput.scheduled_appointments * threshold) - commercialInput.attended_appointments,
    );
    const potentialRevenue = additionalAttendances * commercialInput.average_ticket;

    findings.push({
      pillar: 'commercial',
      severity: 'high',
      title: 'Alto índice de no-show',
      description:
        'A taxa de comparecimento está abaixo de 75%, indicando perda relevante de agendamentos já confirmados.',
      evidence: {
        kpi: 'attendance_rate',
        value: roundTo(commercialKpis.attendance_rate, 4),
        threshold,
        operator: '<',
        unit: 'percentage',
      },
      estimated_impact:
        `Elevar a taxa de comparecimento para 75% representaria aproximadamente ${additionalAttendances} ` +
        `atendimento(s) adicional(is) no período, equivalentes a ${formatCurrency(potentialRevenue)} em receita ` +
        'potencial com base no ticket médio.',
      priority_score: calculatePriorityScore({
        severity: 'high',
        pillar: 'commercial',
        value: commercialKpis.attendance_rate,
        threshold,
        operator: '<',
      }),
    });
  }

  // RULE-002 — Tempo de resposta acima do SLA (commercial / high)
  if (commercialInput.average_response_time_minutes > 15) {
    const threshold = 15;
    const gapMinutes = roundTo(commercialInput.average_response_time_minutes - threshold, 1);

    findings.push({
      pillar: 'commercial',
      severity: 'high',
      title: 'Tempo de resposta acima do SLA',
      description:
        'O tempo médio de resposta a leads é superior a 15 minutos, reduzindo a taxa de conversão do funil comercial.',
      evidence: {
        kpi: 'average_response_time_minutes',
        value: roundTo(commercialInput.average_response_time_minutes, 1),
        threshold,
        operator: '>',
        unit: 'minutes',
      },
      estimated_impact:
        `O tempo médio de resposta está ${gapMinutes} minuto(s) acima do SLA recomendado de 15 minutos — ` +
        'leads respondidos mais rapidamente tendem a converter significativamente mais.',
      priority_score: calculatePriorityScore({
        severity: 'high',
        pillar: 'commercial',
        value: commercialInput.average_response_time_minutes,
        threshold,
        operator: '>',
      }),
    });
  }

  // RULE-003 — Margem líquida comprometida (financial / critical)
  if (financialKpis.net_margin !== null && financialKpis.net_margin < 0.1) {
    const threshold = 0.1;
    const targetNetProfit = financialInput.gross_revenue * threshold;
    const profitGap = Math.max(0, targetNetProfit - financialKpis.net_profit);

    findings.push({
      pillar: 'financial',
      severity: 'critical',
      title: 'Margem líquida comprometida',
      description:
        'A margem líquida está abaixo de 10%, indicando risco à sustentabilidade financeira da clínica.',
      evidence: {
        kpi: 'net_margin',
        value: roundTo(financialKpis.net_margin, 4),
        threshold,
        operator: '<',
        unit: 'percentage',
      },
      estimated_impact:
        `Para atingir uma margem líquida de 10%, o lucro líquido precisaria aumentar em aproximadamente ` +
        `${formatCurrency(profitGap)} (mantendo a receita bruta atual).`,
      priority_score: calculatePriorityScore({
        severity: 'critical',
        pillar: 'financial',
        value: financialKpis.net_margin,
        threshold,
        operator: '<',
      }),
    });
  }

  // RULE-004 — Folha de pagamento elevada em relação ao faturamento (financial / medium)
  if (financialKpis.payroll_percentage !== null && financialKpis.payroll_percentage > 0.4) {
    const threshold = 0.4;
    const targetPayroll = financialInput.gross_revenue * 0.35;
    const payrollExcess = Math.max(0, financialInput.payroll - targetPayroll);

    findings.push({
      pillar: 'financial',
      severity: 'medium',
      title: 'Folha de pagamento elevada em relação ao faturamento',
      description:
        'A folha salarial consome mais de 40% do faturamento bruto, o que pode indicar estrutura de equipe ' +
        'desproporcional ao volume de receita.',
      evidence: {
        kpi: 'payroll_percentage',
        value: roundTo(financialKpis.payroll_percentage, 4),
        threshold,
        operator: '>',
        unit: 'percentage',
      },
      estimated_impact:
        `A folha de pagamento está aproximadamente ${formatCurrency(payrollExcess)} acima do limite ` +
        'recomendado de 35% do faturamento bruto.',
      priority_score: calculatePriorityScore({
        severity: 'medium',
        pillar: 'financial',
        value: financialKpis.payroll_percentage,
        threshold,
        operator: '>',
      }),
    });
  }

  // RULE-005 — Baixa geração de indicações (marketing / medium)
  if (commercialKpis.referral_rate !== null && commercialKpis.referral_rate < 0.1) {
    const threshold = 0.1;
    const additionalReferrals = Math.max(
      0,
      Math.ceil(commercialInput.new_patients * threshold) - commercialInput.referrals,
    );

    findings.push({
      pillar: 'marketing',
      severity: 'medium',
      title: 'Baixa geração de indicações',
      description:
        'Menos de 10% dos novos pacientes vieram por indicação, sugerindo baixa satisfação ou baixa ativação ' +
        'da base de pacientes.',
      evidence: {
        kpi: 'referral_rate',
        value: roundTo(commercialKpis.referral_rate, 4),
        threshold,
        operator: '<',
        unit: 'percentage',
      },
      estimated_impact:
        `Atingir 10% de indicações representaria aproximadamente ${additionalReferrals} indicação(ões) ` +
        'adicional(is) no período, fortalecendo o canal de aquisição orgânica.',
      priority_score: calculatePriorityScore({
        severity: 'medium',
        pillar: 'marketing',
        value: commercialKpis.referral_rate,
        threshold,
        operator: '<',
      }),
    });
  }

  // RULE-006 — Baixa taxa de renovação de pacientes elegíveis (retention / medium)
  if (commercialKpis.renewal_rate !== null && commercialKpis.renewal_rate < 0.6) {
    const threshold = 0.6;
    const additionalRenewals = Math.max(
      0,
      Math.ceil(commercialInput.eligible_renewals * threshold) - commercialInput.renewals,
    );

    findings.push({
      pillar: 'retention',
      severity: 'medium',
      title: 'Baixa taxa de renovação de pacientes elegíveis',
      description:
        'Menos de 60% dos pacientes elegíveis estão renovando pacotes/tratamentos, sinalizando oportunidade ' +
        'de melhoria em retenção.',
      evidence: {
        kpi: 'renewal_rate',
        value: roundTo(commercialKpis.renewal_rate, 4),
        threshold,
        operator: '<',
        unit: 'percentage',
      },
      estimated_impact:
        `Elevar a renovação para 60% representaria aproximadamente ${additionalRenewals} renovação(ões) ` +
        'adicional(is) entre os pacientes elegíveis.',
      priority_score: calculatePriorityScore({
        severity: 'medium',
        pillar: 'retention',
        value: commercialKpis.renewal_rate,
        threshold,
        operator: '<',
      }),
    });
  }

  return findings;
}
