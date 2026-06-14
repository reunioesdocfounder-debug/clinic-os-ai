import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { TaskPriority, TaskStatus, Tables } from '@/lib/supabase/database.types';
import { monthLabel } from '@/app/(app)/diagnostics/constants';
import { Card } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { buildExecutiveRoadmap } from '@/lib/diagnostics/roadmap-generator';

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

export default async function RoadmapPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  const { data: diagnostic, error } = await supabase
    .from('diagnostics')
    .select('id, clinic_id, period_month, period_year')
    .eq('id', id)
    .single();

  if (error || !diagnostic) {
    notFound();
  }

  const { data: clinic } = await supabase.from('clinics').select('name').eq('id', diagnostic.clinic_id).single();

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
    const { data } = await supabase.from('tasks').select('*').in('phase_id', phaseIds).order('created_at');
    tasks = data ?? [];
  }

  const { data: findings } = await supabase
    .from('diagnostic_findings')
    .select('evidence, estimated_impact')
    .eq('diagnostic_id', id);

  const roadmap = buildExecutiveRoadmap({
    actionPlans: plans ?? [],
    phases,
    tasks,
    findings: findings ?? [],
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <PageHeader
        title="Roteiro executivo 30/60/90 dias"
        subtitle={`${clinic?.name ?? 'Clínica'} — ${monthLabel(diagnostic.period_month)} / ${diagnostic.period_year}`}
        actions={
          <ButtonLink href={`/diagnostics/${id}`} variant="secondary">
            Voltar
          </ButtonLink>
        }
      />

      {!plans || plans.length === 0 ? (
        <p className="text-sm text-muted">
          Nenhum plano de ação gerado ainda. Gere o diagnóstico e os planos de ação para montar o roteiro
          executivo.
        </p>
      ) : (
        <div className="space-y-8">
          {roadmap.map((windowResult) => (
            <section key={windowResult.window}>
              <h2 className="mb-1 text-lg font-semibold tracking-tight">{windowResult.label}</h2>
              <p className="mb-3 text-sm text-muted">{windowResult.description}</p>

              {windowResult.projects.length === 0 ? (
                <p className="text-sm text-muted">Nenhuma tarefa prevista para este período.</p>
              ) : (
                <div className="space-y-4">
                  {windowResult.projects.map((project) => (
                    <Card key={project.actionPlanId} padding="p-4">
                      <h3 className="mb-2 text-base font-semibold tracking-tight">{project.title}</h3>

                      {project.expectedResult && (
                        <p className="mb-2 text-sm text-foreground">
                          <strong>KPI esperado:</strong> {project.expectedResult}
                        </p>
                      )}

                      {project.estimatedImpact && (
                        <p className="mb-3 text-xs text-muted">
                          <strong>Impacto estimado:</strong> {project.estimatedImpact}
                        </p>
                      )}

                      <ul className="space-y-2">
                        {project.tasks.map((task) => (
                          <li key={task.id} className="flex items-start justify-between gap-2 text-sm">
                            <div>
                              <p>{task.title}</p>
                              {task.expectedKpi && <p className="text-xs text-muted">KPI: {task.expectedKpi}</p>}
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
                    </Card>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
