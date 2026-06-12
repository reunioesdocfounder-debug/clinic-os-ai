import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ClinicsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: clinics, error } = await supabase
    .from('clinics')
    .select('id, name, city, state')
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clínicas</h1>
        <div className="flex gap-2">
          <Link
            href="/clinics/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Nova clínica
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

      {!error && clinics?.length === 0 && (
        <p className="text-sm text-gray-500">Nenhuma clínica cadastrada ainda.</p>
      )}

      {!error && clinics && clinics.length > 0 && (
        <ul className="divide-y divide-gray-200 rounded border border-gray-200">
          {clinics.map((clinic) => (
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
      )}
    </main>
  );
}
