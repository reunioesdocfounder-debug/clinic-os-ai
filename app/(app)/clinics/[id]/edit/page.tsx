import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateClinic } from '@/app/(app)/clinics/actions';
import { ClinicForm } from '@/app/(app)/clinics/clinic-form';
import { ButtonLink } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';

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
      <PageHeader
        title="Editar clínica"
        actions={
          <ButtonLink href={`/clinics/${id}`} variant="secondary">
            Voltar
          </ButtonLink>
        }
      />

      {errorMessage && (
        <Alert tone="error" className="mb-4">
          {errorMessage}
        </Alert>
      )}

      <ClinicForm clinic={clinic} action={updateClinic.bind(null, id)} submitLabel="Salvar alterações" />
    </main>
  );
}
