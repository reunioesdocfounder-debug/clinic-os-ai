// ============================================================================
// ClinicOS AI — Score de Maturidade da clínica
// Ref.: docs/RULES_ENGINE.md secao 8
// ============================================================================

export type MaturityStatus = 'critico' | 'atencao' | 'bom' | 'excelente';

export interface MaturityLevel {
  label: string;
  description: string;
  recommended_focus: string;
  status: MaturityStatus;
}

/**
 * Classifica a clínica em um nível de maturidade executiva a partir do
 * `general_score` (0-100), reutilizando as mesmas faixas da seção 1.6
 * (docs/RULES_ENGINE.md secao 8). Retorna `null` quando o score geral ainda
 * não foi calculado.
 */
export function getMaturityLevel(generalScore: number | null): MaturityLevel | null {
  if (generalScore === null) return null;

  if (generalScore < 40) {
    return {
      label: 'Clínica em risco',
      description:
        'A clínica apresenta indicadores críticos em diversos pilares, com risco à sustentabilidade ' +
        'do negócio no curto prazo.',
      recommended_focus:
        'Estabilizar a operação: priorizar os planos de ação de severidade crítica/alta para reverter ' +
        'os indicadores antes de investir em crescimento.',
      status: 'critico',
    };
  }

  if (generalScore < 60) {
    return {
      label: 'Clínica desorganizada',
      description:
        'A clínica opera, mas com processos pouco padronizados e indicadores abaixo do recomendado em ' +
        'parte dos pilares.',
      recommended_focus:
        'Estruturar e padronizar os processos comerciais, financeiros e de atendimento antes de ' +
        'acelerar o crescimento.',
      status: 'atencao',
    };
  }

  if (generalScore < 80) {
    return {
      label: 'Clínica estruturada',
      description: 'A clínica tem processos consolidados e a maioria dos indicadores em níveis saudáveis.',
      recommended_focus:
        'Reforçar os pilares com desempenho abaixo da média e preparar a operação para crescer com ' +
        'previsibilidade.',
      status: 'bom',
    };
  }

  return {
    label: 'Clínica escalável',
    description:
      'A clínica apresenta indicadores excelentes em praticamente todos os pilares, com operação ' +
      'madura e processos consolidados.',
    recommended_focus:
      'Investir em expansão (novas unidades, produtos ou canais de aquisição), mantendo o ' +
      'monitoramento contínuo dos indicadores.',
    status: 'excelente',
  };
}
