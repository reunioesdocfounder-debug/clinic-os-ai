'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { TablesInsert } from '@/lib/supabase/database.types';
import { generateActionPlans as buildActionPlans } from '@/lib/diagnostics/action-plan-generator';

/**
 * Gera (ou regenera) os planos de ação a partir dos `diagnostic_findings`
 * críticos/altos do diagnóstico. Idempotente: apaga os planos (e, em
 * cascata, fases e tarefas) existentes antes de recriá-los.
 */
export async function generateActionPlans(diagnosticId: string) {
  const supabase = await createClient();

  const { data: findings, error: findingsError } = await supabase
    .from('diagnostic_findings')
    .select('title, severity')
    .eq('diagnostic_id', diagnosticId);

  if (findingsError) {
    redirect(`/diagnostics/${diagnosticId}/action-plans?error=${encodeURIComponent(findingsError.message)}`);
  }

  const plans = buildActionPlans(findings ?? []);

  const { error: deleteError } = await supabase
    .from('action_plans')
    .delete()
    .eq('diagnostic_id', diagnosticId);

  if (deleteError) {
    redirect(`/diagnostics/${diagnosticId}/action-plans?error=${encodeURIComponent(deleteError.message)}`);
  }

  for (const plan of plans) {
    const { data: insertedPlan, error: planError } = await supabase
      .from('action_plans')
      .insert({
        diagnostic_id: diagnosticId,
        title: plan.title,
        description: plan.description,
        objective: plan.objective,
        expected_result: plan.expected_result,
        status: 'planned',
      })
      .select('id')
      .single();

    if (planError || !insertedPlan) {
      redirect(
        `/diagnostics/${diagnosticId}/action-plans?error=${encodeURIComponent(planError?.message ?? 'Erro ao criar plano de ação')}`,
      );
    }

    for (const phase of plan.phases) {
      const { data: insertedPhase, error: phaseError } = await supabase
        .from('action_plan_phases')
        .insert({
          action_plan_id: insertedPlan.id,
          title: phase.title,
          order_index: phase.order_index,
        })
        .select('id')
        .single();

      if (phaseError || !insertedPhase) {
        redirect(
          `/diagnostics/${diagnosticId}/action-plans?error=${encodeURIComponent(phaseError?.message ?? 'Erro ao criar fase do plano de ação')}`,
        );
      }

      const tasksToInsert: TablesInsert<'tasks'>[] = phase.tasks.map((task) => ({
        phase_id: insertedPhase.id,
        title: task.title,
        priority: task.priority,
        expected_kpi: task.expected_kpi,
        status: 'todo',
      }));

      const { error: tasksError } = await supabase.from('tasks').insert(tasksToInsert);

      if (tasksError) {
        redirect(`/diagnostics/${diagnosticId}/action-plans?error=${encodeURIComponent(tasksError.message)}`);
      }
    }
  }

  revalidatePath(`/diagnostics/${diagnosticId}/action-plans`);
  redirect(`/diagnostics/${diagnosticId}/action-plans`);
}
