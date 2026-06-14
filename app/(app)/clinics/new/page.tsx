import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClinic } from '@/app/(app)/clinics/actions';
import { ClinicForm } from '@/app/(app)/clinics/clinic-form';
import { ButtonLink } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';

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
      <PageHeader
        title="Nova clínica"
        actions={
          <ButtonLink href="/clinics" variant="secondary">
            Voltar
          </ButtonLink>
        }
      />

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      <ClinicForm action={createClinic} submitLabel="Criar clínica" />
    </main>
  );
}
