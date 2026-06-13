import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ClinicDetailPage({
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

  const { data: clinic, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !clinic) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-lg p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{clinic.name}</h1>
        <div className="flex gap-2">
          <Link
            href={`/clinics/${clinic.id}/edit`}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Editar
          </Link>
          <Link
            href="/clinics"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Voltar
          </Link>
        </div>
      </div>

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="font-medium text-gray-500">Cidade / Estado</dt>
          <dd>{[clinic.city, clinic.state].filter(Boolean).join(' - ') || '-'}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Modelo de negócio</dt>
          <dd>{clinic.business_model ?? '-'}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Anos em operação</dt>
          <dd>{clinic.years_in_operation ?? '-'}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Especialidades</dt>
          <dd>{clinic.specialties.length > 0 ? clinic.specialties.join(', ') : '-'}</dd>
        </div>
      </dl>
    </main>
  );
}
