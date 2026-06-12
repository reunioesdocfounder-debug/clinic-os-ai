import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { calculateFinancialKpis } from '@/lib/kpis/financial';
import type { FinancialMetricsInput, FinancialKpis } from '@/lib/kpis/types';
import { saveFinancialMetrics } from './actions';
import { FinancialForm } from './financial-form';

type CurrencyKpiKey = 'net_revenue' | 'gross_profit' | 'ebitda' | 'net_profit';
type PercentKpiKey = 'gross_margin' | 'net_margin' | 'payroll_percentage' | 'marketing_percentage';

const CURRENCY_KPI_FIELDS: { key: CurrencyKpiKey; label: string }[] = [
  { key: 'net_revenue', label: 'Receita líquida' },
  { key: 'gross_profit', label: 'Lucro bruto' },
  { key: 'ebitda', label: 'EBITDA' },
  { key: 'net_profit', label: 'Lucro líquido' },
];

const PERCENT_KPI_FIELDS: { key: PercentKpiKey; label: string }[] = [
  { key: 'gross_margin', label: 'Margem bruta' },
  { key: 'net_margin', label: 'Margem líquida' },
  { key: 'payroll_percentage', label: '% Folha sobre receita' },
  { key: 'marketing_percentage', label: '% Marketing sobre receita' },
];

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

export default async function FinancialMetricsPage({
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

  const { data: diagnostic, error: diagnosticError } = await supabase
    .from('diagnostics')
    .select('id')
    .eq('id', id)
    .single();

  if (diagnosticError || !diagnostic) {
    notFound();
  }

  const { data: metrics } = await supabase
    .from('financial_metrics')
    .select('*')
    .eq('diagnostic_id', id)
    .maybeSingle();

  const input: FinancialMetricsInput = {
    gross_revenue: Number(metrics?.gross_revenue ?? 0),
    taxes: Number(metrics?.taxes ?? 0),
    direct_costs: Number(metrics?.direct_costs ?? 0),
    payroll: Number(metrics?.payroll ?? 0),
    marketing_expenses: Number(metrics?.marketing_expenses ?? 0),
    commissions: Number(metrics?.commissions ?? 0),
    operational_expenses: Number(metrics?.operational_expenses ?? 0),
    financial_expenses: Number(metrics?.financial_expenses ?? 0),
    other_expenses: Number(metrics?.other_expenses ?? 0),
  };

  const kpis: FinancialKpis = calculateFinancialKpis(input);

  return (
    <main className="mx-auto max-w-lg p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Métricas financeiras</h1>
        <Link
          href={`/diagnostics/${id}`}
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

      <p className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        <strong>Atenção:</strong> &quot;Custos diretos&quot; não deve incluir comissões
        comerciais sobre vendas. Lance as comissões separadamente no campo &quot;Comissões&quot;
        — elas são tratadas como despesa operacional no cálculo do EBITDA.
      </p>

      <FinancialForm metrics={metrics} action={saveFinancialMetrics.bind(null, id)} />

      <h2 className="mt-8 mb-3 text-lg font-semibold">KPIs calculados</h2>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        {CURRENCY_KPI_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <dt className="font-medium text-gray-500">{label}</dt>
            <dd>{formatCurrency(kpis[key])}</dd>
          </div>
        ))}
        {PERCENT_KPI_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <dt className="font-medium text-gray-500">{label}</dt>
            <dd>{formatPercent(kpis[key])}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
