// ============================================================================
// ClinicOS AI — Geração de planos de ação a partir de diagnostic_findings
// Ref.: docs/RULES_ENGINE.md secao 6
// ============================================================================

import type { Severity, TaskPriority } from '@/lib/supabase/database.types';

export interface ActionPlanTaskDraft {
  title: string;
  priority: TaskPriority;
  expected_kpi: string;
}

export interface ActionPlanPhaseDraft {
  title: string;
  order_index: number;
  tasks: ActionPlanTaskDraft[];
}

export interface ActionPlanDraft {
  title: string;
  description: string;
  objective: string;
  expected_result: string;
  phases: ActionPlanPhaseDraft[];
}

export interface FindingForActionPlan {
  title: string;
  severity: Severity;
}

const SEVERITY_TO_TASK_PRIORITY: Record<Severity, TaskPriority> = {
  critical: 'urgent',
  high: 'high',
  medium: 'medium',
  low: 'low',
};

interface ActionPlanTemplate {
  planTitle: string;
  description: string;
  objective: string;
  expectedResult: string;
  expectedKpi: string;
  phase1Tasks: string[];
  phase2Tasks: string[];
  phase3Tasks: string[];
}

/**
 * Mapeamento gargalo → plano de ação (docs/RULES_ENGINE.md secao 6), indexado
 * pelo `title` exato gerado por lib/diagnostics/findings.ts para cada regra.
 */
