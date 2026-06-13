import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateClinic } from '@/app/(app)/clinics/actions';
import { ClinicForm } from '@/app/(app)/clinics/clinic-form';

export default async function EditClinicPage({
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
        <h1 className="text-2xl font-semibold">Editar clínica</h1>
        <Link href={`/clinics/${id}`} className="text-sm text-gray-500 hover:underline">
          Voltar
        </Link>
      </div>

      {errorMessage && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <ClinicForm clinic={clinic} action={updateClinic.bind(null, id)} submitLabel="Salvar alterações" />
    </main>
  );
}
