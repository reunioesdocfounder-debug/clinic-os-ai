import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ButtonLink } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';

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
      <PageHeader
        title={clinic.name}
        actions={
          <>
            <ButtonLink href={`/clinics/${clinic.id}/edit`} variant="primary">
              Editar
            </ButtonLink>
            <ButtonLink href="/clinics" variant="secondary">
              Voltar
            </ButtonLink>
          </>
        }
      />

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="font-medium text-muted">Cidade / Estado</dt>
          <dd>{[clinic.city, clinic.state].filter(Boolean).join(' - ') || '-'}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted">Modelo de negócio</dt>
          <dd>{clinic.business_model ?? '-'}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted">Anos em operação</dt>
          <dd>{clinic.years_in_operation ?? '-'}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted">Especialidades</dt>
          <dd>{clinic.specialties.length > 0 ? clinic.specialties.join(', ') : '-'}</dd>
        </div>
      </dl>
    </main>
  );
}
