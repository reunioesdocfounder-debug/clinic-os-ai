import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES, CATEGORY_LABELS } from '@/app/(app)/products/constants';
import { Card } from '@/components/ui/card';
import { ButtonLink, Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';
import { Label, Input, Select } from '@/components/ui/field';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; clinic_id?: string; category?: string; is_active?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const filters = await searchParams;

  const { data: allProducts, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  const clinicIds = [...new Set((allProducts ?? []).map((p) => p.clinic_id))];

  const { data: clinics } =
    clinicIds.length > 0
      ? await supabase.from('clinics').select('id, name').in('id', clinicIds)
      : { data: [] as { id: string; name: string }[] };

  const clinicNameById = new Map((clinics ?? []).map((c) => [c.id, c.name]));
  const sortedClinics = [...(clinics ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  const nameFilter = filters.name?.trim().toLowerCase() ?? '';

  const products = (allProducts ?? []).filter((product) => {
    if (nameFilter && !product.name.toLowerCase().includes(nameFilter)) return false;
    if (filters.clinic_id && product.clinic_id !== filters.clinic_id) return false;
    if (filters.category && product.category !== filters.category) return false;
    if (filters.is_active === 'true' && !product.is_active) return false;
    if (filters.is_active === 'false' && product.is_active) return false;
    return true;
  });

  const hasActiveFilters = Boolean(
    filters.name || filters.clinic_id || filters.category || filters.is_active,
  );

  return (
    <main className="mx-auto max-w-2xl p-6">
      <PageHeader
        title="Produtos"
        actions={
          <>
            <ButtonLink href="/products/new" variant="primary">
              Novo produto
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
            <Label htmlFor="clinic_id">Clínica</Label>
            <Select id="clinic_id" name="clinic_id" defaultValue={filters.clinic_id ?? ''}>
              <option value="">Todas</option>
              {sortedClinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select id="category" name="category" defaultValue={filters.category ?? ''}>
              <option value="">Todas</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="is_active">Status</Label>
            <Select id="is_active" name="is_active" defaultValue={filters.is_active ?? ''}>
              <option value="">Todos</option>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </Select>
          </div>
          <div className="col-span-2 flex gap-2 sm:col-span-4">
            <Button type="submit" variant="primary">
              Filtrar
            </Button>
            {hasActiveFilters && (
              <ButtonLink href="/products" variant="secondary">
                Limpar filtros
              </ButtonLink>
            )}
          </div>
        </form>
      </Card>

      {error && <Alert tone="error">{error.message}</Alert>}

      {!error && products.length === 0 && (
        <p className="text-sm text-muted">
          {hasActiveFilters
            ? 'Nenhum produto encontrado para os filtros selecionados.'
            : 'Nenhum produto cadastrado ainda.'}
        </p>
      )}

      {!error && products.length > 0 && (
        <Card padding="p-0" className="max-h-[70vh] divide-y divide-border overflow-y-auto">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}/edit`}
              className="block p-4 transition-colors first:rounded-t-3xl last:rounded-b-3xl hover:bg-surface-hover"
            >
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted">
                {clinicNameById.get(product.clinic_id) ?? 'Clínica'} —{' '}
                {CATEGORY_LABELS[product.category]} — {product.is_active ? 'Ativo' : 'Inativo'}
              </p>
            </Link>
          ))}
        </Card>
      )}
    </main>
  );
}
