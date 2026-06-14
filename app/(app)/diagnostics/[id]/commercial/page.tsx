import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { calculateCommercialKpis } from '@/lib/kpis/commercial';
import type { CommercialMetricsInput, CommercialKpis } from '@/lib/kpis/types';
import { ButtonLink } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';
import { saveCommercialMetrics } from './actions';
import { CommercialForm } from './commercial-form';

const KPI_FIELDS: { key: keyof CommercialKpis; label: string }[] = [
  { key: 'contact_rate', label: 'Taxa de contato' },
  { key: 'scheduling_rate', label: 'Taxa de agendamento' },
  { key: 'attendance_rate', label: 'Taxa de comparecimento' },
  { key: 'conversion_rate', label: 'Taxa de conversão' },
  { key: 'renewal_rate', label: 'Taxa de renovação' },
  { key: 'referral_rate', label: 'Taxa de indicação' },
];

function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

export default async function CommercialMetricsPage({
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
    .from('commercial_metrics')
    .select('*')
    .eq('diagnostic_id', id)
    .maybeSingle();

  const input: CommercialMetricsInput = {
    leads: Number(metrics?.leads ?? 0),
    contacted_leads: Number(metrics?.contacted_leads ?? 0),
    scheduled_appointments: Number(metrics?.scheduled_appointments ?? 0),
    attended_appointments: Number(metrics?.attended_appointments ?? 0),
    sales: Number(metrics?.sales ?? 0),
    renewals: Number(metrics?.renewals ?? 0),
    eligible_renewals: Number(metrics?.eligible_renewals ?? 0),
    referrals: Number(metrics?.referrals ?? 0),
    new_patients: Number(metrics?.new_patients ?? 0),
    average_ticket: Number(metrics?.average_ticket ?? 0),
    average_response_time_minutes: Number(metrics?.average_response_time_minutes ?? 0),
    average_days_until_appointment: Number(metrics?.average_days_until_appointment ?? 0),
  };

  const kpis = calculateCommercialKpis(input);

  return (
    <main className="mx-auto max-w-lg p-6">
      <PageHeader
        title="Métricas comerciais"
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

      <CommercialForm metrics={metrics} action={saveCommercialMetrics.bind(null, id)} />

      <h2 className="mt-8 mb-3 text-lg font-semibold tracking-tight">KPIs calculados</h2>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        {KPI_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <dt className="font-medium text-muted">{label}</dt>
            <dd>{formatPercent(kpis[key])}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
