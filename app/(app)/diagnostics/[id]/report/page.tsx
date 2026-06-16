import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getKpiStatus, type KpiStatus, type PillarScores } from '@/lib/kpis';
import type {
  ActionPlanStatus,
  Pillar,
  Severity,
  TaskPriority,
  TaskStatus,
  Tables,
} from '@/lib/supabase/database.types';
import { monthLabel, STATUS_LABELS } from '@/app/(app)/diagnostics/constants';
import { Card } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { getMaturityLevel } from '@/lib/diagnostics/maturity';
import { getNextCycleRecommendations } from '@/lib/diagnostics/next-cycle';
import { buildSnapshot, buildComparison, type DiagnosticComparison, type MetricDiff } from '@/lib/diagnostics/comparison';
import { buildExecutiveRoadmap } from '@/lib/diagnostics/roadmap-generator';
import { PrintButton } from './print-button';

const PILLAR_CARDS: Array<{ key: keyof PillarScores; label: string }> = [
  { key: 'commercial_score', label: 'Comercial' },
  { key: 'financial_score', label: 'Financeiro' },
  { key: 'retention_score', label: 'Retenção' },
  { key: 'marketing_score', label: 'Marketing' },
  { key: 'operation_score', label: 'Operação' },
];

const PILLAR_LABELS: Record<Pillar, string> = {
  commercial: 'Comercial',
  financial: 'Financeiro',
  retention: 'Retenção',
  marketing: 'Marketing',
  operation: 'Operação',
};

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

const SEVERITY_TONES: Record<Severity, BadgeTone> = {
  critical: 'red',
  high: 'orange',
  medium: 'yellow',
  low: 'gray',
};

const STATUS_LABELS_PT: Record<KpiStatus, string> = {
  critico: 'Crítico',
  atencao: 'Atenção',
  bom: 'Bom',
  excelente: 'Excelente',
};

const STATUS_TONES: Record<KpiStatus, BadgeTone> = {
  critico: 'red',
  atencao: 'yellow',
  bom: 'blue',
  excelente: 'green',
};

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

// ── Helpers de formatação para a seção de comparação histórica ──────────────

type MetricFormat = 'brl' | 'pct' | 'score';

function fmtValue(value: number | null, fmt: MetricFormat): string {
  if (value === null) return '—';
  if (fmt === 'brl')
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  if (fmt === 'pct') return `${(value * 100).toFixed(1)}%`;
  return value.toFixed(1);
}

function fmtDelta(delta: number | null, fmt: MetricFormat): string {
  if (delta === null) return '—';
  const sign = delta > 0 ? '+' : '';
  if (fmt === 'brl')
    return `${sign}${delta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}`;
  if (fmt === 'pct') return `${sign}${(delta * 100).toFixed(1)} pp`;
  return `${sign}${delta.toFixed(1)}`;
}

function deltaClass(delta: number | null): string {
  if (delta === null || delta === 0) return 'text-muted';
  return delta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
}

function DiffRow({ label, diff, fmt }: { label: string; diff: MetricDiff; fmt: MetricFormat }) {
  const cls = deltaClass(diff.delta);
  const arrow = diff.delta === null || diff.delta === 0 ? '→' : diff.delta > 0 ? '↑' : '↓';
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2 pr-4 text-sm text-foreground">{label}</td>
      <td className="py-2 pr-4 text-right text-sm tabular-nums text-muted">{fmtValue(diff.previous, fmt)}</td>
      <td className="py-2 pr-4 text-right text-sm tabular-nums font-semibold">{fmtValue(diff.current, fmt)}</td>
      <td className={`py-2 pr-4 text-right text-sm tabular-nums ${cls}`}>
        {arrow} {fmtDelta(diff.delta, fmt)}
      </td>
      <td className={`py-2 text-right text-xs tabular-nums ${cls}`}>
        {diff.pct_change !== null
          ? `${diff.pct_change > 0 ? '+' : ''}${diff.pct_change.toFixed(1)}%`
          : '—'}
      </td>
    </tr>
  );
}

function DiffSectionHeader({ title }: { title: string }) {
  return (
    <tr>
      <td
        colSpan={5}
        className="bg-surface-hover py-2 text-xs font-semibold uppercase tracking-wide text-muted"
      >
        {title}
      </td>
    </tr>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number | null }) {
  const status = getKpiStatus(score);

  if (!status) {
    return <Badge tone="gray">Sem dados</Badge>;
  }

  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS_PT[status]}</Badge>;
}

