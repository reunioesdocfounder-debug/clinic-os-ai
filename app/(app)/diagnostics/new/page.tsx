import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createDiagnostic } from '@/app/(app)/diagnostics/actions';
import { MONTHS } from '@/app/(app)/diagnostics/constants';
import { ButtonLink, Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';
import { Label, Input, Select } from '@/components/ui/field';

export default async function NewDiagnosticPage({
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

  const { data: clinics, error: clinicsError } = await supabase
    .from('clinics')
    .select('id, name')
    .order('name');

  const now = new Date();

  return (
    <main className="mx-auto max-w-lg p-6">
      <PageHeader
        title="Novo diagnóstico"
        actions={
          <ButtonLink href="/diagnostics" variant="secondary">
            Voltar
          </ButtonLink>
        }
      />

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      {clinicsError && (
        <Alert tone="error" className="mb-4">
          {clinicsError.message}
        </Alert>
      )}

      {!clinicsError && clinics?.length === 0 && (
        <p className="text-sm text-muted">
          Você ainda não tem clínicas cadastradas.{' '}
          <Link href="/clinics/new" className="text-accent hover:underline">
            Cadastre uma clínica
          </Link>{' '}
          antes de criar um diagnóstico.
        </p>
      )}

      {!clinicsError && clinics && clinics.length > 0 && (
        <form action={createDiagnostic} className="space-y-4">
          <div>
            <Label htmlFor="clinic_id">Clínica *</Label>
            <Select id="clinic_id" name="clinic_id" required>
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="period_month">Mês *</Label>
              <Select id="period_month" name="period_month" required defaultValue={now.getMonth() + 1}>
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="period_year">Ano *</Label>
              <Input
                id="period_year"
                name="period_year"
                type="number"
                required
                min={2000}
                max={2100}
                defaultValue={now.getFullYear()}
              />
            </div>
          </div>

          <Button type="submit" variant="primary">
            Criar diagnóstico
          </Button>
        </form>
      )}
    </main>
  );
}
