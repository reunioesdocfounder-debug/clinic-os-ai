import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { ButtonLink, Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';
import { Label, Input, Select } from '@/components/ui/field';

export default async function ClinicsPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; city?: string; state?: string; business_model?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const filters = await searchParams;

  const { data: allClinics, error } = await supabase
    .from('clinics')
    .select('id, name, city, state, business_model')
    .order('created_at', { ascending: false });

  const states = [...new Set((allClinics ?? []).map((c) => c.state).filter((v): v is string => Boolean(v)))].sort();
  const businessModels = [
    ...new Set((allClinics ?? []).map((c) => c.business_model).filter((v): v is string => Boolean(v))),
  ].sort();

  const nameFilter = filters.name?.trim().toLowerCase() ?? '';
  const cityFilter = filters.city?.trim().toLowerCase() ?? '';

  const clinics = (allClinics ?? []).filter((clinic) => {
    if (nameFilter && !clinic.name.toLowerCase().includes(nameFilter)) return false;
    if (cityFilter && !(clinic.city ?? '').toLowerCase().includes(cityFilter)) return false;
    if (filters.state && clinic.state !== filters.state) return false;
    if (filters.business_model && clinic.business_model !== filters.business_model) return false;
    return true;
  });

  const hasActiveFilters = Boolean(
    filters.name || filters.city || filters.state || filters.business_model,
  );

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

      <Card padding="p-4" className="mb-4">
        <form method="GET" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" type="text" placeholder="Buscar por nome" defaultValue={filters.name ?? ''} />
          </div>
          <div>
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" name="city" type="text" placeholder="Buscar por cidade" defaultValue={filters.city ?? ''} />
          </div>
          <div>
            <Label htmlFor="state">Estado</Label>
            <Select id="state" name="state" defaultValue={filters.state ?? ''}>
              <option value="">Todos</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="business_model">Modelo de negócio</Label>
            <Select id="business_model" name="business_model" defaultValue={filters.business_model ?? ''}>
              <option value="">Todos</option>
              {businessModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </Select>
          </div>
          <div className="col-span-2 flex gap-2 sm:col-span-4">
            <Button type="submit" variant="primary">
              Filtrar
            </Button>
            {hasActiveFilters && (
              <ButtonLink href="/clinics" variant="secondary">
                Limpar filtros
              </ButtonLink>
            )}
          </div>
        </form>
      </Card>

      {error && <Alert tone="error">{error.message}</Alert>}

      {!error && clinics.length === 0 && (
        <p className="text-sm text-muted">
          {hasActiveFilters
            ? 'Nenhuma clínica encontrada para os filtros selecionados.'
            : 'Nenhuma clínica cadastrada ainda.'}
        </p>
      )}

      {!error && clinics.length > 0 && (
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