const ACTION_PLAN_TEMPLATES: Record<string, ActionPlanTemplate> = {
  // RULE-001 — No-show
  'Alto índice de no-show': {
    planTitle: 'Recuperação de No-show',
    description: 'Plano para reduzir o índice de no-show e recuperar agendamentos confirmados.',
    objective: 'Reduzir a taxa de no-show para acima de 75%.',
    expectedResult: 'attendance_rate ≥ 0.75 no próximo diagnóstico.',
    expectedKpi: 'attendance_rate',
    phase1Tasks: ['Levantar motivos de não comparecimento', 'Analisar average_days_until_appointment'],
    phase2Tasks: ['Criar régua de confirmação (lembretes)', 'Definir SLA de contato pré-consulta'],
    phase3Tasks: ['Implantar CRM de agendamento', 'Implantar automações de confirmação (WhatsApp/SMS)'],
  },

  // RULE-002 — SLA de atendimento
  'Tempo de resposta acima do SLA': {
    planTitle: 'Aceleração do Atendimento Comercial',
    description: 'Plano para reduzir o tempo de resposta a leads e aumentar a conversão do funil comercial.',
    objective: 'Reduzir o tempo médio de resposta a leads para até 15 minutos.',
    expectedResult: 'average_response_time_minutes ≤ 15.',
    expectedKpi: 'average_response_time_minutes',
    phase1Tasks: [
      'Mapear horários/canais com maior atraso de resposta',
      'Levantar volume de leads por canal',
    ],
    phase2Tasks: [
      'Definir SLA de primeira resposta por canal',
      'Redistribuir escala da equipe comercial conforme pico de leads',
    ],
    phase3Tasks: [
      'Implantar respostas automáticas/chatbot inicial',
      'Implantar alertas de SLA no CRM',
    ],
  },

  // RULE-003 — Baixa margem
  'Margem líquida comprometida': {
    planTitle: 'Recuperação de Margem',
    description: 'Plano para elevar a margem líquida e reduzir o risco à sustentabilidade financeira da clínica.',
    objective: 'Elevar a margem líquida para acima de 10%.',
    expectedResult: 'net_margin ≥ 0.10.',
    expectedKpi: 'net_margin',
    phase1Tasks: [
      'Detalhar composição de custos e despesas (direct_costs, operational_expenses, other_expenses)',
      'Identificar produtos/serviços com product_margin negativa',
    ],
    phase2Tasks: [
      'Renegociar contratos com maiores custos diretos',
      'Revisar política de preços/ticket médio',
    ],
    phase3Tasks: [
      'Implantar dashboard financeiro mensal',
      'Implantar controle de custos por produto',
    ],
  },

  // RULE-004 — Folha alta
  'Folha de pagamento elevada em relação ao faturamento': {
    planTitle: 'Otimização da Estrutura de Equipe',
    description: 'Plano para reduzir o peso da folha de pagamento sobre o faturamento bruto.',
    objective: 'Reduzir payroll_percentage para 35% ou menos.',
    expectedResult: 'payroll_percentage ≤ 0.35.',
    expectedKpi: 'payroll_percentage',
    phase1Tasks: [
      'Mapear clinic_team vs. volume de atendimentos/receita',
      'Identificar funções com ociosidade',
    ],
    phase2Tasks: [
      'Redefinir escalas e metas de produtividade por função',
      'Avaliar política de comissionamento',
    ],
    phase3Tasks: ['Implantar sistema de gestão de escalas/produtividade'],
  },

  // RULE-005 — Baixa indicação
  'Baixa geração de indicações': {
    planTitle: 'Programa de Indicação e Ativação',
    description: 'Plano para aumentar a geração de indicações e a ativação da base de pacientes.',
    objective: 'Elevar referral_rate para 10% ou mais.',
    expectedResult: 'referral_rate ≥ 0.10.',
    expectedKpi: 'referral_rate',
    phase1Tasks: [
      'Avaliar NPS/satisfação dos pacientes ativos',
      'Mapear pontos de contato pós-venda',
    ],
    phase2Tasks: [
      'Criar programa formal de indicação (incentivos)',
      'Definir régua de relacionamento pós-consulta',
    ],
    phase3Tasks: [
      'Implantar automação de pesquisa de satisfação',
      'Implantar tracking de origem do paciente (indicação)',
    ],
  },

  // RULE-006 — Baixa renovação
  'Baixa taxa de renovação de pacientes elegíveis': {
    planTitle: 'Programa de Retenção e Renovação',
    description: 'Plano para aumentar a taxa de renovação entre os pacientes elegíveis.',
    objective: 'Elevar renewal_rate para 60% ou mais.',
    expectedResult: 'renewal_rate ≥ 0.60.',
    expectedKpi: 'renewal_rate',
    phase1Tasks: [
      'Levantar motivos de não renovação (saída de pacientes elegíveis)',
      'Segmentar pacientes elegíveis por tempo desde a última compra',
    ],
    phase2Tasks: [
      'Criar régua de renovação (pré-vencimento)',
      'Definir oferta/condição padrão de renovação',
    ],
    phase3Tasks: [
      'Implantar automação de régua de renovação',
      'Implantar alerta de pacientes elegíveis próximos do vencimento',
    ],
  },
};

/**
 * Gera os planos de ação (com 3 fases e tarefas) para cada `diagnostic_finding`
 * de severidade `critical` ou `high`, conforme docs/RULES_ENGINE.md secao 6.
 */
export function generateActionPlans(findings: FindingForActionPlan[]): ActionPlanDraft[] {
  return findings
    .filter((finding) => finding.severity === 'critical' || finding.severity === 'high')
    .map((finding) => {
      const template = ACTION_PLAN_TEMPLATES[finding.title];
      if (!template) return null;

      const priority = SEVERITY_TO_TASK_PRIORITY[finding.severity];
      const toTask = (title: string): ActionPlanTaskDraft => ({
        title,
        priority,
        expected_kpi: template.expectedKpi,
      });

      return {
        title: template.planTitle,
        description: template.description,
        objective: template.objective,
        expected_result: template.expectedResult,
        phases: [
          { title: 'Fase 1 — Diagnóstico', order_index: 1, tasks: template.phase1Tasks.map(toTask) },
          { title: 'Fase 2 — Processo', order_index: 2, tasks: template.phase2Tasks.map(toTask) },
          { title: 'Fase 3 — Tecnologia/Automação', order_index: 3, tasks: template.phase3Tasks.map(toTask) },
        ],
      };
    })
    .filter((plan): plan is ActionPlanDraft => plan !== null);
}
