import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getKpiStatus, type KpiStatus, type PillarScores } from '@/lib/kpis';
import type { Pillar, Severity } from '@/lib/supabase/database.types';
import { monthLabel, STATUS_LABELS } from '@/app/(app)/diagnostics/constants';
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

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-700',
};

// Classificação do score (0-100) — docs/RULES_ENGINE.md secao 1.6:
// 0-39 Crítico, 40-59 Atenção, 60-79 Bom, 80-100 Excelente.
const STATUS_LABELS_PT: Record<KpiStatus, string> = {
  critico: 'Crítico',
  atencao: 'Atenção',
  bom: 'Bom',
  excelente: 'Excelente',
};

const STATUS_BADGE_STYLES: Record<KpiStatus, string> = {
  critico: 'bg-red-100 text-red-800',
  atencao: 'bg-yellow-100 text-yellow-800',
  bom: 'bg-blue-100 text-blue-800',
  excelente: 'bg-green-100 text-green-800',
};

function ScoreBadge({ score }: { score: number | null }) {
  const status = getKpiStatus(score);

  if (!status) {
    return <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Sem dados</span>;
  }

  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_STYLES[status]}`}>
      {STATUS_LABELS_PT[status]}
    </span>
  );
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
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{clinic?.name ?? 'Clínica'}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {monthLabel(diagnostic.period_month)} / {diagnostic.period_year} ·{' '}
            <span className="font-medium text-gray-700">{STATUS_LABELS[diagnostic.status]}</span>
          </p>
        </div>
        <Link
          href="/diagnostics"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Voltar
        </Link>
      </header>

      {errorMessage && (
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>
      )}

      {/* Score geral */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Score geral</h2>
        <div className="flex flex-wrap items-center gap-4 rounded border border-gray-200 p-6">
          <span className="text-4xl font-bold tabular-nums">{diagnostic.general_score ?? '—'}</span>
          <ScoreBadge score={diagnostic.general_score} />
          {diagnostic.general_score === null && (
            <span className="text-sm text-gray-500">
              Diagnóstico ainda não gerado. Clique em &ldquo;Gerar diagnóstico&rdquo; em Ações rápidas.
            </span>
          )}
        </div>
      </section>

      {/* Scores por pilar */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Scores por pilar</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {PILLAR_CARDS.map(({ key, label }) => {
            const score = diagnostic[key];
            return (
              <div key={key} className="rounded border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{score ?? '—'}</p>
                <div className="mt-2">
                  <ScoreBadge score={score} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Resumo executivo */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Resumo executivo</h2>
        {diagnostic.executive_summary ? (
          <div className="whitespace-pre-line rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            {diagnostic.executive_summary}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Resumo executivo ainda não gerado.</p>
        )}
      </section>

      {/* Achados prioritários */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Achados prioritários</h2>
        {(!findings || findings.length === 0) ? (
          <p className="text-sm text-gray-500">
            Nenhum achado gerado ainda. Clique em &ldquo;Gerar diagnóstico&rdquo; para analisar os dados.
          </p>
        ) : (
          <ul className="space-y-3">
            {findings.map((finding) => (
              <li key={finding.id} className="rounded border border-gray-200 p-4 text-sm">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{finding.title}</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLES[finding.severity]}`}>
                    {SEVERITY_LABELS[finding.severity]}
                  </span>
                </div>
                <p className="mb-2 text-xs text-gray-500">
                  {PILLAR_LABELS[finding.pillar]} · Prioridade {finding.priority_score ?? '—'}
                </p>
                {finding.description && <p className="mb-2 text-gray-700">{finding.description}</p>}
                {finding.estimated_impact && (
                  <p className="text-xs text-gray-600">
                    <strong>Impacto estimado:</strong> {finding.estimated_impact}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Ações rápidas */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Ações rápidas</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/diagnostics/${diagnostic.id}/commercial`}
            className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Editar métricas comerciais
          </Link>
          <Link
            href={`/diagnostics/${diagnostic.id}/financial`}
            className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Editar métricas financeiras
          </Link>
          <Link
            href={`/diagnostics/${diagnostic.id}/products`}
            className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Editar métricas de produtos
          </Link>
          <form action={generateDiagnostic.bind(null, diagnostic.id)}>
            <button
              type="submit"
              className="inline-block rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Gerar diagnóstico
            </button>
          </form>
          <Link
            href={`/diagnostics/${diagnostic.id}/action-plans`}
            className="inline-block rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Ver planos de ação
          </Link>
          <form action={generateActionPlans.bind(null, diagnostic.id)}>
            <button
              type="submit"
              className="inline-block rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Gerar planos de ação
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
