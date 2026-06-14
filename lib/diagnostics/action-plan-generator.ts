// ============================================================================
// ClinicOS AI — Geração de planos de ação a partir de diagnostic_findings
// Ref.: docs/RULES_ENGINE.md secao 6; docs/NO_AI_RULES_SYSTEM.md secao 2
// ============================================================================

import { ACTION_PLAN_TEMPLATES } from '@/lib/rules-engine';
import type { Json, Severity, TaskPriority } from '@/lib/supabase/database.types';

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
  evidence: Json;
  severity: Severity;
}

const SEVERITY_TO_TASK_PRIORITY: Record<Severity, TaskPriority> = {
  critical: 'urgent',
  high: 'high',
  medium: 'medium',
  low: 'low',
};

/**
 * Extrai `rule_id` de `evidence` (docs/NO_AI_RULES_SYSTEM.md secao 3.2 — a
 * coluna `rule_id` ainda não existe em `diagnostic_findings`, então o motor
 * de regras grava o id da regra dentro de `evidence`).
 */
function getRuleId(evidence: Json): string | null {
  if (evidence !== null && typeof evidence === 'object' && !Array.isArray(evidence)) {
    const ruleId = (evidence as Record<string, Json | undefined>).rule_id;
    if (typeof ruleId === 'string') return ruleId;
  }
  return null;
}

/**
 * Gera os planos de ação (com 3 fases e tarefas) para cada `diagnostic_finding`
 * de severidade `critical` ou `high`, conforme docs/RULES_ENGINE.md secao 6.
 */
export function generateActionPlans(findings: FindingForActionPlan[]): ActionPlanDraft[] {
  return findings
    .filter((finding) => finding.severity === 'critical' || finding.severity === 'high')
    .map((finding) => {
      const ruleId = getRuleId(finding.evidence);
      const template = ruleId ? ACTION_PLAN_TEMPLATES[ruleId] : undefined;
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
        phases: [...template.phases]
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((phase) => ({
            title: phase.title,
            order_index: phase.orderIndex,
            tasks: phase.tasks.map((task) => toTask(task.title)),
          })),
      };
    })
    .filter((plan): plan is ActionPlanDraft => plan !== null);
}
