import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { ActionPlanStatus, TaskPriority, TaskStatus, Tables } from '@/lib/supabase/database.types';
import { monthLabel } from '@/app/(app)/diagnostics/constants';
import { generateActionPlans } from './actions';

const ACTION_PLAN_STATUS_LABELS: Record<ActionPlanStatus, string> = {
  planned: 'Planejado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  paused: 'Pausado',
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'A fazer',
  doing: 'Em andamento',
  done: 'Concluída',
  blocked: 'Bloqueada',
};

const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

const TASK_PRIORITY_STYLES: Record<TaskPriority, string> = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-700',
};

export default async function ActionPlansPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const { error: errorMessage } = await searchParams;

  const { data: diagnostic, error } = await supabase
    .from('diagnostics')
    .select('id, clinic_id, period_month, period_year')
    .eq('id', id)
    .single();

  if (error || !diagnostic) {
    notFound();
  }

  const { data: clinic } = await supabase
    .from('clinics')
    .select('name')
    .eq('id', diagnostic.clinic_id)
    .single();

  const { data: plans } = await supabase
    .from('action_plans')
    .select('*')
    .eq('diagnostic_id', id)
    .order('created_at');

  const planIds = (plans ?? []).map((plan) => plan.id);

  let phases: Tables<'action_plan_phases'>[] = [];
  if (planIds.length > 0) {
    const { data } = await supabase
      .from('action_plan_phases')
      .select('*')
      .in('action_plan_id', planIds)
      .order('order_index');
    phases = data ?? [];
  }

  const phaseIds = phases.map((phase) => phase.id);

  let tasks: Tables<'tasks'>[] = [];
  if (phaseIds.length > 0) {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .in('phase_id', phaseIds)
      .order('created_at');
    tasks = data ?? [];
  }

  const phasesByPlan = new Map<string, Tables<'action_plan_phases'>[]>();
  for (const phase of phases) {
    const list = phasesByPlan.get(phase.action_plan_id) ?? [];
    list.push(phase);
    phasesByPlan.set(phase.action_plan_id, list);
  }

  const tasksByPhase = new Map<string, Tables<'tasks'>[]>();
  for (const task of tasks) {
    const list = tasksByPhase.get(task.phase_id) ?? [];
    list.push(task);
    tasksByPhase.set(task.phase_id, list);
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Planos de ação</h1>
        <Link
          href={`/diagnostics/${id}`}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Voltar
        </Link>
      </div>

      <p className="mb-4 text-sm text-gray-500">
        {clinic?.name ?? 'Clínica'} — {monthLabel(diagnostic.period_month)} / {diagnostic.period_year}
      </p>

      {errorMessage && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <form action={generateActionPlans.bind(null, id)} className="mb-6">
        <button
          type="submit"
          className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Gerar planos de ação
        </button>
      </form>

      {(!plans || plans.length === 0) ? (
        <p className="text-sm text-gray-500">
          Nenhum plano de ação gerado ainda. Gere o diagnóstico para identificar os achados críticos/altos e
          clique em &ldquo;Gerar planos de ação&rdquo;.
        </p>
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => (
            <section key={plan.id} className="rounded border border-gray-200 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{plan.title}</h2>
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  {ACTION_PLAN_STATUS_LABELS[plan.status]}
                </span>
              </div>

              {plan.description && <p className="mb-2 text-sm text-gray-700">{plan.description}</p>}

              <dl className="mb-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {plan.objective && (
                  <div>
                    <dt className="font-medium text-gray-500">Objetivo</dt>
                    <dd>{plan.objective}</dd>
                  </div>
                )}
                {plan.expected_result && (
                  <div>
                    <dt className="font-medium text-gray-500">Resultado esperado</dt>
                    <dd>{plan.expected_result}</dd>
                  </div>
                )}
              </dl>

              <div className="space-y-3">
                {(phasesByPlan.get(plan.id) ?? []).map((phase) => (
                  <div key={phase.id} className="rounded border border-gray-100 bg-gray-50 p-3">
                    <h3 className="mb-2 text-sm font-semibold">{phase.title}</h3>
                    <ul className="space-y-2">
                      {(tasksByPhase.get(phase.id) ?? []).map((task) => (
                        <li key={task.id} className="flex items-start justify-between gap-2 text-sm">
                          <div>
                            <p>{task.title}</p>
                            {task.expected_kpi && (
                              <p className="text-xs text-gray-500">KPI: {task.expected_kpi}</p>
                            )}
                          </div>
                          <div className="flex flex-shrink-0 gap-1">
                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${TASK_PRIORITY_STYLES[task.priority]}`}>
                              {TASK_PRIORITY_LABELS[task.priority]}
                            </span>
                            <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                              {TASK_STATUS_LABELS[task.status]}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
