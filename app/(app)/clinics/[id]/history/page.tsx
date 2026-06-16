import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { monthLabel, STATUS_LABELS } from '@/app/(app)/diagnostics/constants';
import { Card } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { getKpiStatus } from '@/lib/kpis';

const STATUS_TONES = {
  critico: 'red',
  atencao: 'yellow',
  bom: 'blue',
  excelente: 'green',
} as const;

const STATUS_LABELS_PT = {
  critico: 'Crítico',
  atencao: 'Atenção',
  bom: 'Bom',
  excelente: 'Excelente',
} as const;

export default async function ClinicHistoryPage({
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

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id, name')
    .eq('id', id)
    .single();

  if (clinicError || !clinic) {
    notFound();
  }

  const { data: diagnostics } = await supabase
    .from('diagnostics')
    .select('id, period_month, period_year, status, general_score')
    .eq('clinic_id', id)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });

  const list = diagnostics ?? [];

  return (
    <main className="mx-auto max-w-2xl p-6">
      <PageHeader
        title="Histórico de diagnósticos"
        subtitle={clinic.name}
        actions={
          <ButtonLink href={`/clinics/${id}`} variant="secondary">
            Voltar
          </ButtonLink>
        }
      />

      {list.length === 0 && (
        <p className="text-sm text-muted">Nenhum diagnóstico cadastrado para esta clínica.</p>
      )}

      {list.length >= 2 && (
        <div className="mb-4">
          <ButtonLink href={`/diagnostics/${list[0].id}/compare`} variant="primary">
            Comparar 2 diagnósticos mais recentes
          </ButtonLink>
        </div>
      )}

      {list.length > 0 && (
        <Card padding="p-0" className="divide-y divide-border">
          {list.map((diagnostic) => {
            const status = getKpiStatus(diagnostic.general_score);
            return (
              <Link
                key={diagnostic.id}
                href={`/diagnostics/${diagnostic.id}`}
                className="block p-4 transition-colors first:rounded-t-3xl last:rounded-b-3xl hover:bg-surface-hover"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {monthLabel(diagnostic.period_month)} / {diagnostic.period_year}
                    </p>
                    <p className="text-sm text-muted">{STATUS_LABELS[diagnostic.status]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {diagnostic.general_score !== null && (
                      <span className="text-sm font-semibold tabular-nums">
                        {diagnostic.general_score}
                      </span>
                    )}
                    {status ? (
                      <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS_PT[status]}</Badge>
                    ) : (
                      <Badge tone="gray">Sem score</Badge>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </Card>
      )}
    </main>
  );
}
