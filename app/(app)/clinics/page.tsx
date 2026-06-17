import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';

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
      <PageHeader
        title="Clínicas"
        actions={
          <>
            <ButtonLink href="/clinics/new" variant="primary">
              Nova clínica
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="secondary">
              Voltar
            </ButtonLink>
          </>
        }
      />

      {error && <Alert tone="error">{error.message}</Alert>}

      {!error && clinics?.length === 0 && (
        <p className="text-sm text-muted">Nenhuma clínica cadastrada ainda.</p>
      )}

      {!error && clinics && clinics.length > 0 && (
        <Card padding="p-0" className="max-h-[70vh] divide-y divide-border overflow-y-auto">
          {clinics.map((clinic) => (
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
      )}
    </main>
  );
}
