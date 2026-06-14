// ============================================================================
// ClinicOS AI — Templates de planos de ação por regra
// Ref.: docs/RULES_ENGINE.md secao 6; docs/NO_AI_RULES_SYSTEM.md secao 2
// ============================================================================

import type { ActionPlanTemplate } from './types';

/**
 * Mapeamento regra -> plano de ação (docs/RULES_ENGINE.md secao 6), indexado
 * pelo `id` estável de RULE_DEFINITIONS (docs/NO_AI_RULES_SYSTEM.md secao 2.1).
 */
export const ACTION_PLAN_TEMPLATES: Record<string, ActionPlanTemplate> = {
  // RULE-001 — No-show
  'RULE-001': {
    ruleId: 'RULE-001',
    planTitle: 'Recuperação de No-show',
    description: 'Plano para reduzir o índice de no-show e recuperar agendamentos confirmados.',
    objective: 'Reduzir a taxa de no-show para acima de 75%.',
    expectedResult: 'attendance_rate ≥ 0.75 no próximo diagnóstico.',
    expectedKpi: 'attendance_rate',
    phases: [
      {
        title: 'Fase 1 — Diagnóstico',
        orderIndex: 1,
        tasks: [
          { title: 'Levantar motivos de não comparecimento' },
          { title: 'Analisar average_days_until_appointment' },
        ],
      },
      {
        title: 'Fase 2 — Processo',
        orderIndex: 2,
        tasks: [
          { title: 'Criar régua de confirmação (lembretes)' },
          { title: 'Definir SLA de contato pré-consulta' },
        ],
      },
      {
        title: 'Fase 3 — Tecnologia/Automação',
        orderIndex: 3,
        tasks: [
          { title: 'Implantar CRM de agendamento' },
          { title: 'Implantar automações de confirmação (WhatsApp/SMS)' },
        ],
      },
    ],
  },

  // RULE-002 — SLA de atendimento
  'RULE-002': {
    ruleId: 'RULE-002',
    planTitle: 'Aceleração do Atendimento Comercial',
    description: 'Plano para reduzir o tempo de resposta a leads e aumentar a conversão do funil comercial.',
    objective: 'Reduzir o tempo médio de resposta a leads para até 15 minutos.',
    expectedResult: 'average_response_time_minutes ≤ 15.',
    expectedKpi: 'average_response_time_minutes',
    phases: [
      {
        title: 'Fase 1 — Diagnóstico',
        orderIndex: 1,
        tasks: [
          { title: 'Mapear horários/canais com maior atraso de resposta' },
          { title: 'Levantar volume de leads por canal' },
        ],
      },
      {
        title: 'Fase 2 — Processo',
        orderIndex: 2,
        tasks: [
          { title: 'Definir SLA de primeira resposta por canal' },
          { title: 'Redistribuir escala da equipe comercial conforme pico de leads' },
        ],
      },
      {
        title: 'Fase 3 — Tecnologia/Automação',
        orderIndex: 3,
        tasks: [
          { title: 'Implantar respostas automáticas/chatbot inicial' },
          { title: 'Implantar alertas de SLA no CRM' },
        ],
      },
    ],
  },

  // RULE-003 — Baixa margem
  'RULE-003': {
    ruleId: 'RULE-003',
    planTitle: 'Recuperação de Margem',
    description: 'Plano para elevar a margem líquida e reduzir o risco à sustentabilidade financeira da clínica.',
    objective: 'Elevar a margem líquida para acima de 10%.',
    expectedResult: 'net_margin ≥ 0.10.',
    expectedKpi: 'net_margin',
    phases: [
      {
        title: 'Fase 1 — Diagnóstico',
        orderIndex: 1,
        tasks: [
          { title: 'Detalhar composição de custos e despesas (direct_costs, operational_expenses, other_expenses)' },
          { title: 'Identificar produtos/serviços com product_margin negativa' },
        ],
      },
      {
        title: 'Fase 2 — Processo',
        orderIndex: 2,
        tasks: [
          { title: 'Renegociar contratos com maiores custos diretos' },
          { title: 'Revisar política de preços/ticket médio' },
        ],
      },
      {
        title: 'Fase 3 — Tecnologia/Automação',
        orderIndex: 3,
        tasks: [
          { title: 'Implantar dashboard financeiro mensal' },
          { title: 'Implantar controle de custos por produto' },
        ],
      },
    ],
  },

  // RULE-004 — Folha alta
  'RULE-004': {
    ruleId: 'RULE-004',
    planTitle: 'Otimização da Estrutura de Equipe',
    description: 'Plano para reduzir o peso da folha de pagamento sobre o faturamento bruto.',
    objective: 'Reduzir payroll_percentage para 35% ou menos.',
    expectedResult: 'payroll_percentage ≤ 0.35.',
    expectedKpi: 'payroll_percentage',
    phases: [
      {
        title: 'Fase 1 — Diagnóstico',
        orderIndex: 1,
        tasks: [
          { title: 'Mapear clinic_team vs. volume de atendimentos/receita' },
          { title: 'Identificar funções com ociosidade' },
        ],
      },
      {
        title: 'Fase 2 — Processo',
        orderIndex: 2,
        tasks: [
          { title: 'Redefinir escalas e metas de produtividade por função' },
          { title: 'Avaliar política de comissionamento' },
        ],
      },
      {
        title: 'Fase 3 — Tecnologia/Automação',
        orderIndex: 3,
        tasks: [{ title: 'Implantar sistema de gestão de escalas/produtividade' }],
      },
    ],
  },

  // RULE-005 — Baixa indicação
  'RULE-005': {
    ruleId: 'RULE-005',
    planTitle: 'Programa de Indicação e Ativação',
    description: 'Plano para aumentar a geração de indicações e a ativação da base de pacientes.',
    objective: 'Elevar referral_rate para 10% ou mais.',
    expectedResult: 'referral_rate ≥ 0.10.',
    expectedKpi: 'referral_rate',
    phases: [
      {
        title: 'Fase 1 — Diagnóstico',
        orderIndex: 1,
        tasks: [
          { title: 'Avaliar NPS/satisfação dos pacientes ativos' },
          { title: 'Mapear pontos de contato pós-venda' },
        ],
      },
      {
        title: 'Fase 2 — Processo',
        orderIndex: 2,
        tasks: [
          { title: 'Criar programa formal de indicação (incentivos)' },
          { title: 'Definir régua de relacionamento pós-consulta' },
        ],
      },
      {
        title: 'Fase 3 — Tecnologia/Automação',
        orderIndex: 3,
        tasks: [
          { title: 'Implantar automação de pesquisa de satisfação' },
          { title: 'Implantar tracking de origem do paciente (indicação)' },
        ],
      },
    ],
  },

  // RULE-006 — Baixa renovação
  'RULE-006': {
    ruleId: 'RULE-006',
    planTitle: 'Programa de Retenção e Renovação',
    description: 'Plano para aumentar a taxa de renovação entre os pacientes elegíveis.',
    objective: 'Elevar renewal_rate para 60% ou mais.',
    expectedResult: 'renewal_rate ≥ 0.60.',
    expectedKpi: 'renewal_rate',
    phases: [
      {
        title: 'Fase 1 — Diagnóstico',
        orderIndex: 1,
        tasks: [
          { title: 'Levantar motivos de não renovação (saída de pacientes elegíveis)' },
          { title: 'Segmentar pacientes elegíveis por tempo desde a última compra' },
        ],
      },
      {
        title: 'Fase 2 — Processo',
        orderIndex: 2,
        tasks: [
          { title: 'Criar régua de renovação (pré-vencimento)' },
          { title: 'Definir oferta/condição padrão de renovação' },
        ],
      },
      {
        title: 'Fase 3 — Tecnologia/Automação',
        orderIndex: 3,
        tasks: [
          { title: 'Implantar automação de régua de renovação' },
          { title: 'Implantar alerta de pacientes elegíveis próximos do vencimento' },
        ],
      },
    ],
  },

  // RULE-007 — Agenda muito distante
  'RULE-007': {
    ruleId: 'RULE-007',
    planTitle: 'Reorganização da Agenda',
    description:
      'Plano para reduzir o tempo médio entre agendamento e consulta, mitigando o risco de esfriamento do ' +
      'lead, no-show e perda para concorrentes.',
    objective: 'Reduzir o tempo médio entre agendamento e consulta para até 10 dias.',
    expectedResult: 'average_days_until_appointment ≤ 10.',
    expectedKpi: 'average_days_until_appointment',
    phases: [
      {
        title: 'Fase 1 — Diagnóstico',
        orderIndex: 1,
        tasks: [
          { title: 'Medir tempo médio até a consulta por profissional' },
          { title: 'Identificar gargalos de agenda' },
        ],
      },
      {
        title: 'Fase 2 — Reorganização da Agenda',
        orderIndex: 2,
        tasks: [
          { title: 'Criar encaixes estratégicos' },
          { title: 'Criar lista de espera' },
        ],
      },
      {
        title: 'Fase 3 — Tecnologia/Automação',
        orderIndex: 3,
        tasks: [{ title: 'Automatizar confirmação e antecipação de consultas' }],
      },
    ],
  },
};
