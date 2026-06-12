// ============================================================================
// ClinicOS AI — KPIs Financeiros
// Ref.: docs/RULES_ENGINE.md secao 1.2
// ============================================================================

import type { FinancialKpis, FinancialMetricsInput } from './types';
import { safeDivide } from './utils';

export function calculateFinancialKpis(input: FinancialMetricsInput): FinancialKpis {
  const net_revenue = input.gross_revenue - input.taxes;

  // direct_costs = custos de entrega do serviço (repasse médico,
  // nutricionista, insumos, exames, materiais). Comissões NUNCA entram
  // aqui — ver FinancialMetricsInput.direct_costs.
  const gross_profit = net_revenue - input.direct_costs;

  // "Despesas operacionais totais" = payroll + marketing_expenses +
  // commissions (comissões comerciais, fora de direct_costs) +
  // operational_expenses (não categorizadas) + other_expenses.
  const totalOperatingExpenses =
    input.payroll +
    input.marketing_expenses +
    input.commissions +
    input.operational_expenses +
    input.other_expenses;

  const ebitda = gross_profit - totalOperatingExpenses;
  const net_profit = ebitda - input.financial_expenses;

  return {
    net_revenue,
    gross_profit,
    ebitda,
    net_profit,
    gross_margin: safeDivide(gross_profit, input.gross_revenue),
    net_margin: safeDivide(net_profit, input.gross_revenue),
    payroll_percentage: safeDivide(input.payroll, input.gross_revenue),
    marketing_percentage: safeDivide(input.marketing_expenses, input.gross_revenue),
  };
}
