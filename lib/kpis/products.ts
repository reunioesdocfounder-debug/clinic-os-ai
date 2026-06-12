// ============================================================================
// ClinicOS AI — KPIs de Produto
// Ref.: docs/RULES_ENGINE.md secao 1.3
// ============================================================================

import type { ProductKpis, ProductMetricsInput, RankedProductKpis } from './types';
import { safeDivide } from './utils';

export function calculateProductKpis(input: ProductMetricsInput): ProductKpis {
  const product_revenue = input.quantity_sold * input.average_price;
  const product_total_cost =
    input.quantity_sold * (input.direct_cost_per_unit + input.commission_per_unit);
  const product_gross_profit = product_revenue - product_total_cost;

  return {
    product_id: input.product_id,
    product_revenue,
    product_total_cost,
    product_gross_profit,
    product_margin: safeDivide(product_gross_profit, product_revenue),
    total_team_time_minutes: input.quantity_sold * input.team_time_minutes_per_unit,
  };
}

/**
 * Calcula os KPIs de cada produto e atribui um `ranking` (1 = maior lucro
 * bruto) com base em `product_gross_profit`, conforme RULES_ENGINE.md
 * secao 1.3.
 */
export function rankProducts(inputs: ProductMetricsInput[]): RankedProductKpis[] {
  return inputs
    .map(calculateProductKpis)
    .sort((a, b) => b.product_gross_profit - a.product_gross_profit)
    .map((kpis, index) => ({ ...kpis, ranking: index + 1 }));
}
