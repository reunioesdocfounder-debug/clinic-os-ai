import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { monthLabel, STATUS_LABELS } from '@/app/(app)/diagnostics/constants';

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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Diagnósticos</h1>
        <div className="flex gap-2">
          <Link
            href="/diagnostics/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Novo diagnóstico
          </Link>
          <Link
            href="/dashboard"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Voltar
          </Link>
        </div>
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {!error && diagnostics?.length === 0 && (
        <p className="text-sm text-gray-500">Nenhum diagnóstico cadastrado ainda.</p>
      )}

      {!error && diagnostics && diagnostics.length > 0 && (
        <ul className="divide-y divide-gray-200 rounded border border-gray-200">
          {diagnostics.map((diagnostic) => (
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
      )}
    </main>
  );
}
