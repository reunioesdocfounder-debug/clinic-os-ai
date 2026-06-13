import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { calculateProductKpis, rankProducts } from '@/lib/kpis/products';
import type { ProductMetricsInput } from '@/lib/kpis/types';
import { monthLabel } from '@/app/(app)/diagnostics/constants';
import { CATEGORY_LABELS } from '@/app/(app)/products/constants';
import { saveProductMetrics } from './actions';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

function formatMinutes(value: number): string {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} min`;
}

export default async function DiagnosticProductsPage({
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
    .select('id, clinic_id, period_month, period_year')
    .eq('id', id)
    .single();

  if (diagnosticError || !diagnostic) {
    notFound();
  }

  const { data: clinic } = await supabase
    .from('clinics')
    .select('name')
    .eq('id', diagnostic.clinic_id)
    .single();

  const { data: products } = await supabase
    .from('products')
    .select('id, name, category')
    .eq('clinic_id', diagnostic.clinic_id)
    .eq('is_active', true)
    .order('name');

  const { data: metricsRows } = await supabase
    .from('product_metrics')
    .select('*')
    .eq('diagnostic_id', id);

  const metricsByProduct = new Map((metricsRows ?? []).map((m) => [m.product_id, m]));

  const inputs: ProductMetricsInput[] = (products ?? []).map((product) => {
    const metrics = metricsByProduct.get(product.id);
    return {
      product_id: product.id,
      quantity_sold: Number(metrics?.quantity_sold ?? 0),
      average_price: Number(metrics?.average_price ?? 0),
      direct_cost_per_unit: Number(metrics?.direct_cost_per_unit ?? 0),
      commission_per_unit: Number(metrics?.commission_per_unit ?? 0),
      team_time_minutes_per_unit: Number(metrics?.team_time_minutes_per_unit ?? 0),
    };
  });

  const kpisByProduct = new Map(inputs.map((input) => [input.product_id, calculateProductKpis(input)]));
  const ranking = rankProducts(inputs);
  const productNameById = new Map((products ?? []).map((p) => [p.id, p.name]));

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Métricas de produtos</h1>
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

      {(!products || products.length === 0) && (
        <p className="text-sm text-gray-500">
          Nenhum produto ativo cadastrado para esta clínica.{' '}
          <Link href="/products/new" className="text-blue-600 hover:underline">
            Cadastrar produto
          </Link>
        </p>
      )}

      {products && products.length > 0 && (
        <>
          <form action={saveProductMetrics.bind(null, id)} className="space-y-6">
            <input type="hidden" name="product_ids" value={products.map((p) => p.id).join(',')} />

            {products.map((product) => {
              const metrics = metricsByProduct.get(product.id);
              return (
                <fieldset key={product.id} className="rounded border border-gray-200 p-4">
                  <legend className="px-1 text-sm font-semibold">
                    {product.name}{' '}
                    <span className="text-xs font-normal text-gray-500">
                      ({CATEGORY_LABELS[product.category]})
                    </span>
                  </legend>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor={`quantity_sold__${product.id}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Quantidade vendida
                      </label>
                      <input
                        id={`quantity_sold__${product.id}`}
                        name={`quantity_sold__${product.id}`}
                        type="number"
                        step="1"
                        min={0}
                        defaultValue={metrics?.quantity_sold ?? ''}
                        className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`average_price__${product.id}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Preço médio (R$)
                      </label>
                      <input
                        id={`average_price__${product.id}`}
                        name={`average_price__${product.id}`}
                        type="number"
                        step="0.01"
                        min={0}
                        defaultValue={metrics?.average_price ?? ''}
                        className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`direct_cost_per_unit__${product.id}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Custo direto por unidade (R$)
                      </label>
                      <input
                        id={`direct_cost_per_unit__${product.id}`}
                        name={`direct_cost_per_unit__${product.id}`}
                        type="number"
                        step="0.01"
                        min={0}
                        defaultValue={metrics?.direct_cost_per_unit ?? ''}
                        className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`commission_per_unit__${product.id}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Comissão por unidade (R$)
                      </label>
                      <input
                        id={`commission_per_unit__${product.id}`}
                        name={`commission_per_unit__${product.id}`}
                        type="number"
                        step="0.01"
                        min={0}
                        defaultValue={metrics?.commission_per_unit ?? ''}
                        className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`team_time_minutes_per_unit__${product.id}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Tempo de equipe por unidade (min)
                      </label>
                      <input
                        id={`team_time_minutes_per_unit__${product.id}`}
                        name={`team_time_minutes_per_unit__${product.id}`}
                        type="number"
                        step="0.01"
                        min={0}
                        defaultValue={metrics?.team_time_minutes_per_unit ?? ''}
                        className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </fieldset>
              );
            })}

            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Salvar métricas de produtos
            </button>
          </form>

          <h2 className="mt-8 mb-3 text-lg font-semibold">KPIs por produto</h2>
          <div className="overflow-x-auto rounded border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="p-2">Produto</th>
                  <th className="p-2">Receita</th>
                  <th className="p-2">Custo total</th>
                  <th className="p-2">Lucro bruto</th>
                  <th className="p-2">Margem</th>
                  <th className="p-2">Tempo total de equipe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => {
                  const kpis = kpisByProduct.get(product.id)!;
                  return (
                    <tr key={product.id}>
                      <td className="p-2 font-medium">{product.name}</td>
                      <td className="p-2">{formatCurrency(kpis.product_revenue)}</td>
                      <td className="p-2">{formatCurrency(kpis.product_total_cost)}</td>
                      <td className="p-2">{formatCurrency(kpis.product_gross_profit)}</td>
                      <td className="p-2">{formatPercent(kpis.product_margin)}</td>
                      <td className="p-2">{formatMinutes(kpis.total_team_time_minutes)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h2 className="mt-8 mb-3 text-lg font-semibold">Ranking por lucro bruto</h2>
          <ol className="space-y-1 text-sm">
            {ranking.map((kpis) => (
              <li key={kpis.product_id}>
                <span className="font-medium">{kpis.ranking}º</span>{' '}
                {productNameById.get(kpis.product_id) ?? kpis.product_id} —{' '}
                {formatCurrency(kpis.product_gross_profit)}
              </li>
            ))}
          </ol>
        </>
      )}
    </main>
  );
}
