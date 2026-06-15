// ============================================================================
// ClinicOS AI — Geração do resumo executivo do diagnóstico
// Ref.: docs/RULES_ENGINE.md secao 1.6
// ============================================================================

import { getKpiStatus, type KpiStatus, type PillarScores } from '@/lib/kpis';
import type { Severity } from '@/lib/supabase/database.types';
import type { FindingDraft } from './findings';
import { getMaturityLevel } from './maturity';

const PILLAR_LABELS: Record<keyof PillarScores, string> = {
  commercial_score: 'Comercial',
  financial_score: 'Financeiro',
  retention_score: 'Retenção',
  marketing_score: 'Marketing',
  operation_score: 'Operação',
};

const STATUS_LABELS: Record<KpiStatus, string> = {
  critico: 'crítico',
  atencao: 'requer atenção',
  bom: 'bom',
  excelente: 'excelente',
};

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'crítica',
  high: 'alta',
  medium: 'média',
  low: 'baixa',
};

export interface ExecutiveSummaryInput {
  generalScore: number | null;
  pillarScores: PillarScores;
  findings: FindingDraft[];
}

/**
 * Monta o texto de `executive_summary` a partir do score geral, dos scores
 * por pilar e dos achados gerados pelo motor de regras. Retorna parágrafos
 * separados por linha em branco.
 */
export function buildExecutiveSummary(input: ExecutiveSummaryInput): string {
  const { generalScore, pillarScores, findings } = input;
  const paragraphs: string[] = [];

  if (generalScore === null) {
    paragraphs.push(
      'Não há dados suficientes para calcular o score geral da clínica neste período. ' +
        'Preencha as métricas comerciais, financeiras e de produtos para gerar um diagnóstico completo.',
    );
  } else {
    const status = getKpiStatus(generalScore);
    paragraphs.push(
      `O score geral da clínica neste período é ${generalScore.toFixed(1)} de 100, ` +
        `classificado como ${STATUS_LABELS[status ?? 'critico']}.`,
    );

    const maturity = getMaturityLevel(generalScore);
    if (maturity) {
      paragraphs.push(
        `Nível de maturidade: ${maturity.label}. ${maturity.description} ` +
          `Foco recomendado: ${maturity.recommended_focus}`,
      );
    }
  }

  const pillarSentences = (Object.keys(PILLAR_LABELS) as Array<keyof PillarScores>)
    .map((key) => {
      const score = pillarScores[key];
      if (score === null) return null;
      const status = getKpiStatus(score);
      return `${PILLAR_LABELS[key]}: ${score.toFixed(1)} (${STATUS_LABELS[status ?? 'critico']})`;
    })
    .filter((sentence): sentence is string => sentence !== null);

  if (pillarSentences.length > 0) {
    paragraphs.push(`Scores por pilar — ${pillarSentences.join(', ')}.`);
  }

  if (findings.length === 0) {
    paragraphs.push('Nenhum ponto de atenção foi identificado pelas regras automáticas neste diagnóstico.');
  } else {
    const sorted = [...findings].sort((a, b) => b.priority_score - a.priority_score);
    const top = sorted.slice(0, 3);
    const topList = top.map((finding) => `"${finding.title}" (severidade ${SEVERITY_LABELS[finding.severity]})`);

    paragraphs.push(
      `Foram identificados ${findings.length} ponto(s) de atenção. ` +
        `Prioridades: ${topList.join(', ')}.`,
    );
  }

  return paragraphs.join('\n\n');
}
