import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClinic } from '@/app/clinics/actions';
import { ClinicForm } from '@/app/clinics/clinic-form';

export default async function NewClinicPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-lg p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nova clínica</h1>
        <Link href="/clinics" className="text-sm text-gray-500 hover:underline">
          Voltar
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <ClinicForm action={createClinic} submitLabel="Criar clínica" />
    </main>
  );
}
