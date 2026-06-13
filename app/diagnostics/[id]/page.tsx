import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Pillar, Severity } from '@/lib/supabase/database.types';
import { monthLabel, STATUS_LABELS } from '@/app/diagnostics/constants';
import { generateDiagnostic } from './actions';

const SCORE_FIELDS = [
  { key: 'general_score', label: 'Score geral' },
  { key: 'commercial_score', label: 'Comercial' },
  { key: 'financial_score', label: 'Financeiro' },
  { key: 'retention_score', label: 'Retenção' },
  { key: 'marketing_score', label: 'Marketing' },
  { key: 'operation_score', label: 'Operação' },
] as const;

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
    <main className="mx-auto max-w-lg p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{clinic?.name ?? 'Clínica'}</h1>
        <Link
          href="/diagnostics"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Voltar
        </Link>
      </div>

      {errorMessage && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="font-medium text-gray-500">Período</dt>
          <dd>
            {monthLabel(diagnostic.period_month)} / {diagnostic.period_year}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Status</dt>
          <dd>{STATUS_LABELS[diagnostic.status]}</dd>
        </div>
      </dl>

      <h2 className="mt-6 mb-3 text-lg font-semibold">Scores</h2>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        {SCORE_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <dt className="font-medium text-gray-500">{label}</dt>
            <dd>{diagnostic[key] ?? '—'}</dd>
          </div>
        ))}
      </dl>

      {diagnostic.executive_summary && (
        <>
          <h2 className="mt-6 mb-3 text-lg font-semibold">Resumo executivo</h2>
          <div className="space-y-2 whitespace-pre-line rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            {diagnostic.executive_summary}
          </div>
        </>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
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
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Achados</h2>
      {(!findings || findings.length === 0) ? (
        <p className="text-sm text-gray-500">
          Nenhum achado gerado ainda. Clique em &ldquo;Gerar diagnóstico&rdquo; para analisar os dados.
        </p>
      ) : (
        <ul className="space-y-3">
          {findings.map((finding) => (
            <li key={finding.id} className="rounded border border-gray-200 p-4 text-sm">
              <div className="mb-1 flex items-center justify-between gap-2">
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
    </main>
  );
}
