import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { monthLabel } from '@/app/(app)/diagnostics/constants';
import { buildSnapshot, buildComparison, type MetricDiff } from '@/lib/diagnostics/comparison';
import { Card } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';

// Formatadores de valor por tipo de métrica

function fmtBrl(value: number | null): string {
  if (value === null) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function fmtPct(value: number | null): string {
  if (value === null) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

function fmtScore(value: number | null): string {
  if (value === null) return '—';
  return value.toFixed(1);
}

type MetricFormat = 'brl' | 'pct' | 'score';

function formatValue(value: number | null, fmt: MetricFormat): string {
  if (fmt === 'brl') return fmtBrl(value);
  if (fmt === 'pct') return fmtPct(value);
  return fmtScore(value);
}

function formatDelta(delta: number | null, fmt: MetricFormat): string {
  if (delta === null) return '—';
  const sign = delta > 0 ? '+' : '';
  if (fmt === 'brl') return `${sign}${fmtBrl(delta)}`;
  if (fmt === 'pct') return `${sign}${(delta * 100).toFixed(1)} pp`;
  return `${sign}${delta.toFixed(1)}`;
}

function deltaClasses(delta: number | null): string {
  if (delta === null || delta === 0) return 'text-muted';
  return delta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
}

function deltaArrow(delta: number | null): string {
  if (delta === null || delta === 0) return '→';
  return delta > 0 ? '↑' : '↓';
}

// Linha de comparação de uma métrica

function CompareRow({
  label,
  diff,
  fmt,
}: {
  label: string;
  diff: MetricDiff;
  fmt: MetricFormat;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pr-4 text-sm font-medium text-foreground">{label}</td>
      <td className="py-3 pr-4 text-right text-sm tabular-nums text-muted">
        {formatValue(diff.previous, fmt)}
      </td>
      <td className="py-3 pr-4 text-right text-sm tabular-nums font-semibold">
        {formatValue(diff.current, fmt)}
      </td>
      <td className={`py-3 pr-4 text-right text-sm tabular-nums ${deltaClasses(diff.delta)}`}>
        {deltaArrow(diff.delta)} {formatDelta(diff.delta, fmt)}
      </td>
      <td className={`py-3 text-right text-xs tabular-nums ${deltaClasses(diff.delta)}`}>
        {diff.pct_change !== null ? `${diff.pct_change > 0 ? '+' : ''}${diff.pct_change.toFixed(1)}%` : '—'}
      </td>
    </tr>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <tr>
      <td
        colSpan={5}
        className="bg-surface-hover px-0 py-2 text-xs font-semibold uppercase tracking-wide text-muted"
      >
        {title}
      </td>
    </tr>
  );
}

export default async function DiagnosticComparePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  // Carregar diagnóstico atual
  const { data: current, error } = await supabase
    .from('diagnostics')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !current) {
    notFound();
  }

  const { data: clinic } = await supabase
    .from('clinics')
    .select('name')
    .eq('id', current.clinic_id)
    .single();

  // Encontrar o diagnóstico imediatamente anterior da mesma clínica
  // (mesmo clinic_id, ordenado por ano/mês desc, excluindo o atual)
  const { data: allDiagnostics } = await supabase
    .from('diagnostics')
    .select('*')
    .eq('clinic_id', current.clinic_id)
    .neq('id', id)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })
    .limit(1);

  const previous = allDiagnostics?.[0] ?? null;

  if (!previous) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <PageHeader
          title="Comparação de diagnósticos"
          subtitle={clinic?.name}
          actions={
            <ButtonLink href={`/diagnostics/${id}`} variant="secondary">
              Voltar
            </ButtonLink>
          }
        />
        <p className="text-sm text-muted">
          Não há diagnóstico anterior para comparar. Cadastre pelo menos dois diagnósticos para esta clínica.
        </p>
      </main>
    );
  }

  // Carregar métricas financeiras e comerciais dos dois diagnósticos em paralelo
  const [
    { data: currentFinancial },
    { data: currentCommercial },
    { data: previousFinancial },
    { data: previousCommercial },
  ] = await Promise.all([
    supabase.from('financial_metrics').select('*').eq('diagnostic_id', id).maybeSingle(),
    supabase.from('commercial_metrics').select('*').eq('diagnostic_id', id).maybeSingle(),
    supabase.from('financial_metrics').select('*').eq('diagnostic_id', previous.id).maybeSingle(),
    supabase.from('commercial_metrics').select('*').eq('diagnostic_id', previous.id).maybeSingle(),
  ]);

  const currentSnapshot = buildSnapshot(current, currentFinancial ?? null, currentCommercial ?? null);
  const previousSnapshot = buildSnapshot(previous, previousFinancial ?? null, previousCommercial ?? null);
  const comparison = buildComparison(currentSnapshot, previousSnapshot);

  const prevLabel = `${monthLabel(previous.period_month)}/${previous.period_year}`;
  const currLabel = `${monthLabel(current.period_month)}/${current.period_year}`;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <PageHeader
        title="Comparação de diagnósticos"
        subtitle={`${clinic?.name ?? 'Clínica'} — ${prevLabel} vs ${currLabel}`}
        actions={
          <ButtonLink href={`/diagnostics/${id}`} variant="secondary">
            Voltar
          </ButtonLink>
        }
      />

      <Card padding="p-0" className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                Métrica
              </th>
              <th className="py-3 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                {prevLabel}
              </th>
              <th className="py-3 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                {currLabel}
              </th>
              <th className="py-3 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                Diferença
              </th>
              <th className="py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                Variação %
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <SectionHeader title="Score geral e pilares" />
            <CompareRow label="Score geral" diff={comparison.diffs.general_score} fmt="score" />
            <CompareRow label="Comercial" diff={comparison.diffs.commercial_score} fmt="score" />
            <CompareRow label="Financeiro" diff={comparison.diffs.financial_score} fmt="score" />
            <CompareRow label="Retenção" diff={comparison.diffs.retention_score} fmt="score" />
            <CompareRow label="Marketing" diff={comparison.diffs.marketing_score} fmt="score" />
            <CompareRow label="Operação" diff={comparison.diffs.operation_score} fmt="score" />

            <SectionHeader title="Métricas financeiras" />
            <CompareRow label="Receita bruta" diff={comparison.diffs.gross_revenue} fmt="brl" />
            <CompareRow label="Lucro líquido" diff={comparison.diffs.net_profit} fmt="brl" />
            <CompareRow label="Margem líquida" diff={comparison.diffs.net_margin} fmt="pct" />

            <SectionHeader title="Métricas comerciais" />
            <CompareRow label="Comparecimento" diff={comparison.diffs.attendance_rate} fmt="pct" />
            <CompareRow label="Conversão" diff={comparison.diffs.conversion_rate} fmt="pct" />
            <CompareRow label="Renovação" diff={comparison.diffs.renewal_rate} fmt="pct" />
          </tbody>
        </table>
      </Card>

      <p className="mt-4 text-xs text-muted">
        ↑ melhora · ↓ piora · pp = pontos percentuais · Variação % calculada sobre o valor absoluto do período anterior
      </p>
    </main>
  );
}
