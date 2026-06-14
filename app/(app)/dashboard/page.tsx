import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { monthLabel, STATUS_LABELS } from '@/app/(app)/diagnostics/constants';
import { Card } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';

function BuildingIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [
    { count: totalClinics },
    { count: totalDiagnostics },
    { count: completedDiagnostics },
    { count: draftDiagnostics },
    { data: recentClinics },
    { data: recentDiagnostics },
  ] = await Promise.all([
    supabase.from('clinics').select('*', { count: 'exact', head: true }),
    supabase.from('diagnostics').select('*', { count: 'exact', head: true }),
    supabase.from('diagnostics').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('diagnostics').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('clinics').select('id, name, city, state').order('created_at', { ascending: false }).limit(5),
    supabase.from('diagnostics').select('*').order('created_at', { ascending: false }).limit(5),
  ]);

  const clinicIds = [...new Set((recentDiagnostics ?? []).map((d) => d.clinic_id))];

  const { data: diagnosticClinics } =
    clinicIds.length > 0
      ? await supabase.from('clinics').select('id, name').in('id', clinicIds)
      : { data: [] as { id: string; name: string }[] };

  const clinicNameById = new Map((diagnosticClinics ?? []).map((c) => [c.id, c.name]));

  const SUMMARY_CARDS = [
    { label: 'Total de clínicas', value: totalClinics ?? 0, icon: BuildingIcon },
    { label: 'Total de diagnósticos', value: totalDiagnostics ?? 0, icon: ClipboardIcon },
    { label: 'Diagnósticos concluídos', value: completedDiagnostics ?? 0, icon: CheckCircleIcon },
    { label: 'Diagnósticos em rascunho', value: draftDiagnostics ?? 0, icon: PencilIcon },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Visão geral das suas clínicas e diagnósticos.</p>
      </div>

      {/* Cards resumidos */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Icon />
              </div>
              <p className="mt-3 text-sm font-medium text-muted">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{card.value}</p>
            </Card>
          );
        })}
      </section>

      {/* Atalhos principais */}
      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Atalhos</h2>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/clinics/new" variant="primary">
            Nova clínica
          </ButtonLink>
          <ButtonLink href="/diagnostics/new" variant="primary">
            Novo diagnóstico
          </ButtonLink>
          <ButtonLink href="/clinics" variant="secondary">
            Ver clínicas
          </ButtonLink>
          <ButtonLink href="/products" variant="secondary">
            Ver produtos
          </ButtonLink>
          <ButtonLink href="/diagnostics" variant="secondary">
            Ver diagnósticos
          </ButtonLink>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Últimas clínicas criadas */}
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Últimas clínicas</h2>
          {recentClinics && recentClinics.length > 0 ? (
            <Card padding="p-0" className="divide-y divide-border">
              {recentClinics.map((clinic) => (
                <Link
                  key={clinic.id}
                  href={`/clinics/${clinic.id}`}
                  className="block p-4 transition-colors first:rounded-t-3xl last:rounded-b-3xl hover:bg-surface-hover"
                >
                  <p className="font-medium">{clinic.name}</p>
                  <p className="text-sm text-muted">
                    {[clinic.city, clinic.state].filter(Boolean).join(' - ') || 'Localização não informada'}
                  </p>
                </Link>
              ))}
            </Card>
          ) : (
            <p className="text-sm text-muted">Nenhuma clínica cadastrada ainda.</p>
          )}
        </section>

        {/* Últimos diagnósticos criados */}
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Últimos diagnósticos</h2>
          {recentDiagnostics && recentDiagnostics.length > 0 ? (
            <Card padding="p-0" className="divide-y divide-border">
              {recentDiagnostics.map((diagnostic) => (
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
          ) : (
            <p className="text-sm text-muted">Nenhum diagnóstico cadastrado ainda.</p>
          )}
        </section>
      </div>
    </main>
  );
}
