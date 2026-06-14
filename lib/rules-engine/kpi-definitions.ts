// ============================================================================
// ClinicOS AI — Metadados de KPIs usados pelas regras de diagnóstico
// Ref.: docs/RULES_ENGINE.md secao 3; docs/NO_AI_RULES_SYSTEM.md secao 1.1
// ============================================================================

import type { MetricKey } from './types';

export interface KpiDefinition {
  key: MetricKey;
  label: string;
  unit: 'percentage' | 'minutes' | 'days';
  /** Casas decimais usadas ao registrar `evidence.value` (docs/RULES_ENGINE.md secao 3). */
  evidenceDecimals: number;
}

export const KPI_DEFINITIONS: Record<MetricKey, KpiDefinition> = {
  attendance_rate: {
    key: 'attendance_rate',
    label: 'Taxa de Comparecimento',
    unit: 'percentage',
    evidenceDecimals: 4,
  },
  average_response_time_minutes: {
    key: 'average_response_time_minutes',
    label: 'Tempo Médio de Resposta',
    unit: 'minutes',
    evidenceDecimals: 1,
  },
  net_margin: {
    key: 'net_margin',
    label: 'Margem Líquida',
    unit: 'percentage',
    evidenceDecimals: 4,
  },
  payroll_percentage: {
    key: 'payroll_percentage',
    label: 'Percentual de Folha sobre Faturamento',
    unit: 'percentage',
    evidenceDecimals: 4,
  },
  referral_rate: {
    key: 'referral_rate',
    label: 'Taxa de Indicação',
    unit: 'percentage',
    evidenceDecimals: 4,
  },
  renewal_rate: {
    key: 'renewal_rate',
    label: 'Taxa de Renovação',
    unit: 'percentage',
    evidenceDecimals: 4,
  },
  average_days_until_appointment: {
    key: 'average_days_until_appointment',
    label: 'Tempo Médio até a Consulta',
    unit: 'days',
    evidenceDecimals: 1,
  },
};
