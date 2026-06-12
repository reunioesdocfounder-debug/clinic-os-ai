// ============================================================================
// ClinicOS AI — Funções utilitárias da camada de KPIs
// ============================================================================

/**
 * Divide numerator/denominator, retornando `null` quando o denominador é 0
 * (ou o resultado não é finito), em vez de `Infinity`/`NaN`.
 */
export function safeDivide(numerator: number, denominator: number): number | null {
  if (!denominator) return null;

  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Média aritmética ignorando valores `null` (KPIs não calculáveis por falta
 * de dados). Retorna `null` se todos os valores forem `null`.
 */
export function average(values: Array<number | null>): number | null {
  const valid = values.filter((value): value is number => value !== null);
  if (valid.length === 0) return null;

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}
