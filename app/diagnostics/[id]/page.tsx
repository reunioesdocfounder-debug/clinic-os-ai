import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { monthLabel, STATUS_LABELS } from '@/app/diagnostics/constants';

const SCORE_FIELDS = [
  { key: 'general_score', label: 'Score geral' },
  { key: 'commercial_score', label: 'Comercial' },
  { key: 'financial_score', label: 'Financeiro' },
  { key: 'retention_score', label: 'Retenção' },
  { key: 'marketing_score', label: 'Marketing' },
  { key: 'operation_score', label: 'Operação' },
] as const;

export default async function DiagnosticDetailPage({
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

      <div className="mt-6 flex gap-2">
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
      </div>
    </main>
  );
}
