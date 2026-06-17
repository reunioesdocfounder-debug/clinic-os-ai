import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { monthLabel, STATUS_LABELS } from '@/app/(app)/diagnostics/constants';
import { Card } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';

export default async function DiagnosticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: diagnostics, error } = await supabase
    .from('diagnostics')
    .select('*')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });

  const clinicIds = [...new Set((diagnostics ?? []).map((d) => d.clinic_id))];

  const { data: clinics } =
    clinicIds.length > 0
      ? await supabase.from('clinics').select('id, name').in('id', clinicIds)
      : { data: [] as { id: string; name: string }[] };

  const clinicNameById = new Map((clinics ?? []).map((c) => [c.id, c.name]));

  return (
    <main className="mx-auto max-w-2xl p-6">
      <PageHeader
        title="Diagnósticos"
        actions={
          <>
            <ButtonLink href="/diagnostics/new" variant="primary">
              Novo diagnóstico
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="secondary">
              Voltar
            </ButtonLink>
          </>
        }
      />

      {error && <Alert tone="error">{error.message}</Alert>}

      {!error && diagnostics?.length === 0 && (
        <p className="text-sm text-muted">Nenhum diagnóstico cadastrado ainda.</p>
      )}

      {!error && diagnostics && diagnostics.length > 0 && (
        <Card padding="p-0" className="max-h-[70vh] divide-y divide-border overflow-y-auto">
          {diagnostics.map((diagnostic) => (
            <Link
              key={diagnostic.id}
              href={`/diagnostics/${diagnostic.id}`}
              className="block p-4 transition-colors first:rounded-t-3xl last:rounded-b-3xl hover:bg-surface-hover"
            >
              <p className="font-medium">{clinicNameById.get(diagnostic.clinic_id) ?? 'Clínica'}</p>
              <p className="text-sm text-muted">
                {monthLabel(diagnostic.period_month)} / {diagnostic.period_year} —{' '}
                {STATUS_LABELS[diagnostic.status]}
              </p>
            </Link>
          ))}
        </Card>
      )}
    </main>
  );
}
