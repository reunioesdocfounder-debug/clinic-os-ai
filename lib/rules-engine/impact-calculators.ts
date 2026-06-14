// ============================================================================
// ClinicOS AI — Calculadoras de impacto (Tier 2) por regra
// Ref.: docs/RULES_ENGINE.md secao 3; docs/NO_AI_RULES_SYSTEM.md secao 1.5
// ============================================================================

import { roundTo } from '@/lib/kpis';
import type { ImpactCalculator, ImpactCalculatorKey } from './types';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

// RULE-001 — Alto índice de no-show
const attendanceRecovery: ImpactCalculator = (context, rule) => {
  const { commercialInput } = context;
  const additionalAttendances = Math.max(
    0,
    Math.ceil(commercialInput.scheduled_appointments * rule.threshold) - commercialInput.attended_appointments,
  );
  const potentialRevenue = additionalAttendances * commercialInput.average_ticket;

  return (
    `Elevar a taxa de comparecimento para 75% representaria aproximadamente ${additionalAttendances} ` +
    `atendimento(s) adicional(is) no período, equivalentes a ${formatCurrency(potentialRevenue)} em receita ` +
    'potencial com base no ticket médio.'
  );
};

// RULE-002 — Tempo de resposta acima do SLA
const responseTimeSla: ImpactCalculator = (_context, rule, value) => {
  const gapMinutes = roundTo(value - rule.threshold, 1);

  return (
    `O tempo médio de resposta está ${gapMinutes} minuto(s) acima do SLA recomendado de 15 minutos — ` +
    'leads respondidos mais rapidamente tendem a converter significativamente mais.'
  );
};

// RULE-003 — Margem líquida comprometida
const netMarginRecovery: ImpactCalculator = (context, rule) => {
  const { financialInput, financialKpis } = context;
  const targetNetProfit = financialInput.gross_revenue * rule.threshold;
  const profitGap = Math.max(0, targetNetProfit - financialKpis.net_profit);

  return (
    'Para atingir uma margem líquida de 10%, o lucro líquido precisaria aumentar em aproximadamente ' +
    `${formatCurrency(profitGap)} (mantendo a receita bruta atual).`
  );
};

// RULE-004 — Folha de pagamento elevada em relação ao faturamento
const payrollExcess: ImpactCalculator = (context) => {
  const { financialInput } = context;
  const targetPayroll = financialInput.gross_revenue * 0.35;
  const excess = Math.max(0, financialInput.payroll - targetPayroll);

  return (
    `A folha de pagamento está aproximadamente ${formatCurrency(excess)} acima do limite ` +
    'recomendado de 35% do faturamento bruto.'
  );
};

// RULE-005 — Baixa geração de indicações
const referralGrowth: ImpactCalculator = (context, rule) => {
  const { commercialInput } = context;
  const additionalReferrals = Math.max(
    0,
    Math.ceil(commercialInput.new_patients * rule.threshold) - commercialInput.referrals,
  );

  return (
    `Atingir 10% de indicações representaria aproximadamente ${additionalReferrals} indicação(ões) ` +
    'adicional(is) no período, fortalecendo o canal de aquisição orgânica.'
  );
};

// RULE-006 — Baixa taxa de renovação de pacientes elegíveis
const renewalGrowth: ImpactCalculator = (context, rule) => {
  const { commercialInput } = context;
  const additionalRenewals = Math.max(
    0,
    Math.ceil(commercialInput.eligible_renewals * rule.threshold) - commercialInput.renewals,
  );

  return (
    `Elevar a renovação para 60% representaria aproximadamente ${additionalRenewals} renovação(ões) ` +
    'adicional(is) entre os pacientes elegíveis.'
  );
};

export const IMPACT_CALCULATORS: Record<ImpactCalculatorKey, ImpactCalculator> = {
  attendanceRecovery,
  responseTimeSla,
  netMarginRecovery,
  payrollExcess,
  referralGrowth,
  renewalGrowth,
};
