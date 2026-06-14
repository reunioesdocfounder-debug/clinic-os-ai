// ============================================================================
// ClinicOS AI — Regras de diagnóstico declarativas
// Ref.: docs/RULES_ENGINE.md secao 3; docs/NO_AI_RULES_SYSTEM.md secao 1.3
// ============================================================================

import type { RuleDefinition } from './types';

export const RULE_DEFINITIONS: RuleDefinition[] = [
  // RULE-001 — Alto índice de no-show (commercial / high)
  {
    id: 'RULE-001',
    pillar: 'commercial',
    severity: 'high',
    metric: 'attendance_rate',
    operator: '<',
    threshold: 0.75,
    title: 'Alto índice de no-show',
    description:
      'A taxa de comparecimento está abaixo de 75%, indicando perda relevante de agendamentos já confirmados.',
    impactCalculator: 'attendanceRecovery',
  },

  // RULE-002 — Tempo de resposta acima do SLA (commercial / high)
  {
    id: 'RULE-002',
    pillar: 'commercial',
    severity: 'high',
    metric: 'average_response_time_minutes',
    operator: '>',
    threshold: 15,
    title: 'Tempo de resposta acima do SLA',
    description:
      'O tempo médio de resposta a leads é superior a 15 minutos, reduzindo a taxa de conversão do funil comercial.',
    impactCalculator: 'responseTimeSla',
  },

  // RULE-003 — Margem líquida comprometida (financial / critical)
  {
    id: 'RULE-003',
    pillar: 'financial',
    severity: 'critical',
    metric: 'net_margin',
    operator: '<',
    threshold: 0.1,
    title: 'Margem líquida comprometida',
    description:
      'A margem líquida está abaixo de 10%, indicando risco à sustentabilidade financeira da clínica.',
    impactCalculator: 'netMarginRecovery',
  },

  // RULE-004 — Folha de pagamento elevada em relação ao faturamento (financial / medium)
  {
    id: 'RULE-004',
    pillar: 'financial',
    severity: 'medium',
    metric: 'payroll_percentage',
    operator: '>',
    threshold: 0.4,
    title: 'Folha de pagamento elevada em relação ao faturamento',
    description:
      'A folha salarial consome mais de 40% do faturamento bruto, o que pode indicar estrutura de equipe ' +
      'desproporcional ao volume de receita.',
    impactCalculator: 'payrollExcess',
  },

  // RULE-005 — Baixa geração de indicações (marketing / medium)
  {
    id: 'RULE-005',
    pillar: 'marketing',
    severity: 'medium',
    metric: 'referral_rate',
    operator: '<',
    threshold: 0.1,
    title: 'Baixa geração de indicações',
    description:
      'Menos de 10% dos novos pacientes vieram por indicação, sugerindo baixa satisfação ou baixa ativação ' +
      'da base de pacientes.',
    impactCalculator: 'referralGrowth',
  },

  // RULE-006 — Baixa taxa de renovação de pacientes elegíveis (retention / medium)
  {
    id: 'RULE-006',
    pillar: 'retention',
    severity: 'medium',
    metric: 'renewal_rate',
    operator: '<',
    threshold: 0.6,
    title: 'Baixa taxa de renovação de pacientes elegíveis',
    description:
      'Menos de 60% dos pacientes elegíveis estão renovando pacotes/tratamentos, sinalizando oportunidade ' +
      'de melhoria em retenção.',
    impactCalculator: 'renewalGrowth',
  },
];
