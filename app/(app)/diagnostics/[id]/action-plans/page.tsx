import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { ActionPlanStatus, TaskPriority, TaskStatus, Tables } from '@/lib/supabase/database.types';
import { monthLabel } from '@/app/(app)/diagnostics/constants';
import { Card } from '@/components/ui/card';
import { ButtonLink, Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';
import { Badge, type BadgeTone } from '@/components/ui/badge';
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

const TASK_PRIORITY_TONES: Record<TaskPriority, BadgeTone> = {
  urgent: 'red',
  high: 'orange',
  medium: 'yellow',
  low: 'gray',
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
      <PageHeader
        title="Planos de ação"
        subtitle={`${clinic?.name ?? 'Clínica'} — ${monthLabel(diagnostic.period_month)} / ${diagnostic.period_year}`}
        actions={
          <ButtonLink href={`/diagnostics/${id}`} variant="secondary">
            Voltar
          </ButtonLink>
        }
      />

      {errorMessage && (
        <Alert tone="error" className="mb-4">
          {errorMessage}
        </Alert>
      )}

      <form action={generateActionPlans.bind(null, id)} className="mb-6">
        <Button type="submit" variant="primary">
          Gerar planos de ação
        </Button>
      </form>

      {(!plans || plans.length === 0) ? (
        <p className="text-sm text-muted">
          Nenhum plano de ação gerado ainda. Gere o diagnóstico para identificar os achados críticos/altos e
          clique em &ldquo;Gerar planos de ação&rdquo;.
        </p>
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => (
            <Card key={plan.id} padding="p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold tracking-tight">{plan.title}</h2>
                <Badge tone="blue">{ACTION_PLAN_STATUS_LABELS[plan.status]}</Badge>
              </div>

              {plan.description && <p className="mb-2 text-sm text-foreground">{plan.description}</p>}

              <dl className="mb-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {plan.objective && (
                  <div>
                    <dt className="font-medium text-muted">Objetivo</dt>
                    <dd>{plan.objective}</dd>
                  </div>
                )}
                {plan.expected_result && (
                  <div>
                    <dt className="font-medium text-muted">Resultado esperado</dt>
                    <dd>{plan.expected_result}</dd>
                  </div>
                )}
              </dl>

              <div className="space-y-3">
                {(phasesByPlan.get(plan.id) ?? []).map((phase) => (
                  <div key={phase.id} className="rounded-xl border border-border bg-surface-hover p-3">
                    <h3 className="mb-2 text-sm font-semibold">{phase.title}</h3>
                    <ul className="space-y-2">
                      {(tasksByPhase.get(phase.id) ?? []).map((task) => (
                        <li key={task.id} className="flex items-start justify-between gap-2 text-sm">
                          <div>
                            <p>{task.title}</p>
                            {task.expected_kpi && (
                              <p className="text-xs text-muted">KPI: {task.expected_kpi}</p>
                            )}
                          </div>
                          <div className="flex flex-shrink-0 gap-1">
                            <Badge tone={TASK_PRIORITY_TONES[task.priority]}>
                              {TASK_PRIORITY_LABELS[task.priority]}
                            </Badge>
                            <Badge tone="gray">{TASK_STATUS_LABELS[task.status]}</Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
