import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/auth/actions';
import { monthLabel, STATUS_LABELS } from '@/app/diagnostics/constants';

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
    { label: 'Total de clínicas', value: totalClinics ?? 0 },
    { label: 'Total de diagnósticos', value: totalDiagnostics ?? 0 },
    { label: 'Diagnósticos concluídos', value: completedDiagnostics ?? 0 },
    { label: 'Diagnósticos em rascunho', value: draftDiagnostics ?? 0 },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Logado como <strong>{user.email}</strong>
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sair
          </button>
        </form>
      </header>

      {/* Cards resumidos */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {SUMMARY_CARDS.map((card) => (
          <div key={card.label} className="rounded border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{card.value}</p>
          </div>
        ))}
      </section>

      {/* Atalhos principais */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Atalhos</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/clinics/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Nova clínica
          </Link>
          <Link
            href="/diagnostics/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Novo diagnóstico
          </Link>
          <Link
            href="/clinics"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Ver clínicas
          </Link>
          <Link
            href="/products"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Ver produtos
          </Link>
          <Link
            href="/diagnostics"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Ver diagnósticos
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Últimas clínicas criadas */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Últimas clínicas</h2>
          {recentClinics && recentClinics.length > 0 ? (
            <ul className="divide-y divide-gray-200 rounded border border-gray-200">
              {recentClinics.map((clinic) => (
                <li key={clinic.id}>
                  <Link href={`/clinics/${clinic.id}`} className="block p-4 hover:bg-gray-50">
                    <p className="font-medium">{clinic.name}</p>
                    <p className="text-sm text-gray-500">
                      {[clinic.city, clinic.state].filter(Boolean).join(' - ') || 'Localização não informada'}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma clínica cadastrada ainda.</p>
          )}
        </section>

        {/* Últimos diagnósticos criados */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Últimos diagnósticos</h2>
          {recentDiagnostics && recentDiagnostics.length > 0 ? (
            <ul className="divide-y divide-gray-200 rounded border border-gray-200">
              {recentDiagnostics.map((diagnostic) => (
                <li key={diagnostic.id}>
                  <Link href={`/diagnostics/${diagnostic.id}`} className="block p-4 hover:bg-gray-50">
                    <p className="font-medium">{clinicNameById.get(diagnostic.clinic_id) ?? 'Clínica'}</p>
                    <p className="text-sm text-gray-500">
                      {monthLabel(diagnostic.period_month)} / {diagnostic.period_year} —{' '}
                      {STATUS_LABELS[diagnostic.status]}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Nenhum diagnóstico cadastrado ainda.</p>
          )}
        </section>
      </div>
    </main>
  );
}
