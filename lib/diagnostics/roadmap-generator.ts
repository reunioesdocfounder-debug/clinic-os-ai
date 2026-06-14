// ============================================================================
// ClinicOS AI — Roteiro executivo 30/60/90 dias
// Ref.: docs/RULES_ENGINE.md secao 6; docs/NO_AI_RULES_SYSTEM.md secao 4
// ============================================================================

import { ACTION_PLAN_TEMPLATES } from '@/lib/rules-engine';
import type { Json, Tables, TaskPriority, TaskStatus } from '@/lib/supabase/database.types';

export type RoadmapWindow = '0-30' | '31-60' | '61-90';

export const ROADMAP_WINDOWS: RoadmapWindow[] = ['0-30', '31-60', '61-90'];

export const ROADMAP_WINDOW_LABELS: Record<RoadmapWindow, string> = {
  '0-30': '0–30 dias',
  '31-60': '31–60 dias',
  '61-90': '61–90 dias',
};

export const ROADMAP_WINDOW_DESCRIPTIONS: Record<RoadmapWindow, string> = {
  '0-30': 'Ações urgentes e quick wins',
  '31-60': 'Melhorias operacionais',
  '61-90': 'Automação e escala',
};

export interface RoadmapTask {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  expectedKpi: string | null;
}

export interface RoadmapProject {
  actionPlanId: string;
  title: string;
  objective: string | null;
  expectedResult: string | null;
  estimatedImpact: string | null;
  tasks: RoadmapTask[];
}

export interface RoadmapWindowResult {
  window: RoadmapWindow;
  label: string;
  description: string;
  projects: RoadmapProject[];
}

export interface RoadmapInput {
  actionPlans: Tables<'action_plans'>[];
  phases: Tables<'action_plan_phases'>[];
  tasks: Tables<'tasks'>[];
  findings: Pick<Tables<'diagnostic_findings'>, 'evidence' | 'estimated_impact'>[];
}

const TASK_PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
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
 * Janela do roadmap para uma tarefa (docs/NO_AI_RULES_SYSTEM.md secao 4):
 * tarefas urgentes e a Fase 1 (Diagnóstico) são tratadas como ações urgentes/
 * quick wins (0-30 dias); Fase 2 são melhorias operacionais (31-60 dias);
 * Fase 3 é automação/escala (61-90 dias).
 */
function windowForTask(phaseOrderIndex: number, priority: TaskPriority): RoadmapWindow {
  if (priority === 'urgent') return '0-30';
  if (phaseOrderIndex <= 1) return '0-30';
  if (phaseOrderIndex === 2) return '31-60';
  return '61-90';
}

/**
 * Transforma os `action_plans` (com suas fases e tarefas) de um diagnóstico
 * em um roteiro executivo agrupado em janelas de 0-30, 31-60 e 61-90 dias,
 * cruzando cada plano com o `estimated_impact` do achado que o originou
 * (via `rule_id` em `evidence` <-> `ACTION_PLAN_TEMPLATES[ruleId].planTitle`).
 */
export function buildExecutiveRoadmap(input: RoadmapInput): RoadmapWindowResult[] {
  const { actionPlans, phases, tasks, findings } = input;

  const phasesByPlan = new Map<string, Tables<'action_plan_phases'>[]>();
  for (const phase of phases) {
    const list = phasesByPlan.get(phase.action_plan_id) ?? [];
    list.push(phase);
    phasesByPlan.set(phase.action_plan_id, list);
  }
  for (const list of phasesByPlan.values()) {
    list.sort((a, b) => a.order_index - b.order_index);
  }

  const tasksByPhase = new Map<string, Tables<'tasks'>[]>();
  for (const task of tasks) {
    const list = tasksByPhase.get(task.phase_id) ?? [];
    list.push(task);
    tasksByPhase.set(task.phase_id, list);
  }

  const impactByRuleId = new Map<string, string>();
  for (const finding of findings) {
    const ruleId = getRuleId(finding.evidence);
    if (ruleId && finding.estimated_impact) {
      impactByRuleId.set(ruleId, finding.estimated_impact);
    }
  }

  const ruleIdByPlanTitle = new Map<string, string>();
  for (const template of Object.values(ACTION_PLAN_TEMPLATES)) {
    ruleIdByPlanTitle.set(template.planTitle, template.ruleId);
  }

  return ROADMAP_WINDOWS.map((window) => {
    const projects: RoadmapProject[] = [];

    for (const plan of actionPlans) {
      const windowTasks: RoadmapTask[] = [];

      for (const phase of phasesByPlan.get(plan.id) ?? []) {
        for (const task of tasksByPhase.get(phase.id) ?? []) {
          if (windowForTask(phase.order_index, task.priority) === window) {
            windowTasks.push({
              id: task.id,
              title: task.title,
              priority: task.priority,
              status: task.status,
              expectedKpi: task.expected_kpi,
            });
          }
        }
      }

      if (windowTasks.length === 0) continue;

      windowTasks.sort((a, b) => TASK_PRIORITY_ORDER[a.priority] - TASK_PRIORITY_ORDER[b.priority]);

      const ruleId = ruleIdByPlanTitle.get(plan.title);

      projects.push({
        actionPlanId: plan.id,
        title: plan.title,
        objective: plan.objective,
        expectedResult: plan.expected_result,
        estimatedImpact: (ruleId && impactByRuleId.get(ruleId)) || null,
        tasks: windowTasks,
      });
    }

    return {
      window,
      label: ROADMAP_WINDOW_LABELS[window],
      description: ROADMAP_WINDOW_DESCRIPTIONS[window],
      projects,
    };
  });
}
