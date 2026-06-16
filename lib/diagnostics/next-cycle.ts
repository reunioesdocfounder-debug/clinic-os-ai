// ============================================================================
// ClinicOS AI — Recomendações do próximo ciclo de gestão
// Derivadas deterministicamente dos achados de maior prioridade
// ============================================================================

import type { Json, Pillar, Severity } from '@/lib/supabase/database.types';
import type { Tables } from '@/lib/supabase/database.types';

interface NextCycleTemplate {
  foco: string;
  motivo: string;
  acao_sugerida: string;
  kpi_a_acompanhar: string;
}

const NEXT_CYCLE_TEMPLATES: Record<string, NextCycleTemplate> = {
  // RULE-001 — Alto índice de no-show
  'RULE-001': {
    foco: 'Reduzir no-show e aumentar comparecimento',
    motivo:
      'A taxa de comparecimento está abaixo de 75%, gerando perda direta de receita em consultas já agendadas e confirmadas.',
    acao_sugerida:
      'Implantar régua de confirmação automática (WhatsApp/SMS) com lembretes em 48h, 24h e 2h antes da consulta.',
    kpi_a_acompanhar: 'Taxa de Comparecimento (meta: ≥ 75%)',
  },

  // RULE-002 — Tempo de resposta acima do SLA
  'RULE-002': {
    foco: 'Acelerar o atendimento inicial a leads',
    motivo:
      'O tempo médio de resposta supera 15 minutos, reduzindo a conversão de leads em agendamentos e aquecendo a concorrência.',
    acao_sugerida:
      'Definir SLA de primeira resposta ≤ 15 minutos e implantar resposta automática fora do horário de atendimento.',
    kpi_a_acompanhar: 'Tempo Médio de Resposta (meta: ≤ 15 min)',
  },

  // RULE-003 — Margem líquida comprometida
  'RULE-003': {
    foco: 'Reverter a rentabilidade da clínica',
    motivo:
      'A margem líquida está abaixo de 10%, colocando em risco a sustentabilidade financeira e a capacidade de investimento.',
    acao_sugerida:
      'Revisar a composição de custos diretos e despesas operacionais; renegociar contratos prioritários e ajustar a política de preços.',
    kpi_a_acompanhar: 'Margem Líquida (meta: ≥ 10%)',
  },

  // RULE-004 — Folha de pagamento elevada
  'RULE-004': {
    foco: 'Adequar a estrutura de equipe ao volume de receita',
    motivo:
      'A folha de pagamento consome mais de 40% do faturamento bruto, comprimindo a margem operacional.',
    acao_sugerida:
      'Mapear ociosidade por função, revisar escalas e metas de produtividade antes de qualquer nova contratação.',
    kpi_a_acompanhar: 'Percentual de Folha sobre Faturamento (meta: ≤ 35%)',
  },

  // RULE-005 — Baixa geração de indicações
  'RULE-005': {
    foco: 'Ativar a base de pacientes como canal de aquisição',
    motivo:
      'Menos de 10% dos novos pacientes vieram por indicação, sinalizando oportunidade de crescimento de baixo custo ainda inexplorada.',
    acao_sugerida:
      'Lançar programa formal de indicação com incentivos e automatizar pesquisa de satisfação pós-consulta.',
    kpi_a_acompanhar: 'Taxa de Indicação (meta: ≥ 10%)',
  },

  // RULE-006 — Baixa taxa de renovação
  'RULE-006': {
    foco: 'Reter e reativar pacientes elegíveis',
    motivo:
      'Menos de 60% dos pacientes elegíveis estão renovando, indicando perda de receita recorrente já conquistada.',
    acao_sugerida:
      'Criar régua de renovação com abordagem ativa antes do vencimento do pacote ou tratamento.',
    kpi_a_acompanhar: 'Taxa de Renovação (meta: ≥ 60%)',
  },

  // RULE-007 — Agenda muito distante
  'RULE-007': {
    foco: 'Reduzir o tempo médio até a primeira consulta',
    motivo:
      'O intervalo entre agendamento e consulta está acima de 10 dias, aumentando o risco de desistência e no-show.',
    acao_sugerida:
      'Criar encaixes estratégicos e lista de espera para otimizar o uso da agenda e antecipar consultas.',
    kpi_a_acompanhar: 'Tempo Médio até a Consulta (meta: ≤ 10 dias)',
  },
};

export interface NextCycleRecommendation {
  rule_id: string;
  finding_title: string;
  pillar: Pillar;
  severity: Severity;
  priority_score: number | null;
  foco: string;
  motivo: string;
  acao_sugerida: string;
  kpi_a_acompanhar: string;
}

function extractRuleId(evidence: Json): string | null {
  if (evidence !== null && typeof evidence === 'object' && !Array.isArray(evidence)) {
    const ruleId = (evidence as Record<string, Json | undefined>).rule_id;
    if (typeof ruleId === 'string') return ruleId;
  }
  return null;
}

/**
 * Retorna até 3 recomendações para o próximo ciclo, derivadas
 * deterministicamente dos achados com maior `priority_score`.
 * A lista de `findings` deve chegar já ordenada por `priority_score` desc.
 */
export function getNextCycleRecommendations(
  findings: Tables<'diagnostic_findings'>[],
): NextCycleRecommendation[] {
  const result: NextCycleRecommendation[] = [];

  for (const finding of findings) {
    if (result.length >= 3) break;

    const ruleId = extractRuleId(finding.evidence);
    const template = ruleId ? NEXT_CYCLE_TEMPLATES[ruleId] : undefined;
    if (!template) continue;

    result.push({
      rule_id: ruleId!,
      finding_title: finding.title,
      pillar: finding.pillar,
      severity: finding.severity,
      priority_score: finding.priority_score,
      ...template,
    });
  }

  return result;
}