export default async function DiagnosticReportPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  const { data: diagnostic, error } = await supabase.from('diagnostics').select('*').eq('id', id).single();

  if (error || !diagnostic) {
    notFound();
  }

  const { data: clinic } = await supabase.from('clinics').select('name').eq('id', diagnostic.clinic_id).single();

  const { data: findings } = await supabase
    .from('diagnostic_findings')
    .select('*')
    .eq('diagnostic_id', id)
    .order('priority_score', { ascending: false });

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

  const roadmap = buildExecutiveRoadmap({
    actionPlans: plans ?? [],
    phases,
    tasks,
    findings: findings ?? [],
  });

  // Diagnóstico anterior da mesma clínica (para comparação histórica)
  const { data: prevRows } = await supabase
    .from('diagnostics')
    .select('*')
    .eq('clinic_id', diagnostic.clinic_id)
    .neq('id', id)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })
    .limit(1);

  const prevDiagnostic = prevRows?.[0] ?? null;

  let comparison: DiagnosticComparison | null = null;
  let prevLabel = '';

  if (prevDiagnostic) {
    const [{ data: currFin }, { data: currCom }, { data: prevFin }, { data: prevCom }] =
      await Promise.all([
        supabase.from('financial_metrics').select('*').eq('diagnostic_id', id).maybeSingle(),
        supabase.from('commercial_metrics').select('*').eq('diagnostic_id', id).maybeSingle(),
        supabase.from('financial_metrics').select('*').eq('diagnostic_id', prevDiagnostic.id).maybeSingle(),
        supabase.from('commercial_metrics').select('*').eq('diagnostic_id', prevDiagnostic.id).maybeSingle(),
      ]);

    const currSnapshot = buildSnapshot(diagnostic, currFin ?? null, currCom ?? null);
    const prevSnapshot = buildSnapshot(prevDiagnostic, prevFin ?? null, prevCom ?? null);
    comparison = buildComparison(currSnapshot, prevSnapshot);
    prevLabel = `${monthLabel(prevDiagnostic.period_month)}/${prevDiagnostic.period_year}`;
  }

  const maturity = getMaturityLevel(diagnostic.general_score);
  const nextCycle = getNextCycleRecommendations(findings ?? []);

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <PageHeader
        title="Relatório executivo"
        subtitle={
          <>
            {clinic?.name ?? 'Clínica'} · {monthLabel(diagnostic.period_month)} / {diagnostic.period_year} ·{' '}
            <span className="font-medium text-foreground">{STATUS_LABELS[diagnostic.status]}</span>
          </>
        }
        actions={
          <div className="no-print flex flex-wrap gap-2">
            <ButtonLink href={`/diagnostics/${id}`} variant="secondary">
              Voltar
            </ButtonLink>
            <PrintButton />
          </div>
        }
      />

      {/* Score geral */}
      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Score geral</h2>
        <Card padding="p-6" className="flex flex-wrap items-center gap-4 print-avoid-break">
          <span className="text-4xl font-bold tabular-nums">{diagnostic.general_score ?? '—'}</span>
          <ScoreBadge score={diagnostic.general_score} />
          {diagnostic.general_score === null && (
            <span className="text-sm text-muted">Diagnóstico ainda não gerado.</span>
          )}
        </Card>
      </section>

      {/* Nível de maturidade */}
      {maturity && (
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Nível de maturidade</h2>
          <Card padding="p-6" className="space-y-2 print-avoid-break">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-semibold">{maturity.label}</span>
              <Badge tone={STATUS_TONES[maturity.status]}>{STATUS_LABELS_PT[maturity.status]}</Badge>
            </div>
            <p className="text-sm text-foreground">{maturity.description}</p>
            <p className="text-sm text-muted">
              <strong>Foco recomendado:</strong> {maturity.recommended_focus}
            </p>
          </Card>
        </section>
      )}

      {/* Scores por pilar */}
      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Scores por pilar</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {PILLAR_CARDS.map(({ key, label }) => {
            const score = diagnostic[key];
            return (
              <Card key={key} padding="p-4">
                <p className="text-sm font-medium text-muted">{label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{score ?? '—'}</p>
                <div className="mt-2">
                  <ScoreBadge score={score} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Evolução em relação ao ciclo anterior */}
      {comparison && (
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Evolução em relação ao ciclo anterior
          </h2>
          <Card padding="p-0" className="overflow-x-auto print-avoid-break">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    Métrica
                  </th>
                  <th className="py-2 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                    {prevLabel}
                  </th>
                  <th className="py-2 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                    Atual
                  </th>
                  <th className="py-2 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                    Diferença
                  </th>
                  <th className="py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                    Var. %
                  </th>
                </tr>
              </thead>
              <tbody>
                <DiffSectionHeader title="Scores" />
                <DiffRow label="Score geral" diff={comparison.diffs.general_score} fmt="score" />
                <DiffRow label="Comercial" diff={comparison.diffs.commercial_score} fmt="score" />
                <DiffRow label="Financeiro" diff={comparison.diffs.financial_score} fmt="score" />
                <DiffSectionHeader title="Financeiro" />
                <DiffRow label="Receita bruta" diff={comparison.diffs.gross_revenue} fmt="brl" />
                <DiffRow label="Lucro líquido" diff={comparison.diffs.net_profit} fmt="brl" />
                <DiffRow label="Margem líquida" diff={comparison.diffs.net_margin} fmt="pct" />
                <DiffSectionHeader title="Comercial" />
                <DiffRow label="Comparecimento" diff={comparison.diffs.attendance_rate} fmt="pct" />
                <DiffRow label="Conversão" diff={comparison.diffs.conversion_rate} fmt="pct" />
                <DiffRow label="Renovação" diff={comparison.diffs.renewal_rate} fmt="pct" />
              </tbody>
            </table>
          </Card>
          <p className="mt-2 text-xs text-muted">
            ↑ melhora · ↓ piora · pp = pontos percentuais
          </p>
        </section>
      )}

      {/* Resumo executivo */}
      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Resumo executivo</h2>
        {diagnostic.executive_summary ? (
          <div className="whitespace-pre-line rounded-xl border border-border bg-surface-hover p-4 text-sm text-foreground">
            {diagnostic.executive_summary}
          </div>
        ) : (
          <p className="text-sm text-muted">Resumo executivo ainda não gerado.</p>
        )}
      </section>

      {/* Achados prioritários */}
      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Achados prioritários</h2>
        {!findings || findings.length === 0 ? (
          <p className="text-sm text-muted">Nenhum achado gerado ainda.</p>
        ) : (
          <ul className="space-y-3">
            {findings.map((finding) => (
              <li key={finding.id}>
                <Card padding="p-4" className="text-sm print-avoid-break">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{finding.title}</span>
                    <Badge tone={SEVERITY_TONES[finding.severity]}>{SEVERITY_LABELS[finding.severity]}</Badge>
                  </div>
                  <p className="mb-2 text-xs text-muted">
                    {PILLAR_LABELS[finding.pillar]} · Prioridade {finding.priority_score ?? '—'}
                  </p>
                  {finding.description && <p className="mb-2 text-foreground">{finding.description}</p>}
                  {finding.estimated_impact && (
                    <p className="text-xs text-muted">
                      <strong>Impacto estimado:</strong> {finding.estimated_impact}
                    </p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Prioridades do próximo ciclo */}
      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Prioridades do próximo ciclo</h2>
        {nextCycle.length === 0 ? (
          <p className="text-sm text-muted">
            Gere o diagnóstico para ver as prioridades recomendadas para o próximo ciclo de gestão.
          </p>
        ) : (
          <ul className="space-y-3">
            {nextCycle.map((rec, i) => (
              <li key={rec.rule_id}>
                <Card padding="p-4" className="text-sm print-avoid-break">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{i + 1}. {rec.foco}</span>
                    <Badge tone={SEVERITY_TONES[rec.severity]}>{SEVERITY_LABELS[rec.severity]}</Badge>
                  </div>
                  <p className="mb-2 text-xs text-muted">{PILLAR_LABELS[rec.pillar]}</p>
                  <p className="mb-1 text-foreground">
                    <strong className="font-medium">Motivo:</strong> {rec.motivo}
                  </p>
                  <p className="mb-1 text-foreground">
                    <strong className="font-medium">Ação sugerida:</strong> {rec.acao_sugerida}
                  </p>
                  <p className="text-muted">
                    <strong className="font-medium">KPI a acompanhar:</strong> {rec.kpi_a_acompanhar}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Planos de ação */}
      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Planos de ação</h2>
        {!plans || plans.length === 0 ? (
          <p className="text-sm text-muted">Nenhum plano de ação gerado ainda.</p>
        ) : (
          <div className="space-y-6">
            {plans.map((plan) => (
              <Card key={plan.id} padding="p-4" className="print-avoid-break">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold tracking-tight">{plan.title}</h3>
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
                      <h4 className="mb-2 text-sm font-semibold">{phase.title}</h4>
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
      </section>

      {/* Roteiro executivo 30/60/90 dias */}
      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Roteiro executivo 30/60/90 dias</h2>
        {!plans || plans.length === 0 ? (
          <p className="text-sm text-muted">Nenhum plano de ação gerado ainda.</p>
        ) : (
          <div className="space-y-6">
            {roadmap.map((windowResult) => (
              <div key={windowResult.window}>
                <h3 className="mb-1 text-sm font-semibold tracking-tight">{windowResult.label}</h3>
                <p className="mb-3 text-xs text-muted">{windowResult.description}</p>

                {windowResult.projects.length === 0 ? (
                  <p className="text-sm text-muted">Nenhuma tarefa prevista para este período.</p>
                ) : (
                  <div className="space-y-3">
                    {windowResult.projects.map((project) => (
                      <Card key={project.actionPlanId} padding="p-4" className="print-avoid-break">
                        <h4 className="mb-2 text-sm font-semibold tracking-tight">{project.title}</h4>

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
                                {task.expectedKpi && (
                                  <p className="text-xs text-muted">KPI: {task.expectedKpi}</p>
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
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
