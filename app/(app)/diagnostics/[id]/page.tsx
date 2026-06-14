import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getKpiStatus, type KpiStatus, type PillarScores } from '@/lib/kpis';
import type { Pillar, Severity } from '@/lib/supabase/database.types';
import { monthLabel, STATUS_LABELS } from '@/app/(app)/diagnostics/constants';
import { Card } from '@/components/ui/card';
import { ButtonLink, Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { generateDiagnostic } from './actions';
import { generateActionPlans } from './action-plans/actions';

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

// Classificação do score (0-100) — docs/RULES_ENGINE.md secao 1.6:
// 0-39 Crítico, 40-59 Atenção, 60-79 Bom, 80-100 Excelente.
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

function ScoreBadge({ score }: { score: number | null }) {
  const status = getKpiStatus(score);

  if (!status) {
    return <Badge tone="gray">Sem dados</Badge>;
  }

  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS_PT[status]}</Badge>;
}

export default async function DiagnosticDetailPage({
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
    .select('*')
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

  const { data: findings } = await supabase
    .from('diagnostic_findings')
    .select('*')
    .eq('diagnostic_id', id)
    .order('priority_score', { ascending: false });

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Cabeçalho do diagnóstico */}
      <PageHeader
        title={clinic?.name ?? 'Clínica'}
        subtitle={
          <>
            {monthLabel(diagnostic.period_month)} / {diagnostic.period_year} ·{' '}
            <span className="font-medium text-foreground">{STATUS_LABELS[diagnostic.status]}</span>
          </>
        }
        actions={
          <ButtonLink href="/diagnostics" variant="secondary">
            Voltar
          </ButtonLink>
        }
      />

      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

      {/* Score geral */}
      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Score geral</h2>
        <Card padding="p-6" className="flex flex-wrap items-center gap-4">
          <span className="text-4xl font-bold tabular-nums">{diagnostic.general_score ?? '—'}</span>
          <ScoreBadge score={diagnostic.general_score} />
          {diagnostic.general_score === null && (
            <span className="text-sm text-muted">
              Diagnóstico ainda não gerado. Clique em &ldquo;Gerar diagnóstico&rdquo; em Ações rápidas.
            </span>
          )}
        </Card>
      </section>

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
        {(!findings || findings.length === 0) ? (
          <p className="text-sm text-muted">
            Nenhum achado gerado ainda. Clique em &ldquo;Gerar diagnóstico&rdquo; para analisar os dados.
          </p>
        ) : (
          <ul className="space-y-3">
            {findings.map((finding) => (
              <li key={finding.id}>
                <Card padding="p-4" className="text-sm">
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

      {/* Ações rápidas */}
      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Ações rápidas</h2>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/diagnostics/${diagnostic.id}/commercial`} variant="primary">
            Editar métricas comerciais
          </ButtonLink>
          <ButtonLink href={`/diagnostics/${diagnostic.id}/financial`} variant="primary">
            Editar métricas financeiras
          </ButtonLink>
          <ButtonLink href={`/diagnostics/${diagnostic.id}/products`} variant="primary">
            Editar métricas de produtos
          </ButtonLink>
          <form action={generateDiagnostic.bind(null, diagnostic.id)}>
            <Button type="submit" variant="primary">
              Gerar diagnóstico
            </Button>
          </form>
          <ButtonLink href={`/diagnostics/${diagnostic.id}/action-plans`} variant="secondary">
            Ver planos de ação
          </ButtonLink>
          <form action={generateActionPlans.bind(null, diagnostic.id)}>
            <Button type="submit" variant="primary">
              Gerar planos de ação
            </Button>
          </form>
          <ButtonLink href={`/diagnostics/${diagnostic.id}/roadmap`} variant="secondary">
            Ver roteiro 30/60/90
          </ButtonLink>
          <ButtonLink href={`/diagnostics/${diagnostic.id}/report`} variant="secondary">
            Ver relatório executivo
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
